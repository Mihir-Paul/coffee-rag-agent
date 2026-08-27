"""Coffee Shop RAG (Retrieval-Augmented Generation) Module with LangChain.

Integrates LangChain as a dedicated document processing, vector indexing, and retrieval layer.
Uses LangChain Document loaders, RecursiveCharacterTextSplitter, Vector Store disk caching,
and Retriever abstractions alongside Google ADK and Gemini, with graceful Keyword Search fallback.
"""

import os
import json
import hashlib
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
from dotenv import load_dotenv

# LangChain Imports
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.retrievers import BaseRetriever

import google.genai as genai

load_dotenv()

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
KB_DIR = BASE_DIR / "knowledge_base"
CACHE_FILE = BASE_DIR / "coffee_agent" / "data" / "embeddings_cache.json"
EMBEDDING_MODEL = "gemini-embedding-001"
SIMILARITY_THRESHOLD = 0.68


class CoffeeShopRagEngine:
    """LangChain-powered RAG Engine for document chunking, vector indexing, and context retrieval."""

    def __init__(self, kb_dir: Optional[Path] = None):
        self.kb_dir = kb_dir or KB_DIR
        self._client = None
        self.documents: List[Document] = []
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

    def _compute_kb_hash(self, docs: List[Document]) -> str:
        """Compute MD5 hash of LangChain document contents to detect modifications."""
        combined = "".join([d.page_content for d in docs])
        return hashlib.md5(combined.encode("utf-8")).hexdigest()

    def _load_and_index_documents(self) -> None:
        """Load markdown knowledge documents, chunk using LangChain TextSplitter, and index vectors."""
        if not self.kb_dir.exists():
            logger.warning(f"Knowledge base directory {self.kb_dir} does not exist.")
            self.rag_status = "temporarily_unavailable"
            return

        kb_files = list(self.kb_dir.glob("**/*.md"))
        raw_documents = []

        # 1. Load documents into LangChain Document objects
        for filepath in kb_files:
            try:
                content = filepath.read_text(encoding="utf-8")
                # Split sections by markdown '---' dividers or whole document
                sections = [s.strip() for s in content.split("---") if s.strip()]
                for idx, sec in enumerate(sections):
                    raw_documents.append(
                        Document(
                            page_content=sec,
                            metadata={
                                "file": filepath.name,
                                "path": str(filepath.relative_to(self.kb_dir)),
                                "section_id": idx
                            }
                        )
                    )
            except Exception as e:
                logger.error(f"Error reading knowledge base file {filepath}: {e}")

        # 2. Chunk documents using LangChain's RecursiveCharacterTextSplitter
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=450,
            chunk_overlap=50,
            separators=["\n\n", "\n", " ", ""]
        )
        self.documents = text_splitter.split_documents(raw_documents)
        logger.info(f"Loaded and chunked {len(self.documents)} LangChain Document objects from {len(kb_files)} files.")

        if not self.documents:
            self.rag_status = "temporarily_unavailable"
            return

        kb_hash = self._compute_kb_hash(self.documents)

        # 3. Check persistent disk vector store / cache first
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

        # 4. If no cache exists, generate embeddings via Gemini API if key is valid
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key.startswith("your_"):
            logger.warning("GEMINI_API_KEY unconfigured. Using RAG keyword search fallback.")
            self.rag_status = "available"
            return

        try:
            texts = [doc.page_content for doc in self.documents]
            vectors = []
            for text in texts:
                res = self.client.models.embed_content(
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
                self.embeddings = np.array(vectors, dtype=np.float32)
                norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True)
                norms[norms == 0] = 1.0
                self.embeddings = self.embeddings / norms
                self.rag_status = "available"
                logger.info("Successfully generated vector embeddings for LangChain document chunks.")

                # Save generated embeddings to persistent disk cache
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
        """Explicit ingestion method for npm run rag:ingest command."""
        self._load_and_index_documents()
        return self.embeddings is not None

    def query(self, query_text: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """Query LangChain documents using Vector similarity or Keyword Search fallback."""
        if not query_text or not query_text.strip():
            return []

        # 1. Attempt Vertex AI RAG Corpus query if configured
        if self.project_id and self.rag_corpus_name:
            try:
                import vertexai
                from vertexai import rag

                vertexai.init(project=self.project_id, location=self.location)
                rag_resources = [rag.RagResource(rag_corpus=self.rag_corpus_name)] if hasattr(rag, "RagResource") else None
                if rag_resources:
                    response = rag.retrieval_query(
                        text=query_text,
                        rag_resources=rag_resources,
                        similarity_top_k=top_k
                    )
                else:
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

        # 2. LangChain Vector Store cosine similarity query if embeddings exist
        if self.embeddings is not None and len(self.documents) > 0:
            try:
                res = self.client.models.embed_content(
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
                                "source": "langchain_vector_store"
                            })
                    if results:
                        return results
            except Exception as e:
                logger.warning(f"LangChain vector query skipped/failed (using keyword fallback): {e}")

        # 3. Local LangChain document Keyword Search fallback
        if not self.documents:
            return []

        import string
        stop_words = {"what", "is", "the", "of", "and", "in", "for", "a", "to", "are", "you", "do", "have", "can", "i", "what's", "what is", "about"}
        clean_text = query_text.translate(str.maketrans("", "", string.punctuation)).lower()
        query_words = [w for w in clean_text.split() if w not in stop_words and len(w) > 1]
        if not query_words:
            query_words = [clean_text.strip()]

        all_kb_text = " ".join([doc.page_content.lower() for doc in self.documents])

        for w in query_words:
            if len(w) > 3 and not w.isdigit() and w not in all_kb_text:
                logger.debug(f"Query term '{w}' not in KB. Returning no match.")
                return []

        scored_chunks = []
        for doc in self.documents:
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
                    "source": "langchain_keyword_fallback"
                })
        return results

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
        """Retrieve and format grounded context string for ADK tool integration."""
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
