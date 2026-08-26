import os
import logging
from pathlib import Path
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

MENU_FILE_PATH = Path(os.getenv("MENU_FILE_PATH", DATA_DIR / "menu.json"))
CUSTOMERS_FILE_PATH = Path(os.getenv("CUSTOMERS_FILE_PATH", DATA_DIR / "customers.json"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
DEFAULT_MODEL = GEMINI_MODEL


def validate_environment() -> tuple[bool, str]:
    """Validate presence and configuration of required environment variables."""
    key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL")

    if not key or key.strip() == "" or key.startswith("your_"):
        return False, "GEMINI_API_KEY is missing or unconfigured in .env file."
    if not model or model.strip() == "":
        return False, "GEMINI_MODEL is missing or unconfigured in .env file."

    return True, "Environment configured successfully."

