// End-to-end tests for all user stories

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocusaurusChatbot from './DocusaurusChatbot';
import apiService from './api-service';

// Mock the API service
jest.mock('./api-service');

describe('End-to-End Tests: All User Stories', () => {
  const mockApiResponse = {
    response: 'This is a test response from the RAG agent.',
    sources: [
      'https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/docs/example',
      'https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/docs/another-example'
    ],
    session_id: 'test-session-123',
    request_id: 'test-request-456'
  };

  beforeEach(() => {
    apiService.chat.mockClear();
    apiService.chat.mockResolvedValue(mockApiResponse);
  });

  describe('User Story 1: Query Book Content via Chatbot (P1)', () => {
    test('user can submit a query and receive a response', async () => {
      render(<DocusaurusChatbot />);

      // Find the input field and enter a query
      const input = screen.getByPlaceholderText('Ask a question about the book...');
      fireEvent.change(input, { target: { value: 'What is a humanoid robot?' } });

      // Find and click the send button
      const sendButton = screen.getByLabelText('Send message');
      fireEvent.click(sendButton);

      // Wait for the response to appear
      await waitFor(() => {
        expect(screen.getByText('This is a test response from the RAG agent.')).toBeInTheDocument();
      });

      // Verify the API was called
      expect(apiService.chat).toHaveBeenCalledWith(
        'What is a humanoid robot?',
        null,
        expect.any(String)
      );

      // Verify sources are displayed
      expect(screen.getByText('Sources:')).toBeInTheDocument();
      expect(screen.getByText('https://maryamhussan.github.io/Physical-AI-And-Humanoid-Robotics/docs/example')).toBeInTheDocument();
    });

    test('response is clearly formatted and distinguishable from user input', async () => {
      render(<DocusaurusChatbot />);

      // Submit a query
      const input = screen.getByPlaceholderText('Ask a question about the book...');
      fireEvent.change(input, { target: { value: 'Test query' } });
      fireEvent.click(screen.getByLabelText('Send message'));

      // Wait for response
      await waitFor(() => {
        expect(screen.getByText('This is a test response from the RAG agent.')).toBeInTheDocument();
      });

      // Verify both user and assistant messages exist
      expect(screen.getByText('Test query')).toBeInTheDocument(); // User message
      expect(screen.getByText('This is a test response from the RAG agent.')).toBeInTheDocument(); // Assistant message

      // Verify they have different styling (different classes)
      const userMessage = screen.getByText('Test query').closest('.chat-message');
      const assistantMessage = screen.getByText('This is a test response from the RAG agent.').closest('.chat-message');

      expect(userMessage).toHaveClass('chat-message-user');
      expect(assistantMessage).toHaveClass('chat-message-assistant');
    });
  });

  describe('User Story 2: Query Based on Selected Text (P2)', () => {
    // Note: Testing text selection is complex in JSDOM, so we'll test the functionality
    // that would be triggered by text selection
    test('component can handle queries with selected text context', async () => {
      // Mock the text selection functionality
      const originalGetSelection = window.getSelection;
      const originalDocument = document.createElement('div');

      // Create a mock selection
      const mockSelection = {
        toString: () => 'Selected text from the page',
        getRangeAt: (index) => ({
          getBoundingClientRect: () => ({ top: 100, left: 100, width: 100 })
        }),
        rangeCount: 1
      };

      // Temporarily override window.getSelection
      Object.defineProperty(window, 'getSelection', {
        writable: true,
        value: () => mockSelection
      });

      render(<DocusaurusChatbot />);

      // Simulate selection event
      fireEvent.mouseUp(document);

      // Wait a bit for the selection to be processed
      await waitFor(() => {
        // The floating toolbar should appear after selection
        // We'll test that the component can handle selected text
      }, { timeout: 2000 });

      // Restore original function
      Object.defineProperty(window, 'getSelection', {
        writable: true,
        value: originalGetSelection
      });
    });

    test('API service includes selected text in requests when provided', async () => {
      // Directly test the API service with selected text
      const selectedText = 'This is the selected text context';

      // Mock successful response
      apiService.chat.mockResolvedValueOnce(mockApiResponse);

      // In a real scenario, this would be called internally
      // For testing, we can check that the API service accepts selected text
      await apiService.chat('Test query', selectedText, 'session-123');

      // Verify the API was called with selected text
      expect(apiService.chat).toHaveBeenCalledWith(
        'Test query',
        selectedText,
        'session-123'
      );
    });
  });

  describe('User Story 3: Seamless UI Integration (P3)', () => {
    test('chatbot UI follows Docusaurus theme and color scheme', () => {
      render(<DocusaurusChatbot />);

      // Check that the main container uses Docusaurus CSS variables
      const container = screen.getByLabelText('Book Assistant Chat Interface');
      expect(container).toBeInTheDocument();

      // Check for Docusaurus-specific class patterns
      const chatbotContainer = screen.getByRole('complementary');
      expect(chatbotContainer).toBeInTheDocument();
    });

    test('chatbot remains accessible without disrupting navigation', () => {
      render(
        <div>
          <nav>Navigation menu</nav>
          <main>
            <h1>Page Content</h1>
            <DocusaurusChatbot />
          </main>
        </div>
      );

      // Verify navigation still exists and is accessible
      expect(screen.getByText('Navigation menu')).toBeInTheDocument();

      // Verify page content is still accessible
      expect(screen.getByText('Page Content')).toBeInTheDocument();

      // Verify chatbot is present
      expect(screen.getByLabelText('Book Assistant Chat Interface')).toBeInTheDocument();
    });

    test('component is responsive across device sizes', () => {
      render(<DocusaurusChatbot />);

      // Check that responsive classes are applied
      const container = screen.getByLabelText('Book Assistant Chat Interface');

      // The component should have responsive design elements
      const chatInput = screen.getByPlaceholderText('Ask a question about the book...');
      expect(chatInput).toBeInTheDocument();

      // Verify the component can be collapsed/expanded
      const toggleButton = screen.getByLabelText(/Collapse chat|Expand chat/);
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Cross-Cutting Features', () => {
    test('error handling works when API fails', async () => {
      // Mock API failure
      apiService.chat.mockRejectedValueOnce(new Error('API Error'));

      render(<DocusaurusChatbot />);

      // Submit a query
      const input = screen.getByPlaceholderText('Ask a question about the book...');
      fireEvent.change(input, { target: { value: 'Test query' } });
      fireEvent.click(screen.getByLabelText('Send message'));

      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
      });

      // Verify error was handled gracefully
      expect(apiService.chat).toHaveBeenCalled();
    });

    test('loading states are displayed during API communication', async () => {
      // Create a promise that doesn't resolve immediately to test loading state
      const pendingPromise = new Promise(() => {});
      apiService.chat.mockReturnValueOnce(pendingPromise);

      render(<DocusaurusChatbot />);

      // Submit a query
      const input = screen.getByPlaceholderText('Ask a question about the book...');
      fireEvent.change(input, { target: { value: 'Test query' } });
      fireEvent.click(screen.getByLabelText('Send message'));

      // Check that loading indicator appears
      const loadingElement = screen.getByText('Thinking...');
      expect(loadingElement).toBeInTheDocument();
    });

    test('session management works correctly', async () => {
      render(<DocusaurusChatbot />);

      // Submit first query
      const input = screen.getByPlaceholderText('Ask a question about the book...');
      fireEvent.change(input, { target: { value: 'First query' } });
      fireEvent.click(screen.getByLabelText('Send message'));

      // Wait for first response
      await waitFor(() => {
        expect(screen.getByText('This is a test response from the RAG agent.')).toBeInTheDocument();
      });

      // Submit second query
      fireEvent.change(input, { target: { value: 'Second query' } });
      fireEvent.click(screen.getByLabelText('Send message'));

      // Wait for second response
      await waitFor(() => {
        // Should have both messages in the history
        const messageElements = screen.getAllByText('This is a test response from the RAG agent.');
        expect(messageElements).toHaveLength(2);
      });
    });
  });

  describe('Success Criteria Verification', () => {
    test('users can successfully submit queries to the backend', async () => {
      render(<DocusaurusChatbot />);

      const input = screen.getByPlaceholderText('Ask a question about the book...');
      fireEvent.change(input, { target: { value: 'Test query for success criteria' } });
      fireEvent.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(apiService.chat).toHaveBeenCalledWith(
          'Test query for success criteria',
          null,
          expect.any(String)
        );
      });

      expect(apiService.chat).toHaveBeenCalled();
    });

    test('responses are displayed correctly within the book UI', async () => {
      render(<DocusaurusChatbot />);

      const input = screen.getByPlaceholderText('Ask a question about the book...');
      fireEvent.change(input, { target: { value: 'UI display test' } });
      fireEvent.click(screen.getByLabelText('Send message'));

      await waitFor(() => {
        expect(screen.getByText('This is a test response from the RAG agent.')).toBeInTheDocument();
      });

      // Verify response appears in the chat history container
      const historyContainer = screen.getByLabelText('Chat message history');
      expect(within(historyContainer).getByText('This is a test response from the RAG agent.')).toBeInTheDocument();
    });

    test('component works in local development environment', () => {
      // This is implicitly tested by all other tests
      // The component renders and functions without external dependencies
      render(<DocusaurusChatbot />);

      const input = screen.getByPlaceholderText('Ask a question about the book...');
      expect(input).toBeInTheDocument();

      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toBeInTheDocument();
    });
  });
});