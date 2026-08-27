import pytest
import os
from pathlib import Path
from coffee_agent.rag import rag_engine, rag_search, CoffeeShopRagEngine
from coffee_agent.agent import root_agent
from coffee_agent.tools import get_customer_profile


def test_rag_corpus_configuration():
    """Test 1: Verify RAG engine initializes with environment configuration and loaded documents."""
    engine = CoffeeShopRagEngine()
    assert len(engine.documents) > 0
    assert engine.kb_dir.exists()


def test_knowledge_base_ingestion():
    """Test 2: Verify knowledge base contains structured markdown documents across categories."""
    engine = CoffeeShopRagEngine()
    files = [doc.metadata["file"] if hasattr(doc, "metadata") else doc.get("file", "") for doc in engine.documents]
    assert any("coffee_menu.md" in f for f in files)
    assert any("cold_drinks.md" in f for f in files)
    assert any("dietary_information.md" in f for f in files)
    assert any("shop_information.md" in f for f in files)


def test_basic_retrieval():
    """Test 3: Basic query returns relevant text chunks."""
    matches = rag_engine.query("cold coffee", top_k=3)
    assert len(matches) > 0
    assert "text" in matches[0]
    assert "score" in matches[0]


def test_menu_retrieval():
    """Test 4: Menu retrieval query retrieves correct product entries."""
    context = rag_search("Espresso price and ingredients")
    assert "Espresso" in context
    assert "₹120" in context or "120" in context
    assert "Filter" in context or "Beans" in context or "Espresso" in context


def test_price_retrieval():
    """Test 5: Price query returns exact product pricing."""
    context = rag_search("What is the price of the Iced Vanilla Latte?")
    assert "Iced Vanilla Latte" in context
    assert "₹240" in context or "240" in context


def test_ingredient_retrieval():
    """Test 6: Ingredient retrieval query returns explicit ingredient lists."""
    context = rag_search("What are the ingredients in the Iced Vanilla Latte?")
    assert "Espresso" in context or "Oat Milk" in context or "Vanilla" in context


def test_dietary_allergen_retrieval():
    """Test 7: Non-dairy and allergen queries retrieve safe milk/allergen data."""
    context = rag_search("non dairy milk options lactose intolerant")
    assert "Oat Milk" in context or "Milk: None" in context or "Milk" in context


def test_personalized_recommendation_with_rag():
    """Test 8: Combining customer profile with RAG knowledge retrieval."""
    profile_resp = get_customer_profile("C001")
    assert profile_resp["status"] == "success"
    customer = profile_resp["customer"]
    assert customer["customer_id"] == "C001"

    rag_context = rag_search("Cold drinks sweet oat milk budget 250")
    assert len(rag_context) > 0
    assert "Iced Vanilla Latte" in rag_context or "Cold Coffee" in rag_context or "Oat Milk" in rag_context


def test_no_result_query_returns_empty_or_no_match():
    """Test 9: Non-existent product query returns no matches / NO_MATCH indicator."""
    matches = rag_engine.query("strawberry protein smoothie xyz12345")
    assert len(matches) == 0

    context = rag_search("strawberry protein smoothie xyz12345")
    assert "NO_MATCH" in context or "No relevant knowledge" in context


def test_anti_hallucination_rules():
    """Test 10: Root agent instructions contain strict RAG grounding rules."""
    instruction = root_agent.instruction
    instruction_str = str(instruction)
    if callable(instruction):
        try:
            instruction_str = str(instruction(None))  # type: ignore
        except Exception:
            instruction_str = str(instruction)

    assert "RAG" in instruction_str or "retrieved" in instruction_str.lower()
    assert "NEVER fabricate" in instruction_str or "never fabricate" in instruction_str.lower()

    tool_names = []
    for t in root_agent.tools:
        if hasattr(t, "__name__"):
            tool_names.append(t.__name__)
        elif hasattr(t, "name"):
            tool_names.append(t.name)
        else:
            tool_names.append(str(t))
    assert "rag_search" in tool_names
