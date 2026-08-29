# Personalized Coffee Shop AI Agent — LangChain RAG & Google ADK Integration

> [!NOTE]
> **Architecture Status:** Real Retrieval-Augmented Generation (RAG) is fully implemented using **LangChain** for document chunking, indexing, and retriever abstraction alongside **Google ADK** for agent orchestration and **Gemini** (`gemini-3.7-flash`) for LLM response generation.

---

## 1. Project Overview & Architecture Guide

### Understanding the Tech Stack (Beginner Guide)

- **LangChain**: A specialized library used in this project exclusively for document loading, markdown splitting (`RecursiveCharacterTextSplitter`), embedding management, vector caching, and retriever creation.
- **Google ADK (Agent Development Kit)**: The core agent framework responsible for agent instructions, session execution, and invoking tools (`search_menu`, `get_customer_profile`, `rag_search`).
- **Gemini (`gemini-3.7-flash`)**: Google's advanced language model that generates natural, friendly coffee recommendations based on grounded retrieved context.
- **FastAPI**: The Python backend API serving endpoints for React (`/api/chat`, `/api/me`, `/api/conversations`).
- **React**: The customer-facing frontend interface with light/dark themes and chat history.

### Why ADK and LangChain Work Together (No Job Duplication)

Google ADK and LangChain do not compete:
- **Google ADK = Agent & Orchestration**: Decides when to search knowledge, calls tools, and formats prompts.
- **LangChain = Document RAG Pipeline**: Chunks `.md` knowledge files, manages vector embeddings, and retrieves relevant text passages.

### Data Flow Architecture

```text
User Question
     ↓
React Frontend (http://localhost:5173)
     ↓
FastAPI Backend (http://localhost:8000)
     ↓
Google ADK Agent (root_agent) ──(calls tool)──► rag_search()
                                                   │
                                                   ▼
                                         LangChain Retrieval Layer
                                         ├── Document Loader
                                         ├── Text Splitter
                                         └── LangChain Retriever
                                                   │
                                     (Fallback if 429 Quota Exceeded)
                                                   │
                                                   ▼
                                         Keyword Search Fallback
                                                   │
                                                   ▼
                                         Grounded Text Context
                                                   │
                                                   ▼
                                         Google ADK Agent
                                                   │
                                                   ▼
                                         Gemini (LLM Response)
```

---

## 2. Knowledge Base Structure

The knowledge base consists of clean Markdown documents under `knowledge_base/`:

```text
knowledge_base/
├── menu/
│   ├── coffee_menu.md          # Espresso, Americano, Cappuccino, Latte, Mocha, Caramel Macchiato
│   ├── cold_drinks.md          # Cold Coffee, Iced Latte, Iced Americano, Iced Vanilla Latte (Oat Milk), Chocolate Frappe, Peach Iced Tea
│   └── tea_and_others.md       # Masala Chai, Green Tea
├── dietary/
│   └── dietary_information.md  # Milk options, non-dairy rules, allergen declarations
└── shop/
    └── shop_information.md     # Store hours, location, INR currency, pricing rules
```

---

## 3. Environment Configuration & Setup

### Setting Up Environment Variables

1. Copy `.env.example` to create your local `.env` file:
   - **Windows (Command Prompt / PowerShell):**
     ```cmd
     copy .env.example .env
     ```
   - **macOS / Linux:**
     ```bash
     cp .env.example .env
     ```
2. Add your developer credentials (Gemini API key, Supabase project URL, and keys) to `.env`.
3. **NEVER commit `.env` to source control.** Verify `.env` is listed in `.gitignore`.

---

### Security & Variable Classification

#### PUBLIC / FRONTEND SAFE (Browser Exposed):
These variables start with `VITE_` and are bundled into the client browser application:
- `VITE_SUPABASE_URL`: Public Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Public anonymous API key with RLS protection.
- `VITE_API_BASE_URL`: Local or production FastAPI server endpoint URL.

#### SECRET / BACKEND ONLY (Server Only):
> [!CAUTION]
> **NEVER expose these secret variables in frontend `VITE_*` definitions or commit them to source control.**
- `GEMINI_API_KEY`: Secret API key for Google Gemini model access.
- `SUPABASE_SERVICE_ROLE_KEY`: Privileged admin key for server-side operations and data migration.
- `SUPABASE_JWT_SECRET`: Secret used for server-side token signature verification.
- `GOOGLE_CLOUD_PROJECT` & `RAG_CORPUS_NAME`: Backend GCP RAG configuration.

---

### Development Workflow & .env Synchronization

- **Backend Environment Synchronization:**
  Backend environment variables are loaded into memory when the backend process starts. In development mode (`npm run dev`), Uvicorn uses `WatchFiles` to automatically detect `.env` modifications, safely restart the Python process, and reload configuration without manual intervention.

- **Frontend Environment Synchronization:**
  Frontend environment variables prefixed with `VITE_` are handled by Vite. Updating `.env` triggers Vite's development server to re-evaluate configuration and apply hot updates to the React app.

- **Automatic Startup Validation:**
  On backend startup, `coffee_agent/config.py` validates required keys (`GEMINI_API_KEY`, `SUPABASE_URL`, etc.) and prints safe diagnostic status (`Gemini API key: configured`) without exposing secret values.

---

### Environment Variables Template ([`.env.example`](file:///.env.example))
```env
# ==========================================
# GEMINI (SECRET / BACKEND ONLY)
# ==========================================
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash

# ==========================================
# GOOGLE CLOUD RAG (SECRET / BACKEND ONLY)
# ==========================================
GOOGLE_CLOUD_PROJECT=your_gcp_project_id
GOOGLE_CLOUD_LOCATION=us-central1
RAG_CORPUS_NAME=projects/your_gcp_project_id/locations/us-central1/ragCorpora/coffee_shop_kb

# ==========================================
# SUPABASE (SECRET / BACKEND ONLY)
# ==========================================
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_server_only_service_role_key_here
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here

# ==========================================
# SERVER CONFIGURATION (SECRET / BACKEND ONLY)
# ==========================================
PORT=8000

# ==========================================
# FRONTEND CONFIGURATION (PUBLIC / FRONTEND SAFE)
# ==========================================
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key_here
VITE_API_BASE_URL=http://localhost:8000

# ==========================================
# LOCAL DATA PATHS (OPTIONAL OVERRIDES)
# ==========================================
MENU_FILE_PATH=coffee_agent/data/menu.json
CUSTOMERS_FILE_PATH=coffee_agent/data/customers.json
```

---

## 4. Ingestion & RAG Setup

To run the repeatable knowledge base ingestion and corpus setup script:

```bash
python scripts/setup_rag.py
```

### Ingestion Flow:
1. Connects to the configured Google Cloud project.
2. Checks for or creates the `coffee_shop_kb` Vertex AI RAG Corpus.
3. Uploads/imports all Markdown documents from `knowledge_base/`.
4. Computes `gemini-embedding-001` (3072-dimensional) vector index for local retrieval.

---

## 5. How Retrieval & ADK Integration Work

1. **Tool Invocation:** The agent calls `rag_search(query="...")` or `search_menu(...)`.
2. **Retrieval:** `coffee_agent/rag.py` executes retrieval over the Google RAG Corpus / vector store.
3. **Personalization:** When a Customer ID is provided (e.g. `C001`), `get_customer_profile` retrieves customer preferences.
4. **Grounded Reasoning:** Gemini generates a response strictly grounded in retrieved facts.

---

## 6. How to Run & Test the Agent

### Start Local Playground:
```bash
agents-cli playground
```
Open your browser at: `http://127.0.0.1:8080/dev-ui/?app=coffee_agent`

### Run Single Prompt via CLI:
```bash
agents-cli run "What coffees do you have?"
```

### Run Test Suite:
```bash
python -m pytest tests/
```

---

## 7. Production Deployment (Render Backend + Vercel Frontend)

### Backend Deployment on Render:
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository.
3. Configure service settings:
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT` (or `python server.py`)
   - **Health Check Path:** `/health`
4. Set Environment Variables on Render:
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `GEMINI_MODEL`: `gemini-3.7-flash`
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_ANON_KEY`: Your Supabase Public Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key
   - `SUPABASE_JWT_SECRET`: Your Supabase JWT Secret
   - `FRONTEND_URL`: `https://your-coffeemind-frontend.vercel.app`
   - `ALLOWED_ORIGINS`: `https://your-coffeemind-frontend.vercel.app`
   - `HOST`: `0.0.0.0`

### Frontend Deployment on Vercel:
1. Import your repository on [Vercel](https://vercel.com).
2. Root Directory: `frontend`
3. Framework Preset: `Vite`
4. Set Environment Variables on Vercel:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com`
   - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `your_public_anon_key`

---

## 8. Manual Test Prompts

1. **Menu Query:** *"What coffees do you have?"*
2. **Cold Drinks Query:** *"What cold drinks do you have?"*
3. **Exact Price Query:** *"What is the price of the Iced Vanilla Latte?"*
4. **Ingredient Query:** *"What are the ingredients in the Iced Vanilla Latte?"*
5. **Non-Dairy Query:** *"I don't drink dairy. What can I order?"*
6. **Budget Match:** *"I have ₹200 and want something cold and sweet."*
7. **Personalized Order:** *"I am customer C001. What should I order?"*
8. **Anti-Hallucination Test:** *"Do you sell strawberry protein smoothies?"* (Expected: Agent explicitly states item is unavailable).
