"""
Unit and integration tests for the retrieval pipeline
"""
import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Add the backend directory to the path so we can import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.retrieval.models import QueryEmbedding, RetrievedChunk, RetrievalResult
from backend.retrieval.retriever import generate_query_embedding, validate_768_dimensional_vectors, Retriever
from backend.retrieval.config import RetrievalConfiguration


class TestQueryEmbedding(unittest.TestCase):
    """Unit tests for query embedding functionality"""

    def test_query_embedding_creation(self):
        """Test that QueryEmbedding is created with proper validation"""
        # Test valid input
        vector = [0.1] * 768
        query_text = "Test query"

        embedding = QueryEmbedding(vector=vector, query_text=query_text)

        self.assertEqual(len(embedding.vector), 768)
        self.assertEqual(embedding.query_text, query_text)
        self.assertEqual(embedding.model_name, "multilingual-22-12-embed")

    def test_query_embedding_validation(self):
        """Test QueryEmbedding validation"""
        # Test invalid vector length
        with self.assertRaises(ValueError):
            QueryEmbedding(vector=[0.1] * 100, query_text="Test query")  # Wrong dimension

        # Test empty query text
        with self.assertRaises(ValueError):
            QueryEmbedding(vector=[0.1] * 768, query_text="")

        # Test non-finite values
        with self.assertRaises(ValueError):
            QueryEmbedding(vector=[float('nan')] * 768, query_text="Test query")

    def test_validate_768_dimensional_vectors(self):
        """Test validation function for 768-dimensional vectors"""
        # Valid embedding
        valid_embedding = QueryEmbedding(
            vector=[0.1] * 768,
            query_text="Test query"
        )
        self.assertTrue(validate_768_dimensional_vectors(valid_embedding))

        # Invalid embedding
        invalid_embedding = QueryEmbedding(
            vector=[0.1] * 100,  # Wrong dimension
            query_text="Test query"
        )
        self.assertFalse(validate_768_dimensional_vectors(invalid_embedding))

    @patch('backend.retrieval.retriever.COHERE_CLIENT')
    def test_generate_query_embedding(self, mock_cohere_client):
        """Test query embedding generation with mocked Cohere client"""
        # Mock the Cohere response
        mock_response = MagicMock()
        mock_response.embeddings = [[0.1] * 768]
        mock_cohere_client.embed.return_value = mock_response

        query_text = "Test query for embedding"
        result = generate_query_embedding(query_text)

        # Verify the result
        self.assertIsInstance(result, QueryEmbedding)
        self.assertEqual(len(result.vector), 768)
        self.assertEqual(result.query_text, query_text)
        self.assertEqual(result.model_name, "multilingual-22-12-embed")

        # Verify that Cohere client was called
        mock_cohere_client.embed.assert_called_once()


class TestRetrievalIntegration(unittest.TestCase):
    """Integration tests for retrieval functionality"""

    @patch('backend.retrieval.retriever.QDRANT_CLIENT')
    @patch('backend.retrieval.retriever.COHERE_CLIENT')
    def test_full_retrieval_process(self, mock_cohere_client, mock_qdrant_client):
        """Create integration tests for retrieval functionality in tests/test_retrieval.py"""
        # Mock Cohere response
        mock_cohere_response = MagicMock()
        mock_cohere_response.embeddings = [[0.1] * 768]
        mock_cohere_client.embed.return_value = mock_cohere_response

        # Mock Qdrant search results
        mock_result1 = MagicMock()
        mock_result1.id = "test-id-1"
        mock_result1.score = 0.8
        mock_result1.payload = {
            "text": "This is a test content chunk",
            "url": "https://example.com/test",
            "section": "test-section",
            "chunk_index": 0,
            "source": "web_content"
        }

        mock_result2 = MagicMock()
        mock_result2.id = "test-id-2"
        mock_result2.score = 0.6
        mock_result2.payload = {
            "text": "This is another test content chunk",
            "url": "https://example.com/test2",
            "section": "test-section2",
            "chunk_index": 1,
            "source": "web_content"
        }

        mock_qdrant_client.search.return_value = [mock_result1, mock_result2]

        # Create a retriever with custom config
        config = RetrievalConfiguration(top_k=5, similarity_threshold=0.5)
        retriever = Retriever(config)

        # Perform retrieval
        query = "Test query for integration"
        result = retriever.retrieve(query)

        # Verify the result
        self.assertIsInstance(result, RetrievalResult)
        self.assertEqual(result.query, query)
        self.assertEqual(len(result.chunks), 2)  # Both results above threshold

        # Check first chunk
        chunk1 = result.chunks[0]
        self.assertIsInstance(chunk1, RetrievedChunk)
        self.assertEqual(chunk1.url, "https://example.com/test")
        self.assertEqual(chunk1.similarity_score, 0.8)
        self.assertGreaterEqual(chunk1.similarity_score, config.similarity_threshold)

        # Check second chunk
        chunk2 = result.chunks[1]
        self.assertIsInstance(chunk2, RetrievedChunk)
        self.assertEqual(chunk2.url, "https://example.com/test2")
        self.assertEqual(chunk2.similarity_score, 0.6)
        self.assertGreaterEqual(chunk2.similarity_score, config.similarity_threshold)

        # Verify that both clients were called
        mock_cohere_client.embed.assert_called_once()
        mock_qdrant_client.search.assert_called_once()

    @patch('backend.retrieval.retriever.QDRANT_CLIENT')
    @patch('backend.retrieval.retriever.COHERE_CLIENT')
    def test_retrieval_with_low_similarity_filtering(self, mock_cohere_client, mock_qdrant_client):
        """Test that low similarity results are filtered out"""
        # Mock Cohere response
        mock_cohere_response = MagicMock()
        mock_cohere_response.embeddings = [[0.1] * 768]
        mock_cohere_client.embed.return_value = mock_cohere_response

        # Mock Qdrant search results with one low score
        mock_result1 = MagicMock()
        mock_result1.id = "high-score-id"
        mock_result1.score = 0.8
        mock_result1.payload = {
            "text": "High relevance content",
            "url": "https://example.com/high",
            "section": "high-section",
            "chunk_index": 0,
            "source": "web_content"
        }

        mock_result2 = MagicMock()
        mock_result2.id = "low-score-id"
        mock_result2.score = 0.2  # Below threshold
        mock_result2.payload = {
            "text": "Low relevance content",
            "url": "https://example.com/low",
            "section": "low-section",
            "chunk_index": 1,
            "source": "web_content"
        }

        mock_qdrant_client.search.return_value = [mock_result1, mock_result2]

        # Create a retriever with threshold that will filter out the low score
        config = RetrievalConfiguration(top_k=5, similarity_threshold=0.5)
        retriever = Retriever(config)

        # Perform retrieval
        result = retriever.retrieve("Test query")

        # Verify only the high score result is returned
        self.assertEqual(len(result.chunks), 1)
        self.assertEqual(result.chunks[0].id, "high-score-id")
        self.assertGreaterEqual(result.chunks[0].similarity_score, config.similarity_threshold)


def run_tests():
    """Run all tests"""
    print("Running unit and integration tests for retrieval functionality...")

    # Create test suites
    loader = unittest.TestLoader()

    suite1 = loader.loadTestsFromTestCase(TestQueryEmbedding)
    suite2 = loader.loadTestsFromTestCase(TestRetrievalIntegration)

    # Combine all tests
    full_suite = unittest.TestSuite([suite1, suite2])

    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(full_suite)

    # Return success/failure
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    if success:
        print("\n✓ All tests passed!")
    else:
        print("\n✗ Some tests failed!")
        sys.exit(1)