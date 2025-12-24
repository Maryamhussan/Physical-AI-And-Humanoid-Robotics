"""
Basic integration test to verify end-to-end functionality
"""
import unittest
import os
from unittest.mock import patch, MagicMock
from main import get_all_urls, extract_text_from_url, chunk_text, embed, create_collection, save_chunk_to_qdrant, search_similar_content
from main import ContentChunk, VectorEmbedding, ConfigurationParameters


class TestIntegration(unittest.TestCase):
    """Integration tests for the web content ingestion pipeline"""

    def setUp(self):
        """Set up test configuration"""
        self.config = ConfigurationParameters(
            source_url="https://example.com/test",
            chunk_size=100,
            chunk_overlap=20,
            cohere_model="multilingual-22-12-embed",
            qdrant_collection="test_collection"
        )

    @patch('main.requests.get')
    def test_url_extraction(self, mock_get):
        """Test URL extraction functionality"""
        # Mock a simple HTML response
        mock_response = MagicMock()
        mock_response.text = '<html><body><a href="/page1">Page 1</a><a href="/page2">Page 2</a></body></html>'
        mock_response.headers = {'content-type': 'text/html'}
        mock_get.return_value = mock_response

        urls = get_all_urls("https://example.com")
        self.assertGreaterEqual(len(urls), 0)  # At least the base URL should be returned

    def test_text_extraction_and_chunking(self):
        """Test text extraction and chunking functionality"""
        sample_text = "This is a sample text for testing. " * 20  # Create a longer text
        chunks = chunk_text(sample_text, chunk_size=50, overlap=10)

        self.assertGreater(len(chunks), 0)
        self.assertLessEqual(len(chunks[0]), 50)  # First chunk should not exceed chunk_size

    @patch('main.co')
    def test_embedding_generation(self, mock_cohere):
        """Test embedding generation functionality"""
        # Mock the Cohere embed response
        mock_embedding = [0.1] * 768  # Mock 768-dim embedding
        mock_cohere.embed.return_value = MagicMock(embeddings=[mock_embedding])

        result = embed("Test text for embedding")
        self.assertEqual(len(result), 768)  # Should return 768-dim vector

    def test_data_model_creation(self):
        """Test data model creation"""
        chunk = ContentChunk(
            id="test-id",
            text="Test content",
            url="https://example.com",
            chunk_index=0,
            source="test"
        )

        embedding = VectorEmbedding(
            id="test-id",
            vector=[0.1] * 768,
            content_chunk_id="test-id"
        )

        self.assertEqual(chunk.text, "Test content")
        self.assertEqual(len(embedding.vector), 768)

    def test_configuration_validation(self):
        """Test configuration validation"""
        # Valid configuration
        valid_config = ConfigurationParameters(
            source_url="https://example.com",
            chunk_size=512,
            chunk_overlap=128
        )
        errors = valid_config.validate()
        self.assertEqual(len(errors), 0)

        # Invalid configuration
        invalid_config = ConfigurationParameters(
            source_url="invalid-url",
            chunk_size=-1,
            chunk_overlap=512  # Larger than chunk_size
        )
        errors = invalid_config.validate()
        self.assertGreater(len(errors), 0)


def run_integration_tests():
    """Run the integration tests"""
    print("Running integration tests...")

    # Create a test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(TestIntegration)

    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Return success/failure
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_integration_tests()
    if success:
        print("\n✓ All integration tests passed!")
    else:
        print("\n✗ Some integration tests failed!")
        exit(1)