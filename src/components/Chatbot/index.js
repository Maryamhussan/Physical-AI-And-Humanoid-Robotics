// Main entry point for Chatbot components with optimized exports

// Export the main Docusaurus-integrated component as default
export { default } from './DocusaurusChatbot';

// Named exports for individual components
export { default as Chatbot } from './Chatbot';
export { default as ChatbotBase } from './ChatbotBase';
export { default as ChatInput } from './ChatInput';
export { default as ChatHistory } from './ChatHistory';
export { default as FloatingToolbar } from './FloatingToolbar';
export { default as DocusaurusChatbot } from './DocusaurusChatbot';

// Utility exports
export * from './api-service';
export * from './validation-utils';
export * from './state-utils';
export * from './text-selection-utils';
export * from './text-selection-fallback';
export * from './error-handling';
export * from './monitoring';
export * from './performance-optimization';

// Configuration
export { default as API_CONFIG } from './api-config';