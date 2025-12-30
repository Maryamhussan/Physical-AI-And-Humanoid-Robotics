// Text selection detection and capture functionality

// Get the currently selected text
export const getSelectedText = () => {
  if (typeof window === 'undefined') {
    return '';
  }
  const selection = window.getSelection && window.getSelection();
  if (selection && selection.toString().trim()) {
    return selection.toString().trim();
  }
  return '';
};

// Get detailed information about the current selection
export const getSelectionInfo = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  const selection = window.getSelection ? window.getSelection() : document.selection;

  if (!selection || selection.toString().trim() === '') {
    return null;
  }

  const range = selection.getRangeAt ? selection.getRangeAt(0) : null;

  if (!range) {
    return {
      text: selection.toString().trim(),
      rect: null,
      container: null
    };
  }

  const rect = range.getBoundingClientRect();

  return {
    text: selection.toString().trim(),
    rect,
    container: range.commonAncestorContainer
  };
};

// Check if text is currently selected
export const isTextSelected = () => {
  const selectedText = getSelectedText();
  return selectedText.length > 0;
};

// Clear the current text selection
export const clearSelection = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  } else if (document.selection) {
    document.selection.empty();
  }
};

// Create a custom event for text selection
export const createSelectionEvent = (selectedText, position) => {
  return {
    type: 'textSelected',
    selectedText,
    position,
    timestamp: Date.now()
  };
};

// Get the position where the floating toolbar should appear
export const getFloatingToolbarPosition = (selectionRect) => {
  if (!selectionRect) {
    return { top: 0, left: 0 };
  }

  const toolbarHeight = 40; // Approximate height of the toolbar
  const offset = 10; // Offset from the selection

  let top = selectionRect.top - toolbarHeight - offset;
  let left = selectionRect.left + (selectionRect.width / 2);

  // Adjust if toolbar would appear above the viewport
  if (top < 0) {
    top = selectionRect.bottom + offset;
  }

  // Adjust for viewport boundaries
  if (typeof window !== 'undefined') {
    const viewportWidth = window.innerWidth;
    if (left > viewportWidth - 100) { // 100 is approx toolbar width
      left = viewportWidth - 100;
    }
  }

  return { top, left };
};

// Event listener for text selection changes
export const addSelectionListener = (callback) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // Return a no-op function when running on the server
    return () => {};
  }

  const handler = () => {
    const selectionInfo = getSelectionInfo();
    if (selectionInfo && selectionInfo.text) {
      callback(selectionInfo);
    }
  };

  document.addEventListener('mouseup', handler);
  document.addEventListener('keyup', handler);

  // Return a function to remove the listener
  return () => {
    document.removeEventListener('mouseup', handler);
    document.removeEventListener('keyup', handler);
  };
};

// Sanitize selected text to prevent XSS
export const sanitizeSelectedText = (text) => {
  if (typeof text !== 'string') {
    return '';
  }

  // Remove potentially dangerous content
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// Validate selected text
export const validateSelectedText = (text) => {
  if (!text) {
    return {
      isValid: false,
      error: 'No text selected'
    };
  }

  if (typeof text !== 'string') {
    return {
      isValid: false,
      error: 'Selected text is not a string'
    };
  }

  if (text.length > 5000) {
    return {
      isValid: false,
      error: 'Selected text is too long (maximum 5000 characters)'
    };
  }

  if (text.trim().length === 0) {
    return {
      isValid: false,
      error: 'Selected text is empty or contains only whitespace'
    };
  }

  return {
    isValid: true,
    error: null
  };
};

export default {
  getSelectedText,
  getSelectionInfo,
  isTextSelected,
  clearSelection,
  createSelectionEvent,
  getFloatingToolbarPosition,
  addSelectionListener,
  sanitizeSelectedText,
  validateSelectedText
};