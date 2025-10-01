/**
 * Popup Component
 * Main popup interface for the EyeZen Chrome Extension
 */

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { UserStatus, EyeScore, BreakType, PostureStatus, EyeMetrics } from '../../types/index';
import { ChromeStorageService } from '../../core/storage/index';
import { ChromeAIService } from '../../core/ai/chromeAI';

// Lazy load heavy components
const CameraPermissionPopup = lazy(() => import('./CameraPermissionPopup'));
const LoginModal = lazy(() => import('./LoginModal'));
const BreakDetailModal = lazy(() => import('./BreakDetailModal'));

// Lazy load heavy services
const loadAIServices = () => Promise.all([
  import('../../core/api/openai-service').then(m => m.ChromeAIService),
  import('../../core/coach/index').then(m => m.AICoachService),
  import('../../core/ai/chrome-ai-vision').then(m => m.ChromeAIVisionService)
]);

// Initialize Chrome AI service
const chromeAI = new ChromeAIService();

const loadMetricsService = () => import('../../core/metrics/index').then(m => m.EyeHealthScorer);

interface PopupProps {
  onStartBreak: (breakType: BreakType) => void;
  onOpenSettings: () => void;
}

interface PopupState {
  status: UserStatus;
  eyeScore: EyeScore;
  realtimeScore: number; // Real-time fatigue score (0-100)
  isLoading: boolean;
  cameraEnabled: boolean;
  lastBreakTime: number | null;
  streakDays: number;
  showCameraPermissionPopup: boolean;
  isFeatureRestricted: boolean;
  aiRecommendation: string;
  aiCategory: 'environment' | 'posture' | 'habits' | 'nutrition' | 'workspace';
  aiLoading: boolean;
  showLoginModal: boolean;
  isLoggedIn: boolean;
  userEmail: string;
  isModalOpen: boolean;
  selectedBreakType: BreakType | null;
}



const Popup: React.FC<PopupProps> = ({ onStartBreak, onOpenSettings }: PopupProps) => {
  const lastLogTimeRef = useRef<number>(0);

  const [state, setState] = useState<PopupState>({
    status: UserStatus.GOOD,
    eyeScore: {
      current: 50,
      daily: 50,
      weekly: 50,
      trend: 'stable'
    },
    realtimeScore: -1, // Start with -1 to show placeholder until real data is available
    isLoading: true,
    cameraEnabled: true,
    lastBreakTime: null,
    streakDays: 0,
    showCameraPermissionPopup: false,
    isFeatureRestricted: false,
    aiRecommendation: 'Analyzing your eye health patterns...',
    aiCategory: 'environment',
    aiLoading: true,
    showLoginModal: false,
    isLoggedIn: false,
    userEmail: '',
    isModalOpen: false,
    selectedBreakType: null
  });

  useEffect(() => {
    console.log('🔥 POPUP: useEffect triggered, calling loadUserData');
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
      console.log('🔥 POPUP: Message received:', message.type, message);
      if (message.type === 'EYE_METRICS') {
        console.log('🔥 POPUP: EYE_METRICS message received, calling handleEyeMetrics');
        handleEyeMetrics(message.data);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(messageListener);
      
      // Send a test message to verify message system works
      setTimeout(() => {
        console.log('🧪 POPUP: Sending test message to service worker');
        chrome.runtime.sendMessage({ type: 'POPUP_TEST', data: 'Hello from popup' }, (response) => {
          console.log('🧪 POPUP: Test message response:', response);
        });
      }, 1000);
      
      // Fallback: Poll storage for eye metrics in case runtime messages don't work
      const storagePollingInterval = setInterval(async () => {
        try {
          const result = await chrome.storage.local.get(['latest_eye_metrics']);
          if (result.latest_eye_metrics) {
            const { data, timestamp } = result.latest_eye_metrics;
            // Only process if this is a new metric (within last 5 seconds)
            if (Date.now() - timestamp < 5000) {
              console.log('🔄 POPUP: Processing eye metrics from storage fallback:', data);
              handleEyeMetrics(data);
              // Clear the processed metric to avoid reprocessing
              await chrome.storage.local.remove(['latest_eye_metrics']);
            }
          }
        } catch (error) {
          console.log('🔄 POPUP: Error polling storage for metrics:', error);
        }
      }, 1000); // Check every second
      
      // Store the storage polling interval for cleanup
      (window as any).storagePollingInterval = storagePollingInterval;
     }
     
     // Listen for storage changes to sync authentication state
     const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
       if (areaName === 'local' && changes.eyezen_login_state) {
         console.log('Popup: Login state changed in storage:', changes.eyezen_login_state);
         loadLoginState();
       }
     };
     
     if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
       chrome.storage.onChanged.addListener(handleStorageChange);
     }
     
     return () => {
       clearInterval(interval);
       clearInterval(permissionCheckInterval);
       clearInterval(stateValidationInterval);
       if ((window as any).storagePollingInterval) {
         clearInterval((window as any).storagePollingInterval);
       }
       if (typeof chrome !== 'undefined' && chrome.runtime) {
         chrome.runtime.onMessage.removeListener(messageListener);
       }
       if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
         chrome.storage.onChanged.removeListener(handleStorageChange);
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
    console.log('🔥 POPUP: loadUserData function called');
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
        console.log('🔍 POPUP: Recent metrics for health score calculation:', recentMetrics.length, recentMetrics);
        
        // Lazy load EyeHealthScorer
        const EyeHealthScorer = await loadMetricsService();
        const healthScore = EyeHealthScorer.calculateScore(recentMetrics);
        console.log('🔍 POPUP: Calculated health score:', healthScore);
        
        // Determine user status based on score and recent metrics
        const currentStatus = determineUserStatus(healthScore.overall, recentMetrics);
        
        // Calculate streak days
        const streakDays = calculateStreakDays(userData.breaks);
        
        // Get last break time
        const lastBreak = userData.breaks
          .filter(b => b.completed)
          .sort((a, b) => b.endTime! - a.endTime!)[0];
        
        // Generate initial AI category and recommendation
        const avgFatigue = recentMetrics.reduce((sum, m) => sum + (m.fatigueIndex || 0), 0) / recentMetrics.length;
        
        let aiCategory: 'environment' | 'posture' | 'habits' | 'nutrition' | 'workspace' = 'environment';
        let recommendation = 'Analyzing your eye health patterns...';
        
        if (avgFatigue > 0.7) {
          aiCategory = 'workspace';
          recommendation = 'Consider optimizing your workspace setup for better eye health.';
        } else if (avgFatigue > 0.4) {
          aiCategory = 'posture';
          recommendation = 'Focus on maintaining proper posture and screen distance.';
        }

        // Calculate initial real-time score from most recent metrics
        const mostRecentMetric = recentMetrics[recentMetrics.length - 1];
        const initialRealtimeScore = mostRecentMetric 
          ? Math.round(Math.max(0, Math.min(100, 100 - (mostRecentMetric.fatigueIndex * 100))))
          : -1; // Use -1 if no recent metrics available

        // Initialize camera stream flag - do NOT automatically start camera
        // Camera should only be activated when user explicitly clicks the toggle
        (window as any).eyeZenCameraStream = null;
        
        console.log('🔍 POPUP: Setting eyeScore.current to:', healthScore.overall);
        setState(prev => ({
          ...prev,
          status: currentStatus,
          eyeScore: {
            current: healthScore.overall,
            daily: healthScore.overall,
            weekly: healthScore.overall,
            trend: healthScore.trend
          },
          realtimeScore: initialRealtimeScore,
          isLoading: false,
          cameraEnabled: userData.settings.cameraEnabled,
          lastBreakTime: lastBreak?.endTime || null,
          streakDays,
          showCameraPermissionPopup: false, // Only show when explicitly triggered
          isFeatureRestricted: userData.settings.metricsOnly,
          aiRecommendation: recommendation,
          aiCategory: aiCategory,
          aiLoading: false,
          showLoginModal: false
          // Preserve existing login state (isLoggedIn, userEmail)
        }));
      }
    } catch (error) {
      console.error('🔥 POPUP: Failed to load user data:', error);
      console.error('🔥 POPUP: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      setState((prev: PopupState) => ({ ...prev, isLoading: false }));
    }
  };

  // Handle eye metrics from CV worker
  const handleEyeMetrics = async (eyeMetrics: any) => {
    try {
      const timestamp = new Date().toISOString();
      // Always log when handleEyeMetrics is called for debugging
      console.log(`🔥 [${timestamp}] POPUP: handleEyeMetrics called with:`, eyeMetrics);
      
      // Only log face detection occasionally to reduce console noise
        if (Date.now() - lastLogTimeRef.current > 10000) { // Log every 10 seconds
          console.log('👤 Face detected! Received eye metrics:', eyeMetrics);
          console.log('📊 Real-time fatigue index:', eyeMetrics.fatigueIndex, 'Blink rate:', eyeMetrics.blinkRate);
          lastLogTimeRef.current = Date.now();
        }
      
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
      
      // Calculate proper Eye Health score using EyeHealthScorer
      const recentMetrics = [metricsData]; // Use current metrics for real-time calculation
      const EyeHealthScorer = await loadMetricsService();
      const healthScore = EyeHealthScorer.calculateScore(recentMetrics);
      const newScore = healthScore.overall;
      const realtimeFatigueScore = Math.max(0, Math.min(100, 100 - (eyeMetrics.fatigueIndex * 100)));
      const newStatus = determineUserStatus(newScore, [eyeMetrics]);
      
      console.log(`🔥 [${timestamp}] POPUP: Score calculation:`);
      console.log(`  - fatigueIndex: ${eyeMetrics.fatigueIndex}`);
      console.log(`  - Eye Health Score: ${newScore}`);
      console.log(`  - realtimeFatigueScore: ${realtimeFatigueScore}`);
      console.log(`  - Health Score Details:`, healthScore);
      console.log(`  - rounded Eye Health score: ${Math.round(newScore)}`);
      
      // Generate AI recommendation using Chrome AI Prompt API (with fallback)
      let aiRecommendation = 'Your eyes are healthy! Keep up the good work.';
      let aiCategory: 'environment' | 'posture' | 'habits' | 'nutrition' | 'workspace' = 'environment';
      
      // Set AI loading state
      setState(prev => ({ ...prev, aiLoading: true }));
      
      try {
        // Use Chrome AI Prompt API for personalized suggestions
        const aiSuggestion = await chromeAI.generateHealthSuggestion(
          newScore,
          realtimeFatigueScore,
          eyeMetrics
        );
        
        aiRecommendation = aiSuggestion.message;
        aiCategory = aiSuggestion.category;
        
        console.log('🤖 Chrome AI Suggestion:', aiSuggestion);
        
        // If Chrome AI is not available, try Chrome AI Vision as fallback
        if (aiSuggestion.confidence < 0.7) {
          const [ChromeAIService, AICoachService, ChromeAIVisionService] = await loadAIServices();
          
          // Try to get camera frame for AI analysis
          const cameraStream = (window as any).eyeZenCameraStream;
          if (cameraStream && cameraStream.getVideoTracks().length > 0) {
            const video = document.querySelector('video');
            if (video) {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(video, 0, 0);
                const imageData = canvas.toDataURL('image/jpeg', 0.8);
                
                // Use Chrome AI Vision for enhanced analysis
                const aiAnalysis = await ChromeAIVisionService.analyzeEyeStrain(imageData, metricsData);
                aiRecommendation = aiAnalysis.recommendations[0] || aiRecommendation;
                
                // Map AI strain level to category
                if (aiAnalysis.strainLevel > 70) {
                  aiCategory = 'workspace';
                } else if (aiAnalysis.strainLevel > 40) {
                  aiCategory = 'posture';
                } else {
                  aiCategory = 'environment';
                }
                
                console.log('🤖 Chrome AI Vision Analysis:', aiAnalysis);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Chrome AI analysis failed, using fallback:', error);
        // Fallback to basic rule-based recommendations
        if (eyeMetrics.fatigueIndex > 0.7) {
          aiRecommendation = 'Consider optimizing your workspace lighting and taking regular breaks.';
          aiCategory = 'workspace';
        } else if (eyeMetrics.fatigueIndex > 0.4) {
          aiRecommendation = 'Focus on maintaining proper posture and screen distance.';
          aiCategory = 'posture';
        } else if (eyeMetrics.blinkRate < 10) {
          aiRecommendation = 'Adjust screen brightness and humidity levels for comfort.';
          aiCategory = 'environment';
        }
      }
      
      // Single setState call to avoid race conditions
      setState(prev => ({
        ...prev,
        status: newStatus,
        eyeScore: {
          ...prev.eyeScore,
          current: Math.round(newScore)
        },
        realtimeScore: Math.round(realtimeFatigueScore),
        aiRecommendation,
        aiCategory,
        aiLoading: false
      }));
      
      console.log(`🔥 [${timestamp}] POPUP: Updated realtimeScore:`, Math.round(realtimeFatigueScore));
      
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
    setState(prev => ({
      ...prev,
      selectedBreakType: breakType,
      isModalOpen: true
    }));
  };

  const handleCloseModal = () => {
    setState(prev => ({
      ...prev,
      isModalOpen: false,
      selectedBreakType: null
    }));
  };

  const handleAIRecommendation = async () => {
    try {
      // Set AI loading state
      setState(prev => ({ ...prev, aiLoading: true }));
      
      // Get current eye metrics and scores
       const eyeScore = state.eyeScore.current || 50;
       const fatigueScore = state.realtimeScore || 50;
       
       // Create basic eye metrics from current state
       const eyeMetrics = {
         blinkRate: 15, // Default values - in real implementation these would come from camera
         fatigueIndex: fatigueScore / 100,
         posture: 'good' as any,
         earValue: 0.25,
         perclosValue: 0.2,
         timestamp: Date.now()
       };
      
      // Generate AI suggestion using Chrome AI
      const aiSuggestion = await chromeAI.generateHealthSuggestion(
        eyeScore,
        fatigueScore,
        eyeMetrics as any
      );
      
      // Update state with AI recommendation
      setState(prev => ({
        ...prev,
        aiRecommendation: aiSuggestion.message,
        aiCategory: aiSuggestion.category,
        aiLoading: false
      }));
      
      // Show the recommendation in an alert for now
      alert(`AI Health Suggestion (${aiSuggestion.category}):\n\n${aiSuggestion.message}`);
      
    } catch (error) {
      console.error('Failed to generate AI recommendation:', error);
      setState(prev => ({ ...prev, aiLoading: false }));
      alert('Sorry, AI recommendations are not available right now. Please try again later.');
    }
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

  const downloadCurrentFrame = async () => {
    try {
      if (!state.cameraEnabled) {
        alert('Camera must be enabled to capture frames');
        return;
      }

      const response = await new Promise<{success: boolean; filename?: string; error?: string}>((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'DOWNLOAD_FRAME' },
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
        console.log('📸 Frame downloaded successfully:', response.filename);
        // Show success feedback
        alert(`Frame saved as: ${response.filename}`);
      } else {
        console.error('❌ Failed to download frame:', response.error);
        alert(`Failed to download frame: ${response.error}`);
      }
    } catch (error) {
      console.error('Failed to download frame:', error);
      alert('Failed to download frame. Please try again.');
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
        showCameraPermissionPopup: false,
        realtimeScore: 0 // Reset real-time score when camera is disabled
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
          showCameraPermissionPopup: false,
          realtimeScore: 0 // Reset real-time score when permission is revoked
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
        '🔒 Your privacy is protected - no video is recorded or transmitted, and images are only used for one-time analysis.\n' +
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
        alert(' Success! Camera is now active and AI eye health monitoring is running.');
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
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
          <CameraPermissionPopup
            isVisible={state.showCameraPermissionPopup}
            onApprove={handleCameraPermissionApprove}
            onReject={handleCameraPermissionReject}
            onClose={() => setState(prev => ({ ...prev, showCameraPermissionPopup: false }))}
          />
        </Suspense>
       )}
       
      <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
        <LoginModal
          isVisible={state.showLoginModal}
          onClose={() => setState(prev => ({ ...prev, showLoginModal: false }))}
          onLogin={handleLogin}
          onSignup={handleSignup}
        />
      </Suspense>
      <div className="w-[380px] h-[650px] bg-white flex flex-col relative">
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
                {state.cameraEnabled && (
                  <button
                    onClick={downloadCurrentFrame}
                    className="text-xs text-blue-200 hover:text-white underline mt-1 transition-colors flex items-center space-x-1"
                  >
                    <span>📸</span>
                    <span>Download Current Frame</span>
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
      <div className="p-3 relative">
        {/* Real-time Score Display - Upper Left in White Space */}
        {/* <div className="absolute top-3 left-3 z-10">
          <div className="inline-flex items-center px-2 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs shadow-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1.5 animate-pulse"></div>
            <span className="font-medium text-blue-700">
              {state.realtimeScore >= 0 ? state.realtimeScore : '--'}
            </span>
          </div>
        </div> */}
        <div className="text-center mb-3">
          {/* Eye Health Score Card */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 mx-1 mb-2 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-lg mr-2">
                  {state.eyeScore.current >= 80 ? '😊' : state.eyeScore.current >= 60 ? '😐' : state.eyeScore.current >= 40 ? '😟' : '😵'}
                </span>
                <h2 className="text-sm font-semibold text-gray-800">
                  Eye Health Score
                </h2>
              </div>
              <div className="flex items-center">
                <span className={`text-xl font-bold ${getScoreColor(state.eyeScore.current)}`}>
                  {state.eyeScore.current}
                </span>
                <span className="text-sm text-gray-500 ml-1">/100</span>
                {state.cameraEnabled && state.eyeScore.current === 50 && (
                  <span className="ml-2 text-xs text-blue-600 font-medium flex items-center">
                    <span className="animate-spin mr-1">🔄</span>
                    Analyzing...
                  </span>
                )}
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${getScoreColor(state.eyeScore.current).includes('green') ? 'bg-green-500' : getScoreColor(state.eyeScore.current).includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${state.eyeScore.current}%` }}
              ></div>
            </div>
            
            <div className="text-xs text-gray-500 text-center mb-2">
              Based on eye strain, posture, fatigue levels
            </div>
            
            {/* AI Break Button integrated into Eye Health Score section */}
            <div className="mt-3">
              <button
                onClick={handleAIRecommendation}
                disabled={state.aiLoading}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-400 hover:to-emerald-400 transition-all duration-200 font-medium flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.aiLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Getting AI Suggestions...</span>
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    <span>Get AI Health Suggestions</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        

      </div>



      {/* Break Selection */}
      <div className="px-4 pb-4 flex-1 overflow-y-auto">
        
        {/* Break Selection */}
         <div className="mb-2">
           <h3 className="text-xs font-medium text-gray-600 mb-1">Choose Your Break</h3>
           <div className="grid grid-cols-3 gap-1">
             <button
               onClick={() => handleBreakClick(BreakType.MICRO)}
               className="flex flex-col items-center p-2 bg-gradient-to-br from-yellow-300 to-orange-400 hover:from-yellow-400 hover:to-orange-500 rounded border border-orange-300 transition-all duration-200 hover:shadow-md text-white"
             >
               <span className="text-lg mb-1">⚡</span>
               <span className="text-xs font-medium text-white">Quick</span>
               <span className="text-xs text-white opacity-90">20 sec</span>
             </button>
             <button
               onClick={() => handleBreakClick(BreakType.SHORT)}
               className="flex flex-col items-center p-2 bg-gradient-to-br from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 rounded border border-emerald-400 transition-all duration-200 hover:shadow-md text-white"
             >
               <span className="text-lg mb-1">👁️</span>
               <span className="text-xs font-medium text-white">Eye Break</span>
               <span className="text-xs text-white opacity-90">5 min</span>
             </button>
             <button
               onClick={() => handleBreakClick(BreakType.LONG)}
               className="flex flex-col items-center p-2 bg-gradient-to-br from-purple-400 to-indigo-500 hover:from-purple-500 hover:to-indigo-600 rounded border border-indigo-400 transition-all duration-200 hover:shadow-md text-white"
             >
               <span className="text-lg mb-1">🧘</span>
               <span className="text-xs font-medium text-white">Wellness</span>
               <span className="text-xs text-white opacity-90">15 min</span>
             </button>
           </div>
         </div>
         
         <button
          onClick={() => {
            if (state.isLoggedIn) {
              onOpenSettings();
            } else {
              setState(prev => ({ ...prev, showLoginModal: true }));
            }
          }}
          className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center space-x-2"
        >
          {!state.isLoggedIn && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
          <span>{state.isLoggedIn ? 'View detailed dashboard →' : 'Login to view dashboard →'}</span>
        </button>
      </div>

      {/* Break Detail Modal */}
      <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
        <BreakDetailModal
          isOpen={state.isModalOpen}
          breakType={state.selectedBreakType}
          onClose={handleCloseModal}
          onStartBreak={onStartBreak}
        />
      </Suspense>

    </div>
    </>
  );
};

export default Popup;