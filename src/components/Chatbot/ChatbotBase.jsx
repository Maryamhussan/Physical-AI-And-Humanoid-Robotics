import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import './ChatbotBase.css';

// Base UI component structure with Docusaurus theme compatibility
const ChatbotBase = ({
  className = '',
  initialExpanded = false,
  title = 'Book Assistant',
  children,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [isLoading, setIsLoading] = useState(false);

  // Function to toggle expanded/collapsed state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Function to show loading state
  const showLoading = () => {
    setIsLoading(true);
  };

  // Function to hide loading state
  const hideLoading = () => {
    setIsLoading(false);
  };

  // Determine CSS classes based on state
  const containerClasses = clsx(
    'chatbot-container',
    {
      'chatbot-expanded': isExpanded,
      'chatbot-collapsed': !isExpanded,
      'chatbot-loading': isLoading,
    },
    className
  );

  return (
    <div
      className={containerClasses}
      {...props}
      role="complementary"
      aria-label={title}
    >
      <div
        className="chatbot-header"
        onClick={toggleExpanded}
        role="button"
        tabIndex="0"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded();
          }
        }}
      >
        <h3 className="chatbot-title">
          {title}
        </h3>
        <button
          className="chatbot-toggle-button"
          aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
          aria-expanded={isExpanded}
          onClick={(e) => {
            e.stopPropagation();
            toggleExpanded();
          }}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div
          className="chatbot-content"
          role="region"
          tabIndex="-1"
        >
          {isLoading && (
            <div className="chatbot-loading-indicator" role="status" aria-live="polite">
              <div className="loading-spinner" aria-hidden="true"></div>
              <span>Processing...</span>
            </div>
          )}
          <div className="chatbot-body">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

// Export utility functions for loading state management
ChatbotBase.showLoading = (setIsLoading) => setIsLoading(true);
ChatbotBase.hideLoading = (setIsLoading) => setIsLoading(false);
ChatbotBase.toggleExpanded = (setIsExpanded) => setIsExpanded(prev => !prev);

export default ChatbotBase;