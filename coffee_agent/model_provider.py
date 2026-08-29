"""Gemini Model Provider & Execution Orchestration for CoffeeMind AI."""

import os
import asyncio
import logging
from typing import Any, Dict, Optional
from coffee_agent.config import GEMINI_MODEL, DEFAULT_MODEL

logger = logging.getLogger(__name__)


def get_model_name() -> str:
    """Retrieve the configured Gemini model name from environment variable."""
    return os.getenv("GEMINI_MODEL", DEFAULT_MODEL)


async def execute_adk_runner_with_retry(
    runner: Any, 
    user_id: str, 
    session_id: str, 
    new_message: Any, 
    max_retries: int = 3
) -> Dict[str, Any]:
    """Execute ADK Runner with bounded exponential backoff retries for HTTP 503 unavailable errors."""
    retry_delays = [0.1, 0.2, 0.4]
    
    for attempt in range(1, max_retries + 1):
        try:
            response_parts = []
            async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=new_message):
                if event.content and event.content.parts:
                    for p in event.content.parts:
                        if p.text:
                            response_parts.append(p.text)
            
            full_text = "\n".join(response_parts).strip()
            if not full_text:
                full_text = "I'm sorry, I couldn't generate a response. Please try again."

            return {
                "status": "success",
                "text": full_text
            }

        except Exception as e:
            err_msg = str(e)
            
            if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
                logger.warning("Gemini API 429 Resource Exhausted / Quota Limit reached.")
                return {
                    "status": "error",
                    "error_code": "AI_QUOTA_EXHAUSTED",
                    "user_message": "AI service usage limit reached.",
                    "status_code": 429,
                    "raw_error": err_msg
                }

            elif "503" in err_msg or "UNAVAILABLE" in err_msg or "high demand" in err_msg:
                logger.warning(f"Gemini API 503 Unavailable (Attempt {attempt}/{max_retries}).")
                if attempt < max_retries:
                    await asyncio.sleep(retry_delays[attempt - 1])
                    continue
                else:
                    return {
                        "status": "error",
                        "error_code": "AI_TEMPORARILY_UNAVAILABLE",
                        "user_message": "AI service is temporarily unavailable.",
                        "status_code": 503,
                        "raw_error": err_msg
                    }

            elif "403" in err_msg or "PERMISSION" in err_msg or "API key" in err_msg:
                logger.error(f"Gemini API Auth Error: {err_msg}")
                return {
                    "status": "error",
                    "error_code": "AI_AUTHENTICATION_ERROR",
                    "user_message": "Authentication error with AI provider.",
                    "status_code": 403,
                    "raw_error": err_msg
                }

            elif "404" in err_msg or "NOT_FOUND" in err_msg:
                logger.error(f"Gemini API Model Not Found: {err_msg}")
                return {
                    "status": "error",
                    "error_code": "AI_MODEL_NOT_FOUND",
                    "user_message": "Selected Gemini model is currently unavailable.",
                    "status_code": 404,
                    "raw_error": err_msg
                }

            else:
                logger.error(f"Unexpected model execution error: {err_msg}")
                return {
                    "status": "error",
                    "error_code": "INTERNAL_SERVER_ERROR",
                    "user_message": "AI service is temporarily unavailable.",
                    "status_code": 500,
                    "raw_error": err_msg
                }

    return {
        "status": "error",
        "error_code": "AI_TEMPORARILY_UNAVAILABLE",
        "user_message": "AI service is temporarily unavailable.",
        "status_code": 503
    }
