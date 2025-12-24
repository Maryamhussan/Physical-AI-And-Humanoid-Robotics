"""
Client initialization for OpenAI/Gemini and related services
"""
import os
from typing import Optional, Union
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Try to import OpenAI first, fallback to Gemini
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    openai = None

try:
    from .gemini_adapter import GeminiClient
    GEMINI_AVAILABLE = True
except ImportError:
    try:
        from gemini_adapter import GeminiClient
        GEMINI_AVAILABLE = True
    except ImportError:
        GEMINI_AVAILABLE = False
        GeminiClient = None


def initialize_llm_client(api_key: Optional[str] = None) -> Union[object, None]:
    """
    Create LLM client initialization supporting both OpenAI and Gemini APIs
    """
    # Try OpenAI first
    if OPENAI_AVAILABLE:
        openai_api_key = api_key or os.getenv("OPENAI_API_KEY")
        if openai_api_key:
            print("Using OpenAI API")
            try:
                client = openai.OpenAI(api_key=openai_api_key)
                return client
            except Exception as e:
                print(f"Failed to initialize OpenAI client: {e}")

    # Try Gemini next
    if GEMINI_AVAILABLE:
        gemini_api_key = api_key or os.getenv("GEMINI_API_KEY")
        if gemini_api_key:
            print("Using Gemini API")
            try:
                client = GeminiClient(api_key=gemini_api_key)
                return client
            except Exception as e:
                print(f"Failed to initialize Gemini client: {e}")

    # For local development without any API key, we'll use a mock client
    print("Warning: No LLM API key found (neither OPENAI_API_KEY nor GEMINI_API_KEY). Using fallback responses for local development.")

    # Create a mock client-like object that mimics the interfaces
    class MockLLMClient:
        def __init__(self):
            self.api_key = "mock-key-for-local-dev"

        class Chat:
            class Completions:
                def create(self, model: str = "mock-model", messages: list = [], **kwargs):
                    # Create a mock response that mimics OpenAI format
                    class MockChoice:
                        class MockMessage:
                            content = "This is a mock response for local development. The actual response would come from the LLM API when properly configured with an API key."
                        message = MockMessage()
                        index = 0

                    class MockResponse:
                        choices = [MockChoice()]
                        id = "mock-response"
                        created = 0
                        model = model
                        object = "chat.completion"

                    return MockResponse()

            completions = Completions()

        chat = Chat()

    return MockLLMClient()


def check_llm_availability(client: object) -> bool:
    """
    Add LLM API availability checks and graceful degradation
    """
    try:
        # This is a simplified check - in practice, you'd make a real API call
        if hasattr(client, 'chat'):
            return True
        return False
    except Exception as e:
        print(f"LLM API not available: {e}")
        return False


def close_llm_client(client: object):
    """
    Add proper resource management and cleanup for LLM clients
    """
    try:
        if hasattr(client, 'close'):
            client.close()
        print("LLM client connection closed successfully")
    except Exception as e:
        print(f"Error closing LLM client: {e}")


# Global client instance
LLM_CLIENT = initialize_llm_client()


# At program exit, ensure resources are cleaned up
import atexit
atexit.register(lambda: close_llm_client(LLM_CLIENT))