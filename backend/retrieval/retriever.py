"""
Retriever module for the RAG pipeline
"""
import time
import logging
from typing import List, Optional

from qdrant_client.http import models
from .models import QueryEmbedding, RetrievedChunk, RetrievalResult
from .config import RetrievalConfiguration, DEFAULT_CONFIG
from .clients import COHERE_CLIENT, QDRANT_CLIENT, check_qdrant_availability

# Configure logging
logger = logging.getLogger(__name__)


def generate_query_embedding(query_text: str, model_name: str = "multilingual-22-12-embed") -> QueryEmbedding:
    """
    Implement query embedding generation function in backend/retrieval/retriever.py
    """
    start_time = time.time()

    try:
        # Generate embedding using Cohere
        response = COHERE_CLIENT.embed(
            texts=[query_text],
            model=model_name,
            input_type="search_query"
        )

        embedding_vector = response.embeddings[0]

        # Create and return QueryEmbedding object
        query_embedding = QueryEmbedding(
            vector=embedding_vector,
            query_text=query_text,
            model_name=model_name
        )

        # Log the operation
        elapsed_time = time.time() - start_time
        logger.info(f"Generated query embedding for '{query_text[:50]}...' in {elapsed_time:.3f}s")

        return query_embedding

    except Exception as e:
        logger.error(f"Error generating query embedding for '{query_text}': {e}")
        # Handle queries with no matching content in Qdrant with appropriate response
        # Implement error handling for query embedding generation failures
        raise


def validate_768_dimensional_vectors(query_embedding: QueryEmbedding) -> bool:
    """
    Add validation to ensure 768-dimensional vectors are generated consistently
    """
    if len(query_embedding.vector) != 768:
        logger.error(f"Invalid vector dimension: expected 768, got {len(query_embedding.vector)}")
        return False
    return True


def handle_embedding_generation_failure(query_text: str, error: Exception) -> QueryEmbedding:
    """
    Implement error handling for query embedding generation failures
    """
    logger.error(f"Embedding generation failed for query '{query_text}': {error}")
    # In a real implementation, we might have fallback strategies here
    raise error


def log_query_embedding_process(query_text: str, query_embedding: QueryEmbedding, start_time: float):
    """
    Add logging for query embedding process with timing metrics
    """
    elapsed_time = time.time() - start_time
    logger.info(f"Query embedding process completed in {elapsed_time:.3f}s for query: '{query_text[:50]}...'")
    logger.debug(f"Generated embedding with {len(query_embedding.vector)} dimensions")


import threading

class Retriever:
    """
    Main retriever class that orchestrates the retrieval process
    Implements Retriever class with top-k search functionality in backend/retrieval/retriever.py
    """
    def __init__(self, config: Optional[RetrievalConfiguration] = None):
        self.config = config or DEFAULT_CONFIG
        # Add thread safety for concurrent query requests
        self._lock = threading.RLock()

    def retrieve(self, query: str) -> RetrievalResult:
        """
        Main method to retrieve relevant chunks for a given query
        Implement concurrent query request handling with thread safety
        """
        # Use lock to ensure thread safety during retrieval
        with self._lock:
            start_time = time.time()

            # Generate query embedding
            query_embedding = generate_query_embedding(query, self.config.query_model)

            # Validate the embedding
            if not validate_768_dimensional_vectors(query_embedding):
                raise ValueError("Invalid embedding dimensions")

            # Handle queries with no matching content in Qdrant with appropriate response
            try:
                # Perform similarity search against Qdrant collection with cosine metric
                # Implement similarity search against Qdrant collection with cosine metric
                search_results = QDRANT_CLIENT.search(
                    collection_name=self.config.collection_name,
                    query_vector=query_embedding.vector,
                    limit=self.config.top_k,
                    with_payload=True,
                    with_vectors=False
                )
            except Exception as e:
                # Add Qdrant database availability checks and graceful degradation
                logger.error(f"Error searching Qdrant for query '{query}': {e}")
                # Return empty result instead of failing completely
                retrieval_time = time.time() - start_time
                result = RetrievalResult(
                    query=query,
                    query_embedding=query_embedding,
                    chunks=[],
                    retrieval_time=retrieval_time,
                    parameters={
                        "top_k": self.config.top_k,
                        "similarity_threshold": self.config.similarity_threshold,
                        "collection_name": self.config.collection_name
                    }
                )
                return result

            # Implement result ranking by similarity score in descending order
            # Results from Qdrant are already ranked by similarity score in descending order

            # Add proper metadata (URL, section, chunk index) to retrieved chunks
            retrieved_chunks = []
            for result in search_results:
                # Apply similarity threshold filtering with default of 0.3
                if result.score >= self.config.similarity_threshold:
                    chunk = RetrievedChunk(
                        id=result.id,
                        text=result.payload.get("text", ""),
                        url=result.payload.get("url", ""),
                        section=result.payload.get("section", ""),
                        chunk_index=result.payload.get("chunk_index", 0),
                        source=result.payload.get("source", "web_content"),
                        similarity_score=result.score
                    )
                    retrieved_chunks.append(chunk)

            # Implement configurable top-k parameter with default of 5
            # The limit in the search already handles this

            # Add performance metrics tracking for retrieval operations
            retrieval_time = time.time() - start_time

            result = RetrievalResult(
                query=query,
                query_embedding=query_embedding,
                chunks=retrieved_chunks,
                retrieval_time=retrieval_time,
                parameters={
                    "top_k": self.config.top_k,
                    "similarity_threshold": self.config.similarity_threshold,
                    "collection_name": self.config.collection_name
                }
            )

            logger.info(f"Retrieved {len(retrieved_chunks)} chunks for query '{query[:50]}...' in {retrieval_time:.3f}s")
            return result