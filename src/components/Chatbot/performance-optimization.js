// Performance optimization utilities for Chatbot components

// Lazy load heavy components when needed
export const lazyLoadComponent = (importFunction, fallback = null) => {
  const React = require('react');
  const { lazy, Suspense } = React;

  const LazyComponent = lazy(importFunction);

  return (props) => (
    <Suspense fallback={fallback || <div>Loading...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Memoize components to prevent unnecessary re-renders
export const memoizeComponent = (Component, compareFunction) => {
  const React = require('react');
  return React.memo(Component, compareFunction);
};

// Debounce function calls to reduce frequency
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

// Throttle function calls to limit execution rate
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

// Virtualize long lists to improve rendering performance
export class VirtualScroller {
  constructor(container, itemHeight, totalItems) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.totalItems = totalItems;
    this.visibleItems = Math.ceil(container.clientHeight / itemHeight) + 5; // buffer
    this.startIndex = 0;
    this.endIndex = this.visibleItems;
  }

  updateScrollPosition(scrollTop) {
    const newStartIndex = Math.floor(scrollTop / this.itemHeight);
    this.startIndex = Math.max(0, newStartIndex - 2); // buffer
    this.endIndex = Math.min(this.totalItems, this.startIndex + this.visibleItems);

    return {
      startIndex: this.startIndex,
      endIndex: this.endIndex,
      offset: this.startIndex * this.itemHeight
    };
  }
}

// Optimize image loading
export const optimizeImage = (src, options = {}) => {
  const defaultOptions = {
    quality: 0.8,
    maxWidth: 1920,
    format: 'webp'
  };

  const config = { ...defaultOptions, ...options };

  // Return optimized image URL or process image based on options
  return {
    src,
    ...config
  };
};

// Optimize API calls with caching
export class ApiCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

// Optimize state updates to batch them
export const batchStateUpdates = (setStateFunction, updates) => {
  // In React, this would use unstable_batchedUpdates
  // For now, we'll just apply all updates
  setStateFunction(prevState => ({
    ...prevState,
    ...updates
  }));
};

// Memory management utilities
export class MemoryManager {
  constructor() {
    this.largeObjects = new WeakMap();
    this.cleanupThreshold = 100; // MB
  }

  // Track large objects for potential cleanup
  trackObject(obj, sizeEstimate) {
    this.largeObjects.set(obj, {
      size: sizeEstimate,
      timestamp: Date.now()
    });
  }

  // Check if cleanup is needed
  needsCleanup() {
    // Simplified check - in a real implementation, you'd check actual memory usage
    return this.largeObjects.size > 10; // arbitrary threshold
  }

  // Cleanup old objects
  cleanup() {
    // For now, just clear the map - in reality, you'd have more sophisticated cleanup
    this.largeObjects = new WeakMap();
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }

  start(name) {
    this.metrics[name] = {
      startTime: performance.now(),
      startMemory: typeof performance.memory !== 'undefined' ? performance.memory.usedJSHeapSize : 0
    };
  }

  end(name) {
    if (this.metrics[name]) {
      const endMemory = typeof performance.memory !== 'undefined' ? performance.memory.usedJSHeapSize : 0;
      return {
        duration: performance.now() - this.metrics[name].startTime,
        memoryChange: endMemory - this.metrics[name].startMemory
      };
    }
    return null;
  }

  measureFunction(fn, name) {
    return (...args) => {
      this.start(name);
      const result = fn(...args);
      const metrics = this.end(name);
      return { result, metrics };
    };
  }
}

export default {
  lazyLoadComponent,
  memoizeComponent,
  debounce,
  throttle,
  VirtualScroller,
  optimizeImage,
  ApiCache,
  batchStateUpdates,
  MemoryManager,
  PerformanceMonitor
};