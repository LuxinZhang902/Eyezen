/**
 * Popup Entry Point
 * Main entry point for the Chrome Extension popup
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './components/Popup';
import { BreakType } from '../types/index';
import './styles/popup.css';

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('popup-root');
  if (!container) {
    console.error('Popup root element not found');
    return;
  }

  const root = createRoot(container);

  const handleStartBreak = (breakType: BreakType) => {
    // Send message to background script to start break
    chrome.runtime.sendMessage({
      action: 'START_BREAK',
      breakType: breakType
    }, (response) => {
      if (response?.success) {
        // Close popup after starting break
        window.close();
      } else {
        console.error('Failed to start break:', response?.error);
      }
    });
  };

  const handleOpenSettings = () => {
    // Open options page (dashboard)
    chrome.runtime.openOptionsPage();
    window.close();
  };

  root.render(
    <React.StrictMode>
      <Popup 
        onStartBreak={handleStartBreak}
        onOpenSettings={handleOpenSettings}
      />
    </React.StrictMode>
  );
});

// Handle any runtime errors
window.addEventListener('error', (event) => {
  console.error('Popup error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Popup unhandled promise rejection:', event.reason);
});