/**
 * Popup Component
 * Main popup interface for the EyeZen Chrome Extension
 */

import React, { useState, useEffect } from 'react';
import { UserStatus, EyeScore, BreakType, PostureStatus, EyeMetrics } from '../../types/index';
import { ChromeStorageService } from '../../core/storage/index';
import { ChromeAIService } from '../../core/api/openai-service';
import { AICoachService } from '../../core/coach/index';
import { EyeHealthScorer } from '../../core/metrics/index';
import CameraPermissionPopup from './CameraPermissionPopup';
import LoginModal from './LoginModal';

interface PopupProps {
  onStartBreak: (breakType: BreakType) => void;
  onOpenSettings: () => void;
}

interface PopupState {
  status: UserStatus;
  eyeScore: EyeScore;
  isLoading: boolean;
  cameraEnabled: boolean;
  lastBreakTime: number | null;
  streakDays: number;
  showCameraPermissionPopup: boolean;
  isFeatureRestricted: boolean;
  aiRecommendation: string;
  recommendedBreakType: BreakType;
  aiLoading: boolean;
  showLoginModal: boolean;
  isLoggedIn: boolean;
  userEmail: string;
}

const Popup: React.FC<PopupProps> = ({ onStartBreak, onOpenSettings }: PopupProps) => {
  const [state, setState] = useState<PopupState>({
    status: UserStatus.GOOD,
    eyeScore: {
      current: 50,
      daily: 50,
      weekly: 50,
      trend: 'stable'
    },
    isLoading: true,
    cameraEnabled: true,
    lastBreakTime: null,
    streakDays: 0,
    showCameraPermissionPopup: false,
    isFeatureRestricted: false,
    aiRecommendation: 'Analyzing your eye health patterns...',
    recommendedBreakType: BreakType.MICRO,
    aiLoading: true,
    showLoginModal: false,
    isLoggedIn: false,
    userEmail: ''
  });

  useEffect(() => {
    loadUserData();
    loadLoginState();
    
    // Set up periodic updates
    const interval = setInterval(loadUserData, 30000); // Update every 30 seconds
    
    // Set up periodic permission check to detect manual permission changes
    const permissionCheckInterval = setInterval(checkCameraPermissionStatus, 5000); // Check every 5 seconds
    
    // Set up periodic camera state validation
    const stateValidationInterval = setInterval(() => {
      validateCameraState();
    }, 3000); // Check every 3 seconds
    
    // Set up message listener for eye metrics from CV worker
    const messageListener = (message: any, sender: any, sendResponse: any) => {
      if (message.type === 'EYE_METRICS') {
        handleEyeMetrics(message.data);
      }
    };
    
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(messageListener);
    }
    
    return () => {
      clearInterval(interval);
      clearInterval(permissionCheckInterval);
      clearInterval(stateValidationInterval);
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.removeListener(messageListener);
      }
    };
  }, []);

  const loadLoginState = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['eyezen_login_state']);
        const loginState = result.eyezen_login_state;
        
        if (loginState && loginState.isLoggedIn) {
          setState(prev => ({
            ...prev,
            isLoggedIn: true,
            userEmail: loginState.userEmail
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load login state:', error);
    }
  };

  const loadUserData = async () => {
    try {
      let userData = await ChromeStorageService.getUserData();
      
      // Initialize storage if no user data exists
      if (!userData) {
        await ChromeStorageService.initialize();
        userData = await ChromeStorageService.getUserData();
      }
      
      if (userData) {
        // Calculate current eye health score
        const recentMetrics = userData.metrics.slice(-10);
        const healthScore = EyeHealthScorer.calculateScore(recentMetrics);
        
        // Determine user status based on score and recent metrics
        const currentStatus = determineUserStatus(healthScore.overall, recentMetrics);
        
        // Calculate streak days
        const streakDays = calculateStreakDays(userData.breaks);
        
        // Get last break time
        const lastBreak = userData.breaks
          .filter(b => b.completed)
          .sort((a, b) => b.endTime! - a.endTime!)[0];
        
        // Generate AI recommendation
        const aiCoach = new AICoachService();
        const avgFatigue = recentMetrics.reduce((sum, m) => sum + (m.fatigueIndex || 0), 0) / recentMetrics.length;
        
        let recommendedType = BreakType.MICRO;
        let recommendation = 'Take a quick 20-second eye break using the 20-20-20 rule.';
        
        if (avgFatigue > 0.7) {
          recommendedType = BreakType.LONG;
          recommendation = 'High eye strain detected! Take a 15-minute wellness break with TCM massage.';
        } else if (avgFatigue > 0.4) {
          recommendedType = BreakType.SHORT;
          recommendation = 'Moderate eye fatigue. A 5-minute guided relaxation break is recommended.';
        }

        // Initialize camera stream flag - do NOT automatically start camera
        // Camera should only be activated when user explicitly clicks the toggle
        (window as any).eyeZenCameraStream = null;
        
        setState(prev => ({
          ...prev,
          status: currentStatus,
          eyeScore: {
            current: healthScore.overall,
            daily: healthScore.overall,
            weekly: healthScore.overall,
            trend: healthScore.trend
          },
          isLoading: false,
          cameraEnabled: userData.settings.cameraEnabled,
          lastBreakTime: lastBreak?.endTime || null,
          streakDays,
          showCameraPermissionPopup: false, // Only show when explicitly triggered
          isFeatureRestricted: userData.settings.metricsOnly,
          aiRecommendation: recommendation,
          recommendedBreakType: recommendedType,
          aiLoading: false,
          showLoginModal: false
          // Preserve existing login state (isLoggedIn, userEmail)
        }));
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      setState((prev: PopupState) => ({ ...prev, isLoading: false }));
    }
  };

  // Handle eye metrics from CV worker
  const handleEyeMetrics = async (eyeMetrics: any) => {
    try {
      console.log('Received eye metrics:', eyeMetrics);
      
      // Create properly structured EyeMetrics object
      const metricsData = {
        timestamp: Date.now(),
        blinkRate: eyeMetrics.blinkRate || 0,
        fatigueIndex: eyeMetrics.fatigueIndex || 0,
        posture: eyeMetrics.posture || 'unknown',
        earValue: eyeMetrics.earLeft || eyeMetrics.earRight || 0,
        perclosValue: eyeMetrics.perclos || 0
      };
      
      // Save metrics to storage
      await ChromeStorageService.addMetrics(metricsData);
      
      // Update UI state with new metrics
      const newScore = Math.max(0, Math.min(100, 100 - (eyeMetrics.fatigueIndex * 100)));
      const newStatus = determineUserStatus(newScore, [eyeMetrics]);
      
      setState(prev => ({
        ...prev,
        status: newStatus,
        eyeScore: {
          ...prev.eyeScore,
          current: Math.round(newScore)
        }
      }));
      
      // Generate AI recommendation based on current metrics
      if (eyeMetrics.fatigueIndex > 0.7) {
        setState(prev => ({
          ...prev,
          aiRecommendation: 'High eye strain detected! Take a 15-minute wellness break immediately.',
          recommendedBreakType: BreakType.LONG
        }));
      } else if (eyeMetrics.fatigueIndex > 0.4) {
        setState(prev => ({
          ...prev,
          aiRecommendation: 'Moderate eye fatigue detected. Consider a 5-minute guided break.',
          recommendedBreakType: BreakType.SHORT
        }));
      } else if (eyeMetrics.blinkRate < 10) {
        setState(prev => ({
          ...prev,
          aiRecommendation: 'Low blink rate detected. Remember to blink more frequently!',
          recommendedBreakType: BreakType.MICRO
        }));
      }
      
    } catch (error) {
      console.error('Error handling eye metrics:', error);
    }
  };

  const determineUserStatus = (score: number, metrics: any[]): UserStatus => {
    if (score >= 80) return UserStatus.GOOD;
    if (score >= 60) return UserStatus.TIRED;
    return UserStatus.CRITICAL;
  };

  const calculateStreakDays = (breaks: any[]): number => {
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayBreaks = breaks.filter(b => {
        const breakDate = new Date(b.startTime);
        return breakDate >= checkDate && breakDate <= dayEnd && b.completed;
      });
      
      if (dayBreaks.length >= 3) { // At least 3 breaks per day
        streak++;
      } else if (i === 0) {
        // If today doesn't have enough breaks, no streak
        break;
      } else {
        // Streak broken
        break;
      }
    }
    
    return streak;
  };

  const getStatusColor = (status: UserStatus): string => {
    switch (status) {
      case UserStatus.GOOD:
        return 'text-green-600';
      case UserStatus.TIRED:
        return 'text-yellow-600';
      case UserStatus.CRITICAL:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: UserStatus): string => {
    switch (status) {
      case UserStatus.GOOD:
        return '😊';
      case UserStatus.TIRED:
        return '😴';
      case UserStatus.CRITICAL:
        return '😵';
      default:
        return '😐';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      default:
        return '➡️';
    }
  };

  const formatLastBreakTime = (timestamp: number | null): string => {
    if (!timestamp) return 'No recent breaks';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    }
    return `${minutes}m ago`;
  };

  const handleBreakClick = (breakType: BreakType) => {
    onStartBreak(breakType);
  };

  const toggleCamera = async () => {
    try {
      // Use state.cameraEnabled instead of window flag for more reliable state
      if (state.cameraEnabled) {
        await stopCameraStream();
      } else {
        // Direct camera access - try to request permission immediately
        await requestCameraDirectly();
      }
    } catch (error) {
      console.error('Failed to toggle camera:', error);
    }
  };
  
  const stopCameraStream = async () => {
    try {
      // Stop camera through offscreen document
      chrome.runtime.sendMessage(
        { type: 'STOP_CAMERA' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Error stopping camera:', chrome.runtime.lastError.message);
            return;
          }
          if (response?.success) {
            console.log('Camera stopped successfully');
          }
        }
      );
      
      // Clear camera stream flag
      (window as any).eyeZenCameraStream = null;
      
      await ChromeStorageService.updateSettings({
        cameraEnabled: false
      });
      
      setState(prev => ({
        ...prev,
        cameraEnabled: false,
        showCameraPermissionPopup: false
      }));
      
      console.log('Camera deactivated');
    } catch (error) {
      console.error('Failed to stop camera:', error);
    }
  };
  
  const checkCameraPermissionStatus = async () => {
    try {
      // Check if camera permission is still granted
      const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const currentStream = (window as any).eyeZenCameraStream;
      
      if (permissionStatus.state === 'denied' && currentStream) {
        // Permission was revoked but extension still thinks camera is active
        console.log('Camera permission revoked, updating extension state');
        
        // Clear camera stream flag
        (window as any).eyeZenCameraStream = null;
        
        // Update settings and state
        await ChromeStorageService.updateSettings({
          cameraEnabled: false
        });
        
        setState(prev => ({
          ...prev,
          cameraEnabled: false,
          showCameraPermissionPopup: false
        }));
        
        // Stop any active camera stream in offscreen document
        chrome.runtime.sendMessage(
          { type: 'STOP_CAMERA' },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error('❌ Error stopping camera due to permission revocation:', chrome.runtime.lastError.message);
              return;
            }
            if (response?.success) {
              console.log('Camera stopped due to permission revocation');
            }
          }
        );
      }
       // Note: We do NOT automatically initialize camera when permission is granted
     // Camera should only be activated when user explicitly clicks the toggle button
   } catch (error) {
     console.log('Could not check camera permission status:', error);
   }
 };

  const validateCameraState = async () => {
    try {
      // Query offscreen document for actual camera state
      chrome.runtime.sendMessage(
        { type: 'GET_CAMERA_STATE' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Error validating camera state:', chrome.runtime.lastError.message);
            return;
          }
          if (response && response.isActive !== undefined) {
            const offscreenCameraState = response.isActive;
            const currentReactState = state.cameraEnabled;
            
            // If states are mismatched, sync them
            if (currentReactState !== offscreenCameraState) {
              // Update popup state to match offscreen reality
              (window as any).eyeZenCameraStream = offscreenCameraState ? true : null;
              
              setState(prev => ({
                ...prev,
                cameraEnabled: offscreenCameraState
              }));
              
              // Update storage settings
              ChromeStorageService.updateSettings({
                cameraEnabled: offscreenCameraState
              });
            }
          }
        }
      );
    } catch (error) {
      console.log('Could not validate camera state:', error);
    }
  };

  const initializeCameraStream = async () => {
    try {
      // Create offscreen document if it doesn't exist
      const existingContexts = await chrome.runtime.getContexts({});
      const offscreenDocument = existingContexts.find(
        (context) => context.contextType === 'OFFSCREEN_DOCUMENT'
      );
      
      if (!offscreenDocument) {
        await chrome.offscreen.createDocument({
          url: 'offscreen.html',
          reasons: [chrome.offscreen.Reason.USER_MEDIA],
          justification: 'Camera access for eye health monitoring'
        });
      }
      
      // Request camera access through offscreen document
      const response = await new Promise<{success: boolean; error?: string}>((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'REQUEST_CAMERA' },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (!response) {
              reject(new Error('No response received from offscreen document'));
              return;
            }
            resolve(response);
          }
        );
      });
      
      if (response.success) {
        // Set camera stream flag
        (window as any).eyeZenCameraStream = true;
        console.log('Camera stream initialized successfully');
      } else {
        (window as any).eyeZenCameraStream = null;
        console.log('Failed to initialize camera stream:', response.error);
      }
    } catch (error) {
      console.error('Failed to initialize camera stream:', error);
      (window as any).eyeZenCameraStream = null;
    }
  };
  
  const requestCameraDirectly = async () => {
    try {
      // Show user instruction with better explanation of Chrome extension limitations
      const userConfirmed = confirm(
        '📹 Camera Permission Setup\n\n' +
        'Chrome extensions require camera permissions to be set to "Allow" for reliable access.\n\n' +
        'After clicking OK:\n' +
        '• A permission dialog may appear briefly\n' +
        '• If it closes quickly, manually set permissions:\n' +
        '  1. Click the camera icon in Chrome\'s address bar\n' +
        '  2. Select "Always allow"\n' +
        '  3. Refresh this extension\n\n' +
        'Continue? (Cancel for timer-only mode)'
      );
      
      if (!userConfirmed) {
        // User cancelled - set to metrics-only mode
        await ChromeStorageService.updateSettings({
          cameraEnabled: false,
          metricsOnly: true
        });
        
        setState(prev => ({
          ...prev,
          cameraEnabled: false,
          isFeatureRestricted: true
        }));
        return;
      }
      
      // Create offscreen document if it doesn't exist
      const existingContexts = await chrome.runtime.getContexts({});
      const offscreenDocument = existingContexts.find(
        (context) => context.contextType === 'OFFSCREEN_DOCUMENT'
      );
      
      if (!offscreenDocument) {
        await chrome.offscreen.createDocument({
          url: 'offscreen.html',
          reasons: [chrome.offscreen.Reason.USER_MEDIA],
          justification: 'Camera access for eye health monitoring'
        });
      }
      
      // Request camera access through offscreen document
      const response = await new Promise<{success: boolean; error?: string}>((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'REQUEST_CAMERA' },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (!response) {
              reject(new Error('No response received from offscreen document'));
              return;
            }
            resolve(response);
          }
        );
      });
      
      if (response.success) {
        // Update settings to allow camera access
        await ChromeStorageService.updateSettings({
          cameraEnabled: true,
          metricsOnly: false
        });
        
        // Set camera stream flag
        (window as any).eyeZenCameraStream = true;
        
        setState(prev => ({
          ...prev,
          cameraEnabled: true,
          showCameraPermissionPopup: false,
          isFeatureRestricted: false
        }));
        
        console.log('Camera activated successfully');
        // Show brief success notification
        alert('🎉 Success! Camera is now active and AI eye health monitoring is running.');
      } else {
        // Handle camera permission denial gracefully
        console.warn('Camera access denied:', response.error);
        
        // Update settings to metrics-only mode
        await ChromeStorageService.updateSettings({
          cameraEnabled: false,
          metricsOnly: true
        });
        
        // Clear camera stream flag
        (window as any).eyeZenCameraStream = null;
        
        setState(prev => ({
          ...prev,
          cameraEnabled: false,
          showCameraPermissionPopup: false,
          isFeatureRestricted: true
        }));
        
        // Show detailed instructions for enabling camera access
        const message = `${response.error || 'Camera access was denied.'}

🔧 **Why "Ask" doesn't work:**
Chrome extension popups close when permission dialogs appear, preventing you from clicking "Allow".

**Solution - Set to "Always Allow":**

**Method 1 - Chrome Address Bar:**
1. Look for the camera icon (🎥) in Chrome's address bar
2. Click it and select "Always allow"
3. Refresh this extension

**Method 2 - Chrome Settings:**
1. Chrome Settings → Privacy and Security → Site Settings
2. Click "Camera" → find this extension
3. Change from "Ask" to "Allow"
4. Refresh this extension

✅ You can still use basic timer reminders without camera access.`;
        alert(message);
      }
    } catch (error) {
      console.error('Failed to request camera access:', error);
      alert('Failed to request camera access. Please try again.');
    }
  };

  const handleCameraPermissionApprove = async () => {
    try {
      await ChromeStorageService.updateSettings({
        cameraEnabled: true,
        metricsOnly: false
      });
      
      // Set a flag to indicate camera stream should be active
      // The actual stream is managed by the offscreen document
      (window as any).eyeZenCameraStream = true;
      
      setState(prev => ({
        ...prev,
        cameraEnabled: true,
        showCameraPermissionPopup: false,
        isFeatureRestricted: false
      }));
    } catch (error) {
      console.error('Failed to approve camera access:', error);
    }
  };

  const handleCameraPermissionReject = async () => {
    try {
      await ChromeStorageService.updateSettings({
        cameraEnabled: false,
        metricsOnly: true
      });
      
      // Clear camera stream flag
      (window as any).eyeZenCameraStream = null;
      
      setState(prev => ({
        ...prev,
        cameraEnabled: false,
        showCameraPermissionPopup: false,
        isFeatureRestricted: true
      }));
    } catch (error) {
      console.error('Failed to reject camera access:', error);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    console.log('Login attempt:', { email });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get registered users from storage
      const result = await chrome.storage.local.get(['eyezen_users']);
      const users = result.eyezen_users || {};
      
      // Check if user exists
      if (!users[email]) {
        throw new Error('No account found with this email address. Please sign up first.');
      }
      
      // Verify password
      if (users[email].password !== password) {
        throw new Error('Incorrect password. Please try again.');
      }
      
      // Successful login
      setState(prev => ({
        ...prev,
        isLoggedIn: true,
        userEmail: email,
        showLoginModal: false
      }));
      
      // Store login state in Chrome storage
      await chrome.storage.local.set({
        'eyezen_login_state': {
          isLoggedIn: true,
          userEmail: email,
          loginTime: Date.now()
        }
      });
      
    } catch (error) {
      // Re-throw the error to be handled by LoginModal
      throw error;
    }
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    console.log('Signup attempt:', { email, name });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get existing users from storage
      const result = await chrome.storage.local.get(['eyezen_users']);
      const users = result.eyezen_users || {};
      
      // Check if user already exists
      if (users[email]) {
        throw new Error('An account with this email already exists. Please login instead.');
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address.');
      }
      
      // Validate password strength
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }
      
      // Create new user
      const newUser = {
        email,
        password,
        name,
        createdAt: Date.now(),
        verified: true // Set to true after email verification
      };
      
      // Store user in users database
      users[email] = newUser;
      await chrome.storage.local.set({ 'eyezen_users': users });
      
      // Successful signup - log them in
      setState(prev => ({
        ...prev,
        isLoggedIn: true,
        userEmail: email,
        showLoginModal: false
      }));
      
      // Store login state
      await chrome.storage.local.set({
        'eyezen_login_state': {
          isLoggedIn: true,
          userEmail: email,
          loginTime: Date.now()
        }
      });
      
    } catch (error) {
      // Re-throw the error to be handled by LoginModal
      throw error;
    }
  };

  if (state.isLoading) {
    return (
      <div className="w-[380px] h-[550px] bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading EyeZen...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {state.showCameraPermissionPopup && (
         <CameraPermissionPopup
           isVisible={state.showCameraPermissionPopup}
           onApprove={handleCameraPermissionApprove}
           onReject={handleCameraPermissionReject}
           onClose={() => setState(prev => ({ ...prev, showCameraPermissionPopup: false }))}
         />
       )}
       
      <LoginModal
        isVisible={state.showLoginModal}
        onClose={() => setState(prev => ({ ...prev, showLoginModal: false }))}
        onLogin={handleLogin}
        onSignup={handleSignup}
      />
      <div className="w-[380px] h-[550px] bg-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">👁️</div>
            <div>
              <h1 className="text-lg font-bold">EyeZen</h1>
              <p className="text-blue-100 text-xs opacity-90">Eye Health Monitor</p>
            </div>
          </div>
          {state.isLoggedIn ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-blue-100 opacity-90 truncate max-w-20">
                {state.userEmail.split('@')[0]}
              </span>
              <button
                onClick={async () => {
                  await chrome.storage.local.remove(['eyezen_login_state']);
                  setState(prev => ({ ...prev, isLoggedIn: false, userEmail: '' }));
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Logout"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setState(prev => ({ ...prev, showLoginModal: true }))}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Login"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Camera Control - Most Important */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-lg">📹</div>
              <div className="flex-1">
                <div className="font-semibold text-sm">Camera Monitoring</div>
                <div className="text-xs text-blue-100 opacity-90">
                  {state.cameraEnabled ? 'Active - Tracking eye health' : 'Inactive - Click to enable'}
                </div>
                {!state.cameraEnabled && (
                  <button
                    onClick={() => setState(prev => ({ ...prev, showCameraPermissionPopup: true }))}
                    className="text-xs text-blue-200 hover:text-white underline mt-1 transition-colors"
                  >
                    Need help? View setup guide
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={toggleCamera}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                state.cameraEnabled ? 'bg-green-500 shadow-lg' : 'bg-white/30'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-md ${
                  state.cameraEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Simplified Status */}
      <div className="p-3">
        <div className="text-center mb-3">
          <div className="text-3xl mb-1">{getStatusIcon(state.status)}</div>
          <h2 className={`text-base font-bold ${getScoreColor(state.eyeScore.current)}`}>
            Eye Health: {state.eyeScore.current}/100
          </h2>
          <p className="text-xs text-gray-600">
            {state.streakDays} day streak • {formatLastBreakTime(state.lastBreakTime)}
          </p>
        </div>
      </div>

      {/* AI Break Suggestion */}
      <div className="px-4 pb-4 flex-1">
        {/* AI Coach Recommendation */}
        <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <button
            onClick={() => handleBreakClick(BreakType.MICRO)}
            className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-400 hover:to-emerald-400 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
          >
            <span>⚡</span>
            <span>Start Recommended Break with AI</span>
          </button>
        </div>
        
        {/* Break Selection */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Choose Your Break</h3>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleBreakClick(BreakType.MICRO)}
              className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-200 text-center border border-blue-200"
            >
              <div className="text-xl mb-1">⚡</div>
              <div className="text-xs font-medium">Quick</div>
              <div className="text-xs opacity-70">20 sec</div>
            </button>
            
            <button
              onClick={() => handleBreakClick(BreakType.SHORT)}
              className="p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors duration-200 text-center border border-green-200"
            >
              <div className="text-xl mb-1">🧘</div>
              <div className="text-xs font-medium">Eye Break</div>
              <div className="text-xs opacity-70">5 min</div>
            </button>
            
            <button
              onClick={() => handleBreakClick(BreakType.LONG)}
              className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors duration-200 text-center border border-purple-200"
            >
              <div className="text-xl mb-1">💆</div>
              <div className="text-xs font-medium">Wellness</div>
              <div className="text-xs opacity-70">15 min</div>
            </button>
          </div>
        </div>
        
        <button
          onClick={onOpenSettings}
          className="w-full mt-7 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          View detailed dashboard →
        </button>
      </div>


    </div>
    </>
  );
};

export default Popup;