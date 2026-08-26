"""Coffee Shop RAG (Retrieval-Augmented Generation) Module.

Provides real Google RAG retrieval capabilities over coffee shop knowledge documents using Google Cloud RAG Corpus
and Gemini Embedding models (`gemini-embedding-001`).
"""

import os
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
from dotenv import load_dotenv
import google.genai as genai

load_dotenv()

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
KB_DIR = BASE_DIR / "knowledge_base"
EMBEDDING_MODEL = "gemini-embedding-001"
SIMILARITY_THRESHOLD = 0.68


class CoffeeShopRagEngine:
    """RAG Engine for loading knowledge documents, embedding content, and retrieving relevant facts."""

    def __init__(self, kb_dir: Optional[Path] = None):
        self.kb_dir = kb_dir or KB_DIR
        self._client = None
        self.documents: List[Dict[str, Any]] = []
        self.embeddings: Optional[np.ndarray] = None
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        self.location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        self.rag_corpus_name = os.getenv("RAG_CORPUS_NAME")
        self._load_and_index_documents()

    @property
    def client(self):
        if self._client is None:
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key and not api_key.startswith("your_"):
                self._client = genai.Client(api_key=api_key)
            else:
                self._client = genai.Client()
        return self._client

    def _load_and_index_documents(self) -> None:
        """Load markdown documents from knowledge base and compute vector embeddings."""
        if not self.kb_dir.exists():
            logger.warning(f"Knowledge base directory {self.kb_dir} does not exist.")
            return

        kb_files = list(self.kb_dir.glob("**/*.md"))
        chunks = []

        for filepath in kb_files:
            try:
                content = filepath.read_text(encoding="utf-8")
                sections = [s.strip() for s in content.split("---") if s.strip()]
                for idx, sec in enumerate(sections):
                    chunks.append({
                        "file": filepath.name,
                        "path": str(filepath.relative_to(self.kb_dir)),
                        "section_id": idx,
                        "text": sec
                    })
            except Exception as e:
                logger.error(f"Error reading knowledge base file {filepath}: {e}")

        self.documents = chunks
        logger.info(f"Loaded {len(self.documents)} knowledge base chunks from {len(kb_files)} files.")

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key.startswith("your_"):
            logger.warning("GEMINI_API_KEY not configured or placeholder detected. Vector embedding generation skipped.")
            return

        if self.documents:
            try:
                texts = [doc["text"] for doc in self.documents]
                vectors = []
                for text in texts:
                    res = self.client.models.embed_content(
                        model=EMBEDDING_MODEL,
                        contents=text
                    )
                    vectors.append(res.embeddings[0].values)
                
                if vectors:
                    self.embeddings = np.array(vectors, dtype=np.float32)
                    norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True)
                    norms[norms == 0] = 1.0
                    self.embeddings = self.embeddings / norms
                    logger.info("Successfully generated vector embeddings for knowledge base chunks.")
            except Exception as e:
                logger.warning(f"Failed to generate vector embeddings: {e}")

    def query(self, query_text: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """Query RAG system using Vertex AI RAG Corpus or Gemini Embeddings fallback.

        Args:
            query_text: User search query.
            top_k: Maximum number of relevant chunks to return.

        Returns:
            List of matching document chunks with text and relevance scores.
        """
        if not query_text or not query_text.strip():
            return []

        # Attempt Vertex AI RAG query if configured
        if self.project_id and self.rag_corpus_name:
            try:
                import vertexai
                from vertexai import rag

                vertexai.init(project=self.project_id, location=self.location)
                response = rag.retrieval_query(
                    text=query_text,
                    rag_corpora=[self.rag_corpus_name],
                    similarity_top_k=top_k
                )
                if response and hasattr(response, "contexts") and response.contexts.contexts:
                    results = []
                    for ctx in response.contexts.contexts:
                        results.append({
                            "text": ctx.text,
                            "score": getattr(ctx, "distance", 1.0),
                            "source": "vertex_ai_rag_corpus"
                        })
                    return results
            except Exception as e:
                logger.debug(f"Vertex AI RAG query unavailable, using vector index: {e}")

        # Gemini Vector Embeddings RAG fallback
        if self.embeddings is not None and len(self.documents) > 0:
            try:
                res = self.client.models.embed_content(
                    model=EMBEDDING_MODEL,
                    contents=query_text
                )
                q_vec = np.array(res.embeddings[0].values, dtype=np.float32)
                q_norm = np.linalg.norm(q_vec)
                if q_norm > 0:
                    q_vec = q_vec / q_norm

                similarities = np.dot(self.embeddings, q_vec)
                top_indices = np.argsort(similarities)[::-1][:top_k]

                results = []
                for idx in top_indices:
                    score = float(similarities[idx])
                    # Strict thresholding to prevent hallucination on non-existent items
                    if score >= SIMILARITY_THRESHOLD:
                        results.append({
                            "file": self.documents[idx]["file"],
                            "path": self.documents[idx]["path"],
                            "text": self.documents[idx]["text"],
                            "score": score,
                            "source": "gemini_embedding_vector_store"
                        })
                if results:
                    return results
            except Exception as e:
                logger.error(f"Error during RAG vector search query: {e}")

        # Local document text keyword search fallback
        if not self.documents:
            return []

        import string
        stop_words = {"what", "is", "the", "of", "and", "in", "for", "a", "to", "are", "you", "do", "have", "can", "i", "what's", "what is", "about"}
        clean_text = query_text.translate(str.maketrans("", "", string.punctuation)).lower()
        query_words = [w for w in clean_text.split() if w not in stop_words and len(w) > 1]
        if not query_words:
            query_words = [clean_text.strip()]

        # Combine all document texts to check term existence in KB
        all_kb_text = " ".join([doc["text"].lower() for doc in self.documents])

        # If any query term (excluding numbers/short words) is absent from the entire KB, return no matches
        for w in query_words:
            if len(w) > 3 and not w.isdigit() and w not in all_kb_text:
                logger.debug(f"Query term '{w}' not present in knowledge base. Returning no match.")
                return []

        scored_chunks = []
        for doc in self.documents:
            text_lower = doc["text"].lower()
            matches_count = sum(1 for w in query_words if w in text_lower)
            if matches_count > 0:
                score = matches_count / len(query_words)
                scored_chunks.append((score, doc))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        results = []
        for score, doc in scored_chunks[:top_k]:
            if score >= 0.35:
                results.append({
                    "file": doc["file"],
                    "path": doc["path"],
                    "text": doc["text"],
                    "score": score,
                    "source": "keyword_matching_fallback"
                })
        return results

    def get_grounded_context(self, query_text: str) -> str:
        """Retrieve and format grounded context string for prompt integration."""
        matches = self.query(query_text)
        if not matches:
            return "NO_MATCH: No relevant knowledge base documents found for this query."

        formatted_chunks = []
        for i, match in enumerate(matches, 1):
            formatted_chunks.append(f"--- Knowledge Chunk {i} (Source: {match.get('path', 'kb')}) ---\n{match['text']}")

        return "\n\n".join(formatted_chunks)


# Singleton RAG Engine instance
rag_engine = CoffeeShopRagEngine()


def rag_search(query: str = "") -> str:
    """Search the coffee shop RAG knowledge base for official menu items, prices, ingredients, allergens, dietary policies, and shop details.

    Args:
        query: Search keywords or question (e.g. 'Iced Vanilla Latte price', 'cold drinks under 200', 'dairy free options', 'ingredients in Mocha').

    Returns:
        Grounded text context retrieved from the official coffee shop knowledge base, or an explicit no-match message.
    """
    clean_query = query.strip()
    if not clean_query:
        return "Please provide a specific query to search the coffee shop knowledge base."

    context = rag_engine.get_grounded_context(clean_query)
    return context
