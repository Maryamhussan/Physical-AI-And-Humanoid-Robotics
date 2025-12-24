// Performance monitoring and logging for component interactions

// Performance monitoring utilities
export class PerformanceMonitor {
  constructor(options = {}) {
    this.metrics = new Map();
    this.enabled = options.enabled !== false;
    this.onMetric = options.onMetric || (() => {});
    this.maxMetrics = options.maxMetrics || 1000; // Limit stored metrics
  }

  // Start timing an operation
  start(name, metadata = {}) {
    if (!this.enabled) return;

    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    this.metrics.set(name, {
      startTime,
      startMemory,
      metadata,
      id: Date.now() + Math.random() // Unique ID for this measurement
    });
  }

  // End timing an operation and record metrics
  end(name, additionalData = {}) {
    if (!this.enabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric '${name}' not found`);
      return null;
    }

    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();

    const result = {
      name,
      duration: endTime - metric.startTime,
      memoryChange: endMemory - metric.startMemory,
      startTime: metric.startTime,
      endTime,
      metadata: metric.metadata,
      ...additionalData
    };

    // Clean up old metrics if we exceed the limit
    if (this.metrics.size > this.maxMetrics) {
      // Remove the oldest metric
      const firstKey = this.metrics.keys().next().value;
      this.metrics.delete(firstKey);
    }

    // Remove from active metrics
    this.metrics.delete(name);

    // Call the metric callback
    this.onMetric(result);

    return result;
  }

  // Measure a function's performance
  async measureFunction(fn, name, metadata = {}) {
    this.start(name, metadata);
    try {
      const result = await fn();
      return this.end(name, { result, error: null });
    } catch (error) {
      return this.end(name, { result: null, error: error.message });
    }
  }

  // Get current memory usage (where available)
  getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0; // Return 0 if memory info not available
  }

  // Get all recorded metrics
  getAllMetrics() {
    return Array.from(this.metrics.values());
  }

  // Clear all metrics
  clear() {
    this.metrics.clear();
  }
}

// Logging utilities
export class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.enabled = options.enabled !== false;
    this.onLog = options.onLog || (() => {});
    this.prefix = options.prefix || 'Chatbot';
    this.maxLogSize = options.maxLogSize || 1000;
    this.logs = [];
  }

  // Log levels
  levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  shouldLog(level) {
    return this.enabled && this.levels[level] >= this.levels[this.level];
  }

  log(level, message, data = {}) {
    if (!this.shouldLog(level)) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      prefix: this.prefix
    };

    this.logs.push(logEntry);

    // Limit log size
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }

    // Call the log callback
    this.onLog(logEntry);

    // Also output to console
    const consoleMethod = level === 'warn' ? 'warn' :
                         level === 'error' ? 'error' : 'log';
    console[consoleMethod](`[${this.prefix}] ${level.toUpperCase()}:`, message, data);
  }

  debug(message, data) {
    this.log('debug', message, data);
  }

  info(message, data) {
    this.log('info', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  // Get recent logs
  getLogs(limit) {
    const count = limit || this.logs.length;
    return this.logs.slice(-count);
  }

  // Clear logs
  clear() {
    this.logs = [];
  }
}

// Interaction tracking utilities
export class InteractionTracker {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.onInteraction = options.onInteraction || (() => {});
    this.interactions = [];
    this.maxInteractions = options.maxInteractions || 1000;
  }

  // Track a user interaction
  track(type, data = {}) {
    if (!this.enabled) return;

    const interaction = {
      type,
      timestamp: new Date().toISOString(),
      data,
      id: Date.now() + Math.random()
    };

    this.interactions.push(interaction);

    // Limit interaction history
    if (this.interactions.length > this.maxInteractions) {
      this.interactions = this.interactions.slice(-this.maxInteractions);
    }

    // Call the interaction callback
    this.onInteraction(interaction);

    return interaction;
  }

  // Track chat message sent
  trackMessageSent(content, sources = []) {
    return this.track('message_sent', { content, sources });
  }

  // Track message received
  trackMessageReceived(content, sources = []) {
    return this.track('message_received', { content, sources });
  }

  // Track API request
  trackApiRequest(endpoint, status, duration) {
    return this.track('api_request', { endpoint, status, duration });
  }

  // Track error
  trackError(error, context) {
    return this.track('error', { error, context });
  }

  // Get recent interactions
  getInteractions(limit) {
    const count = limit || this.interactions.length;
    return this.interactions.slice(-count);
  }

  // Clear interactions
  clear() {
    this.interactions = [];
  }
}

// Create singleton instances
export const performanceMonitor = new PerformanceMonitor();
export const logger = new Logger({ level: 'info' });
export const interactionTracker = new InteractionTracker();

export default {
  PerformanceMonitor,
  Logger,
  InteractionTracker,
  performanceMonitor,
  logger,
  interactionTracker
};