---
id: 7
title: "backend-service-setup"
stage: "explainer"
date_iso: "2025-12-19"
surface: "agent"
model: "claude-sonnet-4-5-20250929"
feature: "rag-chatbot-integration"
branch: "001-rag-chatbot-integration"
user: "developer"
command: "/sp.analyze i do see the chatbot but it is still no properly like integrated or configured plus it shows this error I'm currently unable to access the knowledge base. Please try again later or check back for updates.  instead of answers"
labels: ["backend", "api", "service", "integration"]
links:
  spec: "specs/001-rag-chatbot-integration/spec.md"
  plan: "specs/001-rag-chatbot-integration/plan.md"
  tasks: "specs/001-rag-chatbot-integration/tasks.md"
  ticket: null
  adr: null
  pr: null
files_yaml:
  - "backend/agent/api.py"
  - "src/components/Chatbot/api-config.js"
tests_yaml: []

---

# Backend Service Setup for RAG Chatbot

## User Input

```
i do see the chatbot but it is still no properly like integrated or configured plus it shows this error I'm currently unable to access the knowledge base. Please try again later or check back for updates.  instead of answers
```

## Response Summary

Identified that the frontend chatbot component is correctly integrated and visible, but the backend RAG agent service is not running. The error "I'm currently unable to access the knowledge base. Please try again later or check back for updates." indicates that the frontend cannot communicate with the backend API.

The RAG chatbot frontend communicates with a FastAPI backend service that provides:
- `/chat` endpoint for processing user queries
- `/retrieve` endpoint for content retrieval
- `/health` endpoint for health checks

## Backend Service Setup Instructions

To run the backend service:

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   pip install fastapi uvicorn python-dotenv cohere qdrant-client requests beautifulsoup4
   ```

3. **Set up environment variables:**
   Create or update `.env` file with required API keys:
   ```
   COHERE_API_KEY=your_cohere_api_key
   QDRANT_URL=your_qdrant_url  # Optional, for cloud; defaults to localhost
   QDRANT_API_KEY=your_qdrant_api_key  # If using cloud
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Run the backend service:**
   ```bash
   # To run the FastAPI backend on port 8000 (default)
   uvicorn agent.api:app --host 0.0.0.0 --port 8000 --reload

   # Or if using the main.py pipeline to populate the knowledge base first:
   python main.py
   ```

5. **Verify the backend is running:**
   - Visit `http://localhost:8000/health` to check if the service is healthy
   - Visit `http://localhost:8000/docs` for API documentation

## Knowledge Base Population

Before the chatbot can answer questions, the knowledge base needs to be populated:

1. **Run the content ingestion pipeline:**
   ```bash
   python main.py
   ```

   This will:
   - Crawl the book content from the GitHub Pages site
   - Extract and chunk the text
   - Generate embeddings using Cohere
   - Store in Qdrant vector database

2. **Alternatively, run the API with uvicorn:**
   ```bash
   cd backend/agent
   uvicorn api:app --host 0.0.0.0 --port 8000 --reload
   ```

## Frontend Configuration

The frontend is configured to connect to `http://localhost:8000` by default. If running the backend on a different port, you can:

1. **Update the API configuration** in `src/components/Chatbot/api-config.js`
2. **Or set environment variable** in your Docusaurus environment

## Troubleshooting

If the error persists:
1. Verify the backend service is running on port 8000
2. Check that the knowledge base has been populated
3. Verify all required environment variables are set
4. Check the browser console for CORS or network errors

## Outcome

Backend service must be running for the RAG chatbot to function properly. Once both frontend (Docusaurus) and backend (FastAPI) services are running, the chatbot will be able to answer questions based on the book content.