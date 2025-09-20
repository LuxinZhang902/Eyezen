/**
 * Popup Component
 * Main popup interface for the EyeZen Chrome Extension
 */

import React, { useState, useEffect } from 'react';
import { UserStatus, EyeScore, BreakType } from '../../types/index';
import { ChromeStorageService } from '../../core/storage/index';
import { ChromeAIService } from '../../core/api/openai-service';
import { AICoachService } from '../../core/coach/index';
import { EyeHealthScorer } from '../../core/metrics/index';
import CameraPermissionPopup from './CameraPermissionPopup';

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
    aiLoading: true
  });

  useEffect(() => {
    loadUserData();
    
    // Set up periodic updates
    const interval = setInterval(loadUserData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

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

        setState({
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
          aiLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      setState((prev: PopupState) => ({ ...prev, isLoading: false }));
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
      const settings = await ChromeStorageService.getSettings();
      const newCameraEnabled = !settings.cameraEnabled;
      
      // If enabling camera, show permission popup
      if (newCameraEnabled) {
        setState(prev => ({
          ...prev,
          showCameraPermissionPopup: true
        }));
      } else {
        // If disabling camera, update settings directly
        await ChromeStorageService.updateSettings({
          cameraEnabled: false
        });
        
        setState(prev => ({
          ...prev,
          cameraEnabled: false,
          showCameraPermissionPopup: false
        }));
      }
    } catch (error) {
      console.error('Failed to toggle camera:', error);
    }
  };

  const handleCameraPermissionApprove = async () => {
    try {
      await ChromeStorageService.updateSettings({
        cameraEnabled: true,
        metricsOnly: false
      });
      
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
          <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Open Dashboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
        </div>
        
        {/* Camera Control - Most Important */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-lg">📹</div>
              <div>
                <div className="font-semibold text-sm">Camera Monitoring</div>
                <div className="text-xs text-blue-100 opacity-90">
                  {state.cameraEnabled && !state.isFeatureRestricted ? 'Active - Tracking eye health' : 'Inactive - Limited features'}
                </div>
              </div>
            </div>
            <button
              onClick={toggleCamera}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                state.cameraEnabled && !state.isFeatureRestricted ? 'bg-green-500 shadow-lg' : 'bg-white/30'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-md ${
                  state.cameraEnabled && !state.isFeatureRestricted ? 'translate-x-6' : 'translate-x-1'
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
        <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
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