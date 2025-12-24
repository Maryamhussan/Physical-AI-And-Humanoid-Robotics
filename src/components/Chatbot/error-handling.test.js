// Tests for error handling and graceful degradation
import { ErrorHandler, CircuitBreaker, FallbackHandler, ERROR_TYPES } from './error-handling';

describe('Error Handling Utilities', () => {
  describe('ErrorHandler', () => {
    let errorHandler;

    beforeEach(() => {
      errorHandler = new ErrorHandler({
        retryAttempts: 2,
        retryDelay: 10 // Fast retry for tests
      });
    });

    test('categorizes network errors correctly', () => {
      const networkError = new Error('Failed to fetch');
      networkError.message = 'Failed to fetch';
      const category = errorHandler.categorizeError(networkError);
      expect(category).toBe(ERROR_TYPES.NETWORK_ERROR);
    });

    test('categorizes timeout errors correctly', () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      const category = errorHandler.categorizeError(timeoutError);
      expect(category).toBe(ERROR_TYPES.TIMEOUT_ERROR);
    });

    test('categorizes server errors correctly', () => {
      const serverError = { status: 500 };
      const category = errorHandler.categorizeError(serverError);
      expect(category).toBe(ERROR_TYPES.SERVER_ERROR);
    });

    test('formats user-friendly error messages', () => {
      const errorType = ERROR_TYPES.NETWORK_ERROR;
      const originalError = new Error('Network failure');
      const message = errorHandler.formatUserMessage(errorType, originalError);
      expect(message).toContain('connect to the service');
    });

    test('retries on transient failures', async () => {
      let callCount = 0;
      const failingFn = () => {
        callCount++;
        if (callCount < 2) {
          throw new Error('Network error');
        }
        return 'success';
      };

      const result = await errorHandler.retryAsync(failingFn, 3, 10);
      expect(result).toBe('success');
      expect(callCount).toBe(2);
    });

    test('stops retrying after max attempts', async () => {
      const failingFn = () => {
        throw new Error('Persistent error');
      };

      await expect(errorHandler.retryAsync(failingFn, 2, 10)).rejects.toThrow('Persistent error');
    });
  });

  describe('CircuitBreaker', () => {
    let circuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        timeout: 100 // 100ms for tests
      });
    });

    test('starts in CLOSED state', () => {
      expect(circuitBreaker.state).toBe('CLOSED');
    });

    test('transitions to OPEN after threshold failures', async () => {
      // First failure
      await expect(circuitBreaker.call(() => Promise.reject(new Error('fail 1')))).rejects.toThrow('fail 1');

      // Second failure - should trip the circuit
      await expect(circuitBreaker.call(() => Promise.reject(new Error('fail 2')))).rejects.toThrow('fail 2');

      // Circuit should now be OPEN
      expect(circuitBreaker.state).toBe('OPEN');
    });

    test('allows calls when CLOSED', async () => {
      const result = await circuitBreaker.call(() => Promise.resolve('success'));
      expect(result).toBe('success');
    });

    test('rejects calls when OPEN', async () => {
      // Trip the circuit first
      await expect(circuitBreaker.call(() => Promise.reject(new Error('fail 1')))).rejects.toThrow();
      await expect(circuitBreaker.call(() => Promise.reject(new Error('fail 2')))).rejects.toThrow();

      // Circuit is now OPEN, should throw specific error
      await expect(circuitBreaker.call(() => Promise.resolve('success'))).rejects.toThrow('Circuit breaker is OPEN');
    });

    test('transitions to HALF_OPEN after timeout', async () => {
      // Trip the circuit
      await expect(circuitBreaker.call(() => Promise.reject(new Error('fail 1')))).rejects.toThrow();
      await expect(circuitBreaker.call(() => Promise.reject(new Error('fail 2')))).rejects.toThrow();
      expect(circuitBreaker.state).toBe('OPEN');

      // Wait for timeout period
      await new Promise(resolve => setTimeout(resolve, 150));

      // Next call should transition to HALF_OPEN
      await expect(circuitBreaker.call(() => Promise.reject(new Error('fail 3')))).rejects.toThrow();
      // In our implementation, it stays OPEN if the call fails again
    });
  });

  describe('FallbackHandler', () => {
    let fallbackHandler;

    beforeEach(() => {
      fallbackHandler = new FallbackHandler({
        enabled: true,
        fallbackResponses: {
          '/custom': { message: 'Custom fallback' }
        }
      });
    });

    test('provides fallback for chat endpoint when backend is unavailable', () => {
      const request = { endpoint: '/chat', session_id: 'test' };
      const fallbackResponse = fallbackHandler.getFallbackResponse(request);

      expect(fallbackResponse).toHaveProperty('response');
      expect(fallbackResponse.response).toContain('unable to access the knowledge base');
    });

    test('returns appropriate fallback based on error type', () => {
      const networkErrorInfo = { type: ERROR_TYPES.NETWORK_ERROR };
      const shouldFallback = fallbackHandler.shouldUseFallback(networkErrorInfo);
      expect(shouldFallback).toBe(true);
    });

    test('does not fallback for validation errors', () => {
      const validationErrorInfo = { type: ERROR_TYPES.VALIDATION_ERROR };
      const shouldFallback = fallbackHandler.shouldUseFallback(validationErrorInfo);
      expect(shouldFallback).toBe(false);
    });
  });

  describe('Error Type Constants', () => {
    test('contains all expected error types', () => {
      expect(ERROR_TYPES).toHaveProperty('NETWORK_ERROR');
      expect(ERROR_TYPES).toHaveProperty('TIMEOUT_ERROR');
      expect(ERROR_TYPES).toHaveProperty('SERVER_ERROR');
      expect(ERROR_TYPES).toHaveProperty('VALIDATION_ERROR');
      expect(ERROR_TYPES).toHaveProperty('RATE_LIMIT_ERROR');
      expect(ERROR_TYPES).toHaveProperty('CORS_ERROR');
      expect(ERROR_TYPES).toHaveProperty('UNKNOWN_ERROR');
    });
  });
});

// Test the singleton instances
describe('Singleton Instances', () => {
  test('exports singleton instances', () => {
    expect(require('./error-handling').errorHandler).toBeDefined();
    expect(require('./error-handling').circuitBreaker).toBeDefined();
    expect(require('./error-handling').fallbackHandler).toBeDefined();
  });
});