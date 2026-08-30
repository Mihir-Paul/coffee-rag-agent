"""
Vercel Serverless Python Function entrypoint for CoffeeMind AI FastAPI Backend.
Exposes the FastAPI `app` instance directly from server.py for unified Vercel deployment.
"""

import sys
from pathlib import Path

# Add project root directory to sys.path so server.py and coffee_agent are discoverable
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Import the existing FastAPI application instance from server.py
from server import app
