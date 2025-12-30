"""
Consolidated RAG Agent with OpenRouter API Integration
"""
import os
import logging
import time
import asyncio
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime
import requests
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import numpy as np

# Load environment variables
load_dotenv()

# Configuration
class AgentConfiguration(BaseModel):
    """
    Settings that control the agent's behavior
    """
    openrouter_model: str = Field(default="xiaomi/mimo-v2-flash:free", description="OpenRouter model to use")
    max_tokens: int = Field(default=1000, ge=1, le=4096, description="Maximum tokens for agent response")
    temperature: float = Field(default=0.3, ge=0.0, le=1.0, description="Temperature setting for response generation")
    grounding_enabled: bool = Field(default=True, description="Whether strict grounding is enforced")
    context_window_size: int = Field(default=8192, ge=1, description="Maximum context window size")
    timeout_seconds: float = Field(default=30.0, ge=1.0, description="Timeout for agent operations")
    retrieval_top_k: int = Field(default=5, ge=1, le=20, description="Number of results to retrieve")
    retrieval_threshold: float = Field(default=0.3, ge=0.0, le=1.0, description="Similarity threshold for retrieval")
    agent_retry_attempts: int = Field(default=3, ge=1, le=10, description="Number of retry attempts for agent operations")

    class Config:
        env_prefix = "AGENT_"

    @classmethod
    def from_env(cls) -> 'AgentConfiguration':
        """Create configuration from environment variables"""
        return cls(
            openrouter_model=os.getenv("OPENROUTER_MODEL", "xiaomi/mimo-v2-flash:free"),
            max_tokens=int(os.getenv("AGENT_MAX_TOKENS", "1000")),
            temperature=float(os.getenv("AGENT_TEMPERATURE", "0.3")),
            grounding_enabled=os.getenv("AGENT_GROUNDING_ENABLED", "true").lower() == "true",
            context_window_size=int(os.getenv("AGENT_CONTEXT_WINDOW_SIZE", "8192")),
            timeout_seconds=float(os.getenv("AGENT_TIMEOUT", "30.0")),
            retrieval_top_k=int(os.getenv("AGENT_RETRIEVAL_TOP_K", "5")),
            retrieval_threshold=float(os.getenv("AGENT_RETRIEVAL_THRESHOLD", "0.3")),
            agent_retry_attempts=int(os.getenv("AGENT_RETRY_ATTEMPTS", "3"))
        )


# Models
class AgentRequest(BaseModel):
    """Request model for the agent"""
    query: str
    selected_text: Optional[str] = None
    session_id: Optional[str] = None
    request_id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.now)


class AgentResponse(BaseModel):
    """Response model from the agent"""
    response: str
    sources: List[str] = []
    confidence: float = 0.0
    retrieved_chunks_count: int = 0
    processing_time: float = 0.0
    request_id: str
    timestamp: datetime


class ValidationStatus:
    """Status of response validation"""
    VALID = "valid"
    INVALID = "invalid"
    PARTIAL = "partial"


class ResponseValidator(BaseModel):
    """Validator for response grounding"""
    grounding_threshold: float = 0.5
    validation_rules: List[str] = []
    retrieved_content: List[Dict] = []
    validation_score: float = 0.0
    validation_status: str = ValidationStatus.VALID


class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    query: str
    selected_text: Optional[str] = None
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    response: str
    sources: List[str] = []
    session_id: str
    request_id: str


class RetrieveRequest(BaseModel):
    """Request model for retrieve endpoint"""
    query: str
    top_k: int = 5


class RetrieveResponse(BaseModel):
    """Response model for retrieve endpoint"""
    query: str
    results: List[Dict]
    retrieval_time: float


class HealthResponse(BaseModel):
    """Response model for health endpoint"""
    status: str
    timestamp: datetime


# Clients
class OpenRouterClient:
    """
    OpenRouter API client for LLM interactions
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is required")
        self.base_url = "https://openrouter.ai/api/v1"
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        })

    def chat_completions_create(self, model: str, messages: List[Dict], **kwargs):
        """Create a chat completion using OpenRouter API"""
        url = f"{self.base_url}/chat/completions"

        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": kwargs.get("max_tokens", 1000),
            "temperature": kwargs.get("temperature", 0.7),
        }

        try:
            response = self.session.post(url, json=payload, timeout=kwargs.get("timeout", 30.0))
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logging.error(f"OpenRouter API error: {e}")
            raise


# Initialize global configuration
AGENT_CONFIG = AgentConfiguration.from_env()


# Retrieval Tool (integrated with Qdrant for this consolidated version)
class RetrievalTool:
    """
    Retrieval tool for the agent that connects to Qdrant vector database
    """
    def __init__(self):
        import os
        from qdrant_client import QdrantClient
        from qdrant_client.http import models
        from dotenv import load_dotenv
        load_dotenv()

        # Initialize Qdrant client
        qdrant_url = os.getenv("QDRANT_URL")
        qdrant_api_key = os.getenv("QDRANT_API_KEY")

        if qdrant_url and qdrant_api_key:
            self.client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
        elif qdrant_url:
            self.client = QdrantClient(url=qdrant_url)
        else:
            # Use local Qdrant instance if no URL provided
            self.client = QdrantClient(host="localhost", port=6333)

        # Initialize local embedding model instead of Cohere API
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

        self.collection_name = "rag_embedding"

    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Search for relevant content based on the query in Qdrant
        """
        try:
            # Generate embedding for the query text using local model
            query_embedding = self.embedding_model.encode([query])[0].tolist()

            # Perform the search in Qdrant using the correct method for the newer API
            search_results = self.client.query_points(
                collection_name=self.collection_name,
                query=query_embedding,
                limit=top_k,
                with_payload=True,
                with_vectors=False
            ).points

            # Format the results
            results = []
            for result in search_results:
                results.append({
                    "id": result.id,
                    "text": result.payload.get("content", ""),  # Changed from "text" to "content"
                    "url": result.payload.get("url", ""),
                    "section": result.payload.get("section", ""),
                    "chunk_index": result.payload.get("position", 0),  # Changed from "chunk_index" to "position"
                    "score": result.score,
                    "source": result.payload.get("source", "web_content")
                })

            return results
        except Exception as e:
            logging.error(f"Error performing similarity search: {e}")
            return []


# Main Agent
class RAGAgent:
    """
    RAG Agent with OpenRouter API integration
    """
    def __init__(self, openrouter_client: Optional[OpenRouterClient] = None):
        self.client = openrouter_client or OpenRouterClient()
        self.config = AGENT_CONFIG
        self.retrieval_tool = RetrievalTool()

    def process_query(self, agent_request: AgentRequest) -> AgentResponse:
        """
        Process a query using RAG approach
        """
        start_time = time.time()

        try:
            query = agent_request.query
            selected_text = agent_request.selected_text

            # Retrieve relevant content
            retrieval_results = self.retrieval_tool.search(query, top_k=self.config.retrieval_top_k)

            # Prepare context for the agent
            context = self._prepare_context(retrieval_results, selected_text)

            # Generate response using OpenRouter
            response_text = self._generate_response(query, context)

            # Validate the response to ensure grounding
            validator = self._create_validator(retrieval_results)
            validation_result = self._validate_response(response_text, validator)

            # Calculate processing time
            processing_time = time.time() - start_time

            # Create and return the response
            agent_response = AgentResponse(
                response=response_text,
                sources=self._extract_sources(retrieval_results),
                confidence=validation_result.validation_score,
                retrieved_chunks_count=len(retrieval_results),
                processing_time=processing_time,
                request_id=agent_request.request_id,
                timestamp=agent_request.timestamp
            )

            logging.info(f"Agent processed query in {processing_time:.3f}s")
            return agent_response

        except Exception as e:
            logging.error(f"Error processing agent request {agent_request.request_id}: {e}")
            processing_time = time.time() - start_time

            # Return error response
            return AgentResponse(
                response="I encountered an error while processing your request. Please try again.",
                sources=[],
                confidence=0.0,
                retrieved_chunks_count=0,
                processing_time=processing_time,
                request_id=agent_request.request_id,
                timestamp=agent_request.timestamp
            )

    def _prepare_context(self, retrieval_results: List[Dict], selected_text: Optional[str]) -> str:
        """
        Prepare context from retrieval results and selected text
        """
        context_parts = []

        # Add selected text if provided
        if selected_text:
            context_parts.append(f"User provided context: {selected_text}\n")

        # Add retrieved content
        if retrieval_results:
            context_parts.append("Relevant information from the knowledge base:")
            for i, result in enumerate(retrieval_results):
                text_content = result.get('text', '')
                if len(text_content) > 500:
                    text_content = text_content[:500] + "..."

                context_parts.append(
                    f"{i+1}. Source: {result.get('url', 'Unknown')}\n"
                    f"   Content: {text_content}\n"
                    f"   Relevance: {result.get('similarity_score', 0):.2f}\n"
                )
        else:
            context_parts.append("No relevant information found in the knowledge base.")

        # Join all parts and truncate if necessary
        full_context = "\n".join(context_parts)

        # Check for potential conflicts between selected_text and retrieved content
        if selected_text and retrieval_results:
            conflict_resolution_note = (
                "\nNOTE: If there are differences between the user-provided context and the knowledge base, "
                "please acknowledge both sources and indicate which information comes from which source.\n"
            )
            full_context = full_context + conflict_resolution_note

        # Respect context window size
        if len(full_context) > self.config.context_window_size // 2:  # Use half for safety
            full_context = full_context[:(self.config.context_window_size // 2)] + "\n[Context truncated due to length]"

        return full_context

    def _generate_response(self, query: str, context: str) -> str:
        """
        Generate response using OpenRouter API
        """
        # Check if the query is too complex or too long
        if len(query) > 500:
            return (
                "The query you provided is too long. Please shorten your question "
                "to under 500 characters to help me better understand and respond to your request."
            )

        # Check if the query contains too many sub-questions
        question_parts = [part.strip() for part in query.split('?') if part.strip()]
        if len(question_parts) > 3:
            return (
                "Your query contains multiple questions or complex reasoning requirements that "
                "exceed my current capabilities. Please break your question down into simpler, "
                "focused questions for better responses."
            )

        # Create a prompt that enforces grounding in the provided context
        system_prompt = (
            "You are a helpful AI assistant that answers questions based strictly on the provided context. "
            "Only use information that is explicitly mentioned in the context. "
            "If the context does not contain information to answer the question, state that clearly. "
            "Always cite sources when providing specific information from the context. "
            "Do not use any knowledge that is not provided in the context. "
            "Your responses must be grounded in the provided information only. "
            "If the question is too complex or requires reasoning beyond the provided context, "
            "acknowledge the limitations and suggest simplifying the question."
        )

        user_message = f"Context:\n{context}\n\nQuestion: {query}"

        try:
            response = self.client.chat_completions_create(
                model=self.config.openrouter_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature,
                timeout=self.config.timeout_seconds
            )

            return response['choices'][0]['message']['content']

        except Exception as e:
            logging.error(f"Error generating response: {e}")
            # Return a more informative response that acknowledges the API issue
            error_msg = str(e).lower()
            if "api" in error_msg or "key" in error_msg or "authentication" in error_msg or "quota" in error_msg or "rate limit" in error_msg:
                return (
                    "I'm currently operating in local development mode without a properly configured LLM API key. "
                    "The system has successfully retrieved relevant information from the knowledge base, "
                    "but cannot generate a detailed response without a working LLM API. "
                    "In a production environment with a proper API key, this would generate a detailed response based on the retrieved context."
                )
            else:
                return (
                    "I encountered an issue while processing your request. "
                    "This may be due to the complexity of the question or system limitations. "
                    "Please try rephrasing your question in a simpler form."
                )

    def _create_validator(self, retrieval_results: List[Dict]) -> ResponseValidator:
        """
        Create a validator for response grounding
        """
        return ResponseValidator(
            grounding_threshold=self.config.retrieval_threshold,
            validation_rules=[
                "Response must only contain information from retrieved content",
                "Cite sources when providing specific information",
                "Acknowledge when information is not available in context"
            ],
            retrieved_content=retrieval_results
        )

    def _validate_response(self, response: str, validator: ResponseValidator) -> ResponseValidator:
        """
        Validate response grounding
        """
        # Simple validation: check if the response contains information that can be traced to retrieved content
        retrieved_texts = [item.get("text", "") for item in validator.retrieved_content]

        # This is a simplified validation - in a real implementation,
        # you would use more sophisticated NLP techniques to verify grounding
        if not validator.retrieved_content:
            # If no content was retrieved, check if the response acknowledges this
            if "no relevant information" in response.lower() or "not found in the knowledge base" in response.lower():
                validator.validation_score = 1.0
                validator.validation_status = ValidationStatus.VALID
            else:
                validator.validation_score = 0.0
                validator.validation_status = ValidationStatus.INVALID
        else:
            # Check if the response contains key phrases from retrieved content
            response_lower = response.lower()
            matched_segments = 0
            total_segments = len(retrieved_texts)

            for text in retrieved_texts:
                if len(text) > 10:  # Only check substantial text segments
                    # Look for overlapping words between response and retrieved content
                    text_words = set(text.lower().split()[:10])  # Use first 10 words as representative
                    response_words = set(response_lower.split())
                    common_words = text_words.intersection(response_words)

                    if len(common_words) > 0:  # If there's overlap, consider it grounded
                        matched_segments += 1

            if total_segments > 0:
                validator.validation_score = matched_segments / total_segments
                if validator.validation_score >= validator.grounding_threshold:
                    validator.validation_status = ValidationStatus.VALID
                else:
                    validator.validation_status = ValidationStatus.INVALID
            else:
                validator.validation_score = 1.0
                validator.validation_status = ValidationStatus.VALID

        # Add confidence scoring for response quality assessment
        if validator.validation_status == ValidationStatus.VALID:
            # Boost confidence if there are high-quality matches
            high_quality_matches = sum(1 for item in validator.retrieved_content
                                     if item.get('similarity_score', 0) > 0.7)
            if high_quality_matches > 0:
                # Increase confidence based on quality of matches
                quality_boost = min(0.2, high_quality_matches * 0.05)  # Max 20% boost
                validator.validation_score = min(1.0, validator.validation_score + quality_boost)

        return validator

    def _extract_sources(self, retrieval_results: List[Dict]) -> List[str]:
        """
        Extract source URLs from retrieval results
        """
        sources = []
        for result in retrieval_results:
            url = result.get("url")
            if url and url not in sources:
                sources.append(url)
        return sources


# Initialize global agent instance with error handling for missing API keys
try:
    RAG_AGENT = RAGAgent()
except ValueError as e:
    # Handle missing API key gracefully
    logging.warning(f"Failed to initialize RAG agent: {e}. Agent will be initialized with fallback functionality.")

    # Create a mock agent that can still handle retrieval but returns informative messages
    class FallbackRAGAgent:
        def process_query(self, agent_request):
            import time
            from datetime import datetime
            # Retrieve relevant content to show that the retrieval system works
            retrieval_tool = RetrievalTool()
            retrieval_results = retrieval_tool.search(agent_request.query, top_k=AGENT_CONFIG.retrieval_top_k)

            # Return a response explaining the API key issue
            response_text = (
                "I'm currently operating in local development mode without a properly configured LLM API key. "
                "The system has successfully retrieved relevant information from the knowledge base, "
                "but cannot generate a detailed response without a working LLM API. "
                "In a production environment with a proper API key, this would generate a detailed response based on the retrieved context."
            )

            return AgentResponse(
                response=response_text,
                sources=self._extract_sources(retrieval_results),
                confidence=0.0,
                retrieved_chunks_count=len(retrieval_results),
                processing_time=0.1,  # Fixed processing time
                request_id=agent_request.request_id,
                timestamp=agent_request.timestamp
            )

        def _extract_sources(self, retrieval_results):
            sources = []
            for result in retrieval_results:
                url = result.get("url")
                if url and url not in sources:
                    sources.append(url)
            return sources

    RAG_AGENT = FallbackRAGAgent()