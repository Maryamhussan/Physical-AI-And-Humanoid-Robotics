// Comprehensive error handling and resilience utilities

// Error types for different failure scenarios
export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  CORS_ERROR: 'CORS_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Enhanced error handler with categorization
export class ErrorHandler {
  constructor(options = {}) {
    this.defaultTimeout = options.defaultTimeout || 10000; // 10 seconds
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000; // 1 second
    this.onRetry = options.onRetry || (() => {});
    this.onError = options.onError || (() => {});
  }

  // Categorize errors based on their nature
  categorizeError(error) {
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return ERROR_TYPES.TIMEOUT_ERROR;
    }

    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return ERROR_TYPES.NETWORK_ERROR;
    }

    if (error.message.includes('429') || error.message.toLowerCase().includes('rate limit')) {
      return ERROR_TYPES.RATE_LIMIT_ERROR;
    }

    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
      return ERROR_TYPES.CORS_ERROR;
    }

    if (error.status >= 500) {
      return ERROR_TYPES.SERVER_ERROR;
    }

    if (error.status >= 400 && error.status < 500) {
      return ERROR_TYPES.VALIDATION_ERROR;
    }

    return ERROR_TYPES.UNKNOWN_ERROR;
  }

  // Format error for user display
  formatUserMessage(errorType, originalError) {
    const messages = {
      [ERROR_TYPES.NETWORK_ERROR]: 'Unable to connect to the service. Please check your internet connection and try again.',
      [ERROR_TYPES.TIMEOUT_ERROR]: 'The request took too long to complete. Please try again.',
      [ERROR_TYPES.SERVER_ERROR]: 'The server encountered an error. Please try again later.',
      [ERROR_TYPES.VALIDATION_ERROR]: 'The request contained invalid data. Please check your input and try again.',
      [ERROR_TYPES.RATE_LIMIT_ERROR]: 'Too many requests. Please wait before trying again.',
      [ERROR_TYPES.CORS_ERROR]: 'Unable to connect to the service due to security restrictions. Please contact support.',
      [ERROR_TYPES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
    };

    return messages[errorType] || originalError.message || 'An error occurred';
  }

  // Retry mechanism for transient failures
  async retryAsync(asyncFn, maxAttempts = this.retryAttempts, delay = this.retryDelay) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await asyncFn();
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts) {
          break;
        }

        const errorType = this.categorizeError(error);
        // Only retry on network and timeout errors, not validation errors
        if (errorType !== ERROR_TYPES.VALIDATION_ERROR && errorType !== ERROR_TYPES.RATE_LIMIT_ERROR) {
          this.onRetry(attempt, maxAttempts, error);
          await this.delay(delay * attempt); // Exponential backoff
        } else {
          break; // Don't retry validation errors
        }
      }
    }

    throw lastError;
  }

  // Delay utility for retry mechanism
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Handle API errors with appropriate user feedback
  async handleApiError(error, context = {}) {
    const errorType = this.categorizeError(error);
    const userMessage = this.formatUserMessage(errorType, error);

    const errorInfo = {
      type: errorType,
      message: userMessage,
      originalError: error,
      context,
      timestamp: new Date().toISOString()
    };

    this.onError(errorInfo);

    return errorInfo;
  }
}

// Circuit breaker pattern to prevent cascade failures
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 60000; // 1 minute
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.onStateChange = options.onStateChange || (() => {});
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    const previousState = this.state;
    this.state = 'CLOSED';

    if (previousState !== this.state) {
      this.onStateChange(this.state);
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      const previousState = this.state;
      this.state = 'OPEN';

      if (previousState !== this.state) {
        this.onStateChange(this.state);
      }
    }
  }

  reset() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    const previousState = this.state;
    this.state = 'CLOSED';

    if (previousState !== this.state) {
      this.onStateChange(this.state);
    }
  }
}

// Fallback mechanism when backend is unavailable
export class FallbackHandler {
  constructor(options = {}) {
    this.fallbackResponses = options.fallbackResponses || {};
    this.onFallback = options.onFallback || (() => {});
    this.enabled = options.enabled !== false; // enabled by default
  }

  // Provide fallback response when backend is unavailable
  getFallbackResponse(request) {
    if (!this.enabled) {
      return null;
    }

    // For chat requests, provide a helpful fallback message
    if (request.endpoint === '/chat') {
      return {
        response: "I'm currently unable to access the knowledge base. Please try again later or check back for updates.",
        sources: [],
        session_id: request.session_id || 'fallback-session',
        request_id: `fallback-${Date.now()}`
      };
    }

    return this.fallbackResponses[request.endpoint] || null;
  }

  // Check if fallback should be used
  shouldUseFallback(errorInfo) {
    return this.enabled && (
      errorInfo.type === ERROR_TYPES.NETWORK_ERROR ||
      errorInfo.type === ERROR_TYPES.TIMEOUT_ERROR ||
      errorInfo.type === ERROR_TYPES.SERVER_ERROR
    );
  }
}

// Create global instances
export const errorHandler = new ErrorHandler();
export const circuitBreaker = new CircuitBreaker();
export const fallbackHandler = new FallbackHandler();

export default {
  ERROR_TYPES,
  ErrorHandler,
  CircuitBreaker,
  FallbackHandler,
  errorHandler,
  circuitBreaker,
  fallbackHandler
};