"""Coffee Brewing & Budget Calculator ADK Tools."""

from typing import Dict, Any, List


def calculate_coffee_brew(
    coffee_grams: float = 15.0, 
    water_ml: float = 250.0, 
    target_ratio: str = "1:15"
) -> Dict[str, Any]:
    """Calculate precise coffee-to-water brewing ratios and extraction parameters.
    
    Args:
        coffee_grams: Weight of coffee grounds in grams (e.g. 15.0).
        water_ml: Volume of water in milliliters (e.g. 250.0).
        target_ratio: Desired brew ratio string ('1:15', '1:16', '1:17').
        
    Returns:
        Dictionary with recommended coffee weight, water volume, brew ratio, and extraction time.
    """
    try:
        ratio_val = float(target_ratio.split(":")[1]) if ":" in target_ratio else 15.0
    except Exception:
        ratio_val = 15.0

    calculated_water = coffee_grams * ratio_val
    calculated_coffee = water_ml / ratio_val

    return {
        "status": "success",
        "input_coffee_g": coffee_grams,
        "input_water_ml": water_ml,
        "ratio": f"1:{ratio_val:.1f}",
        "recommended_water_for_input_coffee_ml": round(calculated_water, 1),
        "recommended_coffee_for_input_water_g": round(calculated_coffee, 1),
        "typical_brew_time": "2:30 - 3:15 minutes",
        "grind_size_recommendation": "Medium-fine for pour-over, Fine for espresso"
    }


def calculate_order_total(item_prices: List[float], discount_percent: float = 0.0) -> Dict[str, Any]:
    """Calculate total price in INR for multiple menu items with optional discount.
    
    Args:
        item_prices: List of item prices in INR (e.g. [180.0, 220.0]).
        discount_percent: Discount percentage to apply (e.g. 10.0 for 10% off).
        
    Returns:
        Dictionary with subtotal, discount amount, and final total in INR.
    """
    subtotal = sum(item_prices)
    discount_amount = (subtotal * max(0.0, min(100.0, discount_percent))) / 100.0
    total = max(0.0, subtotal - discount_amount)

    return {
        "status": "success",
        "subtotal_inr": round(subtotal, 2),
        "discount_applied_inr": round(discount_amount, 2),
        "total_inr": round(total, 2)
    }
