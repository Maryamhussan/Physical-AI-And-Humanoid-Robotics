import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import './ChatInput.css';

const ChatInput = ({
  onSendMessage,
  placeholder = "Ask a question about the book...",
  disabled = false,
  className = '',
  ...props
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  // Handle input change
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Handle sending the message
  const handleSend = () => {
    if (inputValue.trim() && onSendMessage && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  // Handle key down events
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Focus the textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Determine CSS classes
  const containerClasses = clsx(
    'chat-input-container',
    {
      'chat-input-focused': isFocused,
      'chat-input-disabled': disabled,
    },
    className
  );

  return (
    <div className={containerClasses} {...props}>
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-input-textarea"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          aria-label={placeholder}
          role="textbox"
          aria-multiline="true"
          aria-disabled={disabled}
          aria-required="true"
        />
        <button
          className={clsx(
            'chat-input-send-button',
            {
              'chat-input-send-button-disabled': disabled || !inputValue.trim(),
            }
          )}
          onClick={handleSend}
          disabled={disabled || !inputValue.trim()}
          aria-label="Send message"
          aria-disabled={disabled || !inputValue.trim()}
        >
          <svg
            className="chat-input-send-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            focusable="false"
            aria-hidden="true"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatInput;