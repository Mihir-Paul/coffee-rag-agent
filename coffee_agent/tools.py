import json
import logging
from typing import Any, Dict, List, Optional
from coffee_agent.config import MENU_FILE_PATH, CUSTOMERS_FILE_PATH

logger = logging.getLogger(__name__)


def _load_menu_data() -> List[Dict[str, Any]]:
    """Helper to load menu data from JSON file."""
    if not MENU_FILE_PATH.exists():
        logger.error(f"Menu data file not found at {MENU_FILE_PATH}")
        return []
    with open(MENU_FILE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_customers_data() -> List[Dict[str, Any]]:
    """Helper to load customer data from JSON file."""
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
    """Search the coffee shop menu by text query, price budget, category, or temperature.

    Args:
        query: Search keywords to look for in product name, category, or description (e.g. 'cold', 'latte', 'sweet', 'dairy').
        max_price: Maximum price budget in INR (e.g. 200.0).
        category: Specific product category (e.g. 'Coffee', 'Cold Coffee', 'Frappe', 'Tea', 'Beverage').
        temperature: Preferred beverage temperature ('Hot' or 'Cold').

    Returns:
        List of matching menu items with full product details.
    """
    items = _load_menu_data()
    results = []
    query_clean = query.strip().lower()

    for item in items:
        # Price check
        if max_price is not None and item.get("price_inr", 0) > max_price:
            continue

        # Temperature check
        if temperature and item.get("temperature", "").lower() != temperature.strip().lower():
            continue

        # Category check
        if category and category.strip().lower() not in item.get("category", "").lower():
            continue

        # Query matching
        if query_clean and query_clean not in ["all", "menu", "coffees", "anything"]:
            matched = False
            # Check fields
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

            # Direct string inclusion or sub-word match
            keywords = query_clean.split()
            if all(kw in searchable_text for kw in keywords):
                matched = True

            # Special non-dairy / dairy search handling
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
    """Retrieve customer preferences and profile by Customer ID.

    Args:
        customer_id: The unique customer identifier (e.g. 'C001').

    Returns:
        Dictionary containing customer preferences (temperature, sweetness, milk, budget, dietary restrictions)
        or an error message if not found.
    """
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
        "message": f"Customer ID '{customer_id}' not found. Please verify the ID."
    }


def get_menu_item(item_id: str) -> Dict[str, Any]:
    """Lookup a single menu item by its ID or exact product name.

    Args:
        item_id: Menu item ID (e.g. 'M001') or exact name (e.g. 'Espresso').

    Returns:
        Dictionary containing product details or an error message if missing.
    """
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
