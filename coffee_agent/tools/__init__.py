"""CoffeeMind AI ADK Tools Package."""

import json
import logging
from typing import Any, Dict, List, Optional
from coffee_agent.config import MENU_FILE_PATH, CUSTOMERS_FILE_PATH

from coffee_agent.tools.coffee_rag import search_coffee_knowledge, rag_search
from coffee_agent.tools.calculator import calculate_coffee_brew, calculate_order_total
from coffee_agent.tools.recipes import generate_coffee_recipe
from coffee_agent.tools.preferences import get_customer_preferences
from coffee_agent.tools.memories import get_customer_memories, save_customer_memory
from coffee_agent.tools.troubleshooting import troubleshoot_coffee_brew

logger = logging.getLogger(__name__)


def _load_menu_data() -> List[Dict[str, Any]]:
    if not MENU_FILE_PATH.exists():
        logger.error(f"Menu data file not found at {MENU_FILE_PATH}")
        return []
    with open(MENU_FILE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_customers_data() -> List[Dict[str, Any]]:
    if not CUSTOMERS_FILE_PATH.exists():
        logger.error(f"Customers data file not found at {CUSTOMERS_FILE_PATH}")
        return []
    with open(CUSTOMERS_FILE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def search_menu(
    query: str = "",
    max_price: Optional[float] = None,
    category: Optional[str] = None,
    temperature: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Search the coffee shop menu by text query, price budget, category, or temperature."""
    items = _load_menu_data()
    results = []
    query_clean = query.strip().lower()

    for item in items:
        if max_price is not None and item.get("price_inr", 0) > max_price:
            continue
        if temperature and item.get("temperature", "").lower() != temperature.strip().lower():
            continue
        if category and category.strip().lower() not in item.get("category", "").lower():
            continue

        if query_clean and query_clean not in ["all", "menu", "coffees", "anything"]:
            matched = False
            searchable_text = " ".join([
                item.get("name", ""),
                item.get("category", ""),
                item.get("description", ""),
                item.get("temperature", ""),
                item.get("sweetness", ""),
                item.get("milk", ""),
                " ".join(item.get("ingredients", [])),
                " ".join(item.get("allergens", []))
            ]).lower()

            keywords = query_clean.split()
            if all(kw in searchable_text for kw in keywords):
                matched = True

            if "dairy" in query_clean:
                if "no dairy" in query_clean or "dairy-free" in query_clean or "don't drink dairy" in query_clean or "without dairy" in query_clean:
                    if item.get("milk") in ["None", "Oat Milk"] and "Milk" not in item.get("allergens", []):
                        matched = True
                    else:
                        matched = False

            if not matched:
                continue

        results.append(item)

    return results


def get_customer_profile(customer_id: str) -> Dict[str, Any]:
    """Retrieve customer preferences and profile by Customer ID."""
    customers = _load_customers_data()
    clean_id = customer_id.strip().upper()

    for customer in customers:
        if customer.get("customer_id", "").upper() == clean_id:
            return {
                "status": "success",
                "customer": customer
            }

    return {
        "status": "error",
        "message": f"Customer ID '{customer_id}' not found."
    }


def get_menu_item(item_id: str) -> Dict[str, Any]:
    """Lookup a single menu item by its ID or exact product name."""
    items = _load_menu_data()
    clean_target = item_id.strip().lower()

    for item in items:
        if item.get("id", "").lower() == clean_target or item.get("name", "").lower() == clean_target:
            return {
                "status": "success",
                "item": item
            }

    return {
        "status": "error",
        "message": f"Menu item '{item_id}' not found."
    }


__all__ = [
    "search_menu",
    "get_customer_profile",
    "get_menu_item",
    "search_coffee_knowledge",
    "rag_search",
    "calculate_coffee_brew",
    "calculate_order_total",
    "generate_coffee_recipe",
    "get_customer_preferences",
    "get_customer_memories",
    "save_customer_memory",
    "troubleshoot_coffee_brew"
]
