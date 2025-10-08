import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard from './components/Dashboard';
import { UserData, UserSettings } from '../types/index';
import { ChromeStorageService } from '../core/storage/index';
import { sendSettingsUpdate } from '../core/utils/service-worker-communication';
import './styles/popup.css';

interface OptionsPageState {
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
}

const OptionsPage: React.FC = () => {
  const [state, setState] = React.useState<OptionsPageState>({
    userData: null,
    isLoading: true,
    error: null
  });

  React.useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await ChromeStorageService.getUserData();
      if (!userData) {
        // Initialize with default data if none exists
        await ChromeStorageService.initialize();
        const newUserData = await ChromeStorageService.getUserData();
        setState(prev => ({
          ...prev,
          userData: newUserData,
          isLoading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          userData,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load user data',
        isLoading: false
      }));
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!state.userData) return { success: false, error: 'No user data' };

    try {
      const updatedUserData: UserData = {
        ...state.userData,
        settings: {
          ...state.userData.settings,
          ...newSettings
        },
        lastUpdated: Date.now()
      };

      console.log('💾 Saving user data to storage...');
      await ChromeStorageService.saveUserData(updatedUserData);
      console.log('✅ User data saved successfully');
      
      setState(prev => ({
        ...prev,
        userData: updatedUserData
      }));

      // Notify background script of settings change
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        try {
          console.log('📤 Sending SETTINGS_UPDATED message to background script...');
          const response = await sendSettingsUpdate(updatedUserData.settings);
          
          console.log('✅ Settings update message sent successfully:', response);
          return response || { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('❌ Failed to send settings update message:', errorMessage);
          return { success: false, error: errorMessage };
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to update settings:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to update settings'
      }));
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  };

  const handleExportData = async () => {
    try {
      const exportedData = await ChromeStorageService.exportData();
      
      // Create and download file
      const blob = new Blob([exportedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eyezen-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show success message
      alert('Data exported successfully!');
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleEraseData = async () => {
    const confirmed = confirm(
      'Are you sure you want to erase all your data? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    try {
      await ChromeStorageService.clearAllData();
      
      // Reinitialize with default data
      await ChromeStorageService.initialize();
      const newUserData = await ChromeStorageService.getUserData();
      
      setState(prev => ({
        ...prev,
        userData: newUserData
      }));

      // Notify background script
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        try {
          await chrome.runtime.sendMessage({
            type: 'DATA_ERASED',
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('❌ Failed to notify background script of data erasure:', error);
        }
      }

      alert('All data has been erased successfully.');
    } catch (error) {
      console.error('Failed to erase data:', error);
      alert('Failed to erase data. Please try again.');
    }
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-600 text-sm">{state.error}</p>
            </div>
          </div>
          <button
            onClick={loadUserData}
            className="mt-4 w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!state.userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">No user data found</p>
          <button
            onClick={loadUserData}
            className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Initialize Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      userData={state.userData}
      onUpdateSettings={handleUpdateSettings}
      onExportData={handleExportData}
      onEraseData={handleEraseData}
    />
  );
};

// Initialize the React app with error handling
const container = document.getElementById('options-root');
if (container) {
  // Clear any existing content to prevent DOM conflicts
  container.innerHTML = '';
  
  try {
    const root = createRoot(container);
    root.render(<OptionsPage />);
  } catch (error) {
    console.error('Failed to initialize React root:', error);
    // Fallback error display
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: red;">
        <h2>Failed to load options page</h2>
        <p>Please try refreshing the page or reloading the extension.</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px;">
          Reload Page
        </button>
      </div>
    `;
  }
} else {
  console.error('Options root element not found');
}