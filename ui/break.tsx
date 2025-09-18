import React from 'react';
import { createRoot } from 'react-dom/client';
import BreakRitual from './components/BreakRitual';
import { BreakType, BreakActivity } from '../types/index';
import { ChromeStorageService } from '../core/storage/index';
import './styles/popup.css';

interface BreakPageState {
  breakType: BreakType;
  isLoading: boolean;
  error: string | null;
}

const BreakPage: React.FC = () => {
  const [state, setState] = React.useState<BreakPageState>({
    breakType: BreakType.SHORT,
    isLoading: true,
    error: null
  });

  React.useEffect(() => {
    initializeBreakPage();
  }, []);

  const initializeBreakPage = async () => {
    try {
      // Get break type from URL parameters or storage
      const urlParams = new URLSearchParams(window.location.search);
      const breakTypeParam = urlParams.get('type') as BreakType;
      
      const breakType = breakTypeParam || BreakType.SHORT;
      
      setState(prev => ({
        ...prev,
        breakType,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to initialize break page:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load break session',
        isLoading: false
      }));
    }
  };

  const handleBreakComplete = async (activities: BreakActivity[]) => {
    try {
      // Save break session to storage
      const breakSession = {
        id: Date.now().toString(),
        type: state.breakType,
        duration: activities.reduce((total, activity) => total + activity.duration, 0),
        startTime: Date.now() - activities.reduce((total, activity) => total + activity.duration, 0) * 1000,
        endTime: Date.now(),
        completed: true,
        activities
      };

      await ChromeStorageService.addBreakSession(breakSession);

      // Send message to background script
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'BREAK_COMPLETED',
          data: { breakSession },
          timestamp: Date.now()
        });
      }

      // Close the break window
      window.close();
    } catch (error) {
      console.error('Failed to save break session:', error);
      // Still close the window even if saving fails
      window.close();
    }
  };

  const handleBreakSkip = async () => {
    try {
      // Log skipped break
      const breakSession = {
        id: Date.now().toString(),
        type: state.breakType,
        duration: 0,
        startTime: Date.now(),
        endTime: Date.now(),
        completed: false,
        activities: []
      };

      await ChromeStorageService.addBreakSession(breakSession);

      // Send message to background script
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'BREAK_SKIPPED',
          data: { breakSession },
          timestamp: Date.now()
        });
      }

      // Close the break window
      window.close();
    } catch (error) {
      console.error('Failed to log skipped break:', error);
      // Still close the window even if logging fails
      window.close();
    }
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            onClick={() => window.close()}
            className="mt-4 w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <BreakRitual
      breakType={state.breakType}
      onComplete={handleBreakComplete}
      onSkip={handleBreakSkip}
    />
  );
};

// Initialize the React app
const container = document.getElementById('break-root');
if (container) {
  const root = createRoot(container);
  root.render(<BreakPage />);
} else {
  console.error('Break root element not found');
}