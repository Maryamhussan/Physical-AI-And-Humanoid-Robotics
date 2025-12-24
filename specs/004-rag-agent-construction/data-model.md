# Data Model: RAG Agent Construction Using OpenAI Agents SDK and FastAPI

## Core Entities

### AgentRequest
**Description**: Input to the RAG agent containing user query and optional selected-text context
- **Fields**:
  - `query` (string): The main user query
  - `selected_text` (string, optional): Optional context provided by the user
  - `session_id` (string, optional): ID for conversation context
  - `request_id` (string): Unique identifier for this request
  - `timestamp` (datetime): When the request was made
  - `metadata` (dict, optional): Additional request metadata
- **Validation**: Query must not be empty, request_id must be unique
- **Relationships**: Used as input for the RAG agent processing

### AgentResponse
**Description**: Output from the RAG agent containing grounded response text and metadata
- **Fields**:
  - `response` (string): The agent's response to the user query
  - `sources` (list of strings): URLs or identifiers of content used to generate response
  - `confidence` (float): Confidence score for the response (0.0 to 1.0)
  - `retrieved_chunks_count` (integer): Number of chunks used to generate the response
  - `processing_time` (float): Time taken to process the request in seconds
  - `request_id` (string): Reference to the original request
  - `timestamp` (datetime): When the response was generated
- **Validation**: Response must be grounded in retrieved content, confidence score must be between 0 and 1
- **Relationships**: Generated from AgentRequest and retrieved content

### RetrievalTool
**Description**: Tool interface that connects the OpenAI agent to the retrieval pipeline
- **Fields**:
  - `name` (string): Name of the tool ("retrieval_search")
  - `description` (string): Description of what the tool does
  - `parameters` (dict): Schema for tool parameters
  - `retriever` (Retriever): Reference to the Spec-2 retriever instance
- **Validation**: Must have valid retriever instance, parameters must match expected schema
- **Relationships**: Called by OpenAI agent, uses Retriever from Spec-2

### ChatSession
**Description**: State management for ongoing conversations with the RAG agent
- **Fields**:
  - `session_id` (string): Unique identifier for the session
  - `history` (list of dict): Conversation history with query-response pairs
  - `created_at` (datetime): When the session was created
  - `last_accessed` (datetime): When the session was last used
  - `metadata` (dict, optional): Additional session metadata
- **Validation**: Session ID must be unique, history must not exceed size limits
- **Relationships**: Contains multiple AgentRequest-AgentResponse pairs

### ResponseValidator
**Description**: Component that ensures responses are grounded in retrieved content only
- **Fields**:
  - `grounding_threshold` (float): Minimum similarity score for content inclusion (0.0 to 1.0)
  - `validation_rules` (list of strings): Rules for validating response grounding
  - `retrieved_content` (list of RetrievedChunk): Content used to generate response
  - `validation_score` (float): Score indicating how well response matches retrieved content
- **Validation**: Validation score must meet threshold, all facts in response must be verifiable in retrieved content
- **Relationships**: Validates AgentResponse using RetrievedChunk data

## API Request/Response Models

### ChatRequest
**Description**: Request model for the chat endpoint
- **Fields**:
  - `query` (string): User query text
  - `selected_text` (string, optional): Optional context from user
  - `session_id` (string, optional): Session identifier for conversation continuity
- **Validation**: Query must be provided and not empty
- **Relationships**: Maps to AgentRequest

### ChatResponse
**Description**: Response model for the chat endpoint
- **Fields**:
  - `response` (string): Agent's response to the query
  - `sources` (list of strings): List of source URLs used
  - `session_id` (string): Session identifier
  - `request_id` (string): Unique request identifier
- **Validation**: Response must be provided
- **Relationships**: Maps to AgentResponse

### RetrieveRequest
**Description**: Request model for the retrieval testing endpoint
- **Fields**:
  - `query` (string): Query for retrieval testing
  - `top_k` (integer, optional): Number of results to return (default: 5)
  - `threshold` (float, optional): Similarity threshold (default: 0.3)
- **Validation**: Query must be provided and not empty
- **Relationships**: Used to test retrieval functionality directly

### RetrieveResponse
**Description**: Response model for the retrieval testing endpoint
- **Fields**:
  - `query` (string): Original query
  - `results` (list of dict): Retrieved chunks with metadata
  - `retrieval_time` (float): Time taken for retrieval
- **Validation**: Results must be provided
- **Relationships**: Contains RetrievedChunk data from Spec-2

## Configuration Parameters

### AgentConfiguration
**Description**: Settings that control the agent's behavior
- **Fields**:
  - `max_tokens` (integer): Maximum tokens for agent response
  - `temperature` (float): Temperature setting for response generation
  - `grounding_enabled` (boolean): Whether strict grounding is enforced
  - `context_window_size` (integer): Maximum context window size
  - `timeout_seconds` (float): Timeout for agent operations
- **Validation**: Values must be within reasonable ranges
- **Relationships**: Used by the RAG agent

## State Transitions

### Agent Processing States
1. **Request Received**: User query is received by the API
2. **Agent Invoked**: OpenAI agent is initialized with the query
3. **Tool Called**: Retrieval tool is invoked to get relevant content
4. **Content Retrieved**: Relevant chunks are fetched from Qdrant
5. **Response Generated**: Agent generates response based on retrieved content
6. **Response Validated**: Response is checked for grounding compliance
7. **Response Returned**: Final response is returned to user

## Validation Rules

### Response Grounding Validation
- All factual claims in response must be verifiable in retrieved chunks
- Response must cite sources when making specific claims
- If no relevant content is found, response must acknowledge this
- Response must not contain information not present in retrieved chunks

### API Request Validation
- Query must be provided and not empty
- Optional selected_text must be reasonable length
- Session ID format must be valid if provided
- Request must not exceed rate limits

### Content Quality Validation
- Retrieved chunks must meet minimum similarity threshold
- Sources must be properly formatted URLs
- Chunk text must not be empty
- Metadata must be complete and accurate