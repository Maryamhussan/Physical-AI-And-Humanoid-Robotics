// Tests for FloatingToolbar component functionality
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FloatingToolbar from './FloatingToolbar';

describe('FloatingToolbar Component', () => {
  const mockOnAskWithSelection = jest.fn();
  const mockOnCopy = jest.fn();
  const mockOnHighlight = jest.fn();

  beforeEach(() => {
    mockOnAskWithSelection.mockClear();
    mockOnCopy.mockClear();
    mockOnHighlight.mockClear();
  });

  test('renders when visible', () => {
    render(
      <FloatingToolbar
        isVisible={true}
        position={{ top: 100, left: 100 }}
        onAskWithSelection={mockOnAskWithSelection}
        onCopy={mockOnCopy}
        onHighlight={mockOnHighlight}
      />
    );

    expect(screen.getByTitle('Ask about selected text')).toBeInTheDocument();
    expect(screen.getByTitle('Copy selected text')).toBeInTheDocument();
    expect(screen.getByTitle('Highlight selected text')).toBeInTheDocument();
  });

  test('does not render when not visible', () => {
    render(
      <FloatingToolbar
        isVisible={false}
        position={{ top: 100, left: 100 }}
        onAskWithSelection={mockOnAskWithSelection}
        onCopy={mockOnCopy}
        onHighlight={mockOnHighlight}
      />
    );

    expect(screen.queryByTitle('Ask about selected text')).not.toBeInTheDocument();
  });

  test('calls onAskWithSelection when ask button is clicked', () => {
    const selectedText = 'This is the selected text';

    render(
      <FloatingToolbar
        isVisible={true}
        position={{ top: 100, left: 100 }}
        selectedText={selectedText}
        onAskWithSelection={mockOnAskWithSelection}
        onCopy={mockOnCopy}
        onHighlight={mockOnHighlight}
      />
    );

    fireEvent.click(screen.getByTitle('Ask about selected text'));
    expect(mockOnAskWithSelection).toHaveBeenCalledWith(selectedText);
  });

  test('calls onCopy when copy button is clicked', () => {
    const selectedText = 'This is the selected text';

    render(
      <FloatingToolbar
        isVisible={true}
        position={{ top: 100, left: 100 }}
        selectedText={selectedText}
        onAskWithSelection={mockOnAskWithSelection}
        onCopy={mockOnCopy}
        onHighlight={mockOnHighlight}
      />
    );

    fireEvent.click(screen.getByTitle('Copy selected text'));
    expect(mockOnCopy).toHaveBeenCalledWith(selectedText);
  });

  test('calls onHighlight when highlight button is clicked', () => {
    const selectedText = 'This is the selected text';

    render(
      <FloatingToolbar
        isVisible={true}
        position={{ top: 100, left: 100 }}
        selectedText={selectedText}
        onAskWithSelection={mockOnAskWithSelection}
        onCopy={mockOnCopy}
        onHighlight={mockOnHighlight}
      />
    );

    fireEvent.click(screen.getByTitle('Highlight selected text'));
    expect(mockOnHighlight).toHaveBeenCalledWith(selectedText);
  });

  test('applies correct position styles', () => {
    const position = { top: 150, left: 200 };

    render(
      <FloatingToolbar
        isVisible={true}
        position={position}
        onAskWithSelection={mockOnAskWithSelection}
        onCopy={mockOnCopy}
        onHighlight={mockOnHighlight}
      />
    );

    const toolbar = screen.getByRole('button', { name: 'Ask about selected text' }).closest('div');
    expect(toolbar).toHaveStyle({
      top: '150px',
      left: '200px',
      position: 'fixed'
    });
  });

  test('hides when clicking outside', async () => {
    render(
      <div>
        <div data-testid="outside-element">Outside content</div>
        <FloatingToolbar
          isVisible={true}
          position={{ top: 100, left: 100 }}
          onAskWithSelection={mockOnAskWithSelection}
          onCopy={mockOnCopy}
          onHighlight={mockOnHighlight}
        />
      </div>
    );

    // Click outside the toolbar
    fireEvent.mouseDown(screen.getByTestId('outside-element'));

    // The toolbar should trigger onAskWithSelection with null to signal hiding
    expect(mockOnAskWithSelection).toHaveBeenCalledWith(null);
  });
});