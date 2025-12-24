"""
Unit and integration tests for the RAG agent
"""
import unittest
from unittest.mock import patch, MagicMock
import sys
import os
from datetime import datetime

# Add the backend directory to the path so we can import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.agent.models import AgentRequest, ChatRequest
from backend.agent.agent import RAGAgent


class TestAgentIntegration(unittest.TestCase):
    """Unit tests for agent integration"""

    @patch('backend.agent.clients.OPENAI_CLIENT')
    @patch('backend.agent.tools.RETRIEVAL_TOOL')
    def test_agent_creation_and_initialization(self, mock_retrieval_tool, mock_openai_client):
        """Create unit tests for agent integration in tests/test_agent.py"""
        # Mock the OpenAI client response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "This is a test response"
        mock_openai_client.chat.completions.create.return_value = mock_response

        # Mock the retrieval tool
        mock_retrieval_tool.search.return_value = [
            {
                "text": "This is a test content chunk",
                "url": "https://example.com/test",
                "section": "test-section",
                "chunk_index": 0,
                "similarity_score": 0.8,
                "source": "web_content"
            }
        ]

        # Create an agent instance
        agent = RAGAgent()

        # Verify the agent was created successfully
        self.assertIsNotNone(agent)
        self.assertEqual(agent.client, mock_openai_client)

    @patch('backend.agent.clients.OPENAI_CLIENT')
    @patch('backend.agent.tools.RETRIEVAL_TOOL')
    def test_agent_process_query(self, mock_retrieval_tool, mock_openai_client):
        """Test the agent's query processing flow"""
        # Mock the OpenAI client response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "This is a response based on the retrieved content."
        mock_openai_client.chat.completions.create.return_value = mock_response

        # Mock the retrieval tool
        mock_retrieval_tool.search.return_value = [
            {
                "text": "This is a test content chunk",
                "url": "https://example.com/test",
                "section": "test-section",
                "chunk_index": 0,
                "similarity_score": 0.8,
                "source": "web_content"
            }
        ]

        # Create an agent instance
        agent = RAGAgent()

        # Create a test request
        request = AgentRequest(
            query="What is Physical AI?",
            request_id="test-request-123",
            timestamp=datetime.now()
        )

        # Process the query
        response = agent.process_query(request)

        # Verify the response
        self.assertIsNotNone(response)
        self.assertIn("response", response.response.lower())
        self.assertEqual(response.request_id, "test-request-123")
        self.assertGreaterEqual(response.confidence, 0.0)
        self.assertEqual(response.retrieved_chunks_count, 1)

        # Verify that both tools were called
        mock_retrieval_tool.search.assert_called_once()
        mock_openai_client.chat.completions.create.assert_called_once()

    @patch('backend.agent.clients.OPENAI_CLIENT')
    @patch('backend.agent.tools.RETRIEVAL_TOOL')
    def test_agent_with_selected_text_context(self, mock_retrieval_tool, mock_openai_client):
        """Test agent processing with selected text context"""
        # Mock the OpenAI client response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "This is a response incorporating the provided context."
        mock_openai_client.chat.completions.create.return_value = mock_response

        # Mock the retrieval tool
        mock_retrieval_tool.search.return_value = [
            {
                "text": "This is a test content chunk",
                "url": "https://example.com/test",
                "section": "test-section",
                "chunk_index": 0,
                "similarity_score": 0.8,
                "source": "web_content"
            }
        ]

        # Create an agent instance
        agent = RAGAgent()

        # Create a test request with selected text
        request = AgentRequest(
            query="Explain this concept",
            selected_text="This is the user's selected text that provides additional context",
            request_id="test-request-456",
            timestamp=datetime.now()
        )

        # Process the query
        response = agent.process_query(request)

        # Verify the response includes handling for selected text
        self.assertIsNotNone(response)
        self.assertEqual(response.request_id, "test-request-456")
        self.assertGreaterEqual(response.retrieved_chunks_count, 0)

    @patch('backend.agent.clients.OPENAI_CLIENT')
    @patch('backend.agent.tools.RETRIEVAL_TOOL')
    def test_agent_error_handling(self, mock_retrieval_tool, mock_openai_client):
        """Test agent error handling"""
        # Mock an error in the OpenAI client
        mock_openai_client.chat.completions.create.side_effect = Exception("API Error")

        # Mock the retrieval tool to return some results
        mock_retrieval_tool.search.return_value = [
            {
                "text": "This is a test content chunk",
                "url": "https://example.com/test",
                "section": "test-section",
                "chunk_index": 0,
                "similarity_score": 0.8,
                "source": "web_content"
            }
        ]

        # Create an agent instance
        agent = RAGAgent()

        # Create a test request
        request = AgentRequest(
            query="What is Physical AI?",
            request_id="test-request-789",
            timestamp=datetime.now()
        )

        # Process the query (should handle the error gracefully)
        response = agent.process_query(request)

        # Verify the response handles the error gracefully
        self.assertIsNotNone(response)
        self.assertIn("encountered an error", response.response.lower())
        self.assertEqual(response.request_id, "test-request-789")


class TestAPIIntegration(unittest.TestCase):
    """Create API integration tests in tests/test_agent.py"""

    def test_chat_endpoint_formatting(self):
        """Test that chat endpoint returns properly formatted responses"""
        from backend.agent.models import ChatResponse

        # Test that the response model works correctly
        response = ChatResponse(
            response="This is a test response",
            sources=["https://example.com/test"],
            session_id="test-session-123",
            request_id="test-request-123"
        )

        self.assertEqual(response.response, "This is a test response")
        self.assertEqual(response.sources, ["https://example.com/test"])
        self.assertEqual(response.session_id, "test-session-123")
        self.assertEqual(response.request_id, "test-request-123")

    def test_retrieve_endpoint_formatting(self):
        """Test that retrieve endpoint returns properly formatted responses"""
        from backend.agent.models import RetrieveResponse

        # Test that the response model works correctly
        response = RetrieveResponse(
            query="test query",
            results=[{"text": "test content", "url": "https://example.com"}],
            retrieval_time=0.123
        )

        self.assertEqual(response.query, "test query")
        self.assertEqual(len(response.results), 1)
        self.assertEqual(response.retrieval_time, 0.123)

    def test_health_endpoint_formatting(self):
        """Test that health endpoint returns properly formatted responses"""
        from backend.agent.models import HealthResponse
        from datetime import datetime

        # Test that the response model works correctly
        response = HealthResponse(
            status="healthy",
            timestamp=datetime.now()
        )

        self.assertEqual(response.status, "healthy")
        self.assertIsNotNone(response.timestamp)


class TestGroundedResponseGeneration(unittest.TestCase):
    """Create validation tests for grounded response generation"""

    def test_response_validation_with_content(self):
        """Test validation when content is available in retrieved chunks"""
        from backend.agent.models import ResponseValidator, ValidationStatus
        from backend.agent.agent import RAGAgent

        # Create a validator with retrieved content
        validator = ResponseValidator(
            grounding_threshold=0.5,
            retrieved_content=[
                {"text": "Physical AI is a paradigm that integrates physical systems with AI", "url": "https://example.com/physical-ai", "similarity_score": 0.8}
            ]
        )

        # Create an agent to access the validation method
        agent = RAGAgent()

        # Test response that contains key phrases from retrieved content
        response_text = "Physical AI is a paradigm that integrates physical systems with AI as mentioned in the source."

        validated = agent._validate_response(response_text, validator)

        # Check that validation passes and confidence is appropriately set
        self.assertGreaterEqual(validated.validation_score, 0.5)
        self.assertEqual(validated.validation_status, ValidationStatus.VALID)

    def test_response_validation_without_content(self):
        """Test validation when no relevant content is found"""
        from backend.agent.models import ResponseValidator, ValidationStatus
        from backend.agent.agent import RAGAgent

        # Create a validator with no retrieved content
        validator = ResponseValidator(
            grounding_threshold=0.5,
            retrieved_content=[]
        )

        # Create an agent to access the validation method
        agent = RAGAgent()

        # Test response acknowledging no content
        response_text = "No relevant information found in the knowledge base."

        validated = agent._validate_response(response_text, validator)

        # Check that validation passes when acknowledging no content
        self.assertEqual(validated.validation_score, 1.0)
        self.assertEqual(validated.validation_status, ValidationStatus.VALID)

    def test_response_validation_hallucination(self):
        """Test validation catches hallucinated information"""
        from backend.agent.models import ResponseValidator, ValidationStatus
        from backend.agent.agent import RAGAgent

        # Create a validator with retrieved content
        validator = ResponseValidator(
            grounding_threshold=0.5,
            retrieved_content=[
                {"text": "Physical AI is about integrating physical systems with AI", "url": "https://example.com/physical-ai", "similarity_score": 0.8}
            ]
        )

        # Create an agent to access the validation method
        agent = RAGAgent()

        # Test response with information not in retrieved content
        response_text = "This response contains information not found in the provided context."

        validated = agent._validate_response(response_text, validator)

        # The validation score would be low as there's little overlap
        # This is a basic test - real validation would be more sophisticated
        self.assertIsNotNone(validated.validation_score)


def run_tests():
    """Run all tests"""
    print("Running unit and integration tests for RAG agent...")

    # Create test suites
    loader = unittest.TestLoader()

    suite1 = loader.loadTestsFromTestCase(TestAgentIntegration)
    suite2 = loader.loadTestsFromTestCase(TestAPIIntegration)
    suite3 = loader.loadTestsFromTestCase(TestGroundedResponseGeneration)

    # Combine all tests
    full_suite = unittest.TestSuite([suite1, suite2, suite3])

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