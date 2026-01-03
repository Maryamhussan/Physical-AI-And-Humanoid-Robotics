// API endpoint configuration for RAG chatbot integration
// For Docusaurus, we'll use a default API URL and allow for runtime configuration
const DEFAULT_API_BASE_URL =
  "https://maryamghayas-humanoid-book-backend.hf.space/"; // Deployed backend URL
  // const DEFAULT_API_BASE_URL =
  //   "http://localhost:8000/"; // Default to localhost for local development

// Allow runtime configuration through global variable
const getAPIBaseUrl = () => {
  // Check if we have a runtime configuration
  if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) {
    return window.APP_CONFIG.API_BASE_URL;
  }

  // Check for environment-specific variable
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  // For GitHub Pages deployment, we still want to use the deployed backend
  // CORS should be configured on the backend to allow requests from GitHub Pages
  // In Docusaurus, environment variables are typically available during build time
  // but for this case, we'll use a constant default that can be overridden
  return DEFAULT_API_BASE_URL;
};

const API_BASE_URL = getAPIBaseUrl();

// Build endpoint URLs conditionally
const buildEndpointUrl = (endpoint) => {
  if (!API_BASE_URL) {
    // If no base URL is set, use relative paths (for proxy scenarios)
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }

  // Remove trailing slash from base URL and leading slash from endpoint to avoid double slashes
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  return `${baseUrl}/${cleanEndpoint}`;
};

const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    CHAT: buildEndpointUrl('/chat'),
    HEALTH: buildEndpointUrl('/health'),
    RETRIEVE: buildEndpointUrl('/retrieve'),
  },
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  TIMEOUT: 30000, // 30 seconds
};

export default API_CONFIG;