// API request/response validation and error handling utilities

// Validate API request parameters
export const validateChatRequest = (query, selectedText, sessionId) => {
  const errors = [];

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    errors.push('Query is required and must be a non-empty string');
  }

  if (selectedText !== null && typeof selectedText !== 'string') {
    errors.push('Selected text must be a string or null');
  }

  if (sessionId !== null && typeof sessionId !== 'string') {
    errors.push('Session ID must be a string or null');
  }

  if (query && query.length > 10000) {
    errors.push('Query exceeds maximum length of 10,000 characters');
  }

  if (selectedText && selectedText.length > 5000) {
    errors.push('Selected text exceeds maximum length of 5,000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate API response structure
export const validateChatResponse = (response) => {
  const errors = [];

  if (!response) {
    errors.push('Response is null or undefined');
    return {
      isValid: false,
      errors
    };
  }

  if (typeof response.response !== 'string') {
    errors.push('Response must contain a string "response" field');
  }

  if (!Array.isArray(response.sources)) {
    errors.push('Response must contain an array "sources" field');
  } else {
    response.sources.forEach((source, index) => {
      if (typeof source !== 'string') {
        errors.push(`Source at index ${index} must be a string`);
      }
    });
  }

  if (typeof response.session_id !== 'string') {
    errors.push('Response must contain a string "session_id" field');
  }

  if (typeof response.request_id !== 'string') {
    errors.push('Response must contain a string "request_id" field');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Error handling utilities
export const handleApiError = (error) => {
  if (error.name === 'AbortError') {
    return {
      type: 'TIMEOUT',
      message: 'Request timed out. Please try again.',
      originalError: error
    };
  }

  if (error.message.includes('HTTP error')) {
    return {
      type: 'HTTP_ERROR',
      message: `Server error: ${error.message}`,
      originalError: error
    };
  }

  if (error.message.includes('Failed to fetch')) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Unable to connect to the knowledge base service. Please check if the backend service is running.',
      originalError: error
    };
  }

  if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
    return {
      type: 'SERVICE_ERROR',
      message: 'The knowledge base service is temporarily unavailable. Please try again later or check back for updates.',
      originalError: error
    };
  }

  return {
    type: 'UNKNOWN_ERROR',
    message: error.message || 'An unknown error occurred',
    originalError: error
  };
};

// Format error for display to user
export const formatUserErrorMessage = (errorInfo) => {
  switch (errorInfo.type) {
    case 'TIMEOUT':
      return 'The request took too long. Please try again.';
    case 'HTTP_ERROR':
      return 'There was an issue with the server. Please try again later.';
    case 'NETWORK_ERROR':
      return 'Unable to connect to the service. Please check your network connection.';
    case 'SERVICE_ERROR':
      return errorInfo.message; // Use the specific service error message
    case 'VALIDATION_ERROR':
      return `Validation error: ${errorInfo.message}`;
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

// Sanitize user input to prevent XSS
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove potentially dangerous characters/sequences
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// Validate and sanitize user query
export const processUserQuery = (query) => {
  const sanitized = sanitizeInput(query);
  const validation = validateChatRequest(sanitized, null, null);

  return {
    query: sanitized,
    isValid: validation.isValid,
    errors: validation.errors
  };
};

export default {
  validateChatRequest,
  validateChatResponse,
  handleApiError,
  formatUserErrorMessage,
  sanitizeInput,
  processUserQuery
};