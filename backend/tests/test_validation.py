"""
Validation tests for the retrieval pipeline
"""
import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Add the backend directory to the path so we can import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.retrieval.models import RetrievalResult, QueryEmbedding, RetrievedChunk
from backend.retrieval.retriever import Retriever
from backend.retrieval.validator import Validator, ValidationMetrics
from backend.retrieval.config import RetrievalConfiguration


class TestValidation(unittest.TestCase):
    """Validation tests for retrieval functionality"""

    @patch('backend.retrieval.retriever.QDRANT_CLIENT')
    @patch('backend.retrieval.retriever.COHERE_CLIENT')
    def test_validation_metrics_calculation(self, mock_cohere_client, mock_qdrant_client):
        """Create validation tests in tests/test_validation.py"""
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

        # Create a retriever and validator
        config = RetrievalConfiguration(top_k=5, similarity_threshold=0.5)
        retriever = Retriever(config)
        validator = Validator(retriever)

        # Define test queries for validation
        test_queries = [
            {
                "query": "Test query for validation",
                "expected_urls": ["https://example.com/test", "https://example.com/test2"]
            }
        ]

        # Run validation
        validation_metrics = validator.validate_retrieval(test_queries)

        # Verify the validation metrics
        self.assertIsInstance(validation_metrics, ValidationMetrics)
        self.assertGreaterEqual(validation_metrics.precision_score, 0.0)
        self.assertLessEqual(validation_metrics.precision_score, 1.0)
        self.assertGreaterEqual(validation_metrics.consistency_score, 0.0)
        self.assertLessEqual(validation_metrics.consistency_score, 1.0)
        self.assertGreaterEqual(validation_metrics.success_rate, 0.0)
        self.assertLessEqual(validation_metrics.success_rate, 1.0)
        self.assertGreaterEqual(validation_metrics.retrieval_time_avg, 0.0)
        self.assertEqual(len(validation_metrics.test_queries), 1)

    @patch('backend.retrieval.retriever.QDRANT_CLIENT')
    @patch('backend.retrieval.retriever.COHERE_CLIENT')
    def test_consistency_check(self, mock_cohere_client, mock_qdrant_client):
        """Test consistency checking functionality"""
        # Mock Cohere response
        mock_cohere_response = MagicMock()
        mock_cohere_response.embeddings = [[0.1] * 768]
        mock_cohere_client.embed.return_value = mock_cohere_response

        # Mock Qdrant search results
        mock_result1 = MagicMock()
        mock_result1.id = "consistent-id"
        mock_result1.score = 0.8
        mock_result1.payload = {
            "text": "Consistent content",
            "url": "https://example.com/consistent",
            "section": "consistent-section",
            "chunk_index": 0,
            "source": "web_content"
        }

        mock_qdrant_client.search.return_value = [mock_result1]

        # Create a retriever and validator
        config = RetrievalConfiguration(top_k=5, similarity_threshold=0.5)
        retriever = Retriever(config)
        validator = Validator(retriever)

        # Run consistency check
        consistency_results = validator.run_consistency_check("Consistency test query", num_runs=3)

        # Verify consistency results
        self.assertIn("query", consistency_results)
        self.assertIn("num_runs", consistency_results)
        self.assertIn("avg_retrieval_time", consistency_results)
        self.assertIn("consistency_ratio", consistency_results)
        self.assertEqual(consistency_results["num_runs"], 3)
        self.assertGreaterEqual(consistency_results["consistency_ratio"], 0.0)
        self.assertLessEqual(consistency_results["consistency_ratio"], 1.0)

    def test_manual_relevance_inspection(self):
        """Test manual relevance inspection tools"""
        from backend.retrieval.validator import manual_relevance_inspection

        # Create mock chunks for testing
        class MockChunk:
            def __init__(self, url, similarity_score, text):
                self.url = url
                self.similarity_score = similarity_score
                self.text = text

        mock_chunks = [
            MockChunk("https://example.com/rel1", 0.8, "Relevant content 1"),
            MockChunk("https://example.com/rel2", 0.6, "Relevant content 2"),
            MockChunk("https://example.com/irrel", 0.2, "Irrelevant content")
        ]

        # Run manual inspection
        inspection_results = manual_relevance_inspection("Test query", mock_chunks)

        # Verify inspection results
        self.assertEqual(inspection_results["query"], "Test query")
        self.assertEqual(inspection_results["total_chunks"], 3)
        self.assertGreaterEqual(len(inspection_results["relevant_chunks"]), 0)
        self.assertGreaterEqual(len(inspection_results["irrelevant_chunks"]), 0)
        self.assertGreaterEqual(inspection_results["overall_relevance_score"], 0.0)
        self.assertLessEqual(inspection_results["overall_relevance_score"], 1.0)


def run_validation_tests():
    """Run the validation tests"""
    print("Running validation tests for retrieval pipeline...")

    # Create a test suite
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestValidation)

    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Return success/failure
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_validation_tests()
    if success:
        print("\n✓ All validation tests passed!")
    else:
        print("\n✗ Some validation tests failed!")
        sys.exit(1)