"""
Client initialization for Cohere and Qdrant services
"""
import os
from typing import Optional
import cohere
from qdrant_client import QdrantClient
from dotenv import load_dotenv


# Load environment variables
load_dotenv()


def initialize_cohere_client(api_key: Optional[str] = None) -> cohere.Client:
    """
    Implement Cohere client initialization with same model as Spec-1
    """
    if api_key is None:
        api_key = os.getenv("COHERE_API_KEY")

    if not api_key:
        raise ValueError("COHERE_API_KEY environment variable is required")

    # Initialize Cohere client with the same model as Spec-1
    client = cohere.Client(api_key)
    return client


def initialize_qdrant_client(url: Optional[str] = None, api_key: Optional[str] = None) -> QdrantClient:
    """
    Implement Qdrant client initialization with existing collection access
    """
    if url is None:
        url = os.getenv("QDRANT_URL")
    if api_key is None:
        api_key = os.getenv("QDRANT_API_KEY")

    if url and api_key:
        client = QdrantClient(url=url, api_key=api_key)
    elif url:
        client = QdrantClient(url=url)
    else:
        # Use local Qdrant instance if no URL provided
        client = QdrantClient(host="localhost", port=6333)

    return client


def check_qdrant_availability(client: QdrantClient, collection_name: str = "rag_embedding") -> bool:
    """
    Add Qdrant database availability checks and graceful degradation
    """
    try:
        # Try to get collection info to check if Qdrant is accessible
        client.get_collection(collection_name)
        return True
    except Exception:
        # Qdrant is not available
        return False


# Global client instances
COHERE_CLIENT = initialize_cohere_client()
QDRANT_CLIENT = initialize_qdrant_client()