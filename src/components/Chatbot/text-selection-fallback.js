// Fallback mechanism when text selection is not available in browser

// Check if text selection API is supported
export const isTextSelectionSupported = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  return !!(window.getSelection && document.createRange);
};

// Alternative text selection method for older browsers
export const getSelectedTextFallback = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return '';
  }
  if (window.getSelection) {
    return window.getSelection().toString();
  } else if (document.selection && document.selection.type !== 'Control') {
    return document.selection.createRange().text;
  }
  return '';
};

// Check if we're in a mobile browser where selection might be limited
export const isMobileBrowser = () => {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Enhanced selection detection with fallbacks
export const getSelectedTextWithFallback = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return '';
  }

  // Try modern selection API first
  if (window.getSelection) {
    const selection = window.getSelection();
    if (selection.toString().trim()) {
      return selection.toString().trim();
    }
  }

  // Try IE-specific method
  if (document.selection && document.selection.type !== 'Control') {
    return document.selection.createRange().text.trim();
  }

  // Try to get selected text from active element if it's an input
  const activeElement = document.activeElement;
  if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    if (start !== undefined && end !== undefined && start !== end) {
      return activeElement.value.substring(start, end);
    }
  }

  return '';
};

// Create a selection detection helper that works across browsers
export class SelectionHelper {
  constructor() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this.isSupported = isTextSelectionSupported();
      this.isMobile = isMobileBrowser();
    } else {
      // Default values for server-side rendering
      this.isSupported = false;
      this.isMobile = false;
    }
  }

  // Get selected text with all fallbacks
  getSelectedText() {
    if (!this.isSupported) {
      return getSelectedTextFallback();
    }

    return getSelectedTextWithFallback();
  }

  // Check if text is selected with fallbacks
  isTextSelected() {
    const text = this.getSelectedText();
    return text.length > 0;
  }

  // Get selection information with fallbacks
  getSelectionInfo() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return null;
    }

    const text = this.getSelectedText();

    if (!text) {
      return null;
    }

    // For browsers that don't support getRangeAt, return basic info
    if (!window.getSelection || !window.getSelection().getRangeAt) {
      return {
        text: text,
        rect: null, // Can't get precise position without range
        container: null
      };
    }

    try {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        return {
          text: text,
          rect: rect,
          container: range.commonAncestorContainer
        };
      }
    } catch (e) {
      // If we can't get range info, return text only
      return {
        text: text,
        rect: null,
        container: null
      };
    }

    return {
      text: text,
      rect: null,
      container: null
    };
  }

  // Method to check if we should show the selection toolbar
  shouldShowToolbar() {
    // Don't show on mobile by default as selection behavior is different
    if (this.isMobile) {
      return false;
    }

    return this.isTextSelected();
  }

  // Method to provide alternative UI for mobile or unsupported browsers
  getAlternativeUI() {
    if (this.isMobile) {
      return {
        type: 'mobile',
        message: 'Select text and use the share menu to ask about it',
        suggestion: 'Or use the chat below to ask questions about this page'
      };
    }

    if (!this.isSupported) {
      return {
        type: 'unsupported',
        message: 'Your browser does not support text selection',
        suggestion: 'Please use the chat interface below to ask questions'
      };
    }

    return null;
  }
}

// Export a singleton instance for consistent behavior
let selectionHelper;
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  selectionHelper = new SelectionHelper();
} else {
  // Create a minimal object for server-side rendering
  selectionHelper = {
    isSupported: false,
    isMobile: false,
    getSelectedText: () => '',
    isTextSelected: () => false,
    getSelectionInfo: () => null,
    shouldShowToolbar: () => false,
    getAlternativeUI: () => null
  };
}

export { selectionHelper };
export default selectionHelper;