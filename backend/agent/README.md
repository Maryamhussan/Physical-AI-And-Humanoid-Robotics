# RAG Agent Module

This module implements the Retrieval-Augmented Generation (RAG) agent that integrates OpenAI Agents SDK with the retrieval pipeline from Spec-2, exposing functionality through a FastAPI backend.

## Features

- **RAG Agent**: Integrates OpenAI Agents SDK with retrieval pipeline from Spec-2
- **FastAPI Endpoints**: Provides stable endpoints for chat and retrieval testing
- **Grounded Responses**: Ensures responses are strictly based on retrieved content only
- **Context Handling**: Accepts user queries and optional selected-text context
- **Error Handling**: Graceful degradation when APIs are unavailable
- **Validation**: Response validation to ensure grounding in retrieved content

## Architecture

The agent follows this flow:
```
Query → OpenAI Agent → Retrieval Tool → Retrieved Chunks → Agent Reasoning → Grounded Response
```

## Usage

### Starting the API Server

```bash
cd backend
uvicorn agent.api:app --host 0.0.0.0 --port 8000
```

### Chat Endpoint

Send a query to the chat endpoint:

```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is Physical AI and Humanoid Robotics?",
    "selected_text": "Optional context from user selection",
    "session_id": "Optional session ID for conversation continuity"
  }'
```

### Retrieval Endpoint

Test the retrieval functionality directly:

```bash
curl -X POST "http://localhost:8000/retrieve" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the main components of a humanoid robot?",
    "top_k": 5,
    "threshold": 0.3
  }'
```

### Health Check

Check the health of the service:

```bash
curl -X GET "http://localhost:8000/health"
```

## Configuration

The agent can be configured via environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key
- `OPENAI_MODEL`: OpenAI model to use (default: gpt-4-turbo)
- `AGENT_MAX_TOKENS`: Maximum tokens for agent responses (default: 1000)
- `AGENT_TEMPERATURE`: Response randomness (default: 0.3)
- `AGENT_GROUNDING_ENABLED`: Whether strict grounding is enforced (default: true)
- `AGENT_CONTEXT_WINDOW_SIZE`: Maximum context window (default: 8192)
- `AGENT_TIMEOUT`: Timeout for agent operations in seconds (default: 30)
- `AGENT_RETRIEVAL_TOP_K`: Number of results to retrieve (default: 5)
- `AGENT_RETRIEVAL_THRESHOLD`: Similarity threshold for retrieval (default: 0.3)
- `AGENT_RETRY_ATTEMPTS`: Number of retry attempts for agent operations (default: 3)

## Data Models

- `AgentRequest`: Input to the RAG agent containing user query and optional selected-text context
- `AgentResponse`: Output from the RAG agent containing grounded response text and metadata
- `ChatSession`: State management for ongoing conversations
- `ResponseValidator`: Component that ensures responses are grounded in retrieved content
- `ChatRequest`: Request model for the chat endpoint
- `ChatResponse`: Response model for the chat endpoint
- `RetrieveRequest`: Request model for the retrieval testing endpoint
- `RetrieveResponse`: Response model for the retrieval testing endpoint

## Integration with Retrieval Pipeline

The agent integrates with the existing retrieval pipeline from Spec-2:

```python
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

## Testing

Run the unit and integration tests:

```bash
cd backend
python -m pytest tests/test_agent.py -v
```

## Error Handling

The system handles various error conditions:

- **OpenAI API Unavailability**: Graceful degradation with informative error messages
- **Retrieval Failures**: Continues operation with empty results when retrieval fails
- **Complex Queries**: Handles queries that exceed agent capabilities
- **Context Conflicts**: Resolves conflicts between selected-text and retrieved content
- **No Relevant Content**: Properly acknowledges when no relevant information is found

## Performance

- Responds to queries within 5 seconds for 90% of requests
- Supports concurrent API requests without conflicts
- Optimized context window management to respect token limits
- Configurable timeout and retry mechanisms