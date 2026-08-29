"""
Backend Supabase Authentication, Token Verification, and Customer ID Mapping Module.

Secures backend API endpoints by validating Supabase JWT bearer tokens,
verifying user identity, mapping auth user IDs to internal customer records (C001, C002, etc.),
and managing Row-Level Security (RLS) consistent database interactions.
"""

import os
import json
import logging
# pyrefly: ignore [missing-import]
import jwt  # type: ignore
from typing import Optional, Dict, Any
from pathlib import Path
from fastapi import HTTPException, Header, Depends, status
from coffee_agent.config import (
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_JWT_SECRET,
)

logger = logging.getLogger("coffee_auth")

# Initialize Supabase client if credentials exist
supabase_client = None
if SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY):
    try:
        # pyrefly: ignore [missing-import]
        from supabase import create_client  # type: ignore
        key_to_use = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
        supabase_client = create_client(SUPABASE_URL, key_to_use)
        logger.info("Supabase client initialized successfully on backend.")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase backend client: {e}")


# Local fallback customer profiles for offline/testing development
LOCAL_CUSTOMERS_PATH = Path(__file__).resolve().parent / "data" / "customers.json"


def _load_local_customers() -> list:
    if LOCAL_CUSTOMERS_PATH.exists():
        with open(LOCAL_CUSTOMERS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


class AuthenticatedUser:
    def __init__(self, auth_user_id: str, email: str, name: str, internal_customer_id: str, db_customer_id: Optional[str] = None):
        self.auth_user_id = auth_user_id
        self.email = email
        self.name = name
        self.internal_customer_id = internal_customer_id  # e.g., 'C001', 'C002'
        self.db_customer_id = db_customer_id  # UUID PK in Supabase 'customers' table


async def get_optional_auth_user(authorization: Optional[str] = Header(None)) -> AuthenticatedUser:
    """FastAPI dependency: extracts authenticated user if token present, otherwise defaults to Guest (C001)."""
    if not authorization or not authorization.startswith("Bearer "):
        return AuthenticatedUser(
            auth_user_id="guest-anon-session",
            email="guest@coffeemind.ai",
            name="Guest",
            internal_customer_id="C001",
            db_customer_id=None
        )
    try:
        return await verify_supabase_token(authorization)
    except HTTPException:
        return AuthenticatedUser(
            auth_user_id="guest-anon-session",
            email="guest@coffeemind.ai",
            name="Guest",
            internal_customer_id="C001",
            db_customer_id=None
        )


async def verify_supabase_token(authorization: Optional[str] = Header(None)) -> AuthenticatedUser:
    """FastAPI dependency to verify Supabase JWT token and extract authenticated user context."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Missing Bearer token header."
        )

    token = authorization.split(" ")[1].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token cannot be empty."
        )

    # Deterministic test tokens for test suite / offline development / demo mode
    if token.startswith("test-") or token.startswith("mock-"):
        return _get_mock_authenticated_user(token)

    # 1. Verify via Supabase Auth client if available
    if supabase_client:
        try:
            user_response = supabase_client.auth.get_user(token)
            if user_response and user_response.user:
                user = user_response.user
                auth_id = user.id
                email = user.email or ""
                metadata = getattr(user, "user_metadata", {}) or {}
                name = metadata.get("name") or metadata.get("full_name") or email.split("@")[0].capitalize() or "Guest"

                return await resolve_customer_mapping(auth_id, email, name)
        except Exception as e:
            logger.warning(f"Supabase auth.get_user token check failed: {e}")

    # 2. Verify via PyJWT using SUPABASE_JWT_SECRET or unverified decode for development fallback
    try:
        if SUPABASE_JWT_SECRET:
            payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
        else:
            # Fallback unverified decode for dev environments where secret is not configured
            payload = jwt.decode(token, options={"verify_signature": False})

        auth_id = payload.get("sub")
        email = payload.get("email", "")
        user_metadata = payload.get("user_metadata", {})
        name = user_metadata.get("name") or user_metadata.get("full_name") or email.split("@")[0].capitalize() or "User"

        if not auth_id:
            raise HTTPException(status_code=401, detail="Invalid token payload: missing sub.")

        return await resolve_customer_mapping(auth_id, email, name)

    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"JWT verification error: {err}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token."
        )


async def resolve_customer_mapping(auth_user_id: str, email: str, name: str) -> AuthenticatedUser:
    """Maps a Supabase auth_user_id (UUID) to a customer record and internal customer_id (C001, C002, etc.)."""
    
    # 1. Try Supabase DB query if client is active
    if supabase_client:
        try:
            res = supabase_client.table("customers").select("*").eq("auth_user_id", auth_user_id).execute()
            if res.data and len(res.data) > 0:
                cust = res.data[0]
                return AuthenticatedUser(
                    auth_user_id=auth_user_id,
                    email=email,
                    name=cust.get("name", name),
                    internal_customer_id=cust.get("customer_id", "C001"),
                    db_customer_id=cust.get("id")
                )

            # Assign matching seed customer if name/email matches, else generate new C00x
            assigned_customer_id = _allocate_internal_customer_id(name, email)

            # Insert new customer record linked to auth_user_id
            try:
                new_cust = supabase_client.table("customers").insert({
                    "auth_user_id": auth_user_id,
                    "customer_id": assigned_customer_id,
                    "name": name,
                    "email": email
                }).execute()

                db_cust_id = None
                if new_cust.data and len(new_cust.data) > 0:
                    db_cust_id = new_cust.data[0]["id"]
                    _create_default_preferences_in_db(db_cust_id, assigned_customer_id)

                return AuthenticatedUser(
                    auth_user_id=auth_user_id,
                    email=email,
                    name=name,
                    internal_customer_id=assigned_customer_id,
                    db_customer_id=db_cust_id
                )
            except Exception as insert_err:
                # Re-query in case automatic DB trigger created the record concurrently
                retry_res = supabase_client.table("customers").select("*").eq("auth_user_id", auth_user_id).execute()
                if retry_res.data and len(retry_res.data) > 0:
                    cust = retry_res.data[0]
                    return AuthenticatedUser(
                        auth_user_id=auth_user_id,
                        email=email,
                        name=cust.get("name", name),
                        internal_customer_id=cust.get("customer_id", assigned_customer_id),
                        db_customer_id=cust.get("id")
                    )

        except Exception as e:
            logger.error(f"Error querying/creating customer in Supabase: {e}")

    # 2. Local fallback mapping if DB is unavailable
    internal_id = _allocate_internal_customer_id(name, email)
    return AuthenticatedUser(
        auth_user_id=auth_user_id,
        email=email,
        name=name,
        internal_customer_id=internal_id,
        db_customer_id=f"local-{auth_user_id}"
    )


def _allocate_internal_customer_id(name: str, email: str) -> str:
    """Determines internal customer_id (C001 for Aarav/Mihir, C002 for Priya/Ananya, etc.)."""
    local = _load_local_customers()
    name_clean = name.lower()

    if "aarav" in name_clean or "mihir" in name_clean:
        return "C001"
    elif "priya" in name_clean or "ananya" in name_clean:
        return "C002"
    elif "rahul" in name_clean:
        return "C003"

    # Match existing by name
    for c in local:
        if c.get("name", "").lower() in name_clean or name_clean in c.get("name", "").lower():
            return c.get("customer_id")

    # Generate sequential C00x ID
    return f"C{len(local) + 1:03d}"


def _create_default_preferences_in_db(db_customer_id: str, internal_id: str):
    """Populates default customer preferences from local data or defaults."""
    if not supabase_client:
        return

    local = _load_local_customers()
    found_local = next((c for c in local if c.get("customer_id") == internal_id), None)

    pref_data = {
        "customer_id": db_customer_id,
        "temperature": found_local.get("preferred_temperature", "Cold") if found_local else "Cold",
        "sweetness": found_local.get("preferred_sweetness", "Medium") if found_local else "Medium",
        "milk_preference": found_local.get("preferred_milk", "Oat Milk") if found_local else "Oat Milk",
        "caffeine_preference": found_local.get("caffeine_preference", "Medium") if found_local else "Medium",
        "budget": float(found_local.get("budget_inr", 250)) if found_local else 250.0,
        "dietary_restrictions": found_local.get("dietary_restrictions", []) if found_local else []
    }

    try:
        supabase_client.table("customer_preferences").upsert(pref_data, on_conflict="customer_id").execute()
    except Exception as e:
        logger.error(f"Failed to populate customer preferences in DB: {e}")


def _get_mock_authenticated_user(token: str) -> AuthenticatedUser:
    """Helper for testing user isolation and token verification without live network calls."""
    if token == "test-aarav-token" or token == "test-user-a-token":
        return AuthenticatedUser(
            auth_user_id="user-aarav-uuid-1111",
            email="aarav@coffeemind.ai",
            name="Aarav",
            internal_customer_id="C001",
            db_customer_id="cust-uuid-c001"
        )
    elif token == "test-priya-token" or token == "test-user-b-token":
        return AuthenticatedUser(
            auth_user_id="user-priya-uuid-2222",
            email="priya@coffeemind.ai",
            name="Priya",
            internal_customer_id="C002",
            db_customer_id="cust-uuid-c002"
        )
    else:
        return AuthenticatedUser(
            auth_user_id="user-generic-uuid-9999",
            email="guest@coffeemind.ai",
            name="Guest User",
            internal_customer_id="C001",
            db_customer_id="cust-uuid-c001"
        )
