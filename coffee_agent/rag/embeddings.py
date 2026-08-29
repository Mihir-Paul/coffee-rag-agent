"""LangChain Vector Embedding & Caching Module for CoffeeMind AI."""

import os
import json
import hashlib
import logging
from pathlib import Path
from typing import List, Optional, Tuple

import numpy as np
from langchain_core.documents import Document
import google.genai as genai

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CACHE_FILE = BASE_DIR / "coffee_agent" / "data" / "embeddings_cache.json"
EMBEDDING_MODEL = "gemini-embedding-001"


def compute_documents_hash(docs: List[Document]) -> str:
    """Compute MD5 hash of document contents to detect changes."""
    combined = "".join([d.page_content for d in docs])
    return hashlib.md5(combined.encode("utf-8")).hexdigest()


def load_cached_embeddings(docs: List[Document], cache_file: Path = CACHE_FILE) -> Optional[np.ndarray]:
    """Load vector embeddings from persistent disk cache if document hash matches.
    
    Prevents generating embeddings on every application startup.
    """
    if not cache_file.exists():
        return None

    try:
        current_hash = compute_documents_hash(docs)
        with open(cache_file, "r", encoding="utf-8") as f:
            cache_data = json.load(f)

        if cache_data.get("hash") == current_hash and cache_data.get("embeddings"):
            vecs = np.array(cache_data["embeddings"], dtype=np.float32)
            logger.info(f"Successfully loaded {len(vecs)} vector embeddings from cache ({cache_file.name}).")
            return vecs
    except Exception as e:
        logger.warning(f"Could not load embedding cache: {e}")

    return None


def generate_and_cache_embeddings(docs: List[Document], cache_file: Path = CACHE_FILE) -> Tuple[Optional[np.ndarray], str]:
    """Generate vector embeddings for document chunks using Gemini API and save to disk cache.
    
    Returns:
        (embeddings_matrix, status_message)
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key.startswith("your_"):
        logger.warning("GEMINI_API_KEY unconfigured. Using RAG keyword search fallback.")
        return None, "keyword_fallback"

    try:
        client = genai.Client(api_key=api_key) if api_key else genai.Client()
        texts = [d.page_content for d in docs]
        vectors = []

        for text in texts:
            res = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text
            )
            vals = None
            if hasattr(res, "embedding") and res.embedding is not None and hasattr(res.embedding, "values"):
                vals = res.embedding.values
            elif hasattr(res, "embeddings") and res.embeddings and len(res.embeddings) > 0 and res.embeddings[0] is not None:
                vals = res.embeddings[0].values

            if vals:
                vectors.append(vals)

        if vectors:
            matrix = np.array(vectors, dtype=np.float32)
            norms = np.linalg.norm(matrix, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            normalized = matrix / norms

            # Cache to disk
            try:
                cache_file.parent.mkdir(parents=True, exist_ok=True)
                current_hash = compute_documents_hash(docs)
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump({"hash": current_hash, "embeddings": vectors}, f)
                logger.info(f"Saved {len(vectors)} vector embeddings to disk cache.")
            except Exception as cache_err:
                logger.warning(f"Failed to write embedding cache: {cache_err}")

            return normalized, "embedding_rag"

    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
            logger.warning("RAG embedding quota exhausted (HTTP 429). Falling back to Keyword Search.")
            return None, "keyword_fallback (429 quota limit)"
        else:
            logger.warning(f"Error generating vector embeddings: {e}")
            return None, "keyword_fallback"

    return None, "keyword_fallback"
