# RAG Chatbot Component for Docusaurus

This package provides a RAG (Retrieval-Augmented Generation) chatbot component designed for integration with Docusaurus documentation sites. The component allows users to ask questions about the book content and receive responses from an AI agent that has access to the site's content.

## Features

- **Natural Language Queries**: Users can ask questions about the book content in plain English
- **Context-Aware Responses**: The AI agent provides answers based on the book's content
- **Text Selection Integration**: Users can select text and ask questions about it specifically
- **Source Attribution**: Responses include links to the source documents
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support
- **Error Handling**: Graceful degradation when backend is unavailable
- **Performance Optimized**: Efficient loading and caching mechanisms

## Installation

The component is designed to work with Docusaurus v3+. No additional installation is required if you're using the component from this repository.

## Usage

### Basic Usage

```jsx
import DocusaurusChatbot from './src/components/Chatbot';

function MyPage() {
  return (
    <div>
      <h1>My Book Page</h1>
      <p>Some content here...</p>

      {/* Add the chatbot */}
      <DocusaurusChatbot />
    </div>
  );
}
```

### Advanced Configuration

```jsx
import DocusaurusChatbot from './src/components/Chatbot';

function MyPage() {
  return (
    <div>
      <DocusaurusChatbot
        initialExpanded={true}           // Start expanded (default: true)
        showFloatingToolbar={true}       // Show floating toolbar on text selection (default: true)
        title="Book Assistant"          // Custom title for the chatbot (default: "Book Assistant")
      />
    </div>
  );
}
```

## Integration with Docusaurus

### Adding to Layout

To add the chatbot to all pages, you can modify your Docusaurus layout. In `src/theme/Layout/index.js`:

```jsx
import DocusaurusChatbot from '@site/src/components/Chatbot';
import OriginalLayout from '@theme-original/Layout';

export default function Layout(props) {
  return (
    <>
      <OriginalLayout {...props}>
        {props.children}
        <DocusaurusChatbot
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            width: '400px',
            maxHeight: '600px'
          }}
        />
      </OriginalLayout>
    </>
  );
}
```

### Adding to Specific Pages

To add the chatbot to specific pages only, simply import and include the component in your MDX files:

```mdx
import DocusaurusChatbot from '@site/src/components/Chatbot';

# My Documentation Page

Here's some content...

<DocusaurusChatbot />

More content...
```

## Configuration

### Environment Variables

Set these in your `.env` file:

```
REACT_APP_API_BASE_URL=http://localhost:8000  # Backend API URL
```

If not set, defaults to `http://localhost:8000`.

### API Endpoints

The component communicates with the following backend endpoints:

- `POST /chat` - Process user queries
- `GET /health` - Health check
- `POST /retrieve` - Content retrieval (for testing)

## Components

### DocusaurusChatbot (Main Component)

The main component that integrates with Docusaurus. Includes:

- Chat interface with message history
- Text input with send button
- Floating toolbar for text selection
- Error handling and loading states
- Responsive design

### Chatbot

The core chatbot component without Docusaurus-specific features.

### FloatingToolbar

A toolbar that appears when text is selected, allowing users to ask questions about the selected text.

## API Service

The `apiService` module handles communication with the backend:

```js
import { apiService } from './src/components/Chatbot';

// Send a chat message
const response = await apiService.chat('Your question', 'Selected text context', 'session-id');

// Check health
const health = await apiService.health();

// Retrieve content (for testing)
const results = await apiService.retrieve('Query', topK = 5, threshold = 0.3);
```

## Error Handling

The component implements robust error handling:

- **Network Errors**: Graceful degradation with user-friendly messages
- **Timeouts**: Configurable timeout with retry mechanism
- **Backend Unavailability**: Fallback responses
- **Validation Errors**: Input sanitization and validation
- **Rate Limiting**: Respects backend rate limits

## Performance

- **Caching**: API responses are cached to reduce redundant requests
- **Lazy Loading**: Heavy components are loaded on demand
- **Bundle Size**: Optimized for minimal impact on page load
- **Memory Management**: Efficient memory usage with cleanup

## Accessibility

- Full keyboard navigation support
- Screen reader compatibility
- ARIA labels and roles
- Focus management
- Reduced motion support

## Testing

The component includes comprehensive tests:

- Unit tests for individual components
- Integration tests for API communication
- End-to-end tests for user workflows
- Accessibility tests

Run tests with:
```bash
npm test
```

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify backend service is running
   - Check CORS configuration
   - Confirm API URL in environment variables

2. **Text Selection Not Working**
   - Ensure JavaScript is enabled
   - Check for conflicting selection handlers
   - Verify browser compatibility

3. **Performance Issues**
   - Monitor network requests
   - Check for memory leaks
   - Verify caching is working

### Debugging

Enable debug logging:

```js
import { logger } from './src/components/Chatbot';

logger.level = 'debug';
```

## Development

### Running Locally

1. Ensure the backend API is running (typically on port 8000)
2. Start your Docusaurus site
3. The chatbot will connect to the backend automatically

### Testing

Run all tests:
```bash
npm run test
```

Run specific test:
```bash
npm run test -- src/components/Chatbot/Chatbot.test.js
```

## API Contract

### Chat Endpoint Request
```json
{
  "query": "string (required) - The user's question or query",
  "selected_text": "string | null (optional) - Text selected by user on the current page",
  "session_id": "string | null (optional) - Session identifier for conversation continuity"
}
```

### Chat Endpoint Response
```json
{
  "response": "string - The agent's response to the query",
  "sources": ["string"] - "Array of URLs or identifiers of content used to generate response",
  "session_id": "string - Session identifier (new or existing)",
  "request_id": "string - Unique identifier for this request"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This component is part of the Physical AI & Humanoid Robotics book project.