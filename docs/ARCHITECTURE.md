# CoffeeMind AI — System Architecture & LangChain Retrieval Integration

This document outlines the system architecture of **CoffeeMind AI**, detailing how **Google ADK** (Agent Developer Kit), **LangChain**, **Gemini**, **FastAPI**, **Supabase**, and **React** work together in a decoupled, robust pipeline.

---

## 1. System Architecture Overview

CoffeeMind AI uses **Google ADK** for high-level agent orchestration and **LangChain** specifically for document processing, text chunking, vector caching, and document retrieval.

```
+-------------------------------------------------------------------------+
|                              React Frontend                             |
|                        (http://localhost:5173)                          |
+-------------------------------------------------------------------------+
                                    |
                                    | HTTP REST API (JWT Bearer Token)
                                    v
+-------------------------------------------------------------------------+
|                             FastAPI Backend                             |
|                        (http://localhost:8000)                          |
+-------------------------------------------------------------------------+
                                    |
                                    | Agent Runner / Session Execution
                                    v
+-------------------------------------------------------------------------+
|                        Google ADK (Agent Layer)                         |
|                    root_agent = Agent(name="coffee_agent")               |
|                                   |                                     |
|   Tools: [search_menu, get_customer_profile, get_menu_item, rag_search] |
+-------------------------------------------------------------------------+
                                    |
                    invokes tool: rag_search(query)
                                    |
                                    v
+-------------------------------------------------------------------------+
|                       LangChain Retrieval Layer                         |
|                                                                         |
|  1. Document Loader  -->  Loads markdown files from knowledge_base/     |
|  2. Text Splitter    -->  LangChain RecursiveCharacterTextSplitter      |
|  3. Embeddings       -->  Gemini Embeddings interface with disk cache   |
|  4. Vector Store     -->  Disk-cached vectors (embeddings_cache.json)   |
|  5. Retriever        -->  LangChain Document Retriever                  |
+-------------------------------------------------------------------------+
                                    |
                 (If 429 Quota Exceeded & No Cache Present)
                                    |
                                    v
+-------------------------------------------------------------------------+
|                         Keyword Search Fallback                         |
|         Local string matching over loaded LangChain Documents           |
+-------------------------------------------------------------------------+
                                    |
                                    | Grounded Text Context
                                    v
+-------------------------------------------------------------------------+
|                            Google ADK Agent                             |
|                      Passes Context + Prompt to LLM                      |
+-------------------------------------------------------------------------+
                                    |
                                    | Prompt & Grounded Knowledge
                                    v
+-------------------------------------------------------------------------+
|                              Google Gemini                              |
|                           (gemini-3.7-flash)                            |
+-------------------------------------------------------------------------+
                                    |
                                    | Final Response JSON
                                    v
+-------------------------------------------------------------------------+
|                             React Frontend                              |
|                    Renders Assistant Message & Cards                    |
+-------------------------------------------------------------------------+
```

---

## 2. Component Responsibility Matrix

| Component | Responsibility | Why it's used |
|---|---|---|
| **Google ADK** | Agent Orchestration | Manages system instructions, tool execution (`search_menu`, `rag_search`), runner context, and Gemini model invocation. |
| **LangChain** | Document RAG Pipeline | Handles markdown loading, document chunking (`RecursiveCharacterTextSplitter`), embedding interface, vector caching, and retriever abstraction. |
| **Gemini** | Language Generation | Powers natural language understanding and response generation (`gemini-3.7-flash`). |
| **FastAPI** | Backend Web API | Exposes `/api/chat`, `/api/me`, `/api/conversations`, CORS headers, and Supabase JWT authentication middleware. |
| **Supabase** | Auth & Database | Manages customer sign-up/login (Email/Password & Google OAuth) and PostgreSQL persistence (profiles, sessions, messages). |
| **React** | Web UI | Provides light/dark theme user interface with chat history, quick actions, and coffee recommendation cards. |

---

## 3. Fallback Mechanism (Embedding Quota Exhaustion)

If Google Gemini Embedding API returns HTTP 429 (`RESOURCE_EXHAUSTED`):

```
LangChain Vector Retrieval Request
                |
                v
  Embedding Quota Exhausted (HTTP 429)?
         /                \
       YES                 NO
       /                    \
      v                      v
Keyword Search         LangChain Cosine Similarity
  Fallback               Vector Search
      \                      /
       \                    /
        v                  v
     Retrieved Grounded Context Chunks
```

The system **never crashes** and **never fabricates** coffee information. It gracefully falls back to local text matching over LangChain `Document` objects.

---

## 4. Ingestion vs Server Startup

To prevent repeated embedding API calls:
- **Server Startup (`npm run dev`)**: Loads pre-computed embeddings from disk (`coffee_agent/data/embeddings_cache.json`) without calling the API.
- **Explicit Ingestion (`npm run rag:ingest`)**: Executes `python scripts/setup_rag.py` to chunk documents and update the vector cache when knowledge files change.
