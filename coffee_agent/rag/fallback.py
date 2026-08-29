"""LangChain RAG Keyword Search Fallback Module.

Used when vector embedding API returns HTTP 429 quota exhaustion or is unconfigured.
Provides deterministic keyword search over chunked LangChain Document objects.
"""

import string
import logging
from typing import List, Dict, Any
from langchain_core.documents import Document

logger = logging.getLogger(__name__)


def keyword_fallback_search(documents: List[Document], query_text: str, top_k: int = 4) -> List[Dict[str, Any]]:
    """Perform keyword-based search over LangChain Document chunks.
    
    Args:
        documents: List of chunked LangChain Document objects.
        query_text: User search query.
        top_k: Max number of relevant documents to return.
        
    Returns:
        List of result dictionaries containing document text, metadata, score, and source='keyword_fallback'.
    """
    if not documents or not query_text or not query_text.strip():
        return []

    stop_words = {
        "what", "is", "the", "of", "and", "in", "for", "a", "to", "are", 
        "you", "do", "have", "can", "i", "what's", "what is", "about", "me"
    }
    
    clean_text = query_text.translate(str.maketrans("", "", string.punctuation)).lower()
    query_words = [w for w in clean_text.split() if w not in stop_words and len(w) > 1]
    if not query_words:
        query_words = [clean_text.strip()]

    all_kb_text = " ".join([doc.page_content.lower() for doc in documents])

    for w in query_words:
        if len(w) > 3 and not w.isdigit() and w not in all_kb_text:
            logger.debug(f"Query term '{w}' not in KB documents. Skipping fallback match.")
            return []

    scored_chunks = []
    for doc in documents:
        text_lower = doc.page_content.lower()
        matches_count = sum(1 for w in query_words if w in text_lower)
        if matches_count > 0:
            score = matches_count / len(query_words)
            scored_chunks.append((score, doc))

    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    results = []
    for score, doc in scored_chunks[:top_k]:
        if score >= 0.35:
            results.append({
                "file": doc.metadata.get("file", ""),
                "path": doc.metadata.get("path", ""),
                "text": doc.page_content,
                "score": score,
                "source": "keyword_fallback"
            })
            
    return results
