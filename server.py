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
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

from coffee_agent.config import validate_environment, MENU_FILE_PATH
from coffee_agent.agent import root_agent
from coffee_agent.rag import rag_engine
# pyrefly: ignore [missing-import]
from google.adk.runners import Runner
# pyrefly: ignore [missing-import]
from google.adk.sessions import InMemorySessionService
# pyrefly: ignore [missing-import]
from google.genai import types

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("coffee_backend")

# Validate environment at startup
is_valid, env_msg = validate_environment()
if not is_valid:
    logger.warning(f"Backend environment warning: {env_msg}")

from contextlib import asynccontextmanager

PORT = int(os.getenv("PORT", 8000))


@asynccontextmanager
async def lifespan(app: FastAPI):
    rag_state = getattr(rag_engine, "rag_status", "available")
    logger.info("==================================================")
    logger.info(f"CoffeeMind backend started on port {PORT}")
    logger.info(f"API: http://localhost:{PORT}")
    logger.info(f"Model: {root_agent.model}")
    logger.info(f"RAG: {rag_state}")
    logger.info("==================================================")
    yield


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
    user_id: Optional[str] = "customer_1"
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


@app.get("/health")
@app.get("/api/health")
async def health_check():
    rag_state = getattr(rag_engine, "rag_status", "available")
    return {
        "status": "ok",
        "rag": rag_state,
        "app": "CoffeeMind AI Backend",
        "agent": root_agent.name,
        "model": root_agent.model
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    user_msg = payload.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    
    user_id = payload.user_id or "customer_1"
    
    # Create or retrieve session
    if payload.session_id:
        session_id = payload.session_id
    else:
        session = await session_service.create_session(app_name="coffee_agent", user_id=user_id)
        session_id = session.id
    
    adk_msg = types.Content(role="user", parts=[types.Part.from_text(text=user_msg)])
    
    # Bounded retries with exponential backoff ONLY for 503 UNAVAILABLE high demand errors
    max_retries = 3
    retry_delays = [2, 4, 8]
    
    for attempt in range(1, max_retries + 1):
        try:
            response_parts = []
            async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=adk_msg):
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
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=PORT, reload=False)
