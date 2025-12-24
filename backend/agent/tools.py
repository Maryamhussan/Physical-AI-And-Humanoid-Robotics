"""
Tools for the RAG agent
"""
import logging
from typing import Any, Dict, List
from pydantic import BaseModel, Field

try:
    # Try relative import first (when running as module)
    from ..retrieval.retriever import Retriever
    from ..retrieval.config import RetrievalConfiguration
except (ImportError, ValueError):
    # Fall back to absolute import (when running directly)
    from retrieval.retriever import Retriever
    from retrieval.config import RetrievalConfiguration


logger = logging.getLogger(__name__)


class RetrievalTool(BaseModel):
    """
    Tool interface that connects the OpenAI agent to the retrieval pipeline from Spec-2
    """
    name: str = Field(default="retrieval_search", description="Name of the tool")
    description: str = Field(
        default="Retrieve relevant content chunks from the knowledge base based on the query",
        description="Description of what the tool does"
    )
    parameters: Dict[str, Any] = Field(
        default_factory=lambda: {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The search query"},
                "top_k": {"type": "integer", "description": "Number of results to return", "default": 5}
            },
            "required": ["query"]
        },
        description="Schema for tool parameters"
    )

    # We can't directly store complex objects in Pydantic models, so we'll initialize retriever separately
    retriever: Any = None

    class Config:
        arbitrary_types_allowed = True

    def __init__(self, **data):
        super().__init__(**data)
        # Initialize the retriever with default configuration
        config = RetrievalConfiguration(top_k=5, similarity_threshold=0.3)
        self.retriever = Retriever(config)

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Implement retrieval tool that connects OpenAI agent to Spec-2 retrieval pipeline
        """
        try:
            # Use the retriever to get relevant chunks
            result = self.retriever.retrieve(query)

            # Format results for the agent
            formatted_results = []
            for chunk in result.chunks[:top_k]:
                formatted_results.append({
                    "text": chunk.text,
                    "url": chunk.url,
                    "section": chunk.section,
                    "chunk_index": chunk.chunk_index,
                    "similarity_score": chunk.similarity_score,
                    "source": chunk.source
                })

            logger.info(f"Retrieved {len(formatted_results)} chunks for query: '{query[:50]}...'")
            return formatted_results

        except Exception as e:
            logger.error(f"Error in retrieval tool for query '{query}': {e}")
            return []


# Create a global instance of the retrieval tool
RETRIEVAL_TOOL = RetrievalTool()