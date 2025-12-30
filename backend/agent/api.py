"""
FastAPI application for the RAG agent with OpenRouter API
"""
import uuid
import time
import logging
from datetime import datetime, timedelta
from typing import Optional
import asyncio
from collections import defaultdict
import threading

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import from the consolidated agent file
from .agent import ChatRequest, ChatResponse, RetrieveRequest, RetrieveResponse, HealthResponse, AgentRequest, RAG_AGENT


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Rate limiting implementation
class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)
        self.lock = threading.Lock()

    def is_allowed(self, identifier: str) -> bool:
        with self.lock:
            now = datetime.now()
            # Remove requests older than 1 minute
            self.requests[identifier] = [
                req_time for req_time in self.requests[identifier]
                if now - req_time < timedelta(minutes=1)
            ]

            # Check if we're under the limit
            if len(self.requests[identifier]) < self.requests_per_minute:
                self.requests[identifier].append(now)
                return True

            return False


# Initialize rate limiter
RATE_LIMITER = RateLimiter(requests_per_minute=30)  # 30 requests per minute per IP


# Create FastAPI app instance
app = FastAPI(
    title="RAG Agent API",
    description="API for the Retrieval-Augmented Generation agent that uses OpenRouter API and Qdrant-backed retrieval",
    version="1.0.0"
)


# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Add middleware for rate limiting
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    if not RATE_LIMITER.is_allowed(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    response = await call_next(request)
    return response


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_request: ChatRequest):
    """
    Chat endpoint that accepts user queries and optional selected-text context
    """
    try:
        # Generate a unique request ID if not provided
        request_id = str(uuid.uuid4())

        # Create an AgentRequest from the ChatRequest
        agent_request = AgentRequest(
            query=chat_request.query,
            selected_text=chat_request.selected_text,
            session_id=chat_request.session_id,
            request_id=request_id,
            timestamp=datetime.now()
        )

        # Process the request with the RAG agent
        start_time = time.time()
        agent_response = RAG_AGENT.process_query(agent_request)
        processing_time = time.time() - start_time

        # Create and return the ChatResponse
        response = ChatResponse(
            response=agent_response.response,
            sources=agent_response.sources,
            session_id=chat_request.session_id or str(uuid.uuid4()),
            request_id=agent_request.request_id
        )

        logger.info(f"Processed chat request in {processing_time:.3f}s")
        return response

    except Exception as e:
        logger.error(f"Error processing chat request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/retrieve", response_model=RetrieveResponse)
async def retrieve_endpoint(retrieve_request: RetrieveRequest):
    """
    Retrieve endpoint for testing retrieval functionality
    """
    try:
        start_time = time.time()

        # Use the retrieval tool from the global RAG agent
        results = RAG_AGENT.retrieval_tool.search(
            retrieve_request.query,
            top_k=retrieve_request.top_k
        )

        retrieval_time = time.time() - start_time

        response = RetrieveResponse(
            query=retrieve_request.query,
            results=results,
            retrieval_time=retrieval_time
        )

        logger.info(f"Processed retrieve request in {retrieval_time:.3f}s")
        return response

    except Exception as e:
        logger.error(f"Error processing retrieve request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health", response_model=HealthResponse)
async def health_endpoint():
    """
    Health endpoint for health checking
    """
    try:
        # Perform basic health checks
        response = HealthResponse(
            status="healthy",
            timestamp=datetime.now()
        )

        logger.info("Health check performed")
        return response

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Add proper error handling for API endpoints
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Add proper error handling for API endpoints
    """
    logger.error(f"Global exception: {exc}")
    return {"error": "Internal server error", "message": str(exc)}