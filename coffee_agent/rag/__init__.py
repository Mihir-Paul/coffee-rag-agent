"""Coffee Shop LangChain RAG Package."""

from coffee_agent.rag.retriever import CoffeeShopRagEngine, LangChainCoffeeRetriever

# Singleton RAG Engine instance
rag_engine = CoffeeShopRagEngine()


def rag_search(query: str = "") -> str:
    """Search the coffee shop RAG knowledge base for official menu items, prices, ingredients, allergens, dietary policies, and shop details."""
    clean_query = query.strip()
    if not clean_query:
        return "Please provide a specific query to search the coffee shop knowledge base."

    context = rag_engine.get_grounded_context(clean_query)
    return context


__all__ = ["rag_engine", "rag_search", "CoffeeShopRagEngine", "LangChainCoffeeRetriever"]
