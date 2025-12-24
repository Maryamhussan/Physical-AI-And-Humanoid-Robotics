# API Contract Documentation: RAG Chatbot Integration

## Overview
This document defines the API contracts between the Docusaurus frontend and the FastAPI RAG agent backend for the chatbot integration. The API enables users to query book content and ask questions based on selected text.

## Base URL
- Local Development: `http://localhost:8000`
- The backend service runs on port 8000 by default (as defined in the backend/agent/api.py)

## API Endpoints

### 1. Chat Endpoint
**POST** `/chat`

Processes user queries and returns RAG-enhanced responses.

#### Request
- **Headers**:
  - `Content-Type: application/json`
  - `Accept: application/json`

- **Body**:
  ```json
  {
    "query": "string (required) - The user's question or query",
    "selected_text": "string | null (optional) - Text selected by user on the current page",
    "session_id": "string | null (optional) - Session identifier for conversation continuity"
  }
  ```

#### Response
- **Success (200 OK)**:
  ```json
  {
    "response": "string - The agent's response to the query",
    "sources": ["string"] - "Array of URLs or identifiers of content used to generate response",
    "session_id": "string - Session identifier (new or existing)",
    "request_id": "string - Unique identifier for this request"
  }
  ```

- **Validation Error (422 Unprocessable Entity)**:
  ```json
  {
    "detail": "Array of validation error details"
  }
  ```

- **Server Error (500 Internal Server Error)**:
  ```json
  {
    "detail": "string - Error description"
  }
  ```

#### Example Request
```json
{
  "query": "What are the main components of a humanoid robot?",
  "selected_text": "Physical AI represents a paradigm shift in artificial intelligence where systems are designed to interact with the physical world in a more integrated and embodied way.",
  "session_id": "session_12345"
}
```

#### Example Response
```json
{
  "response": "Based on the content, humanoid robots typically consist of several key components including: 1) Actuators and motors for movement, 2) Sensors for environmental perception, 3) Control systems for coordination, and 4) Physical AI systems for embodied intelligence.",
  "sources": [
    "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/docs/hardware-components",
    "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/docs/ai-systems"
  ],
  "session_id": "session_12345",
  "request_id": "req_67890"
}
```

### 2. Health Check Endpoint
**GET** `/health`

Checks the health status of the backend service.

#### Response
- **Success (200 OK)**:
  ```json
  {
    "status": "string - Health status (e.g., 'healthy')",
    "timestamp": "string - ISO 8601 formatted timestamp"
  }
  ```

- **Server Error (500 Internal Server Error)**:
  ```json
  {
    "detail": "string - Error description"
  }
  ```

#### Example Response
```json
{
  "status": "healthy",
  "timestamp": "2025-12-19T10:30:00.123456"
}
```

### 3. Retrieval Testing Endpoint
**POST** `/retrieve`

For testing retrieval functionality (internal use).

#### Request
- **Headers**:
  - `Content-Type: application/json`
  - `Accept: application/json`

- **Body**:
  ```json
  {
    "query": "string (required) - Query for retrieval testing",
    "top_k": "integer (optional, default: 5) - Number of results to return (1-20)",
    "threshold": "float (optional, default: 0.3) - Similarity threshold (0.0-1.0)"
  }
  ```

#### Response
- **Success (200 OK)**:
  ```json
  {
    "query": "string - Original query",
    "results": [
      {
        "id": "string - Content chunk ID",
        "text": "string - Retrieved text content",
        "url": "string - Source URL",
        "score": "float - Similarity score",
        "metadata": "object - Additional content metadata"
      }
    ],
    "retrieval_time": "float - Time taken for retrieval in seconds"
  }
  ```

## Error Handling

### HTTP Status Codes
- `200`: Success
- `422`: Validation error - request body doesn't match expected schema
- `500`: Server error - backend processing failure or external service error

### Error Response Format
All error responses follow this format:
```json
{
  "detail": "string - Human-readable error message"
}
```

## CORS Configuration
The backend is configured to allow requests from the Docusaurus frontend domain for local development. In production, appropriate CORS headers will be configured.

## Rate Limiting
The API implements rate limiting at 30 requests per minute per IP address to prevent abuse.

## Authentication
No authentication required for local development. Authentication may be implemented in future production deployments.