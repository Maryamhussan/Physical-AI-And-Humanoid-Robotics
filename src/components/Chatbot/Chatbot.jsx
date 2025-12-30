import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import ChatInput from './ChatInput';
import ChatHistory from './ChatHistory';
import ChatbotBase from './ChatbotBase';
import apiService from './api-service';
import { validateChatRequest, validateChatResponse, handleApiError, formatUserErrorMessage, processUserQuery } from './validation-utils';
import { SessionManager } from './state-utils';
import { performanceMonitor, logger, interactionTracker } from './monitoring';
import './Chatbot.css';

const Chatbot = ({
  className = '',
  initialExpanded = false,
  title = 'Book Assistant',
  ...props
}) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Initialize session manager
  useEffect(() => {
    const sessionManager = new SessionManager();
    const newSessionId = sessionManager.initSession();
    setSessionId(newSessionId);

    logger.info('Chatbot initialized', { sessionId: newSessionId });
  }, []);

  // Function to handle sending a message
  const handleSendMessage = async (query) => {
    // Track the interaction
    interactionTracker.trackMessageSent(query);

    // Validate the query first
    const processedQuery = processUserQuery(query);
    if (!processedQuery.isValid) {
      const validationError = { type: 'VALIDATION_ERROR', message: processedQuery.errors.join(', ') };
      setError(validationError);
      logger.warn('Query validation failed', { query, errors: processedQuery.errors });
      interactionTracker.trackError(validationError, { query });
      return;
    }

    const userQuery = processedQuery.query;

    // Add user message to history
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userQuery,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Measure API call performance
      const apiMetric = await performanceMonitor.measureFunction(
        () => apiService.chat(userQuery, null, sessionId),
        'api_chat_request',
        { query: userQuery, sessionId }
      );

      const response = apiMetric.result;

      // Track API request
      interactionTracker.trackApiRequest('/chat', 'success', apiMetric.duration);

      // Validate the response
      const validation = validateChatResponse(response);
      if (!validation.isValid) {
        throw new Error(`Invalid response format: ${validation.errors.join(', ')}`);
      }

      // Update session ID if returned from backend
      if (response.session_id && response.session_id !== sessionId) {
        setSessionId(response.session_id);
      }

      // Add assistant response to history
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        sources: response.sources || [],
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      interactionTracker.trackMessageReceived(response.response, response.sources);

      logger.info('Query processed successfully', {
        query: userQuery,
        responseLength: response.response.length,
        sourcesCount: response.sources.length
      });
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo);

      // Track the error
      interactionTracker.trackError(errorInfo, { query: userQuery });
      logger.error('Error processing query', { query: userQuery, error: err.message });

      // Add error message to history
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: formatUserErrorMessage(errorInfo),
        sources: [],
        timestamp: new Date().toISOString(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error after a delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <ChatbotBase
      className={clsx('chatbot-main', className)}
      initialExpanded={initialExpanded}
      title={title}
      {...props}
      role="region"
      aria-label="Book Assistant Chat Interface"
    >
      <div
        className="chatbot-content-wrapper"
        role="feed"
        aria-live="polite"
        aria-label="Chat message history"
      >
        {error && (
          <div className="chatbot-error-message" role="alert" aria-live="assertive">
            <div className="error-text">{error.message || 'An error occurred'}</div>
          </div>
        )}

        <div className="chatbot-messages-container" role="list" aria-label="Chat message history">
          <ChatHistory
            messages={messages}
            showSources={true}
            role="listitem"
          />
        </div>

        <div className="chatbot-input-container" role="form" aria-label="Message input form">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            placeholder="Ask a question about the book..."
            aria-label="Type your question here"
          />
        </div>

        {isLoading && (
          <div className="chatbot-loading-state" role="status" aria-live="polite">
            <div className="loading-indicator" aria-label="Processing your request">Thinking...</div>
          </div>
        )}
      </div>
    </ChatbotBase>
  );
};

export default Chatbot;