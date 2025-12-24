import React from 'react';
import clsx from 'clsx';
import './ChatHistory.css';

const ChatHistory = ({
  messages = [],
  className = '',
  showSources = true,
  ...props
}) => {
  // Function to render a single message
  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';

    return (
      <div
        key={message.id || `msg-${index}`}
        className={clsx(
          'chat-message',
          {
            'chat-message-user': isUser,
            'chat-message-assistant': isAssistant,
          }
        )}
      >
        <div className="chat-message-content">
          <div className="chat-message-text">
            {message.content}
          </div>

          {isAssistant && showSources && message.sources && message.sources.length > 0 && (
            <div className="chat-message-sources">
              <div className="chat-message-sources-label">Sources:</div>
              <ul className="chat-message-sources-list">
                {message.sources.map((source, idx) => (
                  <li key={idx} className="chat-message-source-item">
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chat-message-source-link"
                    >
                      {source.length > 60 ? `${source.substring(0, 60)}...` : source}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={clsx('chat-history-container', className)}
      {...props}
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.length === 0 ? (
        <div className="chat-history-empty" role="status" aria-live="polite">
          <p>Start a conversation by asking a question about the book.</p>
        </div>
      ) : (
        <div className="chat-history-messages" aria-label="Message history">
          {messages.map((message, index) => renderMessage(message, index))}
        </div>
      )}
    </div>
  );
};

export default ChatHistory;