"""
Configuration for the RAG agent
"""
import os
from typing import Optional
from pydantic import BaseModel, Field


class AgentConfiguration(BaseModel):
    """
    Settings that control the agent's behavior
    """
    openai_model: str = Field(default="gpt-4-turbo", description="OpenAI model to use")
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
            openai_model=os.getenv("OPENAI_MODEL", "gpt-4-turbo"),
            max_tokens=int(os.getenv("AGENT_MAX_TOKENS", "1000")),
            temperature=float(os.getenv("AGENT_TEMPERATURE", "0.3")),
            grounding_enabled=os.getenv("AGENT_GROUNDING_ENABLED", "true").lower() == "true",
            context_window_size=int(os.getenv("AGENT_CONTEXT_WINDOW_SIZE", "8192")),
            timeout_seconds=float(os.getenv("AGENT_TIMEOUT", "30.0")),
            retrieval_top_k=int(os.getenv("AGENT_RETRIEVAL_TOP_K", "5")),
            retrieval_threshold=float(os.getenv("AGENT_RETRIEVAL_THRESHOLD", "0.3")),
            agent_retry_attempts=int(os.getenv("AGENT_RETRY_ATTEMPTS", "3"))
        )


# Global configuration instance
AGENT_CONFIG = AgentConfiguration.from_env()