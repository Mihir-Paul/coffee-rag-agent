"""Coffee Brewing Troubleshooting ADK Tool."""

from typing import Dict, Any


def troubleshoot_coffee_brew(issue_description: str) -> Dict[str, Any]:
    """Diagnose espresso, pour-over, or coffee extraction issues (sourness, bitterness, weak crema, channeling).
    
    Args:
        issue_description: Description of taste or extraction problem (e.g. 'espresso tastes too sour', 'coffee is bitter and watery').
        
    Returns:
        Barista diagnostic breakdown and actionable adjustments.
    """
    desc_lower = issue_description.lower()
    diagnosis = "Standard Extraction Adjustment"
    causes = []
    remedies = []

    if "sour" in desc_lower or "acidic" in desc_lower or "under-extracted" in desc_lower:
        diagnosis = "Under-Extraction (Flowing too quickly / insufficient contact time)"
        causes = [
            "Grind size is too coarse.",
            "Water temperature is too low (below 90°C).",
            "Extraction time was too short (under 25 seconds for double shot).",
            "Dose is too small for basket size."
        ]
        remedies = [
            "Fine-tune grind size finer.",
            "Increase brew water temperature to 93°C.",
            "Increase shot extraction time to 28-30 seconds."
        ]
    elif "bitter" in desc_lower or "harsh" in desc_lower or "over-extracted" in desc_lower or "burnt" in desc_lower:
        diagnosis = "Over-Extraction (Flowing too slowly / excess contact time)"
        causes = [
            "Grind size is too fine.",
            "Water temperature is too high (above 95°C).",
            "Extraction time was too long (over 35 seconds).",
            "Over-tamping or channeling."
        ]
        remedies = [
            "Adjust grind size slightly coarser.",
            "Lower brew water temperature to 91-92°C.",
            "Ensure level distribution and even tamping force (15kg)."
        ]
    elif "crema" in desc_lower or "weak" in desc_lower or "watery" in desc_lower:
        diagnosis = "Low Crema / Weak Body"
        causes = [
            "Beans are stale (roasted over 4 weeks ago) or roast is too light.",
            "Under-dosing or low extraction pressure (under 9 bar)."
        ]
        remedies = [
            "Use freshly roasted beans (7-21 days past roast date).",
            "Increase coffee dose by 1.0g.",
            "Verify machine pump pressure at 9 bar."
        ]
    else:
        causes = ["General extraction variance."]
        remedies = ["Check grind consistency, dose weight (+/- 0.1g), and water temperature."]

    return {
        "status": "success",
        "issue": issue_description,
        "diagnosis": diagnosis,
        "probable_causes": causes,
        "recommended_adjustments": remedies
    }
