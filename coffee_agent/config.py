import os
from pathlib import Path
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

MENU_FILE_PATH = Path(os.getenv("MENU_FILE_PATH", DATA_DIR / "menu.json"))
CUSTOMERS_FILE_PATH = Path(os.getenv("CUSTOMERS_FILE_PATH", DATA_DIR / "customers.json"))

DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.7-flash")
