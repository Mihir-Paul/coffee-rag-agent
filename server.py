import os
import sys
import re
import json
import asyncio
import logging
from typing import Optional, List, Dict, Any
from pathlib import Path
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

# Ensure coffee_agent package is discoverable
sys.path.insert(0, str(Path(__file__).resolve().parent))

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

from coffee_agent.config import validate_environment, log_config_status, PORT, MENU_FILE_PATH
from coffee_agent.agent import root_agent
from coffee_agent.rag import rag_engine
# pyrefly: ignore [missing-import]
from google.adk.runners import Runner
# pyrefly: ignore [missing-import]
from google.adk.sessions import InMemorySessionService
# pyrefly: ignore [missing-import]
from google.genai import types

from coffee_agent.auth import (
    verify_supabase_token, 
    AuthenticatedUser, 
    supabase_client,
    _load_local_customers
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("coffee_backend")

# Validate environment at startup
is_valid, env_msg = validate_environment()
if not is_valid:
    logger.warning(f"Backend environment warning: {env_msg}")

from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    log_config_status()
    rag_state = getattr(rag_engine, "rag_status", "available")
    logger.info("==================================================")
    logger.info(f"CoffeeMind backend started on port {PORT}")
    logger.info(f"API: http://localhost:{PORT}")
    logger.info(f"RAG Status: {rag_state}")
    logger.info("==================================================")
    yield
    logger.info("CoffeeMind backend shutting down.")


app = FastAPI(
    title="CoffeeMind AI Backend",
    description="Customer-facing API endpoint for CoffeeMind AI assistant powered by Google ADK and RAG.",
    lifespan=lifespan
)

# Configurable CORS origins for development
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

frontend_env_url = os.getenv("VITE_API_BASE_URL")
if frontend_env_url:
    allowed_origins.append(frontend_env_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load menu database for recommendation enrichment
menu_items: List[Dict[str, Any]] = []
try:
    if MENU_FILE_PATH.exists():
        with open(MENU_FILE_PATH, "r", encoding="utf-8") as f:
            menu_items = json.load(f)
        logger.info(f"Loaded {len(menu_items)} menu items for API enrichment.")
except Exception as e:
    logger.error(f"Failed to load menu database: {e}")

# Global ADK runner and session service
session_service = InMemorySessionService()
runner = Runner(agent=root_agent, app_name="coffee_agent", session_service=session_service)


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    recommendations: List[Dict[str, Any]] = []
    session_id: str
    status: str = "success"


def extract_matching_recommendations(text: str) -> List[Dict[str, Any]]:
    """Find menu items mentioned in the agent's text response to build structured cards."""
    if not text or not menu_items:
        return []
    
    text_lower = text.lower()
    matches = []
    seen_ids = set()

    for item in menu_items:
        item_name = item.get("name", "").strip()
        if not item_name:
            continue
        
        if item_name.lower() in text_lower:
            if item.get("id") not in seen_ids:
                seen_ids.add(item.get("id"))
                matches.append(item)
    
    return matches


def generate_deterministic_title(message: str) -> str:
    """Generate a clean, deterministic session title without extra LLM requests."""
    clean = message.strip()
    if not clean:
        return "Coffee Session"

    lower = clean.lower()
    if "cold" in lower and "sweet" in lower:
        return "Cold & Sweet Order"
    elif "cold" in lower or "iced" in lower:
        return "Cold Drink Recommendation"
    elif "hot" in lower or "warm" in lower:
        return "Hot Coffee Selection"
    elif "dairy" in lower or "oat" in lower or "vegan" in lower:
        return "Dietary & Non-Dairy Options"
    elif "budget" in lower or "under" in lower or "price" in lower or "₹" in lower:
        return "Budget Coffee Search"
    elif "caffeine" in lower or "strong" in lower:
        return "High Caffeine Order"

    # Default to clean snippet of first prompt
    words = clean.split()
    snippet = " ".join(words[:4])
    return snippet.capitalize() if snippet else "Coffee Session"


@app.get("/health")
@app.get("/api/health")
async def health_check():
    rag_state = getattr(rag_engine, "rag_status", "available")
    return {
        "status": "ok",
        "rag": rag_state,
        "app": "CoffeeMind AI Backend",
        "agent": root_agent.name,
        "model": root_agent.model,
        "supabase": "connected" if supabase_client else "offline_fallback"
    }


@app.get("/api/me")
async def get_user_profile(auth_user: AuthenticatedUser = Depends(verify_supabase_token)):
    """Fetch current authenticated customer's profile & preferences without exposing internal customer IDs."""
    preferences = {
        "temperature": "Cold",
        "sweetness": "Medium",
        "milk_preference": "Oat Milk",
        "caffeine_preference": "Medium",
        "budget": 250.0,
        "dietary_restrictions": []
    }

    # Fetch from Supabase DB if available
    if supabase_client and auth_user.db_customer_id:
        try:
            pref_res = supabase_client.table("customer_preferences").select("*").eq("customer_id", auth_user.db_customer_id).execute()
            if pref_res.data and len(pref_res.data) > 0:
                p = pref_res.data[0]
                preferences = {
                    "temperature": p.get("temperature", "Cold"),
                    "sweetness": p.get("sweetness", "Medium"),
                    "milk_preference": p.get("milk_preference", "Oat Milk"),
                    "caffeine_preference": p.get("caffeine_preference", "Medium"),
                    "budget": float(p.get("budget", 250)),
                    "dietary_restrictions": p.get("dietary_restrictions", [])
                }
        except Exception as e:
            logger.warning(f"Failed to fetch preferences from Supabase: {e}")
    else:
        # Fallback to local customers.json
        local = _load_local_customers()
        found = next((c for c in local if c.get("customer_id") == auth_user.internal_customer_id), None)
        if found:
            preferences = {
                "temperature": found.get("preferred_temperature", "Cold"),
                "sweetness": found.get("preferred_sweetness", "Medium"),
                "milk_preference": found.get("preferred_milk", "Oat Milk"),
                "caffeine_preference": found.get("caffeine_preference", "Medium"),
                "budget": float(found.get("budget_inr", 250)),
                "dietary_restrictions": found.get("dietary_restrictions", [])
            }

    return {
        "id": auth_user.auth_user_id,
        "name": auth_user.name,
        "email": auth_user.email,
        "preferences": preferences
    }


@app.get("/api/conversations")
async def get_conversations(auth_user: AuthenticatedUser = Depends(verify_supabase_token)):
    """Fetch authenticated user's conversations strictly isolated by ownership."""
    if supabase_client and auth_user.db_customer_id:
        try:
            res = supabase_client.table("conversations").select("*").eq("customer_id", auth_user.db_customer_id).order("updated_at", desc=True).execute()
            return {"conversations": res.data or []}
        except Exception as e:
            logger.error(f"Error fetching conversations from Supabase: {e}")

    # Offline/Mock fallback
    return {
        "conversations": [
            {
                "id": "session-default-1",
                "title": "Current Coffee Session",
                "created_at": "2026-08-27T10:00:00Z",
                "updated_at": "2026-08-27T10:00:00Z"
            }
        ]
    }


@app.post("/api/conversations")
async def create_conversation(auth_user: AuthenticatedUser = Depends(verify_supabase_token)):
    """Create a new conversation session for the authenticated user."""
    if supabase_client and auth_user.db_customer_id:
        try:
            res = supabase_client.table("conversations").insert({
                "customer_id": auth_user.db_customer_id,
                "title": "New Coffee Session"
            }).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            logger.error(f"Failed to create conversation in Supabase: {e}")

    # Fallback return
    owner_id = (auth_user.db_customer_id or "c001").lower()
    new_id = f"conv-{owner_id}-{int(asyncio.get_event_loop().time() * 1000)}"
    return {
        "id": new_id,
        "title": "New Coffee Session",
        "created_at": "2026-08-27T10:00:00Z",
        "updated_at": "2026-08-27T10:00:00Z"
    }


@app.get("/api/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, auth_user: AuthenticatedUser = Depends(verify_supabase_token)):
    """Fetch messages for a specific conversation with strict ownership verification."""
    if supabase_client and auth_user.db_customer_id:
        try:
            # Verify user owns the conversation first
            conv = supabase_client.table("conversations").select("*").eq("id", conversation_id).eq("customer_id", auth_user.db_customer_id).execute()
            if not conv.data:
                raise HTTPException(status_code=403, detail="Access denied. You do not own this conversation.")

            res = supabase_client.table("messages").select("*").eq("conversation_id", conversation_id).order("created_at", desc=False).execute()
            return {"messages": res.data or []}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to load messages from Supabase: {e}")

    # Fallback / offline mode ownership verification
    owner_id = (auth_user.db_customer_id or "c001").lower()
    if conversation_id.startswith("conv-") and not conversation_id.startswith(f"conv-{owner_id}-"):
        raise HTTPException(status_code=403, detail="Access denied. You do not own this conversation.")

    return {"messages": []}


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest, auth_user: AuthenticatedUser = Depends(verify_supabase_token)):
    """Secured chat endpoint verified via Supabase JWT token.
    Uses authenticated user's mapped internal customer ID for ADK context."""

    user_msg = payload.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    
    # Internal customer ID resolved securely on server-side (NEVER trusted from client payload)
    internal_customer_id = auth_user.internal_customer_id
    
    # Resolve or create conversation session
    if payload.session_id and payload.session_id != "null":
        session_id = payload.session_id
    else:
        # Create session in ADK
        session = await session_service.create_session(app_name="coffee_agent", user_id=internal_customer_id)
        session_id = session.id

        # Persist conversation record in Supabase DB
        if supabase_client and auth_user.db_customer_id:
            try:
                title = generate_deterministic_title(user_msg)
                conv = supabase_client.table("conversations").insert({
                    "id": session_id,
                    "customer_id": auth_user.db_customer_id,
                    "title": title
                }).execute()
            except Exception as e:
                logger.warning(f"Could not insert conversation into Supabase DB: {e}")

    # Persist incoming user message to Supabase DB if available
    if supabase_client:
        try:
            supabase_client.table("messages").insert({
                "conversation_id": session_id,
                "role": "user",
                "content": user_msg
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to save user message to DB: {e}")

    # Format user message for ADK runner
    effective_query = f"[Customer profile {internal_customer_id}] {user_msg}"
    adk_msg = types.Content(role="user", parts=[types.Part.from_text(text=effective_query)])
    
    # Bounded retries with exponential backoff ONLY for 503 UNAVAILABLE high demand errors
    max_retries = 3
    retry_delays = [2, 4, 8]
    
    for attempt in range(1, max_retries + 1):
        try:
            response_parts = []
            async for event in runner.run_async(user_id=internal_customer_id, session_id=session_id, new_message=adk_msg):
                if event.content and event.content.parts:
                    for p in event.content.parts:
                        if p.text:
                            response_parts.append(p.text)
            
            full_text = "\n".join(response_parts).strip()
            if not full_text:
                full_text = "I'm sorry, I couldn't generate a response. Please try again."
            
            # Sanitize internal customer IDs from output text
            full_text = re.sub(r'\bCustomer\s+C\d{3}\b', 'your', full_text, flags=re.IGNORECASE)
            full_text = re.sub(r"\bC\d{3}'s\b", "your", full_text, flags=re.IGNORECASE)
            full_text = re.sub(r'\bC\d{3}\b', 'your', full_text, flags=re.IGNORECASE)
            full_text = re.sub(r'\byour prefers\b', 'you prefer', full_text, flags=re.IGNORECASE)
            full_text = re.sub(r'\byour likes\b', 'you like', full_text, flags=re.IGNORECASE)

            recommendations = extract_matching_recommendations(full_text)
            
            # Persist AI assistant response to Supabase DB
            if supabase_client:
                try:
                    supabase_client.table("messages").insert({
                        "conversation_id": session_id,
                        "role": "assistant",
                        "content": full_text,
                        "recommendations": recommendations
                    }).execute()

                    # Update conversation title / updated_at
                    title = generate_deterministic_title(user_msg)
                    supabase_client.table("conversations").update({
                        "title": title
                    }).eq("id", session_id).execute()
                except Exception as e:
                    logger.warning(f"Failed to save assistant message to DB: {e}")

            return ChatResponse(
                response=full_text,
                recommendations=recommendations,
                session_id=session_id,
                status="success"
            )

        except Exception as e:
            err_msg = str(e)

            # Categorize and log error types clearly, returning structured API responses
            if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
                logger.warning("Backend API Error: 429 = quota exhausted. Request failed.")
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "error": "AI_QUOTA_EXHAUSTED",
                        "message": "AI service usage limit reached."
                    }
                )

            elif "503" in err_msg or "UNAVAILABLE" in err_msg or "high demand" in err_msg:
                logger.warning(f"Backend API Warning: 503 = temporary model/service unavailability (Attempt {attempt}/{max_retries}).")
                if attempt < max_retries:
                    await asyncio.sleep(retry_delays[attempt - 1])
                    continue
                else:
                    logger.error(f"Backend API Error: 503 = service unavailable after {max_retries} attempts.")
                    return JSONResponse(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        content={
                            "error": "AI_TEMPORARILY_UNAVAILABLE",
                            "message": "AI service is temporarily unavailable."
                        }
                    )

            elif "401" in err_msg or "403" in err_msg or "PERMISSION" in err_msg or "UNAUTHENTICATED" in err_msg:
                logger.error("Backend API Error: 401/403 = authentication/permission problem.")
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={
                        "error": "AI_AUTHENTICATION_ERROR",
                        "message": "Authentication error with AI provider."
                    }
                )

            elif "404" in err_msg or "NOT_FOUND" in err_msg:
                logger.error("Backend API Error: 404 = invalid model/resource.")
                return JSONResponse(
                    status_code=status.HTTP_404_NOT_FOUND,
                    content={
                        "error": "AI_MODEL_NOT_FOUND",
                        "message": "Selected Gemini model is currently unavailable."
                    }
                )

            else:
                logger.error(f"Backend API Error: 500 = application/server error: {err_msg}")
                return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content={
                        "error": "INTERNAL_SERVER_ERROR",
                        "message": "Something went wrong. Please try again."
                    }
                )


if __name__ == "__main__":
    import uvicorn
    log_config_status()
    is_dev = os.getenv("ENV", "development").lower() != "production"
    uvicorn.run(
        "server:app",
        host="127.0.0.1",
        port=PORT,
        reload=is_dev,
        reload_includes=["*.py", ".env", ".env.*"] if is_dev else None
    )

