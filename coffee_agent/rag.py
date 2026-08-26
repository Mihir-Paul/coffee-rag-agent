"""Coffee Shop RAG (Retrieval-Augmented Generation) Module.

Provides real Google RAG retrieval capabilities over coffee shop knowledge documents using Google Cloud RAG Corpus
and Gemini Embedding models (`gemini-embedding-001`) with disk caching and graceful fallback handling.
"""

import os
import json
import hashlib
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
CACHE_FILE = BASE_DIR / "coffee_agent" / "data" / "embeddings_cache.json"
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
        self.rag_status: str = "available"
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

    def _compute_kb_hash(self, chunks: List[Dict[str, Any]]) -> str:
        """Compute MD5 hash of knowledge base texts to detect modifications."""
        combined = "".join([c["text"] for c in chunks])
        return hashlib.md5(combined.encode("utf-8")).hexdigest()

    def _load_and_index_documents(self) -> None:
        """Load markdown documents from knowledge base and load or compute vector embeddings."""
        if not self.kb_dir.exists():
            logger.warning(f"Knowledge base directory {self.kb_dir} does not exist.")
            self.rag_status = "temporarily_unavailable"
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

        if not self.documents:
            self.rag_status = "temporarily_unavailable"
            return

        kb_hash = self._compute_kb_hash(self.documents)

        # 1. Try loading cached vector embeddings from disk first
        if CACHE_FILE.exists():
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    cache_data = json.load(f)
                
                if cache_data.get("hash") == kb_hash and cache_data.get("embeddings"):
                    cached_vecs = cache_data["embeddings"]
                    self.embeddings = np.array(cached_vecs, dtype=np.float32)
                    self.rag_status = "available"
                    logger.info(f"Loaded {len(self.embeddings)} vector embeddings from disk cache ({CACHE_FILE.name}).")
                    return
            except Exception as e:
                logger.warning(f"Failed to load embedding cache file: {e}")

        # 2. If no valid disk cache, generate embeddings via Gemini API if key exists
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key.startswith("your_"):
            logger.warning("GEMINI_API_KEY unconfigured. Using RAG keyword search fallback.")
            self.rag_status = "available" # keyword search operates locally
            return

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
                self.rag_status = "available"
                logger.info("Successfully generated vector embeddings for knowledge base chunks.")

                # Save generated embeddings to disk cache
                try:
                    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
                    with open(CACHE_FILE, "w", encoding="utf-8") as f:
                        json.dump({
                            "hash": kb_hash,
                            "embeddings": vectors
                        }, f)
                    logger.info(f"Saved vector embeddings to cache: {CACHE_FILE}")
                except Exception as cache_err:
                    logger.warning(f"Could not write embedding cache file: {cache_err}")

        except Exception as e:
            err_msg = str(e)
            if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
                logger.warning("RAG embedding quota exhausted (HTTP 429). Backend operating in RAG Keyword Search mode.")
                self.rag_status = "temporarily_unavailable — embedding quota exhausted"
            else:
                logger.warning(f"Could not generate vector embeddings: {e}")
                self.rag_status = "temporarily_unavailable"

    def ingest_and_save_cache(self) -> bool:
        """Explicit ingestion method for rag:ingest command."""
        self._load_and_index_documents()
        return self.embeddings is not None

    def query(self, query_text: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """Query RAG system using Vertex AI RAG Corpus, Gemini Embeddings, or Keyword Search fallback."""
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
                logger.debug(f"Vertex AI RAG query unavailable: {e}")

        # Gemini Vector Embeddings RAG fallback if embeddings exist
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
                logger.warning(f"RAG vector query skipped/failed (using keyword fallback): {e}")

        # Local document text keyword search fallback
        if not self.documents:
            return []

        import string
        stop_words = {"what", "is", "the", "of", "and", "in", "for", "a", "to", "are", "you", "do", "have", "can", "i", "what's", "what is", "about"}
        clean_text = query_text.translate(str.maketrans("", "", string.punctuation)).lower()
        query_words = [w for w in clean_text.split() if w not in stop_words and len(w) > 1]
        if not query_words:
            query_words = [clean_text.strip()]

        all_kb_text = " ".join([doc["text"].lower() for doc in self.documents])

        for w in query_words:
            if len(w) > 3 and not w.isdigit() and w not in all_kb_text:
                logger.debug(f"Query term '{w}' not in KB. Returning no match.")
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
    """Search the coffee shop RAG knowledge base for official menu items, prices, ingredients, allergens, dietary policies, and shop details."""
    clean_query = query.strip()
    if not clean_query:
        return "Please provide a specific query to search the coffee shop knowledge base."

    context = rag_engine.get_grounded_context(clean_query)
    return context
