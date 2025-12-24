// Offline mode detection and messaging

// Detect if the user is offline
export const isOffline = () => {
  // Use the browser's navigator.onLine property
  return !navigator.onLine;
};

// Listen for online/offline events
export class OfflineDetector {
  constructor() {
    this.isCurrentlyOffline = !navigator.onLine;
    this.listeners = [];
    this.init();
  }

  init() {
    // Set initial state
    this.isCurrentlyOffline = !navigator.onLine;

    // Add event listeners
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  handleOnline() {
    this.isCurrentlyOffline = false;
    this.notifyListeners('online');
  }

  handleOffline() {
    this.isCurrentlyOffline = true;
    this.notifyListeners('offline');
  }

  // Add a listener for online/offline events
  addListener(callback) {
    this.listeners.push(callback);
    // Return a function to remove the listener
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners of a state change
  notifyListeners(status) {
    this.listeners.forEach(listener => {
      listener(status, this.isCurrentlyOffline);
    });
  }

  // Check current online status
  checkStatus() {
    return {
      isOnline: navigator.onLine,
      isOffline: !navigator.onLine,
      timestamp: new Date().toISOString()
    };
  }

  // Cleanup event listeners
  destroy() {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    this.listeners = [];
  }
}

// Create a singleton instance
export const offlineDetector = new OfflineDetector();

// React hook for using offline detection in components
export const useOfflineDetection = () => {
  const [isOffline, setIsOffline] = (typeof React !== 'undefined' && React.useState)
    ? React.useState(!navigator.onLine)
    : [!navigator.onLine, () => {}];

  // In a real React component, we would use useEffect
  // This is a simplified version that returns the functions needed
  const addOfflineListener = (callback) => {
    const removeListener = offlineDetector.addListener((status, isCurrentlyOffline) => {
      if (typeof setIsOffline === 'function') {
        setIsOffline(isCurrentlyOffline);
      }
      callback(status, isCurrentlyOffline);
    });
    return removeListener;
  };

  return {
    isOffline: offlineDetector.isCurrentlyOffline,
    isOnline: !offlineDetector.isCurrentlyOffline,
    addOfflineListener,
    checkStatus: offlineDetector.checkStatus
  };
};

// Offline message utilities
export class OfflineMessageManager {
  constructor(options = {}) {
    this.messageTemplates = {
      ...this.defaultTemplates,
      ...options.messageTemplates
    };
    this.options = {
      showBanner: options.showBanner !== false, // default to true
      position: options.position || 'top',
      duration: options.duration || 5000, // 5 seconds
      ...options
    };
  }

  get defaultTemplates() {
    return {
      offline: 'You are currently offline. Some features may be limited.',
      online: 'You are back online. Full functionality restored.',
      limitedFunctionality: 'Limited functionality available while offline.'
    };
  }

  // Get appropriate message based on context
  getMessage(context = 'offline') {
    return this.messageTemplates[context] || this.messageTemplates.offline;
  }

  // Show offline message
  showMessage(context = 'offline', elementId = 'offline-message') {
    if (!this.options.showBanner) {
      return null;
    }

    const message = this.getMessage(context);
    const existingElement = document.getElementById(elementId);

    if (existingElement) {
      existingElement.textContent = message;
      existingElement.classList.add('offline-message', `offline-message-${context}`);
      return existingElement;
    }

    // Create new message element
    const messageElement = document.createElement('div');
    messageElement.id = elementId;
    messageElement.className = `offline-message offline-message-${context}`;
    messageElement.textContent = message;
    messageElement.setAttribute('role', 'status');
    messageElement.setAttribute('aria-live', 'polite');

    // Add to DOM based on position
    if (this.options.position === 'top') {
      document.body.insertBefore(messageElement, document.body.firstChild);
    } else {
      document.body.appendChild(messageElement);
    }

    // Auto-hide if duration is set
    if (this.options.duration > 0) {
      setTimeout(() => {
        this.hideMessage(elementId);
      }, this.options.duration);
    }

    return messageElement;
  }

  // Hide offline message
  hideMessage(elementId = 'offline-message') {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.opacity = '0';
      element.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }, 300);
    }
  }
}

// Create a default instance
export const offlineMessageManager = new OfflineMessageManager();

export default {
  isOffline,
  OfflineDetector,
  offlineDetector,
  useOfflineDetection,
  OfflineMessageManager,
  offlineMessageManager
};