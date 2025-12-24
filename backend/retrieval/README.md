# Retrieval Module for RAG Chatbot

This module implements the retrieval and validation pipeline for the RAG (Retrieval-Augmented Generation) chatbot. It provides functionality to retrieve semantically relevant content from the Qdrant vector database using query embeddings.

## Features

- **Query Processing**: Generate embeddings for user queries using the same Cohere model as the ingestion pipeline
- **Similarity Search**: Perform cosine similarity search against Qdrant vector database
- **Content Ranking**: Rank results by similarity score in descending order
- **Configurable Parameters**: Adjustable top-k results and similarity threshold
- **Metadata Preservation**: Return content with associated metadata (URL, section, chunk index)
- **Validation Capabilities**: Quality metrics for retrieval performance and consistency
- **Error Handling**: Graceful degradation when Qdrant is unavailable

## Architecture

The retrieval pipeline follows this flow:
```
Query → Embedding Generation → Qdrant Search → Result Ranking → Metadata Enrichment → Validation
```

## Usage

### Basic Retrieval

```python
from retrieval.retriever import Retriever
from retrieval.config import RetrievalConfiguration

# Create a retriever with default configuration
retriever = Retriever()

# Or with custom configuration
config = RetrievalConfiguration(
    top_k=5,
    similarity_threshold=0.3,
    query_model="multilingual-22-12-embed",
    collection_name="rag_embedding"
)
retriever = Retriever(config)

# Perform a retrieval
query = "What is Physical AI and Humanoid Robotics?"
results = retriever.retrieve(query)

# Access the results
for chunk in results.chunks:
    print(f"URL: {chunk.url}")
    print(f"Score: {chunk.similarity_score}")
    print(f"Content: {chunk.text[:200]}...")
    print("---")
```

### Validation

```python
from retrieval.validator import Validator

# Create a validator for the retriever
validator = Validator(retriever)

# Run validation on test queries
validation_metrics = validator.validate_retrieval()

print(f"Precision Score: {validation_metrics.precision_score}")
print(f"Consistency Score: {validation_metrics.consistency_score}")
print(f"Success Rate: {validation_metrics.success_rate}")
```

## Configuration

The system supports these configurable parameters:

- `top_k`: Number of top results to return (default: 5)
- `similarity_threshold`: Minimum similarity score for inclusion (default: 0.3)
- `query_model`: Cohere model name for query embedding (default: "multilingual-22-12-embed")
- `collection_name`: Name of Qdrant collection to search (default: "rag_embedding")

## Data Models

- `QueryEmbedding`: Vector representation of a user query
- `RetrievedChunk`: Content fragment with metadata from Qdrant
- `RetrievalResult`: Collection of ranked results with timing and parameters
- `ValidationMetrics`: Quality measures for retrieval performance

## Integration with Agent

The retrieval module is designed to be modular and ready for consumption by an LLM agent:

```python
def agent_query(user_question, retriever):
    # Retrieve relevant context
    retrieval_results = retriever.retrieve(user_question)

    # Format context for LLM
    context = []
    for chunk in retrieval_results.chunks:
        context.append({
            "text": chunk.text,
            "source": chunk.url,
            "relevance_score": chunk.similarity_score
        })

    # Use context to generate response with LLM
    # ... (LLM integration code)

    return response
```

## Error Handling

The system handles various error conditions:

- **Qdrant Unavailability**: Graceful degradation with empty results
- **Query Embedding Failures**: Proper error propagation with logging
- **Invalid Input**: Validation with meaningful error messages
- **Network Issues**: Appropriate timeouts and retry logic
```

## Performance

- Retrieval operations complete within 2 seconds for 90% of queries
- Supports concurrent query requests with thread safety
- Efficient similarity search with cosine metric
- Configurable performance parameters for optimization

## Testing

Run the unit and integration tests:
```bash
cd backend
python -m pytest tests/test_retrieval.py -v
python -m pytest tests/test_validation.py -v
```