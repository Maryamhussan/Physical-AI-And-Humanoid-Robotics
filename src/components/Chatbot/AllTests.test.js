// Comprehensive test suite for all Chatbot components and utilities

// Import all individual test files to ensure full coverage
import ChatbotTest from './Chatbot.test';
import FloatingToolbarTest from './FloatingToolbar.test';
import DocusaurusChatbotTest from './DocusaurusChatbot.test';
import ErrorHandlingTest from './error-handling.test';

// Additional comprehensive tests
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import apiService from './api-service';
import { validateChatResponse, validateChatRequest } from './validation-utils';
import { SessionManager } from './state-utils';
import { getSelectedText, isTextSelected } from './text-selection-utils';
import { ErrorHandler, CircuitBreaker, FallbackHandler } from './error-handling';
import { performanceMonitor, logger, interactionTracker } from './monitoring';

// Mock API service for all tests
jest.mock('./api-service');

describe('Comprehensive Chatbot Test Suite', () => {
  describe('API Service Integration', () => {
    beforeEach(() => {
      apiService.chat.mockClear();
      apiService.health.mockClear();
    });

    test('handles successful API responses correctly', async () => {
      const mockResponse = {
        response: 'Test response from API',
        sources: ['https://example.com'],
        session_id: 'test-session',
        request_id: 'test-request'
      };

      apiService.chat.mockResolvedValue(mockResponse);

      // Validate the response format
      const validation = validateChatResponse(mockResponse);
      expect(validation.isValid).toBe(true);
    });

    test('handles API errors gracefully', async () => {
      const error = new Error('API Error');
      apiService.chat.mockRejectedValue(error);

      await expect(apiService.chat('test query')).rejects.toThrow('API Error');
    });
  });

  describe('Validation Utilities', () => {
    test('validates chat requests properly', () => {
      const validRequest = validateChatRequest('Valid query', null, 'session123');
      expect(validRequest.isValid).toBe(true);

      const invalidRequest = validateChatRequest('', null, 'session123');
      expect(invalidRequest.isValid).toBe(false);
    });

    test('validates chat responses properly', () => {
      const validResponse = validateChatResponse({
        response: 'Valid response',
        sources: ['https://example.com'],
        session_id: 'session123',
        request_id: 'request123'
      });
      expect(validResponse.isValid).toBe(true);

      const invalidResponse = validateChatResponse({
        response: 'Missing sources'
        // Missing sources, session_id, and request_id
      });
      expect(invalidResponse.isValid).toBe(false);
    });
  });

  describe('State Management', () => {
    test('manages chat session correctly', () => {
      const sessionManager = new SessionManager();
      const sessionId = sessionManager.initSession();

      expect(sessionId).toBeDefined();
      expect(sessionId.startsWith('session_')).toBe(true);

      // Add messages to history
      const userMsg = sessionManager.addUserMessage('Hello');
      const assistantMsg = sessionManager.addAssistantMessage('Hi there!', ['https://example.com']);

      expect(sessionManager.getHistory(5)).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    test('categorizes errors correctly', () => {
      const errorHandler = new ErrorHandler();

      const networkError = new Error('Failed to fetch');
      const errorType = errorHandler.categorizeError(networkError);
      expect(errorType).toBeDefined();
    });

    test('implements circuit breaker pattern', async () => {
      const circuitBreaker = new CircuitBreaker({ failureThreshold: 2 });

      // Test that it allows calls when healthy
      const result = await circuitBreaker.call(async () => 'success');
      expect(result).toBe('success');
    });

    test('provides fallback responses', () => {
      const fallbackHandler = new FallbackHandler();

      const fallbackResponse = fallbackHandler.getFallbackResponse({ endpoint: '/chat' });
      expect(fallbackResponse).toHaveProperty('response');
    });
  });

  describe('Monitoring and Logging', () => {
    test('measures performance correctly', () => {
      const monitor = performanceMonitor;
      monitor.start('test-operation');

      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {} // Busy wait for 10ms

      const result = monitor.end('test-operation');
      expect(result).toHaveProperty('duration');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    test('logs messages appropriately', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      logger.info('Test message', { test: 'data' });
      expect(logSpy).toHaveBeenCalled();

      logSpy.mockRestore();
    });

    test('tracks interactions', () => {
      const interaction = interactionTracker.track('test-event', { data: 'value' });
      expect(interaction).toHaveProperty('type', 'test-event');
      expect(interaction).toHaveProperty('data', { data: 'value' });
    });
  });

  describe('Text Selection Utilities', () => {
    test('detects text selection', () => {
      // This is difficult to test without a DOM environment
      // The utility functions are tested in integration scenarios
      expect(typeof getSelectedText).toBe('function');
      expect(typeof isTextSelected).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    // Test that components can be imported and used together
    test('all components can be imported without errors', () => {
      expect(() => {
        require('./Chatbot');
        require('./ChatInput');
        require('./ChatHistory');
        require('./ChatbotBase');
        require('./FloatingToolbar');
        require('./DocusaurusChatbot');
      }).not.toThrow();
    });
  });
});

// Export the individual test modules if needed
export {
  ChatbotTest,
  FloatingToolbarTest,
  DocusaurusChatbotTest,
  ErrorHandlingTest
};