// API service module to handle HTTP communication with FastAPI backend
import API_CONFIG from './api-config';
import { errorHandler, circuitBreaker, fallbackHandler } from './error-handling';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.defaultHeaders = API_CONFIG.HEADERS;
    this.timeout = API_CONFIG.TIMEOUT;
    this.errorHandler = errorHandler;
    this.circuitBreaker = circuitBreaker;
    this.fallbackHandler = fallbackHandler;
  }

  // Helper method to perform API requests with timeout
  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  // Enhanced method with error handling and fallback
  async makeRequestWithHandling(url, options = {}, endpoint) {
    try {
      // Use circuit breaker to prevent cascade failures
      const result = await this.circuitBreaker.call(async () => {
        return await this.makeRequest(url, options);
      });

      return result;
    } catch (error) {
      // Handle the error
      const errorInfo = await this.errorHandler.handleApiError(error, { endpoint, url });

      // Check if we should use a fallback response
      if (this.fallbackHandler.shouldUseFallback(errorInfo)) {
        const fallbackRequest = { endpoint, url, options };
        const fallbackResponse = this.fallbackHandler.getFallbackResponse(fallbackRequest);

        if (fallbackResponse) {
          return fallbackResponse;
        }
      }

      // Re-throw the error if no fallback is available
      throw error;
    }
  }

  // Chat endpoint: Process user queries with optional selected text context
  async chat(query, selectedText = null, sessionId = null) {
    // Validate and sanitize inputs
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Query is required and must be a non-empty string');
    }

    // Sanitize selected text if provided
    let sanitizedSelectedText = null;
    if (selectedText) {
      if (typeof selectedText !== 'string') {
        throw new Error('Selected text must be a string');
      }

      // Basic sanitization to prevent XSS
      sanitizedSelectedText = selectedText
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();

      // Limit length to prevent oversized requests
      if (sanitizedSelectedText.length > 5000) {
        sanitizedSelectedText = sanitizedSelectedText.substring(0, 5000);
      }
    }

    // Limit query length as well
    let sanitizedQuery = query.trim();
    if (sanitizedQuery.length > 10000) {
      sanitizedQuery = sanitizedQuery.substring(0, 10000);
    }

    const requestBody = {
      query: sanitizedQuery,
      selected_text: sanitizedSelectedText,
      session_id: sessionId
    };

    return this.makeRequestWithHandling(API_CONFIG.ENDPOINTS.CHAT, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(requestBody)
    }, '/chat');
  }

  // Health check endpoint
  async health() {
    return this.makeRequestWithHandling(API_CONFIG.ENDPOINTS.HEALTH, {
      method: 'GET',
      headers: this.defaultHeaders
    }, '/health');
  }

  // Retrieve endpoint (for testing/internal use)
  async retrieve(query, topK = 5, threshold = 0.3) {
    const requestBody = {
      query: query,
      top_k: topK,
      threshold: threshold
    };

    return this.makeRequestWithHandling(API_CONFIG.ENDPOINTS.RETRIEVE, {
      method: 'POST',
      headers: this.defaultHeaders,
      body: JSON.stringify(requestBody)
    }, '/retrieve');
  }
}

// Create a singleton instance
const apiService = new ApiService();
export default apiService;