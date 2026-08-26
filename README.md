# Personalized Coffee Shop AI Agent — Task 2 RAG Integration

> [!NOTE]
> **Task 2 Status:** Real Google Retrieval-Augmented Generation (RAG) is fully implemented and integrated with Google ADK, Google Cloud RAG / Vertex AI RAG Engine, and Gemini `gemini-embedding-001` vector retrieval.

---

## 1. Project Overview & RAG Architecture

The **Coffee Shop AI Agent** is a customer-facing assistant built with Python, Google Agent Development Kit (`google-adk`), Google GenAI SDK (`google-genai`), and Gemini (`gemini-3.6-flash`).

### What RAG Means in This Project
Retrieval-Augmented Generation (RAG) grounds the LLM agent in authoritative coffee-shop knowledge documents (menus, product metadata, ingredient declarations, milk/allergen policies, store hours, and pricing rules). Instead of relying on static parametric memory or hallucinating non-existent products, the agent retrieves factual context before responding.

### Target Architecture

```text
User
 ↓
ADK Agent (coffee_shop_agent)
 ↓
RAG Retrieval (rag_search / rag.py)
 ↓
Google RAG Corpus / Gemini Embeddings (gemini-embedding-001)
 ↓
Coffee Knowledge (knowledge_base/)
 ↓
Relevant Context
 ↓
Gemini (gemini-3.6-flash)
 ↓
Personalized Recommendation
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

## 3. Google Cloud Resources & Configuration

### Environment Variables ([`.env.example`](file:///.env.example))
```env
# Gemini API Configuration
GEMINI_API_KEY=your_actual_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash

# Google Cloud RAG Configuration
GOOGLE_CLOUD_PROJECT=your_gcp_project_id
GOOGLE_CLOUD_LOCATION=us-central1
RAG_CORPUS_NAME=projects/your_gcp_project_id/locations/us-central1/ragCorpora/coffee_shop_kb
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

## 7. Manual Test Prompts

1. **Menu Query:** *"What coffees do you have?"*
2. **Cold Drinks Query:** *"What cold drinks do you have?"*
3. **Exact Price Query:** *"What is the price of the Iced Vanilla Latte?"*
4. **Ingredient Query:** *"What are the ingredients in the Iced Vanilla Latte?"*
5. **Non-Dairy Query:** *"I don't drink dairy. What can I order?"*
6. **Budget Match:** *"I have ₹200 and want something cold and sweet."*
7. **Personalized Order:** *"I am customer C001. What should I order?"*
8. **Anti-Hallucination Test:** *"Do you sell strawberry protein smoothies?"* (Expected: Agent explicitly states item is unavailable).
