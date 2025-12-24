# Quickstart: RAG Agent Construction Using OpenAI Agents SDK and FastAPI

## Prerequisites

- Python 3.13 or higher
- `uv` package manager
- OpenAI API key
- Existing retrieval pipeline from Spec-2 (Qdrant-backed)
- Cohere API key (from Spec-1)
- Qdrant Cloud account (from Spec-1)

## Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   uv sync
   # Or install directly:
   pip install openai fastapi uvicorn pydantic python-dotenv
   ```

3. **Verify environment variables**
   Ensure your `.env` file contains:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   COHERE_API_KEY=your_cohere_api_key_here
   QDRANT_URL=your_qdrant_url_here
   QDRANT_API_KEY=your_qdrant_api_key_here
   ```

## Basic Usage

### Start the API server
```bash
cd backend
uvicorn agent.api:app --host 0.0.0.0 --port 8000
```

### Make a chat request
```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is Physical AI and Humanoid Robotics?",
    "selected_text": "Optional context from user selection"
  }'
```

### Test retrieval directly
```bash
curl -X POST "http://localhost:8000/retrieve" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the main components of a humanoid robot?",
    "top_k": 5
  }'
```

### Check health
```bash
curl -X GET "http://localhost:8000/health"
```

## API Endpoints

### POST /chat
Main endpoint for chat interactions with the RAG agent.

**Request Body**:
```json
{
  "query": "Your question here",
  "selected_text": "Optional context (optional)",
  "session_id": "Session ID for conversation continuity (optional)"
}
```

**Response**:
```json
{
  "response": "Agent's response to your query",
  "sources": ["https://example.com/source1", "https://example.com/source2"],
  "session_id": "Session ID",
  "request_id": "Unique request identifier"
}
```

### POST /retrieve
Testing endpoint for direct retrieval functionality.

**Request Body**:
```json
{
  "query": "Your search query here",
  "top_k": 5,
  "threshold": 0.3
}
```

**Response**:
```json
{
  "query": "Your original query",
  "results": [
    {
      "text": "Content chunk text",
      "url": "https://example.com/source",
      "similarity_score": 0.85
    }
  ],
  "retrieval_time": 0.234
}
```

### GET /health
Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2023-12-18T10:30:00Z"
}
```

### GET /docs
Automatic API documentation (Swagger UI).

## Agent Configuration

The RAG agent can be configured through environment variables:

- `OPENAI_MODEL`: OpenAI model to use (default: "gpt-4-turbo")
- `MAX_TOKENS`: Maximum tokens for agent responses (default: 1000)
- `TEMPERATURE`: Response randomness (default: 0.3)
- `GROUNDING_ENABLED`: Whether strict grounding is enforced (default: true)
- `CONTEXT_WINDOW_SIZE`: Maximum context window (default: 8192)
- `AGENT_TIMEOUT`: Timeout for agent operations in seconds (default: 30)

## Expected Output

When you make a chat request, you should receive a response similar to:

```json
{
  "response": "Physical AI represents a paradigm shift in artificial intelligence where systems are designed to interact with the physical world in a more integrated and embodied way. According to the retrieved content, Physical AI emphasizes the importance of...",
  "sources": [
    "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/introduction",
    "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/core-concepts"
  ],
  "session_id": "sess_abc123",
  "request_id": "req_def456"
}
```

## Testing Strategy

### Sample Queries for Testing
The validation system uses these sample queries to test agent functionality:

```python
test_queries = [
    {
        "query": "What are the main principles of Physical AI?",
        "expected_sources": [
            "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/principles"
        ]
    },
    {
        "query": "Explain the design of humanoid robots",
        "expected_sources": [
            "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/design",
            "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/components"
        ]
    }
]
```

### Controlled Failure Cases
Test cases for edge scenarios:
- Queries with no relevant content in retrieval results
- Malformed queries that might cause agent errors
- Queries that exceed context window limits
- Requests during retrieval pipeline failures

## Integration with Retrieval Pipeline

The RAG agent integrates with the existing retrieval pipeline from Spec-2:

```python
# The agent uses the existing retriever from Spec-2
from retrieval.retriever import Retriever
from retrieval.config import RetrievalConfiguration

# Configuration is shared between the retrieval pipeline and agent
config = RetrievalConfiguration(
    top_k=5,
    similarity_threshold=0.3,
    collection_name="rag_embedding"
)
retriever = Retriever(config)
```