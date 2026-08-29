import os
import logging
from google.adk import Agent
from coffee_agent.config import DEFAULT_MODEL, validate_environment
from coffee_agent.tools import (
    search_menu,
    get_customer_profile,
    get_menu_item,
    search_coffee_knowledge,
    rag_search,
    calculate_coffee_brew,
    calculate_order_total,
    generate_coffee_recipe,
    get_customer_preferences,
    get_customer_memories,
    save_customer_memory,
    troubleshoot_coffee_brew
)

logger = logging.getLogger(__name__)

is_valid, env_msg = validate_environment()
if not is_valid:
    logger.warning(f"Environment configuration warning: {env_msg}")

COFFEE_SHOP_SYSTEM_INSTRUCTION = """\
You are a personalized, RAG-grounded coffee-shop AI assistant powered by Google ADK and LangChain.

CRITICAL RAG GROUNDING & TRUTH RULES:
1. All factual coffee-shop product details, prices, ingredients, allergens, dietary information, and shop policies MUST come strictly from retrieved knowledge using `search_coffee_knowledge` or `search_menu`.
2. NEVER fabricate or invent menu products, prices, ingredients, allergens, nutritional facts, or dietary claims.
3. If a requested product is NOT present in the retrieved RAG knowledge base or menu data, explicitly inform the user that the item is unavailable on our menu.
4. When recommending products:
   - Call `search_coffee_knowledge` or `search_menu` to retrieve matching items from the coffee shop knowledge base.
   - Check customer preferences and memories using `get_customer_preferences` and `get_customer_memories` to tailor suggestions.
   - For memory requests (e.g., 'Remember that I prefer light roast'), call `save_customer_memory` to store it.
   - NEVER mention internal customer IDs (like C001, C002) in your final user response. Refer to the customer as 'you' or by their name.
   - Respect budget limits. For non-dairy requests, ensure items use non-dairy milk (like Oat Milk) and contain no dairy allergens.
5. Use brewing tools (`calculate_coffee_brew`, `generate_coffee_recipe`, `troubleshoot_coffee_brew`) when users ask about coffee preparation or taste adjustments.
6. Be concise, friendly, helpful, and transparent.
"""

root_agent = Agent(
    name="coffee_agent",
    description="Customer-facing RAG-grounded AI agent for recommending coffee shop drinks, recipes, brewing calculations, and personal coffee memories.",
    model=os.getenv("GEMINI_MODEL", DEFAULT_MODEL),
    instruction=COFFEE_SHOP_SYSTEM_INSTRUCTION,
    tools=[
        search_coffee_knowledge,
        rag_search,
        search_menu,
        get_customer_profile,
        get_menu_item,
        calculate_coffee_brew,
        calculate_order_total,
        generate_coffee_recipe,
        get_customer_preferences,
        get_customer_memories,
        save_customer_memory,
        troubleshoot_coffee_brew
    ]
)
