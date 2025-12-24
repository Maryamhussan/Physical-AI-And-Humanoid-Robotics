# Research: RAG Agent Construction Using OpenAI Agents SDK and FastAPI

## Decision: OpenAI Agents SDK vs Alternative Approaches
**Rationale**: Using OpenAI Agents SDK provides built-in reasoning capabilities, tool orchestration, and memory management. This is more robust than simple prompt engineering or custom agent implementations.

**Alternatives considered**:
- OpenAI Function Calling: Less sophisticated reasoning capabilities
- LangChain agents: Would introduce additional dependency complexity
- Custom agent implementation: Would require significant development time and maintenance

## Decision: Agent Architecture - agent → retrieval → response generation flow
**Rationale**: The flow will be: User Query → OpenAI Agent → Retrieval Tool → Retrieved Chunks → Agent Reasoning → Grounded Response. This ensures proper orchestration and grounding validation.

**Flow details**:
1. User sends query to FastAPI endpoint
2. FastAPI creates AgentRequest with query and optional context
3. OpenAI Agent invokes RetrievalTool with the query
4. RetrievalTool calls the Spec-2 retrieval pipeline
5. Retrieved chunks are returned to the agent
6. Agent reasons over the content to generate grounded response
7. AgentResponse is returned through FastAPI

## Decision: Grounding Strategy
**Rationale**: Implement a strict grounding strategy where the agent only has access to retrieved content. This prevents hallucination and ensures responses are based on the source material.

**Implementation approach**:
- RetrievalTool provides only the retrieved chunks to the agent
- Agent operates in a sandboxed environment with no external knowledge
- ResponseValidator checks that responses only contain information from retrieved chunks

## Decision: Tool Interface Design
**Rationale**: Create a dedicated RetrievalTool that integrates with the OpenAI Agents SDK and calls the Spec-2 retrieval pipeline. This provides clean separation of concerns.

**Interface specification**:
- Tool name: "retrieval_search"
- Parameters: query (string), top_k (integer, optional)
- Returns: list of content chunks with text, source, and similarity score

## Decision: Context Limits and Prompting Rules
**Rationale**: Implement clear context limits and prompting rules to enforce retrieval-only responses and prevent hallucination.

**Rules**:
- Agent must cite sources from retrieved chunks when providing information
- If no relevant content is found, agent must acknowledge this limitation
- Maximum response length to prevent excessive token usage
- Context window management for conversation history

## Decision: FastAPI Service Structure
**Rationale**: FastAPI provides async support, automatic API documentation (Swagger), and excellent performance for API endpoints.

**Endpoints planned**:
- POST /chat: Main chat endpoint accepting queries and optional context
- POST /retrieve: Testing endpoint for direct retrieval functionality
- GET /health: Health check endpoint
- GET /docs: Automatic API documentation