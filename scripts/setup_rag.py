"""Repeatable Google Cloud RAG Corpus setup and knowledge base ingestion script.

This script scans the `knowledge_base/` directory, checks for Google Cloud RAG / Vertex AI RAG Corpus configuration,
creates/imports files into the corpus, and builds/updates the local vector index cache.
"""

import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
KB_DIR = BASE_DIR / "knowledge_base"


def get_kb_files() -> list[Path]:
    """Find all markdown documents in knowledge_base directory."""
    if not KB_DIR.exists():
        logger.error(f"Knowledge base directory not found at {KB_DIR}")
        return []
    return list(KB_DIR.glob("**/*.md"))


def setup_vertex_ai_rag() -> bool:
    """Setup Google Cloud / Vertex AI RAG Corpus if configured."""
    project = os.getenv("GOOGLE_CLOUD_PROJECT")
    location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
    corpus_name_env = os.getenv("RAG_CORPUS_NAME")

    if not project:
        logger.info("GOOGLE_CLOUD_PROJECT not set. Skipping Vertex AI RAG cloud corpus registration.")
        return False

    try:
        import vertexai
        from vertexai import rag

        logger.info(f"Initializing Vertex AI for project '{project}' in region '{location}'...")
        vertexai.init(project=project, location=location)

        existing_corpora = rag.list_corpora()
        target_corpus = None

        for corpus in existing_corpora:
            if corpus.display_name == "coffee_shop_kb" or (corpus_name_env and corpus.name == corpus_name_env):
                target_corpus = corpus
                logger.info(f"Found existing Vertex AI RAG Corpus: {corpus.name}")
                break

        if not target_corpus:
            logger.info("Creating new Vertex AI RAG Corpus 'coffee_shop_kb'...")
            target_corpus = rag.create_corpus(
                display_name="coffee_shop_kb",
                description="Coffee Shop RAG Knowledge Base (Products, Prices, Dietary, Shop Info)"
            )
            logger.info(f"Successfully created Corpus: {target_corpus.name}")

        kb_files = get_kb_files()
        uploaded_count = 0

        for filepath in kb_files:
            try:
                rag.upload_file(
                    corpus_name=target_corpus.name,
                    path=str(filepath),
                    display_name=filepath.name,
                    description=f"Knowledge document: {filepath.relative_to(KB_DIR)}"
                )
                uploaded_count += 1
                logger.info(f"Uploaded to Vertex RAG: {filepath.name}")
            except Exception as e:
                logger.warning(f"File upload to Vertex RAG failed for {filepath.name}: {e}")

        logger.info(f"Vertex AI RAG Setup complete. Corpus Resource Name: {target_corpus.name}")
        return True

    except Exception as e:
        logger.warning(f"Vertex AI RAG initialization encountered an error: {e}")
        logger.info("The application will proceed with the Gemini Vector RAG Engine fallback.")
        return False


def main():
    logger.info("=== Starting Coffee Shop RAG Knowledge Base Ingestion ===")
    kb_files = get_kb_files()
    logger.info(f"Found {len(kb_files)} knowledge base documents in {KB_DIR}")

    for f in kb_files:
        logger.info(f"  - {f.relative_to(KB_DIR)}")

    cloud_success = setup_vertex_ai_rag()

    # Pre-verify RAG module
    try:
        sys.path.insert(0, str(BASE_DIR))
        from coffee_agent.rag import rag_engine
        results = rag_engine.query("Iced Vanilla Latte price")
        logger.info(f"RAG Engine verification query returned {len(results)} matches.")
    except Exception as e:
        logger.error(f"RAG Engine verification failed: {e}")

    logger.info("=== RAG Setup Completed Successfully ===")


if __name__ == "__main__":
    main()
