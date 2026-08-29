"""Customer Coffee Preferences ADK Tools."""

import json
import logging
from typing import Dict, Any, List, Optional
from coffee_agent.config import CUSTOMERS_FILE_PATH

logger = logging.getLogger(__name__)


def _load_customers() -> List[Dict[str, Any]]:
    if CUSTOMERS_FILE_PATH.exists():
        with open(CUSTOMERS_FILE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def get_customer_preferences(customer_id: str) -> Dict[str, Any]:
    """Retrieve saved coffee taste preferences for a customer.
    
    Args:
        customer_id: Internal customer identifier (e.g. 'C001').
        
    Returns:
        Customer preference details (preferred temperature, sweetness, milk, caffeine, budget, dietary restrictions).
    """
    customers = _load_customers()
    clean_id = customer_id.strip().upper()

    for c in customers:
        if c.get("customer_id", "").upper() == clean_id:
            return {
                "status": "success",
                "customer_id": clean_id,
                "name": c.get("name"),
                "preferences": {
                    "preferred_temperature": c.get("preferred_temperature", "Cold"),
                    "preferred_sweetness": c.get("preferred_sweetness", "Medium"),
                    "preferred_milk": c.get("preferred_milk", "Oat Milk"),
                    "caffeine_preference": c.get("caffeine_preference", "Medium"),
                    "budget_inr": c.get("budget_inr", 250.0),
                    "dietary_restrictions": c.get("dietary_restrictions", [])
                }
            }

    return {
        "status": "success",
        "customer_id": clean_id,
        "preferences": {
            "preferred_temperature": "Cold",
            "preferred_sweetness": "Medium",
            "preferred_milk": "Oat Milk",
            "caffeine_preference": "Medium",
            "budget_inr": 250.0,
            "dietary_restrictions": []
        }
    }
