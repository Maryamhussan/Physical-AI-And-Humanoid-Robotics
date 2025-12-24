"""
Gemini API Adapter for OpenAI-Compatible Interface
This module provides a compatibility layer to use Google's Gemini API
with the same interface as OpenAI, allowing seamless substitution.
"""
import os
import google.generativeai as genai
from typing import Optional, Union
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class GeminiClient:
    """
    A client that mimics the OpenAI client interface but uses Google's Gemini API
    """
    def __init__(self, api_key: Optional[str] = None):
        if api_key is None:
            api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

        # Configure the Gemini API
        genai.configure(api_key=api_key)

        # Store the API key
        self.api_key = api_key

        # Initialize the chat.completions interface
        self.chat = GeminiChatInterface(api_key=api_key)

class GeminiChatInterface:
    """
    Mimics the OpenAI chat.completions interface for Gemini
    """
    def __init__(self, api_key: str):
        self.api_key = api_key
        genai.configure(api_key=api_key)

    def create(
        self,
        model: str = "gemini-1.5-pro-latest",  # Default to gemini-pro, can be overridden
        messages: list = [],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        timeout: Optional[Union[float, int]] = None,
        **kwargs
    ):
        """
        Create a chat completion using Gemini API with OpenAI-compatible interface
        """
        # Map OpenAI-style messages to Gemini format
        gemini_contents = []
        system_instruction = None

        for msg in messages:
            role = msg.get("role", "")
            content = msg.get("content", "")

            if role == "system":
                system_instruction = content
            elif role == "user":
                gemini_contents.append({"role": "user", "parts": [content]})
            elif role == "assistant":
                gemini_contents.append({"role": "model", "parts": [content]})

        # Determine which Gemini model to use based on the requested model
        gemini_model_name = self._map_model(model)

        # Initialize the Gemini model with system instruction if provided
        if system_instruction:
            model_instance = genai.GenerativeModel(
                model_name=gemini_model_name,
                system_instruction=system_instruction
            )
        else:
            model_instance = genai.GenerativeModel(model_name=gemini_model_name)

        # Prepare generation config
        generation_config = {}
        if temperature is not None:
            generation_config["temperature"] = temperature
        if max_tokens is not None:
            generation_config["max_output_tokens"] = max_tokens

        # Make the API call
        try:
            # Generate response based on the conversation history
            if gemini_contents:
                # If we have a chat history, use generate_content with the full history
                response = model_instance.generate_content(
                    gemini_contents,
                    generation_config=generation_config
                )
            else:
                # If no content, return an empty response
                class EmptyResponse:
                    candidates = [{'content': {'parts': [{'text': 'No user message provided'}]}}]

                    def text(self):
                        return "No user message provided"

                response = EmptyResponse()

            # Format response to match OpenAI format
            return GeminiCompletionResponse(response, model=gemini_model_name)

        except Exception as e:
            # Handle API errors
            raise Exception(f"Gemini API error: {str(e)}")

    def _map_model(self, openai_model: str) -> str:
        """
        Map OpenAI model names to equivalent Gemini models
        """
        model_mapping = {
            "gpt-4-turbo": "gemini-1.5-pro-latest",
            "gpt-4": "gemini-1.5-pro-latest",
            "gpt-3.5-turbo": "gemini-1.0-pro",
            "gpt-4o": "gemini-1.5-pro-latest",
            "gpt-4o-mini": "gemini-1.5-flash",
            "gemini-pro": "gemini-1.0-pro",  # Direct mapping
            "gemini-1.5-pro": "gemini-1.5-pro-latest",
            "gemini-1.5-flash": "gemini-1.5-flash"
        }

        return model_mapping.get(openai_model, "gemini-1.5-pro-latest")


class GeminiCompletionResponse:
    """
    Wrapper to make Gemini response compatible with OpenAI response format
    """
    def __init__(self, gemini_response, model: str = "gemini"):
        # Create a choices list that mimics OpenAI format
        class Choice:
            class Message:
                # Extract text from the Gemini response
                if hasattr(gemini_response, 'candidates') and gemini_response.candidates:
                    # Handle the case where response has candidates
                    candidate = gemini_response.candidates[0]
                    if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                        content = ' '.join([part.text for part in candidate.content.parts if hasattr(part, 'text')])
                    else:
                        content = str(gemini_response)
                elif hasattr(gemini_response, 'text'):
                    # Handle the direct text attribute
                    content = gemini_response.text
                else:
                    content = str(gemini_response)

            message = Message()
            index = 0
            finish_reason = "stop"  # Standard OpenAI finish reason

        self.choices = [Choice()]

        # Add other attributes to make it compatible with OpenAI format
        import time
        self.id = f"cmpl-{int(time.time())}"
        self.created = int(time.time())
        self.model = model
        self.object = "chat.completion"

        # Add usage information if available
        self.usage = {
            "prompt_tokens": 0,  # Not available from Gemini response directly
            "completion_tokens": 0,  # Not available from Gemini response directly
            "total_tokens": 0  # Not available from Gemini response directly
        }


def create_gemini_client(api_key: Optional[str] = None) -> GeminiClient:
    """
    Factory function to create a Gemini client
    """
    return GeminiClient(api_key)