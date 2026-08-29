"""
Centralized Backend Configuration Module for CoffeeMind AI.

Loads, validates, and manages server environment variables.
Provides safe startup logging without exposing secret API keys or credentials.
"""

import os
import logging
from pathlib import Path
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

logger = logging.getLogger("coffee_config")

# Force fresh load of .env file into os.environ on process start
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH, override=True)
else:
    load_dotenv(override=True)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

# Application Data Paths
MENU_FILE_PATH = Path(os.getenv("MENU_FILE_PATH", DATA_DIR / "menu.json"))
CUSTOMERS_FILE_PATH = Path(os.getenv("CUSTOMERS_FILE_PATH", DATA_DIR / "customers.json"))

# Gemini & Chatbot API Configuration
CHATBOT_API_KEY = os.getenv("CHATBOT_API_KEY")
CHATBOT_API_URL = os.getenv("CHATBOT_API_URL")
GEMINI_API_KEY = CHATBOT_API_KEY or os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.7-flash")
DEFAULT_MODEL = GEMINI_MODEL

# Google Cloud RAG Configuration
GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
GOOGLE_CLOUD_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
RAG_CORPUS_NAME = os.getenv("RAG_CORPUS_NAME")

# Supabase Authentication & Database Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # SERVER ONLY
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")                # SERVER ONLY

# Server Configuration
PORT = int(os.getenv("PORT", 8000))


def validate_environment() -> tuple[bool, str]:
    """
    Validate presence and correctness of required environment variables.
    Returns (is_valid: bool, status_message: str). Never exposes secrets.
    """
    issues = []

    # Check API Key
    if not GEMINI_API_KEY or GEMINI_API_KEY.strip() == "" or GEMINI_API_KEY.startswith("your_"):
        issues.append("Chatbot / Gemini API key is not configured. Check .env for GEMINI_API_KEY or CHATBOT_API_KEY.")

    # Check Gemini Model
    if not GEMINI_MODEL or GEMINI_MODEL.strip() == "":
        issues.append("Gemini model name is missing. Check .env.")

    # Check Supabase Configuration
    if not SUPABASE_URL or SUPABASE_URL.startswith("https://your-"):
        issues.append("Supabase URL is not configured. Check .env.")

    if not SUPABASE_SERVICE_ROLE_KEY and not SUPABASE_ANON_KEY:
        issues.append("Supabase configuration is not complete. Check .env.")

    if issues:
        return False, " | ".join(issues)

    return True, "All environment variables configured successfully."


def log_config_status():
    """
    Safely log configuration status at startup without printing secret values.
    """
    gemini_key_status = "configured" if (GEMINI_API_KEY and not GEMINI_API_KEY.startswith("your_")) else "not configured"
    supabase_status = "configured" if (SUPABASE_URL and not SUPABASE_URL.startswith("https://your-")) else "not configured"

    print("=== CoffeeMind AI Backend Configuration ===")
    print(f"Gemini API key: {gemini_key_status}")
    print(f"Gemini model: {GEMINI_MODEL}")
    print(f"Supabase: {supabase_status}")
    print(f"Server port: {PORT}")
    print("===========================================")
