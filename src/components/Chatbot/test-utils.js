// Testing utilities for Chatbot components
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock API responses for testing
export const mockApiResponse = {
  response: 'This is a sample response from the RAG agent.',
  sources: [
    'https://physical-ai-humanoid-robotics.vercel.app/docs/example',
    'https://physical-ai-humanoid-robotics.vercel.app/docs/another-example'
  ],
  session_id: 'test-session-123',
  request_id: 'test-request-456'
};

export const mockHealthResponse = {
  status: 'healthy',
  timestamp: new Date().toISOString()
};

// Utility function to render components with common providers
export const renderWithProviders = (component) => {
  // For Docusaurus integration, we might need additional providers
  // This is a basic implementation that can be extended as needed
  return render(component);
};

// Mock API service for testing
export const createMockApiService = () => {
  return {
    chat: jest.fn().mockResolvedValue(mockApiResponse),
    health: jest.fn().mockResolvedValue(mockHealthResponse),
    retrieve: jest.fn().mockResolvedValue({
      query: 'test query',
      results: [{
        id: 'test-id',
        text: 'test text',
        url: 'https://example.com',
        score: 0.8
      }],
      retrieval_time: 0.1
    }),
    // Mock error responses
    chatError: jest.fn().mockRejectedValue(new Error('API Error')),
    healthError: jest.fn().mockRejectedValue(new Error('Health Check Failed'))
  };
};

export default {
  mockApiResponse,
  mockHealthResponse,
  renderWithProviders,
  createMockApiService
};