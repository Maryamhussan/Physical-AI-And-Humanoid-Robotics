"""
Data models for the RAG agent
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class AgentRequest(BaseModel):
    """
    Input to the RAG agent containing user query and optional selected-text context
    """
    query: str = Field(..., description="The main user query")
    selected_text: Optional[str] = Field(None, description="Optional context provided by the user")
    session_id: Optional[str] = Field(None, description="ID for conversation context")
    request_id: str = Field(..., description="Unique identifier for this request")
    timestamp: datetime = Field(default_factory=datetime.now, description="When the request was made")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional request metadata")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class SourceInfo(BaseModel):
    """
    Information about a source used in the response
    """
    url: str
    title: Optional[str] = None
    similarity_score: Optional[float] = None


class AgentResponse(BaseModel):
    """
    Output from the RAG agent containing grounded response text and metadata
    """
    response: str = Field(..., description="The agent's response to the user query")
    sources: List[str] = Field(default_factory=list, description="URLs or identifiers of content used to generate response")
    confidence: float = Field(0.0, ge=0.0, le=1.0, description="Confidence score for the response")
    retrieved_chunks_count: int = Field(0, ge=0, description="Number of chunks used to generate the response")
    processing_time: float = Field(0.0, ge=0.0, description="Time taken to process the request in seconds")
    request_id: str = Field(..., description="Reference to the original request")
    timestamp: datetime = Field(default_factory=datetime.now, description="When the response was generated")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ChatSession(BaseModel):
    """
    State management for ongoing conversations with the RAG agent
    """
    session_id: str = Field(..., description="Unique identifier for the session")
    history: List[Dict[str, str]] = Field(default_factory=list, description="Conversation history with query-response pairs")
    created_at: datetime = Field(default_factory=datetime.now, description="When the session was created")
    last_accessed: datetime = Field(default_factory=datetime.now, description="When the session was last used")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional session metadata")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ValidationStatus(str, Enum):
    """
    Status of response validation
    """
    VALID = "valid"
    INVALID = "invalid"
    NEEDS_REVIEW = "needs_review"


class ResponseValidator(BaseModel):
    """
    Component that ensures responses are grounded in retrieved content only
    """
    grounding_threshold: float = Field(0.5, ge=0.0, le=1.0, description="Minimum similarity score for content inclusion")
    validation_rules: List[str] = Field(default_factory=list, description="Rules for validating response grounding")
    retrieved_content: List[Dict[str, Any]] = Field(default_factory=list, description="Content used to generate response")
    validation_score: float = Field(0.0, ge=0.0, le=1.0, description="Score indicating how well response matches retrieved content")
    validation_status: ValidationStatus = Field(ValidationStatus.NEEDS_REVIEW, description="Current validation status")


# API Request/Response Models
class ChatRequest(BaseModel):
    """
    Request model for the chat endpoint
    """
    query: str = Field(..., description="User query text")
    selected_text: Optional[str] = Field(None, description="Optional context from user")
    session_id: Optional[str] = Field(None, description="Session identifier for conversation continuity")


class ChatResponse(BaseModel):
    """
    Response model for the chat endpoint
    """
    response: str = Field(..., description="Agent's response to the query")
    sources: List[str] = Field(default_factory=list, description="List of source URLs used")
    session_id: str = Field(..., description="Session identifier")
    request_id: str = Field(..., description="Unique request identifier")


class RetrieveRequest(BaseModel):
    """
    Request model for the retrieval testing endpoint
    """
    query: str = Field(..., description="Query for retrieval testing")
    top_k: int = Field(5, ge=1, le=20, description="Number of results to return (default: 5)")
    threshold: float = Field(0.3, ge=0.0, le=1.0, description="Similarity threshold (default: 0.3)")


class RetrieveResponse(BaseModel):
    """
    Response model for the retrieval testing endpoint
    """
    query: str = Field(..., description="Original query")
    results: List[Dict[str, Any]] = Field(..., description="Retrieved chunks with metadata")
    retrieval_time: float = Field(..., description="Time taken for retrieval")


class HealthResponse(BaseModel):
    """
    Response model for the health check endpoint
    """
    status: str = Field(..., description="Health status")
    timestamp: datetime = Field(default_factory=datetime.now, description="When the check was performed")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }