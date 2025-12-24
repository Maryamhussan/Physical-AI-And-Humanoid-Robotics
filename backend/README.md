# Web Content Ingestion and Vector Embedding Pipeline

This backend service implements a complete pipeline to crawl, extract, embed, and store content from a Docusaurus-based GitHub Pages site for use in a RAG (Retrieval-Augmented Generation) chatbot.

## Features

- **URL Discovery**: Crawls all accessible pages from a GitHub Pages site
- **Content Extraction**: Extracts clean text content from HTML pages
- **Text Chunking**: Splits content into semantically meaningful chunks
- **Embedding Generation**: Creates vector embeddings using Cohere API
- **Vector Storage**: Stores embeddings in Qdrant vector database with metadata
- **Similarity Search**: Provides semantic search capabilities for content retrieval
- **Incremental Updates**: Avoids duplicate processing with content tracking
- **Configuration Management**: Supports configurable source URLs and chunking strategies
- **Pipeline Monitoring**: Tracks execution metrics and performance
- **Retrieval Module**: Dedicated module for query processing and content retrieval
- **Validation System**: Quality metrics for retrieval performance and consistency

## Architecture

The pipeline follows this flow:
```
URL ingestion → Content extraction → Text chunking → Embedding generation → Qdrant storage
```

The retrieval system follows this flow:
```
Query → Embedding Generation → Qdrant Search → Result Ranking → Metadata Enrichment → Validation
```

## Prerequisites

- Python 3.13+
- `uv` package manager
- Cohere API key
- Qdrant Cloud account (or local instance)

## Setup

1. Clone the repository
2. Navigate to the backend directory: `cd backend`
3. Install dependencies: `uv sync`
4. Copy the environment file: `cp .env .env.local`
5. Add your API keys to the `.env.local` file:

```bash
COHERE_API_KEY=your_cohere_api_key_here
QDRANT_URL=your_qdrant_url_here
QDRANT_API_KEY=your_qdrant_api_key_here
```

## Configuration Environment Variables

The system can be configured via environment variables:

- `COHERE_API_KEY`: Your Cohere API key
- `QDRANT_URL`: URL of your Qdrant instance
- `QDRANT_API_KEY`: API key for Qdrant (if required)
- `SOURCE_URL`: Base URL of the GitHub Pages site to crawl (default: https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics)
- `CHUNK_SIZE`: Size of text chunks in characters (default: 512)
- `CHUNK_OVERLAP`: Overlap between chunks in characters (default: 128)
- `COHERE_MODEL`: Cohere model name to use (default: multilingual-22-12-embed)
- `QDRANT_COLLECTION`: Name of the Qdrant collection (default: rag_embedding)

## Usage

Run the complete pipeline:
```bash
uv run python main.py
```

## Core Functions

The main.py file contains these key functions:

- `get_all_urls()`: Discovers all accessible URLs from the target site
- `extract_text_from_url()`: Extracts clean text from a single page
- `chunk_text()`: Splits text into semantic chunks with overlap
- `embed()`: Generates embeddings using Cohere
- `create_collection()`: Initializes the Qdrant collection
- `save_chunk_to_qdrant()`: Stores embeddings with metadata
- `search_similar_content()`: Performs similarity search for content retrieval
- `process_with_incremental_updates()`: Processes content with duplicate detection
- `demonstrate_retrieval_functionality()`: Shows RAG retrieval capabilities
- `main()`: Executes the complete pipeline

## Retrieval Module

The `retrieval/` directory contains the dedicated retrieval module for RAG functionality:

- `retriever.py`: Main retrieval class with top-k search functionality
- `validator.py`: Validation capabilities for retrieval quality
- `config.py`: Configuration parameters for retrieval process
- `models.py`: Data models for query embeddings and results
- `clients.py`: Client initialization for Cohere and Qdrant
- `test_queries.py`: Predefined test queries for validation

### Using the Retrieval Module

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

## Data Models

The system uses these data models:

- `ContentChunk`: Represents a segment of extracted text with metadata
- `VectorEmbedding`: Numeric representation of content semantics
- `ConfigurationParameters`: Settings for the ingestion process
- `PipelineMetrics`: Tracks pipeline execution metrics
- `QueryEmbedding`: Vector representation of a user query
- `RetrievedChunk`: Content fragment with metadata from Qdrant
- `RetrievalResult`: Collection of ranked results with timing and parameters
- `ValidationMetrics`: Quality measures for retrieval performance

## Key Decisions

- **Chunk size**: 512 characters with 128-character overlap
- **Embedding model**: Cohere multilingual-22-12-embed
- **Vector dimensions**: 768-dim vectors in Qdrant
- **Metadata stored**: URL, section, chunk index, and source
- **Duplicate handling**: Content hash-based detection to avoid reprocessing
- **Similarity metric**: Cosine similarity for semantic search consistency
- **Top-k value**: 5 for balanced relevance and information density
- **Threshold**: 0.3 minimum similarity score for inclusion

## Performance & Monitoring

- Query performance validation (under 2 seconds for 90% of queries)
- Pipeline execution tracking with metrics
- Qdrant usage monitoring for free tier limits
- Error boundary handling for all major components
- Validation metrics for retrieval quality and consistency

## Error Handling

- Rate limiting for Cohere API calls
- Retry logic for network requests
- Graceful handling of malformed HTML
- Proper exception handling throughout the pipeline
- Content existence checks to prevent duplicates
- Configuration validation with clear error messages
- Qdrant database availability checks with graceful degradation
- Query embedding generation failure handling

## Reproducibility

- Consistent content hashing for identical results across runs
- Deterministic chunking with fixed parameters
- Environment-based configuration management
- Pipeline reproducibility validation
- Validation report generation functionality

## Integration with RAG Agent

The retrieval module is designed to be consumed by the RAG agent in the `agent/` directory:

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

## RAG Agent Module

The `agent/` directory contains the dedicated RAG agent module that integrates with the retrieval pipeline:

- `agent.py`: Main RAG agent with OpenAI integration
- `tools.py`: Tool interface connecting to the retrieval pipeline
- `api.py`: FastAPI endpoints for chat and retrieval testing
- `models.py`: Data models for agent requests and responses
- `config.py`: Configuration parameters for agent behavior
- `clients.py`: Client initialization for OpenAI and related services

### Using the RAG Agent

Start the API server:
```bash
cd backend
uvicorn agent.api:app --host 0.0.0.0 --port 8000
```

Make a chat request:
```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is Physical AI and Humanoid Robotics?",
    "selected_text": "Optional context from user selection"
  }'
```

## Testing

Run the unit and integration tests:
```bash
cd backend
python -m pytest tests/test_retrieval.py -v
python -m pytest tests/test_validation.py -v
python -m pytest tests/test_agent.py -v
```