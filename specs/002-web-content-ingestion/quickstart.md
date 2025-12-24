# Quickstart: Web Content Ingestion and Vector Embedding Pipeline

## Prerequisites

- Python 3.13 or higher
- `uv` package manager
- Cohere API key
- Qdrant Cloud account (or local Qdrant instance)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Physical-AI-And-Humanoid-Robotics
   ```

2. **Navigate to backend directory**
   ```bash
   cd backend
   ```

3. **Install dependencies**
   ```bash
   uv sync
   # Or if you prefer to install directly:
   pip install requests beautifulsoup4 cohere qdrant-client python-dotenv
   ```

4. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env .env.local
   ```

5. **Configure your API keys**
   Edit `.env.local` and add your keys:
   ```bash
   COHERE_API_KEY=your_cohere_api_key_here
   QDRANT_URL=your_qdrant_url_here
   QDRANT_API_KEY=your_qdrant_api_key_here
   ```

## Basic Usage

### Run the complete ingestion pipeline
```bash
uv run python main.py
```

### Run with specific environment file
```bash
uv run python main.py
# The application will automatically load environment variables from .env
```

## Configuration

### Environment Variables

- `COHERE_API_KEY`: Your Cohere API key for embedding generation
- `QDRANT_URL`: URL of your Qdrant Cloud instance (e.g., https://your-cluster.europe-west3-0.gcp.cloud.qdrant.io)
- `QDRANT_API_KEY`: API key for your Qdrant Cloud instance

### Default Settings

The application uses these default settings which can be modified in the code:
- Chunk size: 512 characters
- Chunk overlap: 128 characters
- Cohere model: multilingual-22-12-embed
- Qdrant collection: rag_embedding

## Expected Output

When you run the pipeline, you should see logs similar to:
```
2025-12-17 16:26:37,126 - INFO - Starting web content ingestion pipeline
https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/sitemap.xml
2025-12-17 16:26:XX,XXX - INFO - Discovered X URLs
2025-12-17 16:26:XX,XXX - INFO - Processing URL 1/X: <url>
2025-12-17 16:26:XX,XXX - INFO - Extracted XXX characters from <url>
2025-12-17 16:26:XX,XXX - INFO - Text chunked into X chunks
2025-12-17 16:26:XX,XXX - INFO - Saved chunk to Qdrant with ID: <chunk-id>
...
2025-12-17 16:26:XX,XXX - INFO - Pipeline completed successfully
```

## Troubleshooting

### Common Issues

1. **Timeout errors**: The target website might be slow to respond. The application has a 10-second timeout which can be adjusted in the code.

2. **API rate limits**: If you encounter rate limit errors, the application includes a 0.1 second delay between requests to respect API limits.

3. **Qdrant connection errors**: Verify your QDRANT_URL and QDRANT_API_KEY are correct.

4. **Cohere API errors**: Ensure your COHERE_API_KEY is valid and you have sufficient credits.

### Verifying the Installation

To verify that all dependencies are correctly installed:

```bash
uv run python -c "import requests, bs4, cohere, qdrant_client, dotenv; print('All dependencies imported successfully')"
```

## Next Steps

After successful ingestion:
1. Query the Qdrant collection to verify embeddings were stored
2. Implement a search function to retrieve relevant content
3. Build a RAG chatbot interface to use the stored embeddings