"""Coffee Recipe Generation ADK Tool."""

from typing import Dict, Any


def generate_coffee_recipe(
    beverage_name: str, 
    milk_type: str = "Oat Milk", 
    sweetness_level: str = "Medium"
) -> Dict[str, Any]:
    """Generate a step-by-step barista recipe and preparation guide for a custom coffee beverage.
    
    Args:
        beverage_name: Name of beverage (e.g. 'Cortado', 'Flat White', 'Iced Vanilla Latte').
        milk_type: Type of milk ('Oat Milk', 'Whole Milk', 'Almond Milk', 'None').
        sweetness_level: Sweetness level ('None', 'Low', 'Medium', 'High').
        
    Returns:
        Structured recipe parameters and preparation instructions.
    """
    bev_lower = beverage_name.lower()
    temp = "Cold" if "iced" in bev_lower or "cold" in bev_lower or "frappe" in bev_lower else "Hot"
    
    espresso_shots = 2 if "cortado" in bev_lower or "flat white" in bev_lower or "double" in bev_lower else 1
    
    steps = [
        "1. Grind 18g of fresh espresso roast beans to fine consistency.",
        f"2. Pull {espresso_shots} shot(s) of double espresso (36g liquid yield in 28-30 seconds).",
    ]
    
    if milk_type != "None":
        if temp == "Hot":
            steps.append(f"3. Steam 150ml of {milk_type} to 60-65°C with silky microfoam.")
        else:
            steps.append(f"3. Fill glass with ice and pour 150ml of cold {milk_type}.")

    if sweetness_level != "None":
        syrup_pumps = 1 if sweetness_level == "Low" else (2 if sweetness_level == "Medium" else 3)
        steps.append(f"4. Stir in {syrup_pumps} pump(s) of vanilla/caramel house syrup.")

    steps.append("5. Pour espresso over beverage base and serve fresh.")

    return {
        "status": "success",
        "beverage": beverage_name,
        "temperature": temp,
        "espresso_shots": espresso_shots,
        "milk": milk_type,
        "sweetness": sweetness_level,
        "steps": steps
    }
