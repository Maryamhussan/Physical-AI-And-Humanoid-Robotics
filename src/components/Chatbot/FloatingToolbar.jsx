import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { getSelectedText, getSelectionInfo, getFloatingToolbarPosition, clearSelection } from './text-selection-utils';
import './FloatingToolbar.css';

const FloatingToolbar = ({
  onAskWithSelection,
  onCopy,
  onHighlight,
  isVisible = false,
  position = { top: 0, left: 0 },
  className = '',
  ...props
}) => {
  const [currentPosition, setCurrentPosition] = useState(position);
  const [selectedText, setSelectedText] = useState('');
  const toolbarRef = useRef(null);

  // Update position when prop changes
  useEffect(() => {
    setCurrentPosition(position);
  }, [position]);

  // Get current selection when component mounts and updates
  useEffect(() => {
    const selectionInfo = getSelectionInfo();
    if (selectionInfo) {
      setSelectedText(selectionInfo.text);
    }
  }, [isVisible]);

  // Handle click outside to hide toolbar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
        // Check if the click is outside the toolbar but not on the selected text
        const selection = window.getSelection();
        if (selection && selection.toString().trim() === '') {
          // Selection was cleared, toolbar should hide
          if (onAskWithSelection) {
            onAskWithSelection(null); // Signal that selection is cleared
          }
        }
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onAskWithSelection]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // ESC key to clear selection and hide toolbar
      if (event.key === 'Escape') {
        clearSelection();
        if (onAskWithSelection) {
          onAskWithSelection(null);
        }
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onAskWithSelection]);

  // Calculate toolbar style based on position
  const toolbarStyle = {
    top: `${currentPosition.top}px`,
    left: `${currentPosition.left}px`,
    position: 'fixed',
    zIndex: 10000, // High z-index to appear above other content
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={toolbarRef}
      className={clsx('floating-toolbar', className)}
      style={toolbarStyle}
      {...props}
    >
      <button
        className="floating-toolbar-button"
        onClick={() => onAskWithSelection && onAskWithSelection(selectedText)}
        title="Ask about selected text"
        aria-label="Ask about selected text"
      >
        <svg
          className="floating-toolbar-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </button>

      <button
        className="floating-toolbar-button"
        onClick={() => onCopy && onCopy(selectedText)}
        title="Copy selected text"
        aria-label="Copy selected text"
      >
        <svg
          className="floating-toolbar-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>

      {onHighlight && (
        <button
          className="floating-toolbar-button"
          onClick={() => onHighlight(selectedText)}
          title="Highlight selected text"
          aria-label="Highlight selected text"
        >
          <svg
            className="floating-toolbar-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 12l2 2 4-4"></path>
            <path d="M21 12c.552 0 1-.448 1-1V8.605c0-.255-.058-.508-.169-.737l-2.414-4.828a1.907 1.907 0 0 0-1.73-.936H5.314c-.75 0-1.424.403-1.73.936L1.169 7.868A1.907 1.907 0 0 0 1 8.605V11c0 .552.448 1 1 1h18z"></path>
          </svg>
        </button>
      )}
    </div>
  );
};

export default FloatingToolbar;