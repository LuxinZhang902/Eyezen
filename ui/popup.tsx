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

  // Clear any existing content to prevent DOM conflicts
  container.innerHTML = '';

  try {
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
      <Popup 
        onStartBreak={handleStartBreak}
        onOpenSettings={handleOpenSettings}
      />
    );
  } catch (error) {
    console.error('Failed to initialize popup React root:', error);
    // Fallback error display
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: red;">
        <h3>Failed to load popup</h3>
        <p>Please try reloading the extension.</p>
      </div>
    `;
  }
});

// Handle any runtime errors
window.addEventListener('error', (event) => {
  console.error('Popup error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Popup unhandled promise rejection:', event.reason);
});