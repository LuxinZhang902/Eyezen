/**
 * Popup Component
 * Main popup interface for the EyeZen Chrome Extension
 */

import React, { useState, useEffect } from 'react';
import { UserStatus, EyeScore, BreakType } from '../../types/index';
import { ChromeStorageService } from '../../core/storage/index';
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
    isFeatureRestricted: false
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
          isFeatureRestricted: userData.settings.metricsOnly
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
      <div className="w-[400px] h-[600px] bg-white p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
      <div className="w-[400px] bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">👁️</div>
            <h1 className="text-lg font-semibold">EyeZen</h1>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        {/* Camera Status Indicator */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              state.cameraEnabled && !state.isFeatureRestricted ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            <span className="text-blue-100">
              Camera: {state.cameraEnabled && !state.isFeatureRestricted ? 'Active' : 'Inactive'}
            </span>
          </div>
          {state.isFeatureRestricted && (
            <span className="text-yellow-300 text-xs px-2 py-1 bg-yellow-600 bg-opacity-30 rounded">
              Limited Mode
            </span>
          )}
        </div>
      </div>

      {/* Status Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{getStatusIcon(state.status)}</div>
            <div>
              <h2 className={`text-xl font-semibold ${getStatusColor(state.status)}`}>
                {state.status.charAt(0).toUpperCase() + state.status.slice(1)}
              </h2>
              <p className="text-sm text-gray-600">Current Status</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(state.eyeScore.current)}`}>
              {state.eyeScore.current}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span>{getTrendIcon(state.eyeScore.trend)}</span>
              <span className="ml-1">{state.eyeScore.trend}</span>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600">Streak</div>
            <div className="font-semibold text-blue-600">{state.streakDays} days</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-600">Last Break</div>
            <div className="font-semibold text-gray-800">
              {formatLastBreakTime(state.lastBreakTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Break Buttons */}
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Take a Break</h3>
        {state.isFeatureRestricted && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-700">Camera access rejected. Only alarm features available.</p>
          </div>
        )}
        
        <button
          onClick={() => handleBreakClick(BreakType.MICRO)}
          disabled={state.isFeatureRestricted}
          className={`w-full py-3 px-4 rounded-lg transition-colors flex items-center justify-between ${
            state.isFeatureRestricted 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">⚡</span>
            <div className="text-left">
              <div className="font-medium">Quick Break</div>
              <div className="text-xs opacity-90">20 seconds</div>
            </div>
          </div>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => handleBreakClick(BreakType.SHORT)}
          disabled={state.isFeatureRestricted}
          className={`w-full py-3 px-4 rounded-lg transition-colors flex items-center justify-between ${
            state.isFeatureRestricted 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">🧘</span>
            <div className="text-left">
              <div className="font-medium">Eye Break</div>
              <div className="text-xs opacity-90">5 minutes</div>
            </div>
          </div>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => handleBreakClick(BreakType.LONG)}
          disabled={state.isFeatureRestricted}
          className={`w-full py-3 px-4 rounded-lg transition-colors flex items-center justify-between ${
            state.isFeatureRestricted 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">🌸</span>
            <div className="text-left">
              <div className="font-medium">Wellness Break</div>
              <div className="text-xs opacity-90">15 minutes</div>
            </div>
          </div>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Quick Settings */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${state.isFeatureRestricted ? 'text-gray-400' : 'text-gray-600'}`}>Camera Monitoring</span>
            <div className={`w-2 h-2 rounded-full ${
              state.cameraEnabled ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
          </div>
          <button
            onClick={toggleCamera}
            disabled={state.isFeatureRestricted}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              state.isFeatureRestricted 
                ? 'bg-gray-200 cursor-not-allowed' 
                : state.cameraEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                state.cameraEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <button
          onClick={onOpenSettings}
          disabled={state.isFeatureRestricted}
          className={`w-full mt-3 text-sm font-medium transition-colors ${
            state.isFeatureRestricted 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          View Dashboard & Settings →
        </button>
        
        {state.isFeatureRestricted && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">✓ Set Alarm feature is still available</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Popup;