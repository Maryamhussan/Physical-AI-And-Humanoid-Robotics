// Component state management and session handling utilities

// Create a session ID
export const createSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Manage chat history state
export class ChatHistoryManager {
  constructor(maxHistory = 50) {
    this.maxHistory = maxHistory;
    this.history = [];
  }

  // Add a new message to history
  addMessage(role, content, sources = []) {
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      role, // 'user' or 'assistant'
      content,
      timestamp: new Date().toISOString(),
      sources
    };

    this.history.push(message);

    // Keep history within limits
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    return message;
  }

  // Get recent messages
  getRecentMessages(count = 10) {
    return this.history.slice(-count);
  }

  // Get all messages
  getAllMessages() {
    return [...this.history];
  }

  // Clear history
  clear() {
    this.history = [];
  }

  // Get message count
  getCount() {
    return this.history.length;
  }
}

// Session management
export class SessionManager {
  constructor() {
    this.currentSessionId = null;
    this.chatHistory = new ChatHistoryManager();
  }

  // Initialize a new session
  initSession(sessionId = null) {
    this.currentSessionId = sessionId || createSessionId();
    return this.currentSessionId;
  }

  // Get current session ID
  getSessionId() {
    if (!this.currentSessionId) {
      this.currentSessionId = createSessionId();
    }
    return this.currentSessionId;
  }

  // Update session ID (e.g., when received from backend)
  updateSessionId(newSessionId) {
    this.currentSessionId = newSessionId;
  }

  // Add user message to history
  addUserMessage(content) {
    return this.chatHistory.addMessage('user', content);
  }

  // Add assistant message to history
  addAssistantMessage(content, sources = []) {
    return this.chatHistory.addMessage('assistant', content, sources);
  }

  // Get chat history
  getHistory(count) {
    return this.chatHistory.getRecentMessages(count);
  }

  // Clear session
  clearSession() {
    this.currentSessionId = null;
    this.chatHistory.clear();
  }
}

// React hook for managing component state
export const useStateManager = (initialState = {}) => {
  // In a real implementation, we'd use React's useState here
  // This is a utility function that can be used within components
  const stateManager = {
    state: { ...initialState },

    setState(newState) {
      if (typeof newState === 'function') {
        this.state = { ...this.state, ...newState(this.state) };
      } else {
        this.state = { ...this.state, ...newState };
      }
    },

    getState() {
      return { ...this.state };
    },

    updateState(updates) {
      this.state = { ...this.state, ...updates };
    }
  };

  return stateManager;
};

// Utility for debouncing function calls
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Utility for throttling function calls
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export default {
  createSessionId,
  ChatHistoryManager,
  SessionManager,
  useStateManager,
  debounce,
  throttle
};