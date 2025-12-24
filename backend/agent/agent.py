"""
RAG Agent implementation
"""
import logging
import time
import asyncio
from typing import Optional, Dict, Any, List

from openai import OpenAI
from pydantic import BaseModel, Field

from .models import AgentRequest, AgentResponse, ResponseValidator, ValidationStatus
from .config import AGENT_CONFIG
from .tools import RETRIEVAL_TOOL
from .clients import LLM_CLIENT as OPENAI_CLIENT  # Keep same variable name for compatibility


logger = logging.getLogger(__name__)


class RAGAgent:
    """
    Implement OpenAI agent initialization with retrieval tool integration
    """
    def __init__(self, openai_client: Optional[OpenAI] = None):
        self.client = openai_client or OPENAI_CLIENT
        self.retrieval_tool = RETRIEVAL_TOOL
        self.config = AGENT_CONFIG

    def process_query(self, agent_request: AgentRequest) -> AgentResponse:
        """
        Implement agent processing flow: query → retrieval → response generation
        """
        start_time = time.time()

        try:
            # Add proper error handling for agent operations
            query = agent_request.query
            selected_text = agent_request.selected_text

            # Retrieve relevant content
            retrieval_results = self.retrieval_tool.search(
                query,
                top_k=self.config.retrieval_top_k
            )

            # Prepare context for the agent
            context = self._prepare_context(retrieval_results, selected_text)

            # Generate response using OpenAI
            response_text = self._generate_response(query, context)

            # Validate the response to ensure grounding
            validator = self._create_validator(retrieval_results)
            validation_result = self._validate_response(response_text, validator)

            # Add logic to handle cases where no relevant content is found (T028)
            if not retrieval_results and "no relevant information" not in response_text.lower() and "not found in the knowledge base" not in response_text.lower():
                # If no content was retrieved but the response doesn't acknowledge this,
                # generate a response that acknowledges the lack of information
                response_text = (
                    f"I couldn't find any relevant information in the knowledge base to answer your question: '{query}'. "
                    f"The search didn't return any results that match your query. "
                    f"Please try rephrasing your question or check if the topic is covered in the source material."
                )

            # Calculate processing time
            processing_time = time.time() - start_time

            # Create and return the response
            agent_response = AgentResponse(
                response=response_text,
                sources=self._extract_sources(retrieval_results),
                confidence=validation_result.validation_score,
                retrieved_chunks_count=len(retrieval_results),
                processing_time=processing_time,
                request_id=agent_request.request_id,
                timestamp=agent_request.timestamp
            )

            logger.info(f"Agent processed query in {processing_time:.3f}s")
            return agent_response

        except Exception as e:
            # Add proper error handling for agent operations
            logger.error(f"Error processing agent request {agent_request.request_id}: {e}")
            processing_time = time.time() - start_time

            # Return error response
            return AgentResponse(
                response="I encountered an error while processing your request. Please try again.",
                sources=[],
                confidence=0.0,
                retrieved_chunks_count=0,
                processing_time=processing_time,
                request_id=agent_request.request_id,
                timestamp=agent_request.timestamp
            )

    def _prepare_context(self, retrieval_results: List[Dict], selected_text: Optional[str]) -> str:
        """
        Resolve conflicts between selected-text context and retrieved content
        """
        context_parts = []

        # Add selected text if provided
        if selected_text:
            context_parts.append(f"User provided context: {selected_text}\n")

        # Add retrieved content
        if retrieval_results:
            context_parts.append("Relevant information from the knowledge base:")
            for i, result in enumerate(retrieval_results):
                # Limit the text length to respect context window
                text_content = result.get('text', '')
                if len(text_content) > 500:
                    text_content = text_content[:500] + "..."

                context_parts.append(
                    f"{i+1}. Source: {result.get('url', 'Unknown')}\n"
                    f"   Content: {text_content}\n"
                    f"   Relevance: {result.get('similarity_score', 0):.2f}\n"
                )
        else:
            context_parts.append("No relevant information found in the knowledge base.")

        # Join all parts and truncate if necessary to respect context window
        full_context = "\n".join(context_parts)

        # Check for potential conflicts between selected_text and retrieved content
        if selected_text and retrieval_results:
            # Add instructions to the model on how to handle conflicts
            conflict_resolution_note = (
                "\nNOTE: If there are differences between the user-provided context and the knowledge base, "
                "please acknowledge both sources and indicate which information comes from which source.\n"
            )
            full_context = full_context + conflict_resolution_note

        # Respect context window size
        if len(full_context) > self.config.context_window_size // 2:  # Use half for safety
            full_context = full_context[:(self.config.context_window_size // 2)] + "\n[Context truncated due to length]"

        return full_context

    def _generate_response(self, query: str, context: str) -> str:
        """
        Implement proper handling for complex queries that exceed agent capabilities
        """
        # Check if the query is too complex or too long
        if len(query) > 500:
            return (
                "The query you provided is too long. Please shorten your question "
                "to under 500 characters to help me better understand and respond to your request."
            )

        # Check if the query contains too many sub-questions or complex reasoning requirements
        question_parts = [part.strip() for part in query.split('?') if part.strip()]
        if len(question_parts) > 3:
            return (
                "Your query contains multiple questions or complex reasoning requirements that "
                "exceed my current capabilities. Please break your question down into simpler, "
                "focused questions for better responses."
            )

        # Create a prompt that enforces grounding in the provided context
        system_prompt = (
            "You are a helpful AI assistant that answers questions based strictly on the provided context. "
            "Only use information that is explicitly mentioned in the context. "
            "If the context does not contain information to answer the question, state that clearly. "
            "Always cite sources when providing specific information from the context. "
            "Do not use any knowledge that is not provided in the context. "
            "Your responses must be grounded in the provided information only. "
            "If the question is too complex or requires reasoning beyond the provided context, "
            "acknowledge the limitations and suggest simplifying the question."
        )

        user_message = f"Context:\n{context}\n\nQuestion: {query}"

        try:
            response = self.client.chat.completions.create(
                model=self.config.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature,
                timeout=self.config.timeout_seconds
            )

            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return (
                "I encountered an issue while processing your request. "
                "This may be due to the complexity of the question or system limitations. "
                "Please try rephrasing your question in a simpler form."
            )

    def _create_validator(self, retrieval_results: List[Dict]) -> ResponseValidator:
        """
        Create a validator for response grounding
        """
        return ResponseValidator(
            grounding_threshold=self.config.retrieval_threshold,
            validation_rules=[
                "Response must only contain information from retrieved content",
                "Cite sources when providing specific information",
                "Acknowledge when information is not available in context"
            ],
            retrieved_content=retrieval_results
        )

    def _validate_response(self, response: str, validator: ResponseValidator) -> ResponseValidator:
        """
        Implement ResponseValidator to ensure responses are grounded in retrieved content
        """
        # Simple validation: check if the response contains information that can be traced to retrieved content
        retrieved_texts = [item.get("text", "") for item in validator.retrieved_content]

        # This is a simplified validation - in a real implementation,
        # you would use more sophisticated NLP techniques to verify grounding
        if not validator.retrieved_content:
            # If no content was retrieved, check if the response acknowledges this
            if "no relevant information" in response.lower() or "not found in the knowledge base" in response.lower():
                validator.validation_score = 1.0
                validator.validation_status = ValidationStatus.VALID
            else:
                validator.validation_score = 0.0
                validator.validation_status = ValidationStatus.INVALID
        else:
            # Check if the response contains key phrases from retrieved content
            response_lower = response.lower()
            matched_segments = 0
            total_segments = len(retrieved_texts)

            for text in retrieved_texts:
                if len(text) > 10:  # Only check substantial text segments
                    # Look for overlapping words between response and retrieved content
                    text_words = set(text.lower().split()[:10])  # Use first 10 words as representative
                    response_words = set(response_lower.split())
                    common_words = text_words.intersection(response_words)

                    if len(common_words) > 0:  # If there's overlap, consider it grounded
                        matched_segments += 1

            if total_segments > 0:
                validator.validation_score = matched_segments / total_segments
                if validator.validation_score >= validator.grounding_threshold:
                    validator.validation_status = ValidationStatus.VALID
                else:
                    validator.validation_status = ValidationStatus.INVALID
            else:
                validator.validation_score = 1.0
                validator.validation_status = ValidationStatus.VALID

        # Add confidence scoring for response quality assessment (T030)
        if validator.validation_status == ValidationStatus.VALID:
            # Boost confidence if there are high-quality matches
            high_quality_matches = sum(1 for item in validator.retrieved_content
                                     if item.get('similarity_score', 0) > 0.7)
            if high_quality_matches > 0:
                # Increase confidence based on quality of matches
                quality_boost = min(0.2, high_quality_matches * 0.05)  # Max 20% boost
                validator.validation_score = min(1.0, validator.validation_score + quality_boost)

        return validator

    def _extract_sources(self, retrieval_results: List[Dict]) -> List[str]:
        """
        Extract source URLs from retrieval results
        """
        sources = []
        for result in retrieval_results:
            url = result.get("url")
            if url and url not in sources:
                sources.append(url)
        return sources