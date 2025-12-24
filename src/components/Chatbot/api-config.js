// API endpoint configuration for RAG chatbot integration
// For Docusaurus, we'll use a default API URL and allow for runtime configuration
const DEFAULT_API_BASE_URL = 'http://localhost:8001';

// Allow runtime configuration through global variable
const getAPIBaseUrl = () => {
  // Check if we have a runtime configuration
  if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) {
    return window.APP_CONFIG.API_BASE_URL;
  }

  // In Docusaurus, environment variables are typically available during build time
  // but for this case, we'll use a constant default that can be overridden
  return DEFAULT_API_BASE_URL;
};

const API_BASE_URL = getAPIBaseUrl();

const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    CHAT: `${API_BASE_URL}/chat`,
    HEALTH: `${API_BASE_URL}/health`,
    RETRIEVE: `${API_BASE_URL}/retrieve`,
  },
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  TIMEOUT: 30000, // 30 seconds
};

export default API_CONFIG;