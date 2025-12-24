// Integration tests for API communication

import { apiService } from './api-service';
import { ErrorHandler, CircuitBreaker, FallbackHandler } from './error-handling';

// Mock fetch API for testing
global.fetch = jest.fn();

describe('API Communication Integration Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch.mockClear();
    global.fetch = originalFetch;
  });

  describe('Chat API Integration', () => {
    test('successfully sends query and receives response', async () => {
      const mockResponse = {
        response: 'This is a test response',
        sources: ['https://example.com/doc1', 'https://example.com/doc2'],
        session_id: 'test-session-123',
        request_id: 'test-request-456'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await apiService.chat('Test query', null, 'existing-session');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );

      expect(response).toEqual(mockResponse);
    });

    test('includes selected text in request when provided', async () => {
      const mockResponse = {
        response: 'Response considering context',
        sources: ['https://example.com'],
        session_id: 'test-session-123',
        request_id: 'test-request-456'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const selectedText = 'This is the selected text context';
      await apiService.chat('Test query', selectedText, 'session-123');

      const fetchCall = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.selected_text).toBe(selectedText);
    });

    test('handles API validation errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity'
      });

      await expect(apiService.chat('Test query')).rejects.toThrow('HTTP error');
    });

    test('handles network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.chat('Test query')).rejects.toThrow('Network error');
    });

    test('handles timeout errors', async () => {
      // Simulate timeout by rejecting with AbortError
      global.fetch.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(apiService.chat('Test query')).rejects.toThrow('Request timeout');
    });
  });

  describe('Health Check API Integration', () => {
    test('successfully checks health status', async () => {
      const mockHealthResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHealthResponse)
      });

      const response = await apiService.health();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.objectContaining({
          method: 'GET'
        })
      );

      expect(response).toEqual(mockHealthResponse);
    });

    test('handles health check errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      });

      await expect(apiService.health()).rejects.toThrow('HTTP error');
    });
  });

  describe('Retrieve API Integration', () => {
    test('successfully retrieves content', async () => {
      const mockRetrieveResponse = {
        query: 'test query',
        results: [{
          id: 'test-id',
          text: 'test content',
          url: 'https://example.com',
          score: 0.85
        }],
        retrieval_time: 0.123
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRetrieveResponse)
      });

      const response = await apiService.retrieve('test query', 5, 0.3);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/retrieve'),
        expect.objectContaining({
          method: 'POST'
        })
      );

      expect(response).toEqual(mockRetrieveResponse);
    });
  });

  describe('Error Handling Integration', () => {
    test('circuit breaker prevents cascade failures', async () => {
      const circuitBreaker = new CircuitBreaker({ failureThreshold: 2 });

      // Mock API to always fail
      global.fetch.mockRejectedValue(new Error('Service unavailable'));

      // First call should fail
      await expect(
        circuitBreaker.call(() => apiService.chat('Test query'))
      ).rejects.toThrow();

      // Second call should also fail
      await expect(
        circuitBreaker.call(() => apiService.chat('Test query'))
      ).rejects.toThrow();

      // Circuit should now be open, next call should be rejected by circuit breaker
      await expect(
        circuitBreaker.call(() => apiService.chat('Test query'))
      ).rejects.toThrow('Circuit breaker is OPEN');
    });

    test('fallback mechanism works when API is unavailable', async () => {
      const fallbackHandler = new FallbackHandler({ enabled: true });

      global.fetch.mockRejectedValue(new Error('Network error'));

      // In a real scenario, the fallback would be handled by the enhanced API service
      // This tests that the fallback system is properly configured
      expect(fallbackHandler.shouldUseFallback({
        type: 'NETWORK_ERROR'
      })).toBe(true);
    });
  });

  describe('Input Validation Integration', () => {
    test('rejects empty queries', async () => {
      await expect(apiService.chat('')).rejects.toThrow('Query is required');
    });

    test('rejects non-string queries', async () => {
      await expect(apiService.chat(123)).rejects.toThrow('Query is required');
    });

    test('sanitizes selected text input', async () => {
      const maliciousText = '<script>alert("xss")</script>This is safe text';
      const safeQuery = 'This is a safe query';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          response: 'Response',
          sources: [],
          session_id: 'session',
          request_id: 'request'
        })
      });

      // This should succeed with sanitized input
      await apiService.chat(safeQuery, maliciousText, 'session');

      const fetchCall = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      // Verify that the malicious script was removed
      expect(requestBody.selected_text).not.toContain('<script>');
    });

    test('truncates very long inputs', async () => {
      const longQuery = 'A'.repeat(11000); // Exceeds 10000 limit
      const longSelectedText = 'B'.repeat(6000); // Exceeds 5000 limit

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          response: 'Response',
          sources: [],
          session_id: 'session',
          request_id: 'request'
        })
      });

      await apiService.chat(longQuery, longSelectedText, 'session');

      const fetchCall = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      // Verify that inputs were truncated
      expect(requestBody.query.length).toBeLessThanOrEqual(10000);
      expect(requestBody.selected_text.length).toBeLessThanOrEqual(5000);
    });
  });

  describe('Headers and Configuration Integration', () => {
    test('uses correct headers for all requests', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ response: 'ok' })
      });

      await apiService.chat('Test query');

      const fetchCall = global.fetch.mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Accept']).toBe('application/json');
    });
  });
});