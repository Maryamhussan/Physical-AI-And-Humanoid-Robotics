import React, { useState, useEffect } from 'react';
import { useColorMode } from '@docusaurus/theme-common';
import Chatbot from './Chatbot';
import { addSelectionListener } from './text-selection-utils';
import { selectionHelper } from './text-selection-fallback';
import FloatingToolbar from './FloatingToolbar';
import { getFloatingToolbarPosition } from './text-selection-utils';
import './DocusaurusChatbot.css';

const DocusaurusChatbot = ({
  showFloatingToolbar = true,
  showInSidebar = false,
  initialExpanded = true,
  ...props
}) => {
  const { colorMode } = useColorMode();
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');

  // Handle text selection for floating toolbar
  useEffect(() => {
    if (!showFloatingToolbar) {
      return;
    }

    let removeListener = null;

    const handleSelection = (selectionInfo) => {
      if (selectionInfo && selectionInfo.text) {
        const position = getFloatingToolbarPosition(selectionInfo.rect);
        setToolbarPosition(position);
        setSelectedText(selectionInfo.text);
        setShowToolbar(true);
      } else {
        setShowToolbar(false);
      }
    };

    // Use the selection helper for cross-browser compatibility
    if (selectionHelper.isSupported) {
      removeListener = addSelectionListener(handleSelection);
    } else {
      // For unsupported browsers, don't show the toolbar
      setShowToolbar(false);
    }

    // Cleanup function
    return () => {
      if (removeListener) {
        removeListener();
      }
    };
  }, [showFloatingToolbar]);

  // Update CSS classes based on color mode
  const chatbotClassName = `docusaurus-chatbot-container theme-${colorMode}`;

  // Handle ask with selection
  const handleAskWithSelection = (text) => {
    if (text) {
      // This would trigger the chatbot to ask about the selected text
      // For now, we'll just hide the toolbar
      setShowToolbar(false);
      setSelectedText('');
    } else {
      // Selection was cleared
      setShowToolbar(false);
      setSelectedText('');
    }
  };

  return (
    <div className={chatbotClassName}>
      {showToolbar && (
        <FloatingToolbar
          isVisible={showToolbar}
          position={toolbarPosition}
          onAskWithSelection={handleAskWithSelection}
          onCopy={(text) => navigator.clipboard && navigator.clipboard.writeText(text)}
          onHighlight={() => {}}
        />
      )}

      <div className="docusaurus-chatbot-content">
        <Chatbot
          initialExpanded={initialExpanded}
          {...props}
        />
      </div>
    </div>
  );
};

// Export the main Chatbot component as well for direct usage
export { Chatbot };
export default DocusaurusChatbot;