import pytest
from coffee_agent.tools import search_menu, get_customer_profile, get_menu_item


def test_search_menu_returns_relevant_products():
    """Test 1: Menu search returns relevant products matching query, price, and temperature."""
    # Test query search
    cold_results = search_menu(query="cold")
    assert len(cold_results) > 0
    for item in cold_results:
        assert "cold" in item["temperature"].lower() or "cold" in item["category"].lower() or "cold" in item["name"].lower() or "iced" in item["name"].lower()

    # Test budget filter
    budget_results = search_menu(max_price=150)
    assert len(budget_results) > 0
    for item in budget_results:
        assert item["price_inr"] <= 150


def test_get_customer_profile_valid():
    """Test 2: get_customer_profile returns the correct customer details."""
    response = get_customer_profile("C001")
    assert response["status"] == "success"
    customer = response["customer"]
    assert customer["customer_id"] == "C001"
    assert customer["name"] == "Mihir"
    assert customer["preferred_temperature"] == "Cold"
    assert customer["budget_inr"] == 250


def test_get_customer_profile_invalid():
    """Test 3: Invalid customer ID is handled gracefully."""
    response = get_customer_profile("INVALID_ID_999")
    assert response["status"] == "error"
    assert "not found" in response["message"].lower()


def test_get_menu_item_valid():
    """Test 4: Menu item lookup works by ID and by product name."""
    # Lookup by ID
    res_id = get_menu_item("M001")
    assert res_id["status"] == "success"
    assert res_id["item"]["name"] == "Espresso"

    # Lookup by exact Name
    res_name = get_menu_item("Latte")
    assert res_name["status"] == "success"
    assert res_name["item"]["id"] == "M004"


def test_get_menu_item_missing():
    """Test 5: Missing menu item is handled gracefully."""
    response = get_menu_item("NON_EXISTENT_COFFEE")
    assert response["status"] == "error"
    assert "not found" in response["message"].lower()


def test_recommendation_tool_data_schema():
    """Test 6: Recommendation-related tool data contains expected fields."""
    items = search_menu(query="latte")
    assert len(items) > 0
    required_fields = {
        "id", "name", "category", "price_inr", "temperature",
        "sweetness", "caffeine", "milk", "ingredients", "allergens", "description"
    }
    for item in items:
        assert required_fields.issubset(set(item.keys()))
        assert isinstance(item["price_inr"], (int, float))
        assert isinstance(item["ingredients"], list)
        assert isinstance(item["allergens"], list)
