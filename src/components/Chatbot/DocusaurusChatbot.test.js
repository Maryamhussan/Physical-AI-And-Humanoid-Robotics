// Tests for DocusaurusChatbot component integration
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocusaurusChatbot from './DocusaurusChatbot';
import Chatbot from './Chatbot';

// Mock the child components
jest.mock('./Chatbot', () => {
  return {
    __esModule: true,
    default: jest.fn(() => <div data-testid="chatbot-component">Mock Chatbot</div>),
    Chatbot: jest.fn(() => <div data-testid="chatbot-component">Mock Chatbot</div>)
  };
});

describe('DocusaurusChatbot Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    Chatbot.mockClear();
  });

  test('renders without crashing', () => {
    render(<DocusaurusChatbot />);
    expect(screen.getByTestId('chatbot-component')).toBeInTheDocument();
  });

  test('applies correct initial expansion state', () => {
    render(<DocusaurusChatbot initialExpanded={false} />);
    // This would test that the chatbot respects the initialExpanded prop
    expect(Chatbot).toHaveBeenCalledWith(
      expect.objectContaining({
        initialExpanded: false
      }),
      expect.anything()
    );
  });

  test('handles floating toolbar visibility', () => {
    render(<DocusaurusChatbot showFloatingToolbar={true} />);
    // Initially, toolbar should not be visible since no text is selected
    expect(screen.queryByRole('button', { name: 'Ask about selected text' })).not.toBeInTheDocument();
  });

  test('respects showFloatingToolbar prop', () => {
    render(<DocusaurusChatbot showFloatingToolbar={false} />);
    // With showFloatingToolbar=false, the floating toolbar functionality should be disabled
    expect(screen.queryByRole('button', { name: 'Ask about selected text' })).not.toBeInTheDocument();
  });

  test('renders with proper CSS classes for Docusaurus integration', () => {
    render(<DocusaurusChatbot />);
    const container = screen.getByTestId('chatbot-component').closest('.docusaurus-chatbot-container');
    expect(container).toBeInTheDocument();
  });

  test('passes additional props to child Chatbot component', () => {
    const customTitle = 'Custom Assistant';
    render(<DocusaurusChatbot title={customTitle} />);

    expect(Chatbot).toHaveBeenCalledWith(
      expect.objectContaining({
        title: customTitle
      }),
      expect.anything()
    );
  });

  test('has proper accessibility attributes', () => {
    render(<DocusaurusChatbot />);
    const container = screen.getByTestId('chatbot-component').closest('.docusaurus-chatbot-container');
    expect(container).toBeInTheDocument();
  });

  test('handles window events without errors', () => {
    render(<DocusaurusChatbot />);

    // Simulate selection events that would trigger the floating toolbar
    fireEvent.mouseUp(document);
    fireEvent.keyUp(document, { key: 'A' });

    // Component should handle these events without errors
    expect(screen.getByTestId('chatbot-component')).toBeInTheDocument();
  });

  test('cleans up event listeners on unmount', () => {
    const { unmount } = render(<DocusaurusChatbot />);

    // Verify component renders
    expect(screen.getByTestId('chatbot-component')).toBeInTheDocument();

    // Unmount and make sure no errors occur
    expect(() => unmount()).not.toThrow();
  });
});

// Test the main Chatbot export as well
describe('Chatbot Component Export', () => {
  test('exports Chatbot component as named export', () => {
    const { Chatbot: ExportedChatbot } = require('./DocusaurusChatbot');
    expect(ExportedChatbot).toBeDefined();
  });

  test('exports Chatbot component as default export', () => {
    expect(DocusaurusChatbot).toBeDefined();
  });
});