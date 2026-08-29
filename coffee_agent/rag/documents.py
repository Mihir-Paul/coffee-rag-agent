"""LangChain Document Loader & Text Splitter Module for CoffeeMind AI RAG."""

import logging
from pathlib import Path
from typing import List
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
KB_DIR = BASE_DIR / "knowledge_base"


def load_and_split_documents(kb_dir: Path = KB_DIR) -> List[Document]:
    """Load markdown documents from knowledge base directory and chunk using LangChain TextSplitter.
    
    Args:
        kb_dir: Path to the knowledge base directory.
        
    Returns:
        List of chunked LangChain Document objects.
    """
    if not kb_dir.exists():
        logger.warning(f"Knowledge base directory {kb_dir} does not exist.")
        return []

    kb_files = list(kb_dir.glob("**/*.md"))
    raw_documents: List[Document] = []

    for filepath in kb_files:
        try:
            content = filepath.read_text(encoding="utf-8")
            sections = [s.strip() for s in content.split("---") if s.strip()]
            for idx, sec in enumerate(sections):
                raw_documents.append(
                    Document(
                        page_content=sec,
                        metadata={
                            "file": filepath.name,
                            "path": str(filepath.relative_to(kb_dir)),
                            "section_id": idx
                        }
                    )
                )
        except Exception as e:
            logger.error(f"Error reading knowledge base file {filepath}: {e}")

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=450,
        chunk_overlap=50,
        separators=["\n\n", "\n", " ", ""]
    )
    
    chunks = text_splitter.split_documents(raw_documents)
    logger.info(f"Loaded {len(chunks)} LangChain Document chunks from {len(kb_files)} files in {kb_dir.name}.")
    return chunks
