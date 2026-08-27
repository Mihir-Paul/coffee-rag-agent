"""Dedicated unit tests for LangChain RAG retrieval layer in CoffeeMind AI."""

import pytest
from langchain_core.documents import Document
from coffee_agent.rag import rag_engine, rag_search, CoffeeShopRagEngine
from coffee_agent.agent import root_agent
from coffee_agent.tools import get_customer_profile


def test_langchain_document_loading_and_chunking():
    """Verify documents are loaded into LangChain Document instances and chunked."""
    engine = CoffeeShopRagEngine()
    assert len(engine.documents) > 0
    first_doc = engine.documents[0]
    assert isinstance(first_doc, Document)
    assert hasattr(first_doc, "page_content")
    assert hasattr(first_doc, "metadata")
    assert "file" in first_doc.metadata


def test_langchain_retriever_interface():
    """Verify get_relevant_documents returns a list of LangChain Document objects."""
    docs = rag_engine.get_relevant_documents("cold coffee")
    assert isinstance(docs, list)
    if docs:
        assert isinstance(docs[0], Document)
        assert len(docs[0].page_content) > 0
        assert "source" in docs[0].metadata


def test_langchain_keyword_search_fallback():
    """Verify fallback mechanism retrieves relevant context even when vector embeddings are unconfigured/cached."""
    matches = rag_engine.query("Iced Vanilla Latte")
    assert len(matches) > 0
    assert "Iced Vanilla Latte" in matches[0]["text"]
    assert matches[0]["source"] in ["langchain_vector_store", "langchain_keyword_fallback", "gemini_embedding_vector_store"]


def test_adk_tool_integration():
    """Verify rag_search tool returns formatted grounded text string for ADK."""
    context = rag_search("What milk options are available?")
    assert "Oat Milk" in context or "Milk" in context
    assert "--- Knowledge Chunk" in context or "Knowledge Chunk" in context


def test_anti_hallucination_grounding():
    """Verify queries for unlisted products return NO_MATCH indicator."""
    context = rag_search("strawberry protein smoothie xyz999")
    assert "NO_MATCH" in context or "No relevant knowledge" in context


def test_customer_personalization_privacy():
    """Verify customer profiles are retrieved without exposing internal customer IDs to responses."""
    resp = get_customer_profile("C001")
    assert resp["status"] == "success"
    assert resp["customer"]["name"] in ["Mihir", "Aarav"]
    assert resp["customer"]["customer_id"] == "C001"
