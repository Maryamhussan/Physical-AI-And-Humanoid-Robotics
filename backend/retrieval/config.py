"""
Configuration module for the retrieval pipeline
"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class RetrievalConfiguration:
    """
    Settings that control the retrieval process
    """
    top_k: int = 5
    similarity_threshold: float = 0.3
    query_model: str = "multilingual-22-12-embed"
    collection_name: str = "rag_embedding"
    timeout: float = 30.0  # seconds

    def __post_init__(self):
        """Validate configuration parameters"""
        if self.top_k <= 0:
            raise ValueError("top_k must be positive")
        if not 0 <= self.similarity_threshold <= 1:
            raise ValueError("similarity_threshold must be between 0 and 1")
        if self.timeout <= 0:
            raise ValueError("timeout must be positive")


# Default configuration instance
DEFAULT_CONFIG = RetrievalConfiguration()