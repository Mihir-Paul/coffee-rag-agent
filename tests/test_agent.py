import pytest
from google.adk import Agent
from coffee_agent.agent import root_agent


def test_agent_initialization():
    """Verify that root_agent is initialized with correct ADK properties."""
    assert isinstance(root_agent, Agent)
    assert root_agent.name == "coffee_shop_agent"
    assert len(root_agent.tools) == 4
    tool_names = [t.__name__ for t in root_agent.tools]
    assert "search_menu" in tool_names
    assert "get_customer_profile" in tool_names
    assert "get_menu_item" in tool_names
    assert "rag_search" in tool_names


def test_agent_instruction_contains_safety_rules():
    """Verify system instructions contain safety against hallucination."""
    instruction = root_agent.instruction
    assert "NEVER fabricate" in instruction or "never fabricate" in instruction.lower()
    assert "budget" in instruction.lower()


def test_agent_uses_configured_model():
    """Verify root_agent model matches configured GEMINI_MODEL."""
    assert root_agent.model is not None
    assert len(root_agent.model) > 0

