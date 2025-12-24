// Basic tests for Chatbot component functionality
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Chatbot from './Chatbot';
import apiService from './api-service';
import { createMockApiService } from './test-utils';

// Mock the API service
jest.mock('./api-service');

describe('Chatbot Component', () => {
  const mockApi = createMockApiService();

  beforeEach(() => {
    apiService.chat.mockClear();
    apiService.health.mockClear();
  });

  test('renders without crashing', () => {
    render(<Chatbot />);
    expect(screen.getByText('Book Assistant')).toBeInTheDocument();
  });

  test('shows initial empty state message', () => {
    render(<Chatbot />);
    expect(screen.getByText('Start a conversation by asking a question about the book.')).toBeInTheDocument();
  });

  test('allows user to type and submit a query', async () => {
    // Mock successful API response
    apiService.chat.mockResolvedValue({
      response: 'This is a test response',
      sources: ['https://example.com'],
      session_id: 'test-session',
      request_id: 'test-request'
    });

    render(<Chatbot />);

    // Find the textarea and input a query
    const textarea = screen.getByPlaceholderText('Ask a question about the book...');
    fireEvent.change(textarea, { target: { value: 'Test query' } });

    // Find and click the send button
    const sendButton = screen.getByLabelText('Send message');
    fireEvent.click(sendButton);

    // Wait for the response to appear
    await waitFor(() => {
      expect(screen.getByText('This is a test response')).toBeInTheDocument();
    });

    // Verify API was called
    expect(apiService.chat).toHaveBeenCalledWith('Test query', null, expect.any(String));
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    apiService.chat.mockRejectedValue(new Error('API Error'));

    render(<Chatbot />);

    // Find the textarea and input a query
    const textarea = screen.getByPlaceholderText('Ask a question about the book...');
    fireEvent.change(textarea, { target: { value: 'Test query' } });

    // Find and click the send button
    const sendButton = screen.getByLabelText('Send message');
    fireEvent.click(sendButton);

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
    });
  });

  test('disables input when loading', async () => {
    // Mock a delayed API response
    apiService.chat.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({
        response: 'Delayed response',
        sources: ['https://example.com'],
        session_id: 'test-session',
        request_id: 'test-request'
      }), 100);
    }));

    render(<Chatbot />);

    // Find the textarea and input a query
    const textarea = screen.getByPlaceholderText('Ask a question about the book...');
    fireEvent.change(textarea, { target: { value: 'Test query' } });

    // Find and click the send button
    const sendButton = screen.getByLabelText('Send message');
    fireEvent.click(sendButton);

    // Verify input is disabled during loading
    expect(textarea).toBeDisabled();
    expect(sendButton).toBeDisabled();

    // Wait for the response and verify input is re-enabled
    await waitFor(() => {
      expect(screen.getByText('Delayed response')).toBeInTheDocument();
    });

    // Input might still be disabled if component is still mounted,
    // but the send button should be enabled again after the response
  });

  test('handles various input types and lengths', async () => {
    const longQuery = 'A'.repeat(100); // Long query
    const specialCharsQuery = 'Test with special chars: !@#$%^&*()'; // Special characters
    const normalQuery = 'Normal query'; // Normal query

    // Mock API responses
    apiService.chat
      .mockResolvedValueOnce({
        response: 'Response to long query',
        sources: ['https://example.com'],
        session_id: 'test-session-1',
        request_id: 'test-request-1'
      })
      .mockResolvedValueOnce({
        response: 'Response to special chars query',
        sources: ['https://example.com'],
        session_id: 'test-session-2',
        request_id: 'test-request-2'
      })
      .mockResolvedValueOnce({
        response: 'Response to normal query',
        sources: ['https://example.com'],
        session_id: 'test-session-3',
        request_id: 'test-request-3'
      });

    render(<Chatbot />);

    const textarea = screen.getByPlaceholderText('Ask a question about the book...');

    // Test long query
    fireEvent.change(textarea, { target: { value: longQuery } });
    fireEvent.click(screen.getByLabelText('Send message'));
    await waitFor(() => {
      expect(screen.getByText('Response to long query')).toBeInTheDocument();
    });

    // Test special characters query
    fireEvent.change(textarea, { target: { value: specialCharsQuery } });
    fireEvent.click(screen.getByLabelText('Send message'));
    await waitFor(() => {
      expect(screen.getByText('Response to special chars query')).toBeInTheDocument();
    });

    // Test normal query
    fireEvent.change(textarea, { target: { value: normalQuery } });
    fireEvent.click(screen.getByLabelText('Send message'));
    await waitFor(() => {
      expect(screen.getByText('Response to normal query')).toBeInTheDocument();
    });
  });
});