import os
import sys
import re
import json
import asyncio
import logging
from typing import Optional, List, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Ensure coffee_agent package is discoverable
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from coffee_agent.config import validate_environment, log_config_status, PORT, HOST, MENU_FILE_PATH
from coffee_agent.agent import root_agent
from coffee_agent.rag import rag_engine
from coffee_agent.model_provider import execute_adk_runner_with_retry
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
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
    logger.info(f"CoffeeMind backend started on port {PORT} (host: {HOST})")
    logger.info(f"API: http://{HOST}:{PORT}")
    logger.info(f"RAG Status: {rag_state} (Mode: {rag_engine.retrieval_mode})")
    logger.info("==================================================")
    yield
    logger.info("CoffeeMind backend shutting down.")


app = FastAPI(
    title="CoffeeMind AI Backend",
    description="Customer-facing API endpoint powered by Google ADK, LangChain RAG, and Supabase Auth.",
    lifespan=lifespan
)

# CORS middleware for Vite frontend & Vercel deployments
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# Add origins from environment variables (comma-separated or single)
for env_var in ["FRONTEND_URL", "ALLOWED_ORIGINS", "CORS_ORIGINS", "VERCEL_URL", "VITE_API_BASE_URL", "VITE_API_URL"]:
    val = os.getenv(env_var)
    if val:
        for origin in val.split(","):
            clean_origin = origin.strip().rstrip("/")
            if clean_origin:
                if not clean_origin.startswith("http://") and not clean_origin.startswith("https://"):
                    clean_origin = f"https://{clean_origin}"
                if clean_origin not in allowed_origins:
                    allowed_origins.append(clean_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
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
    success: bool = True
    message: str = ""
    response: str = ""
    recommendations: List[Dict[str, Any]] = []
    session_id: str
    title: Optional[str] = None
    status: str = "success"


class CustomerPreferencesPayload(BaseModel):
    temperature: str = "Cold"
    sweetness: str = "Medium"
    milk_preference: str = "Oat Milk"
    caffeine_preference: str = "Medium"
    budget: float = 250.0
    dietary_restrictions: List[str] = []


class MemoryPayload(BaseModel):
    memory_text: str


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
    """Generate a clean, human-readable 2-6 word title based on user message context."""
    clean = message.strip()
    if not clean:
        return "New Chat"

    lower = clean.lower()

    if "sweet" in lower and ("recommend" in lower or "what" in lower or "like" in lower):
        return "Sweet Coffee Recommendations"
    elif "sweet" in lower and ("cold" in lower or "iced" in lower):
        return "Sweet Cold Coffee"
    elif "sweet" in lower:
        return "Sweet Coffee Recommendations"
    elif "strong" in lower and ("under" in lower or "200" in lower or "₹" in lower or "budget" in lower):
        return "Strong Coffee Under ₹200"
    elif "strong" in lower or "caffeine" in lower:
        return "High Caffeine Selection"
    elif "dairy-free" in lower or "dairy free" in lower or "without dairy" in lower or "no dairy" in lower:
        return "Dairy-Free Cold Coffee"
    elif "oat milk" in lower or "oat" in lower:
        return "Oat Milk Recommendations"
    elif "cold" in lower or "iced" in lower or "frappe" in lower:
        return "Cold Drink Recommendations"
    elif "hot" in lower or "warm" in lower or "espresso" in lower:
        return "Hot Coffee Selection"
    elif "under" in lower or "budget" in lower or "price" in lower or "₹" in lower:
        return "Budget Coffee Search"

    stop_words = {"what", "coffee", "would", "you", "recommend", "if", "i", "like", "want", "do", "have", "can", "get", "please", "the", "a", "an", "something", "with", "for", "me", "is", "are"}
    meaningful_words = [w for w in clean.split() if w.lower() not in stop_words and len(w) > 1]

    if not meaningful_words:
        meaningful_words = clean.split()

    snippet = " ".join(meaningful_words[:4]).strip()
    if snippet:
        return snippet.title()

    return "Coffee Session"


@app.get("/")
async def root():
    return {
        "status": "ok",
        "app": "CoffeeMind AI Backend",
        "health": "/health",
        "docs": "/docs",
        "chat_endpoint": "/api/chat"
    }


@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "rag": rag_engine.rag_status,
        "rag_mode": rag_engine.retrieval_mode,
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

    return {
        "id": auth_user.auth_user_id,
        "name": auth_user.name,
        "email": auth_user.email,
        "preferences": preferences
    }


@app.get("/api/preferences")
async def get_preferences(auth_user: AuthenticatedUser = Depends(verify_supabase_token)):
    """Fetch authenticated user's preferences."""
    profile = await get_user_profile(auth_user)
    return profile.get("preferences", {})


@app.put("/api/preferences")
async def update_preferences(payload: CustomerPreferencesPayload, auth_user: AuthenticatedUser = Depends(verify_supabase_token)):
    """Update authenticated user's coffee taste preferences."""
    if supabase_client and auth_user.db_customer_id:
        try:
            pref_data = {
                "customer_id": auth_user.db_customer_id,
                "temperature": payload.temperature,
                "sweetness": payload.sweetness,
                "milk_preference": payload.milk_preference,
                "caffeine_preference": payload.caffeine_preference,
                "budget": payload.budget,
                "dietary_restrictions": payload.dietary_restrictions
            }
            res = supabase_client.table("customer_preferences").upsert(pref_data, on_conflict="customer_id").execute()
            return {"status": "success", "preferences": payload.model_dump()}
        except Exception as e:
            logger.error(f"Failed to update preferences in Supabase: {e}")
            raise HTTPException(status_code=500, detail="Failed to save preferences.")

    return {"status": "success", "preferences": payload.model_dump()}


@app.get("/api/memories")
async def get_memories(auth_user: AuthenticatedUser = Depends(verify_supabase_token)):
    """Fetch user's persistent coffee memories."""
    if supabase_client and auth_user.db_customer_id:
        try:
            res = supabase_client.table("customer_memories").select("*").eq("customer_id", auth_user.db_customer_id).eq("is_active", True).order("created_at", desc=True).execute()
            return {"memories": res.data or []}
        except Exception as e:
            logger.error(f"Error fetching memories from Supabase: {e}")

    return {"memories": []}


@app.post("/api/memories")
async def add_memory(payload: MemoryPayload, auth_user: AuthenticatedUser = Depends(verify_supabase_token)):
    """Add a new personal memory for the user."""
    clean_text = payload.memory_text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Memory text cannot be empty.")

    if supabase_client and auth_user.db_customer_id:
        try:
            res = supabase_client.table("customer_memories").insert({
                "customer_id": auth_user.db_customer_id,
                "memory_text": clean_text
            }).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            logger.error(f"Failed to add memory in Supabase: {e}")

    return {"id": "mem-local", "memory_text": clean_text, "created_at": "2026-08-29T10:00:00Z"}


@app.delete("/api/memories/{memory_id}")
async def delete_memory(memory_id: str, auth_user: AuthenticatedUser = Depends(verify_supabase_token)):
    """Delete or deactivate a user memory with ownership check."""
    if supabase_client and auth_user.db_customer_id:
        try:
            supabase_client.table("customer_memories").delete().eq("id", memory_id).eq("customer_id", auth_user.db_customer_id).execute()
            return {"status": "success", "deleted_id": memory_id}
        except Exception as e:
            logger.error(f"Failed to delete memory: {e}")
            raise HTTPException(status_code=500, detail="Could not delete memory.")

    return {"status": "success", "deleted_id": memory_id}


@app.get("/api/conversations")
async def get_conversations(auth_user: AuthenticatedUser = Depends(verify_supabase_token)):
    """Fetch authenticated user's conversations strictly isolated by ownership."""
    if supabase_client and auth_user.db_customer_id:
        try:
            res = supabase_client.table("conversations").select("*").eq("customer_id", auth_user.db_customer_id).order("updated_at", desc=True).execute()
            return {"conversations": res.data or []}
        except Exception as e:
            logger.error(f"Error fetching conversations from Supabase: {e}")

    return {"conversations": []}


@app.post("/api/conversations")
async def create_conversation(auth_user: AuthenticatedUser = Depends(verify_supabase_token)):
    """Create a new conversation session for the authenticated user."""
    if supabase_client and auth_user.db_customer_id:
        try:
            res = supabase_client.table("conversations").insert({
                "customer_id": auth_user.db_customer_id,
                "title": "New Chat"
            }).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            logger.error(f"Failed to create conversation in Supabase: {e}")

    owner_id = (auth_user.internal_customer_id or auth_user.auth_user_id or "c001").lower()
    new_id = f"conv-{owner_id}-{int(asyncio.get_event_loop().time() * 1000)}"
    return {
        "id": new_id,
        "title": "New Chat",
        "created_at": "2026-08-29T10:00:00Z",
        "updated_at": "2026-08-29T10:00:00Z"
    }


@app.get("/api/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, auth_user: AuthenticatedUser = Depends(verify_supabase_token)):
    """Fetch messages for a specific conversation with strict ownership verification."""
    if supabase_client and auth_user.db_customer_id:
        try:
            conv = supabase_client.table("conversations").select("*").eq("id", conversation_id).eq("customer_id", auth_user.db_customer_id).execute()
            if not conv.data:
                raise HTTPException(status_code=403, detail="Access denied. You do not own this conversation.")

            res = supabase_client.table("messages").select("*").eq("conversation_id", conversation_id).order("created_at", desc=False).execute()
            return {"messages": res.data or []}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to load messages from Supabase: {e}")

    # Fallback user isolation check for local/mock mode
    if conversation_id.startswith("conv-"):
        owner_internal = auth_user.internal_customer_id.lower()
        owner_auth = auth_user.auth_user_id.lower()
        if owner_internal not in conversation_id.lower() and owner_auth not in conversation_id.lower():
            raise HTTPException(status_code=403, detail="Access denied. You do not own this conversation.")

    return {"messages": []}


@app.post("/api/chat", response_model=ChatResponse)
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest, auth_user: AuthenticatedUser = Depends(verify_supabase_token)):
    """Secured chat endpoint verified via Supabase JWT token."""
    user_msg = payload.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    
    internal_customer_id = auth_user.internal_customer_id
    logger.info(f"[CHAT] Incoming request: session_id={payload.session_id}, user={internal_customer_id}")
    
    if payload.session_id and payload.session_id != "null":
        session_id = payload.session_id
    else:
        session = await session_service.create_session(app_name="coffee_agent", user_id=internal_customer_id)
        session_id = session.id

        if supabase_client and auth_user.db_customer_id:
            try:
                title = generate_deterministic_title(user_msg)
                supabase_client.table("conversations").insert({
                    "id": session_id,
                    "customer_id": auth_user.db_customer_id,
                    "title": title
                }).execute()
            except Exception as e:
                logger.warning(f"Could not insert conversation into Supabase DB: {e}")

    if supabase_client:
        try:
            supabase_client.table("messages").insert({
                "conversation_id": session_id,
                "role": "user",
                "content": user_msg
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to save user message to DB: {e}")

    effective_query = f"[Customer profile {internal_customer_id}] {user_msg}"
    adk_msg = types.Content(role="user", parts=[types.Part.from_text(text=effective_query)])
    
    logger.info("[CHAT] Calling chatbot API")
    # Run ADK agent via model_provider helper with retry and error translation
    execution_result = await execute_adk_runner_with_retry(
        runner=runner,
        user_id=internal_customer_id,
        session_id=session_id,
        new_message=adk_msg
    )

    if execution_result.get("status") == "error":
        status_code = execution_result.get("status_code", 500)
        error_code = execution_result.get("error_code", "INTERNAL_SERVER_ERROR")
        user_err_msg = execution_result.get("user_message", "AI service is temporarily unavailable. Please try again.")
        logger.error(f"[CHAT] API status: {status_code} (Error: {error_code})")
        logger.error(f"[CHAT] API error details: {execution_result.get('raw_error', user_err_msg)}")
        return JSONResponse(
            status_code=status_code,
            content={
                "success": False,
                "error": error_code,
                "message": user_err_msg
            }
        )

    full_text = execution_result.get("text", "")
    full_text = re.sub(r'\bCustomer\s+C\d{3}\b', 'your', full_text, flags=re.IGNORECASE)
    full_text = re.sub(r"\bC\d{3}'s\b", "your", full_text, flags=re.IGNORECASE)
    full_text = re.sub(r'\bC\d{3}\b', 'your', full_text, flags=re.IGNORECASE)

    logger.info(f"[CHAT] API status: 200")
    logger.info(f"[CHAT] API response: {full_text[:100]!r}...")
    logger.info("[CHAT] Returning response to frontend")

    recommendations = extract_matching_recommendations(full_text)
    
    if supabase_client:
        try:
            supabase_client.table("messages").insert({
                "conversation_id": session_id,
                "role": "assistant",
                "content": full_text,
                "recommendations": recommendations
            }).execute()

            title = generate_deterministic_title(user_msg)
            supabase_client.table("conversations").update({"title": title}).eq("id", session_id).execute()
        except Exception as e:
            logger.warning(f"Failed to save assistant message to DB: {e}")

    title = generate_deterministic_title(user_msg)

    return ChatResponse(
        success=True,
        message=full_text,
        response=full_text,
        recommendations=recommendations,
        session_id=session_id,
        title=title,
        status="success"
    )



if __name__ == "__main__":
    import uvicorn
    log_config_status()
    is_dev = os.getenv("ENV", "development").lower() == "development"
    uvicorn.run(
        "server:app",
        host=HOST,
        port=PORT,
        reload=is_dev,
        reload_includes=["*.py", ".env", ".env.*"] if is_dev else None
    )
