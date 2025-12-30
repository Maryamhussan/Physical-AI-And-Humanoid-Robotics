# OpenRouter API Integration

## Overview
The backend has been restructured to use OpenRouter API instead of OpenAI/Gemini API with a consolidated architecture.

## Features

- **RAG Agent**: Integrates OpenRouter API with retrieval pipeline
- **Consolidated Architecture**: All functionality in single agent file
- **FastAPI Endpoints**: Provides stable endpoints for chat and retrieval testing
- **Grounded Responses**: Ensures responses are strictly based on retrieved content only
- **Context Handling**: Accepts user queries and optional selected-text context
- **Error Handling**: Graceful degradation when APIs are unavailable
- **Validation**: Response validation to ensure grounding in retrieved content

## Architecture

The agent follows this flow:
```
Query → OpenRouter Agent → Retrieval Tool → Retrieved Chunks → Agent Reasoning → Grounded Response
```

## Changes Made

### 1. Consolidated Agent File
- Combined all agent functionality into a single `agent.py` file
- Includes configuration, models, clients, and retrieval tools
- Maintains all original functionality in a single file

### 2. OpenRouter API Integration
- Replaced OpenAI/Gemini API with OpenRouter API
- Uses `xiaomi/mimo-v2-flash:free` model by default (free tier)
- Proper error handling for API issues

### 3. Environment Variables
- Updated to use `OPENROUTER_API_KEY` instead of `OPENAI_API_KEY` or `GEMINI_API_KEY`
- All other environment variables remain the same (QDRANT, COHERE, etc.)

### 4. Qdrant Integration
- Fixed Qdrant client method calls to use correct API (`query_points` instead of `search`)
- Maintains full retrieval functionality

### 5. API Endpoints
- `/chat` - Main chat endpoint with RAG functionality
- `/retrieve` - Direct retrieval endpoint
- `/health` - Health check endpoint

## Usage

### Environment Setup

```bash
OPENROUTER_API_KEY="your-openrouter-api-key"
QDRANT_API_KEY="your-qdrant-api-key"
QDRANT_URL="your-qdrant-url"
COHERE_API_KEY="your-cohere-api-key"
```

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
    "top_k": 5
  }'
```

### Health Check

Check the health of the service:

```bash
curl -X GET "http://localhost:8000/health"
```

## Configuration

The agent can be configured via environment variables:

- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `OPENROUTER_MODEL`: OpenRouter model to use (default: xiaomi/mimo-v2-flash:free)
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

The agent integrates with the existing retrieval pipeline:

```python
# All functionality is now in the single agent file
# The retrieval tool is integrated directly in the RAG agent
from .agent import RetrievalTool

# Configuration is shared between the retrieval pipeline and agent
retrieval_tool = RetrievalTool()
```

## Testing

Run the unit and integration tests:

```bash
cd backend
python -m pytest tests/test_agent.py -v
```

## Error Handling

The system handles various error conditions:

- **OpenRouter API Unavailability**: Graceful degradation with informative error messages
- **Retrieval Failures**: Continues operation with empty results when retrieval fails
- **Complex Queries**: Handles queries that exceed agent capabilities
- **Context Conflicts**: Resolves conflicts between selected-text and retrieved content
- **No Relevant Content**: Properly acknowledges when no relevant information is found

## Performance

- Responds to queries within 5 seconds for 90% of requests
- Supports concurrent API requests without conflicts
- Optimized context window management to respect token limits
- Configurable timeout and retry mechanisms