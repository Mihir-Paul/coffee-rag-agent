"""Coffee RAG Search ADK Tool."""

from coffee_agent.rag import rag_search


def search_coffee_knowledge(query: str = "") -> str:
    """Search the coffee shop RAG knowledge base for official menu items, prices, ingredients, allergens, dietary policies, and shop details.
    
    Args:
        query: Specific search terms or question regarding coffee shop offerings or knowledge base.
        
    Returns:
        Grounded context retrieved from knowledge base documents.
    """
    return rag_search(query)


__all__ = ["search_coffee_knowledge", "rag_search"]
