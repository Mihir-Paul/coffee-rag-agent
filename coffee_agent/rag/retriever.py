"""Coffee Shop RAG Engine & LangChain Retriever Interface."""

import os
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence

import numpy as np
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks import CallbackManagerForRetrieverRun

from coffee_agent.rag.documents import load_and_split_documents
from coffee_agent.rag.embeddings import (
    load_cached_embeddings,
    generate_and_cache_embeddings,
    EMBEDDING_MODEL
)
from coffee_agent.rag.fallback import keyword_fallback_search

logger = logging.getLogger(__name__)

SIMILARITY_THRESHOLD = 0.65


class CoffeeShopRagEngine:
    """RAG Engine managing LangChain document chunks, vector search, and keyword fallback."""

    def __init__(self, kb_dir: Optional[Path] = None):
        from coffee_agent.rag.documents import KB_DIR
        self.kb_dir: Path = kb_dir or KB_DIR
        self.rag_corpus_name: Optional[str] = os.getenv("RAG_CORPUS_NAME")
        self.documents: List[Document] = []
        self.embeddings: Optional[np.ndarray] = None
        self.retrieval_mode: str = "embedding_rag"
        self.rag_status: str = "available"
        self._initialize_pipeline(self.kb_dir)

    def _initialize_pipeline(self, kb_dir: Optional[Path] = None):
        """Load document chunks, load persistent embeddings cache, or fallback to keyword search."""
        self.documents = load_and_split_documents(kb_dir) if kb_dir else load_and_split_documents()
        
        if not self.documents:
            self.rag_status = "unavailable"
            return

        # Try loading cached embeddings first
        cached_vecs = load_cached_embeddings(self.documents)
        if cached_vecs is not None:
            self.embeddings = cached_vecs
            self.retrieval_mode = "embedding_rag"
            self.rag_status = "available"
            return

        # Otherwise generate vector embeddings
        vecs, mode = generate_and_cache_embeddings(self.documents)
        self.embeddings = vecs
        self.retrieval_mode = mode
        self.rag_status = "available"

    def query(self, query_text: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """Query RAG pipeline using vector similarity if available, else keyword fallback."""
        if not query_text or not query_text.strip():
            return []

        # Vector cosine similarity if embeddings are available
        if self.embeddings is not None and len(self.documents) > 0:
            try:
                import google.genai as genai
                api_key = os.getenv("GEMINI_API_KEY")
                client = genai.Client(api_key=api_key) if api_key else genai.Client()
                
                res = client.models.embed_content(
                    model=EMBEDDING_MODEL,
                    contents=query_text
                )
                vals = None
                if hasattr(res, "embedding") and res.embedding is not None and hasattr(res.embedding, "values"):
                    vals = res.embedding.values
                elif hasattr(res, "embeddings") and res.embeddings and len(res.embeddings) > 0 and res.embeddings[0] is not None:
                    vals = res.embeddings[0].values

                if vals is not None:
                    q_vec = np.array(vals, dtype=np.float32)
                    q_norm = np.linalg.norm(q_vec)
                    if q_norm > 0:
                        q_vec = q_vec / q_norm

                    similarities = np.dot(self.embeddings, q_vec)
                    top_indices = np.argsort(similarities)[::-1][:top_k]

                    results = []
                    for idx in top_indices:
                        score = float(similarities[idx])
                        if score >= SIMILARITY_THRESHOLD:
                            doc = self.documents[idx]
                            results.append({
                                "file": doc.metadata.get("file", ""),
                                "path": doc.metadata.get("path", ""),
                                "text": doc.page_content,
                                "score": score,
                                "source": "embedding_rag"
                            })
                    if results:
                        return results
            except Exception as e:
                logger.warning(f"Vector search skipped due to embedding API error: {e}")

        # Keyword Search Fallback
        return keyword_fallback_search(self.documents, query_text, top_k=top_k)

    def get_relevant_documents(self, query_text: str) -> List[Document]:
        """LangChain standard retriever method returning List[Document]."""
        matches = self.query(query_text)
        docs = []
        for match in matches:
            docs.append(
                Document(
                    page_content=match["text"],
                    metadata={
                        "source": match.get("source", "langchain_rag"),
                        "path": match.get("path", ""),
                        "score": match.get("score", 1.0)
                    }
                )
            )
        return docs

    def get_grounded_context(self, query_text: str) -> str:
        """Format retrieved context chunks into a grounded prompt context string."""
        matches = self.query(query_text)
        if not matches:
            return "NO_MATCH: No relevant knowledge base documents found for this query."

        formatted_chunks = []
        for i, match in enumerate(matches, 1):
            source_tag = match.get("source", "rag")
            formatted_chunks.append(
                f"--- Knowledge Chunk {i} (Path: {match.get('path', 'kb')}, Mode: {source_tag}) ---\n{match['text']}"
            )

        return "\n\n".join(formatted_chunks)


class LangChainCoffeeRetriever(BaseRetriever):
    """Custom LangChain BaseRetriever adapter wrapping CoffeeShopRagEngine."""

    engine: CoffeeShopRagEngine

    def _get_relevant_documents(
        self, query: str, *, run_manager: Optional[CallbackManagerForRetrieverRun] = None
    ) -> List[Document]:
        matches = self.engine.query(query)
        docs = []
        for m in matches:
            docs.append(
                Document(
                    page_content=m["text"],
                    metadata={
                        "source": m.get("source", "langchain_rag"),
                        "path": m.get("path", ""),
                        "score": m.get("score", 1.0)
                    }
                )
            )
        return docs
