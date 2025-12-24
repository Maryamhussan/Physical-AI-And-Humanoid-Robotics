# Quickstart: Retrieval and Validation Pipeline for RAG Chatbot

## Prerequisites

- Python 3.13 or higher
- `uv` package manager
- Cohere API key (same as Spec-1)
- Qdrant Cloud account with existing "rag_embedding" collection from Spec-1
- Existing vector embeddings in Qdrant from the content ingestion pipeline

## Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Ensure dependencies are installed**
   ```bash
   uv sync
   # Or install directly:
   pip install cohere qdrant-client python-dotenv
   ```

3. **Verify environment variables**
   Ensure your `.env` file contains the same Cohere and Qdrant credentials used in Spec-1:
   ```bash
   COHERE_API_KEY=your_cohere_api_key_here
   QDRANT_URL=your_qdrant_url_here
   QDRANT_API_KEY=your_qdrant_api_key_here
   ```

## Basic Usage

### Import and initialize the retriever
```python
from retrieval.retriever import Retriever

# Initialize with default configuration
retriever = Retriever()

# Or initialize with custom configuration
retriever = Retriever(
    top_k=5,
    similarity_threshold=0.3,
    collection_name="rag_embedding"
)
```

### Perform a retrieval
```python
# Simple retrieval
query = "What is Physical AI and Humanoid Robotics?"
results = retriever.retrieve(query)

# Print the results
for i, chunk in enumerate(results.chunks):
    print(f"Result {i+1}: Score {chunk.similarity_score:.3f}")
    print(f"URL: {chunk.url}")
    print(f"Content: {chunk.text[:200]}...")
    print("---")
```

### Using the validation functionality
```python
from retrieval.validator import Validator

# Create a validator instance
validator = Validator(retriever)

# Run validation on predefined test queries
validation_metrics = validator.validate_retrieval()

print(f"Precision Score: {validation_metrics.precision_score:.3f}")
print(f"Consistency Score: {validation_metrics.consistency_score:.3f}")
print(f"Success Rate: {validation_metrics.success_rate:.3f}")
```

## Configuration

### Environment Variables

- `COHERE_API_KEY`: Your Cohere API key (must match Spec-1)
- `QDRANT_URL`: URL of your Qdrant Cloud instance
- `QDRANT_API_KEY`: API key for your Qdrant Cloud instance

### Runtime Configuration

The retrieval system supports these configurable parameters:

- `top_k`: Number of top results to return (default: 5)
- `similarity_threshold`: Minimum similarity score for inclusion (default: 0.3)
- `collection_name`: Name of Qdrant collection to search (default: "rag_embedding")

## Expected Output

When you perform a retrieval, you should see results similar to:

```
Query: "What is Physical AI and Humanoid Robotics?"
Retrieval Time: 0.845 seconds
Found 5 relevant chunks:

Result 1: Score 0.847
URL: https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/introduction
Content: Physical AI represents a paradigm shift in artificial intelligence where...

Result 2: Score 0.792
URL: https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/core-concepts
Content: The core concepts of Physical AI involve the integration of...
```

## Testing Strategy

### Predefined Queries
The validation system uses predefined queries with expected relevant results to test retrieval quality:

```python
test_queries = [
    {
        "query": "What are the main components of a humanoid robot?",
        "expected_urls": [
            "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/components",
            "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/design"
        ]
    },
    {
        "query": "How does machine learning apply to robotics?",
        "expected_urls": [
            "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/ml-applications",
            "https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/ai-integration"
        ]
    }
]
```

### Manual Relevance Inspection
For each query, manually inspect the returned results to ensure they are semantically relevant to the query topic.

## Integration with Future Agent

The retrieval module is designed to be modular and ready for consumption by an LLM agent:

```python
# Example of how a future agent might use the retriever
def agent_query(user_question):
    # Retrieve relevant context
    retrieval_results = retriever.retrieve(user_question)

    # Format context for LLM
    context = format_context_for_llm(retrieval_results)

    # Generate response with LLM using context
    response = llm.generate(user_question, context)

    return response
```