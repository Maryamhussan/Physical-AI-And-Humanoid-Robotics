// Accessibility tests for Chatbot components
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Chatbot from './Chatbot';
import ChatInput from './ChatInput';
import ChatHistory from './ChatHistory';

describe('Chatbot Accessibility Tests', () => {
  test('Chatbot component has proper ARIA attributes', () => {
    render(<Chatbot />);

    const chatInterface = screen.getByRole('region', { name: /Book Assistant Chat Interface/i });
    expect(chatInterface).toBeInTheDocument();

    const messageHistory = screen.getByRole('feed', { name: /Chat message history/i });
    expect(messageHistory).toBeInTheDocument();

    const messageForm = screen.getByRole('form', { name: /Message input form/i });
    expect(messageForm).toBeInTheDocument();
  });

  test('ChatInput component has proper ARIA attributes', () => {
    const mockSendMessage = jest.fn();
    render(<ChatInput onSendMessage={mockSendMessage} />);

    const textbox = screen.getByRole('textbox', { name: /Ask a question about the book/i });
    expect(textbox).toBeInTheDocument();
    expect(textbox).toHaveAttribute('aria-multiline', 'true');
    expect(textbox).toHaveAttribute('aria-required', 'true');
    expect(textbox).toHaveAttribute('aria-label', 'Ask a question about the book...');
  });

  test('ChatHistory component has proper ARIA attributes', () => {
    const messages = [
      { id: '1', role: 'user', content: 'Test message' },
      { id: '2', role: 'assistant', content: 'Response message' }
    ];

    render(<ChatHistory messages={messages} />);

    const log = screen.getByRole('log', { name: /Chat messages/i });
    expect(log).toBeInTheDocument();
  });
});

describe('ChatInput Keyboard Navigation', () => {
  test('Enter key sends message', () => {
    const mockSendMessage = jest.fn();
    render(<ChatInput onSendMessage={mockSendMessage} />);

    const textbox = screen.getByRole('textbox');
    fireEvent.change(textbox, { target: { value: 'Test message' } });
    fireEvent.keyDown(textbox, { key: 'Enter', code: 'Enter' });

    expect(mockSendMessage).toHaveBeenCalledWith('Test message');
  });

  test('Shift+Enter does not send message', () => {
    const mockSendMessage = jest.fn();
    render(<ChatInput onSendMessage={mockSendMessage} />);

    const textbox = screen.getByRole('textbox');
    fireEvent.change(textbox, { target: { value: 'Test message' } });
    fireEvent.keyDown(textbox, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});

describe('Focus Management', () => {
  test('ChatInput textarea is focused on mount', () => {
    render(<ChatInput />);

    const textbox = screen.getByRole('textbox');
    expect(textbox).toHaveFocus();
  });
});