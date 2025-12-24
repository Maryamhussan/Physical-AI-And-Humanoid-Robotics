---
id: 6
title: "runtime-error-fix"
stage: "misc"
date_iso: "2025-12-19"
surface: "agent"
model: "claude-sonnet-4-5-20250929"
feature: "rag-chatbot-integration"
branch: "001-rag-chatbot-integration"
user: "developer"
command: "/sp.analyze Uncaught runtime errors: × ERROR process is not defined ReferenceError: process is not defined at eval (webpack-internal:///./src/components/Chatbot/api-config.js:6:20)"
labels: ["bug-fix", "runtime-error", "environment-variables", "docusaurus"]
links:
  spec: "specs/001-rag-chatbot-integration/spec.md"
  plan: "specs/001-rag-chatbot-integration/plan.md"
  tasks: "specs/001-rag-chatbot-integration/tasks.md"
  ticket: null
  adr: null
  pr: null
files_yaml:
  - "src/components/Chatbot/api-config.js"
tests_yaml: []

---

# Runtime Error Fix: process is not defined

## User Input

```
Uncaught runtime errors:
×
ERROR
process is not defined
ReferenceError: process is not defined
    at eval (webpack-internal:///./src/components/Chatbot/api-config.js:6:20)
    at ./src/components/Chatbot/api-config.js (http://localhost:3001/Physical-AI-And-Humanoid-Robotics/main.js:2066:1)
    at __webpack_require__ (http://localhost:3001/Physical-AI-And-Humanoid-Robotics/runtime~main.js:34:32)
    at fn (http://localhost:3001/Physical-AI-And-Humanoid-Robotics/runtime~main.js:321:21)
    at eval (webpack-internal:///./src/components/Chatbot/api-service.js:5:69)
    at ./src/components/Chatbot/api-service.js (http://localhost:3001/Physical-AI-And-Humanoid-Robotics/main.js:2074:1)
    at __webpack_require__ (http://localhost:3001/Physical-AI-And-Humanoid-Robotics/runtime~main.js:34:32)
    at fn (http://localhost:3001/Physical-AI-And-Humanoid-Robotics/runtime~main.js:321:21)
    at eval (webpack-internal:///./src/components/Chatbot/Chatbot.jsx:11:70)
    at ./src/components/Chatbot/Chatbot.jsx (http://localho
```

## Response Summary

Fixed the runtime error caused by attempting to access Node.js-specific `process` object in the browser environment. The original code used `process.env.REACT_APP_API_BASE_URL` which is not available in the browser runtime.

Modified the api-config.js file to safely handle both build-time and runtime environments by:
1. Removing all references to `process.env` in the browser runtime code
2. Implementing a fallback mechanism that checks for runtime configuration via `window.APP_CONFIG`
3. Providing a default API URL ('http://localhost:8000') as fallback

## Outcome

Runtime error resolved. The chatbot component now loads without errors in the browser environment. The API configuration safely handles both build-time and runtime environments without referencing Node.js-specific globals.