import React, { useState, useEffect } from 'react';
import { DashboardProps, UserData, UserSettings, EyeMetrics, BreakSession, WeeklySummary } from '../../types/index';
import { ChromeStorageService } from '../../core/storage/index';
import LoginModal from './LoginModal';

// AI Service interfaces
interface ImageAnalysisResult {
  eyeStrainScore: number;
  confidence: number;
  analysis: any;
  summary: string;
}

interface CameraAnalysisResult {
  eyeStrainScore: number;
  confidence: number;
  analysis: any;
  summary: string;
}

type AnalysisMode = 'camera-capture' | 'upload-photo';

// Dynamic AI service loading
const loadAIServices = () => Promise.all([
  import('../../core/api/openai-service').then(m => m.ChromeAIService),
  import('../../core/coach/index').then(m => m.AICoachService),
  import('../../core/ai/chrome-ai-vision').then(m => m.ChromeAIVisionService)
]);

interface DashboardState {
  activeTab: 'overview' | 'detection' | 'analytics' | 'goals' | 'settings' | 'privacy';
  isLoading: boolean;
  error: string | null;
  weeklyData: WeeklySummary | null;
  todayMetrics: EyeMetrics[];
  todayBreaks: BreakSession[];
  // AI Analysis states
  imageAnalysisResult: ImageAnalysisResult | null;
  cameraAnalysisResult: CameraAnalysisResult | null;
  analysisMode: AnalysisMode;
  aiLoading: boolean;
  cameraEnabled: boolean;
  // Authentication states
  isLoggedIn: boolean;
  userEmail: string;
  showLoginModal: boolean;
  loginLoading: boolean;
  loginError: string | null;
  userDashboardData: any | null;
}

const Dashboard: React.FC<DashboardProps> = ({ userData, onUpdateSettings, onExportData, onEraseData }) => {
  const [state, setState] = useState<DashboardState>({
    activeTab: 'overview',
    isLoading: true,
    error: null,
    weeklyData: null,
    todayMetrics: [],
    todayBreaks: [],
    // AI Analysis initial states
    imageAnalysisResult: null,
    cameraAnalysisResult: null,
    analysisMode: 'camera-capture',
    aiLoading: false,
    cameraEnabled: false,
    // Authentication initial states
    isLoggedIn: false,
    userEmail: '',
    showLoginModal: false,
    loginLoading: false,
    loginError: null,
    userDashboardData: null
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Mock data for dashboard - replace with actual API calls when available
      const weeklyData: WeeklySummary = {
        weekStart: Date.now() - 7 * 24 * 60 * 60 * 1000,
        weekEnd: Date.now(),
        totalBreaks: 42,
        averageEyeScore: 78,
        fatigueEvents: 5,
        improvements: ['Better posture', 'More frequent breaks'],
        recommendations: ['Take more micro-breaks', 'Adjust screen brightness'],
        generated: Date.now()
      };
      
      const todayMetrics = userData.metrics.filter(m => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const metricDate = new Date(m.timestamp);
        metricDate.setHours(0, 0, 0, 0);
        return metricDate.getTime() === today.getTime();
      });
      
      const todayBreaks = userData.breaks.filter(b => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const breakDate = new Date(b.startTime);
        breakDate.setHours(0, 0, 0, 0);
        return breakDate.getTime() === today.getTime();
      });

      setState(prev => ({
        ...prev,
        weeklyData,
        todayMetrics,
        todayBreaks,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load dashboard data',
        isLoading: false
      }));
    }
  };

  const handleSettingChange = (key: keyof UserSettings, value: string | number | boolean) => {
    onUpdateSettings({ [key]: value });
  };

  // Authentication functions
  const checkLoginStatus = async () => {
    try {
      console.log('Checking login status...');
      
      // Check if chrome.storage is available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const loginData = await chrome.storage.local.get(['eyezen_login_data']);
        console.log('Login data from storage:', loginData);
        
        if (loginData.eyezen_login_data && loginData.eyezen_login_data.email) {
          console.log('User is logged in:', loginData.eyezen_login_data.email);
          setState(prev => ({ 
            ...prev, 
            isLoggedIn: true, 
            userEmail: loginData.eyezen_login_data.email,
            isLoading: false 
          }));
          await loadUserDashboardData(loginData.eyezen_login_data.email);
        } else {
          console.log('No login data found');
          setState(prev => ({ ...prev, isLoggedIn: false, isLoading: false }));
        }
      } else {
        console.warn('Chrome storage API not available, using fallback');
        // Fallback for development/testing
        setState(prev => ({ ...prev, isLoggedIn: false, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to check login status:', error);
      setState(prev => ({ ...prev, isLoggedIn: false, isLoading: false }));
    }
  };

  const loadUserDashboardData = async (email: string) => {
    try {
      // Simulate API call to load user-specific dashboard data
      const response = await fetch(`/api/dashboard/${email}`);
      if (response.ok) {
        const dashboardData = await response.json();
        setState(prev => ({ ...prev, userDashboardData: dashboardData }));
      }
    } catch (error) {
      console.error('Failed to load user dashboard data:', error);
      // For demo purposes, create mock user data
      const mockUserData = {
        goals: {
          daily: { breaks: 8, eyeScore: 85, completed: 6 },
          weekly: { consistency: 5, avgScore: 82 },
          monthly: { improvement: 12, streak: 18 }
        },
        analytics: {
          weeklyTrend: [78, 82, 85, 88, 84, 87, 89],
          monthlyAverage: 84,
          improvementRate: 15
        },
        settings: {
          notifications: true,
          reminderInterval: 20,
          darkMode: false
        }
      };
      setState(prev => ({ ...prev, userDashboardData: mockUserData }));
    }
  };

  // Helper functions for calculations
  const calculateStreakDays = (breaks: BreakSession[]): number => {
    if (!breaks.length) return 0;
    
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const dayBreaks = breaks.filter(b => {
        const breakDate = new Date(b.startTime);
        return breakDate.toDateString() === checkDate.toDateString();
      });
      
      if (dayBreaks.length >= (userData.settings?.dailyBreakGoal || 8)) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Calculate daily goal completion percentage
  const calculateDailyGoalCompletion = (breaks: BreakSession[]): number => {
    const today = new Date().toDateString();
    const todayBreaks = breaks.filter(b => 
      new Date(b.startTime).toDateString() === today
    );
    
    const targetBreaks = userData.settings?.dailyBreakGoal || 8;
    return Math.min((todayBreaks.length / targetBreaks) * 100, 100);
  };

  const handleLogin = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loginLoading: true, loginError: null }));
    
    try {
      // Simulate API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const loginData = { email, timestamp: Date.now() };
        await chrome.storage.local.set({ eyezen_login_data: loginData });
        
        setState(prev => ({
          ...prev,
          isLoggedIn: true,
          userEmail: email,
          showLoginModal: false,
          loginLoading: false
        }));
        
        await loadUserDashboardData(email);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loginError: 'Login failed. Please check your credentials.',
        loginLoading: false
      }));
    }
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    setState(prev => ({ ...prev, loginLoading: true, loginError: null }));
    
    try {
      // For demo purposes, automatically "register" the user
      const loginData = { email, name, timestamp: Date.now() };
      await chrome.storage.local.set({ eyezen_login_data: loginData });
      
      setState(prev => ({
        ...prev,
        isLoggedIn: true,
        userEmail: email,
        showLoginModal: false,
        loginLoading: false
      }));
      
      await loadUserDashboardData(email);
    } catch (error) {
      setState(prev => ({
        ...prev,
        loginError: 'Signup failed. Please try again.',
        loginLoading: false
      }));
    }
  };

  const handleLogout = async () => {
    try {
      await chrome.storage.local.remove(['eyezen_login_data']);
      
      setState(prev => ({
        ...prev,
        isLoggedIn: false,
        userEmail: '',
        userDashboardData: null
      }));
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Check login status on component mount
  useEffect(() => {
    console.log('Dashboard mounted, checking login status...');
    checkLoginStatus();
  }, []);

  // Add a loading check for authentication
  const isAuthLoading = state.isLoading;

  // Calculate today's stats
  const calculateTodayStats = () => {
    const today = new Date().toDateString();
    const todayBreaks = state.todayBreaks.filter(b => 
      new Date(b.startTime).toDateString() === today
    );
    const todayMetrics = state.todayMetrics.filter(m => 
      new Date(m.timestamp).toDateString() === today
    );
    
    return { todayBreaks, todayMetrics };
  };

  const renderOverview = () => {
    const { todayBreaks, todayMetrics } = calculateTodayStats();
    const streakDays = calculateStreakDays(state.todayBreaks);
    const dailyCompletion = calculateDailyGoalCompletion(state.todayBreaks);

    return (
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's Breaks */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-lg border border-blue-200/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Today's Breaks</p>
                <p className="text-3xl font-bold text-blue-800">{todayBreaks.length}</p>
                <p className="text-blue-500 text-xs mt-1">Target: {userData.settings?.dailyBreakGoal || 8}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${dailyCompletion}%` }}></div>
              </div>
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl shadow-lg border border-green-200/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Current Streak</p>
                <p className="text-3xl font-bold text-green-800">{streakDays}</p>
                <p className="text-green-500 text-xs mt-1">days</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center space-x-1">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full ${i < streakDays ? 'bg-green-500' : 'bg-green-200'}`}></div>
                ))}
              </div>
            </div>
          </div>

          {/* Eye Health Score */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl shadow-lg border border-purple-200/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Eye Health Score</p>
                <p className="text-3xl font-bold text-purple-800">{userData.score?.current || 0}</p>
                <p className="text-purple-500 text-xs mt-1">out of 100</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full transition-all duration-500" style={{ width: `${userData.score?.current || 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* Weekly Average */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl shadow-lg border border-orange-200/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Weekly Average</p>
                <p className="text-3xl font-bold text-orange-800">{userData.score?.weekly || 0}</p>
                <p className="text-orange-500 text-xs mt-1">this week</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-orange-600">
                {userData.score?.weekly > userData.score?.current ? '↗️ Improving' : '↘️ Declining'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-8 hover:shadow-3xl transition-all duration-500">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent mb-8 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="group p-8 bg-gradient-to-br from-blue-500/10 via-blue-600/10 to-indigo-600/10 rounded-2xl border-2 border-blue-200/50 hover:border-blue-400/70 hover:bg-gradient-to-br hover:from-blue-500/20 hover:via-blue-600/20 hover:to-indigo-600/20 transition-all duration-300 text-left hover:shadow-2xl hover:shadow-blue-500/20 transform hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-blue-500/50">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h4 className="font-bold text-blue-800 text-lg group-hover:text-blue-900 transition-colors">Take Break Now</h4>
              </div>
              <p className="text-blue-600 font-medium group-hover:text-blue-700 transition-colors">Start a guided eye rest session</p>
            </button>
            
            <button 
              onClick={() => setState(prev => ({ ...prev, activeTab: 'analytics' }))}
              className="group p-8 bg-gradient-to-br from-emerald-500/10 via-green-600/10 to-teal-600/10 rounded-2xl border-2 border-emerald-200/50 hover:border-emerald-400/70 hover:bg-gradient-to-br hover:from-emerald-500/20 hover:via-green-600/20 hover:to-teal-600/20 transition-all duration-300 text-left hover:shadow-2xl hover:shadow-emerald-500/20 transform hover:scale-105"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-emerald-500/50">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="font-bold text-emerald-800 text-lg group-hover:text-emerald-900 transition-colors">View Analytics</h4>
              </div>
              <p className="text-emerald-600 font-medium group-hover:text-emerald-700 transition-colors">Check your detailed progress</p>
            </button>
            
            <button 
              onClick={() => setState(prev => ({ ...prev, activeTab: 'settings' }))}
              className="group p-8 bg-gradient-to-br from-purple-500/10 via-violet-600/10 to-purple-600/10 rounded-2xl border-2 border-purple-200/50 hover:border-purple-400/70 hover:bg-gradient-to-br hover:from-purple-500/20 hover:via-violet-600/20 hover:to-purple-600/20 transition-all duration-300 text-left hover:shadow-2xl hover:shadow-purple-500/20 transform hover:scale-105"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-purple-500/50">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                </div>
                <h4 className="font-bold text-purple-800 text-lg group-hover:text-purple-900 transition-colors">Adjust Settings</h4>
              </div>
              <p className="text-purple-600 font-medium group-hover:text-purple-700 transition-colors">Customize your preferences</p>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDetection = () => (
    <div className="space-y-8">
      {/* Detection Header */}
      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8 rounded-2xl shadow-lg border border-green-200/50">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">👁️ Detection & Monitoring</h3>
            <p className="text-green-600">Configure eye tracking and fatigue detection settings</p>
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
        <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </span>
          ⚙️ General Settings
        </h4>
        
        <div className="space-y-6">
          {/* Notification Settings */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200/50 hover:border-blue-300/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 015.5 4H9v1H5.5a3 3 0 00-2.121.879l-.707.707A3 3 0 002 8.5V12H1V8.5a4 4 0 011.172-2.828z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <label className="text-lg font-semibold text-blue-800">🔔 Notifications</label>
                  <p className="text-sm text-green-600 mt-1">Enable real-time eye tracking and fatigue detection</p>
                  <p className="text-xs text-green-500 mt-2">🔍 Real-time monitoring • 🎯 Accurate detection • 🚀 Instant alerts</p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('cameraEnabled', !userData.settings.cameraEnabled)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 transform hover:scale-105 ${
                  userData.settings.cameraEnabled 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-200' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-md ${
                  userData.settings.cameraEnabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Detection Sensitivity */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200/50 hover:border-blue-300/50 transition-all duration-200">
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div className="flex-1">
                <label className="text-lg font-semibold text-blue-800">🎚️ Detection Sensitivity</label>
                <p className="text-sm text-blue-600 mt-1">Adjust how sensitive the eye tracking detection should be</p>
                <div className="mt-4">
                  <select
                    value={userData.settings.detectionSensitivity}
                    onChange={(e) => handleSettingChange('detectionSensitivity', e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-blue-800 font-medium shadow-sm hover:shadow-md"
                  >
                    <option value="low">🟢 Low - Less sensitive, fewer alerts</option>
                    <option value="medium">🟡 Medium - Balanced detection</option>
                    <option value="high">🔴 High - Very sensitive, more alerts</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Break Reminder Settings */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200/50 hover:border-orange-300/50 transition-all duration-200">
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <label className="text-lg font-semibold text-orange-800">⏰ Break Reminders</label>
                <p className="text-sm text-orange-600 mt-1">Configure when and how often you want break reminders</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-2">Reminder Interval (minutes)</label>
                    <select
                      value={userData.settings.reminderInterval || 20}
                      onChange={(e) => handleSettingChange('reminderInterval', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={20}>20 minutes (recommended)</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>1 hour</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-2">Daily Break Target</label>
                    <select
                      value={userData.settings.dailyBreakGoal || 8}
                      onChange={(e) => handleSettingChange('dailyBreakGoal', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    >
                      <option value={6}>6 breaks/day</option>
                      <option value={8}>8 breaks/day (recommended)</option>
                      <option value={10}>10 breaks/day</option>
                      <option value={12}>12 breaks/day</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8">
      {/* Settings Header */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-2xl shadow-lg border border-blue-200/50">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-blue-800 mb-2">⚙️ General Settings</h3>
            <p className="text-blue-600">Customize your general preferences and notifications</p>
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
        <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 015.5 4H9v1H5.5a3 3 0 00-2.121.879l-.707.707A3 3 0 002 8.5V12H1V8.5a4 4 0 011.172-2.828z" />
            </svg>
          </span>
          🔔 Notification Settings
        </h4>
        
        <div className="space-y-6">
          {/* Notification Settings */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200/50 hover:border-blue-300/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 4.828A4 4 0 015.5 4H9v1H5.5a3 3 0 00-2.121.879l-.707.707A3 3 0 002 8.5V12H1V8.5a4 4 0 011.172-2.828z" />
                  </svg>
                </div>
                <div>
                  <label className="text-lg font-semibold text-blue-800">🔔 Notifications</label>
                  <p className="text-sm text-blue-600 mt-1">Enable break reminders and health alerts</p>
                  <p className="text-xs text-blue-500 mt-2">📱 Smart alerts • ⏰ Timely reminders • 🎯 Personalized</p>
                </div>
              </div>
              <button
                onClick={() => handleSettingChange('reminderEnabled', !userData.settings.reminderEnabled)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 transform hover:scale-105 ${
                  userData.settings.reminderEnabled 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-200' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-md ${
                  userData.settings.reminderEnabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Break Reminder Settings */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200/50 hover:border-orange-300/50 transition-all duration-200">
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <label className="text-lg font-semibold text-orange-800">⏰ Break Reminders</label>
                <p className="text-sm text-orange-600 mt-1">Configure when and how often you want break reminders</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-2">Reminder Interval (minutes)</label>
                    <select
                      value={userData.settings.reminderInterval || 20}
                      onChange={(e) => handleSettingChange('reminderInterval', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={20}>20 minutes (recommended)</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>1 hour</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-2">Daily Break Target</label>
                    <select
                      value={userData.settings.dailyBreakGoal || 8}
                    onChange={(e) => handleSettingChange('dailyBreakGoal', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    >
                      <option value={6}>6 breaks/day</option>
                      <option value={8}>8 breaks/day (recommended)</option>
                      <option value={10}>10 breaks/day</option>
                      <option value={12}>12 breaks/day</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGoals = () => {
    if (isAuthLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your goals...</p>
        </div>
      );
    }

    if (!state.isLoggedIn) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">🔒 Login Required</div>
          <p className="text-gray-600 mb-4">Please log in to view your eye protection goals.</p>
          <button
            onClick={() => setState(prev => ({ ...prev, showLoginModal: true }))}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Login to Access Goals
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 rounded-2xl shadow-lg border border-indigo-200/50">
          <h3 className="text-2xl font-bold text-indigo-800 mb-2">🎯 Your Eye Health Goals</h3>
          <p className="text-indigo-600">Track and achieve your personalized eye care objectives</p>
        </div>
        
        {/* Enhanced Goal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-xl">📅</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Daily Goals</h4>
                <p className="text-sm text-gray-600">Today's targets</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Breaks taken</span>
                <span className="font-semibold text-blue-600">6/8</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-xl">📊</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Weekly Progress</h4>
                <p className="text-sm text-gray-600">This week's consistency</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Consistency</span>
                <span className="font-semibold text-green-600">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" style={{width: '85%'}}></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white text-xl">🏆</span>
              </div>
              <div>
                <h4 className="font-bold text-gray-800">Achievements</h4>
                <p className="text-sm text-gray-600">Your milestones</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current streak</span>
                <span className="font-semibold text-purple-600">18 days</span>
              </div>
              <div className="text-xs text-purple-500 bg-purple-50 px-2 py-1 rounded-full inline-block">
                🔥 On fire!
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    if (isAuthLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your analytics...</p>
        </div>
      );
    }

    if (!state.isLoggedIn) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">🔒 Login Required</div>
          <p className="text-gray-600 mb-4">Please log in to view your detailed analytics.</p>
          <button
            onClick={() => setState(prev => ({ ...prev, showLoginModal: true }))}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Login to Access Analytics
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-8 rounded-2xl shadow-lg border border-emerald-200/50">
          <h3 className="text-2xl font-bold text-emerald-800 mb-2">📊 Analytics & Insights</h3>
          <p className="text-emerald-600">Detailed analysis of your eye health patterns</p>
        </div>
        
        {/* Enhanced Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-sm">📈</span>
              </span>
              Weekly Trend
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Score</span>
                <span className="font-semibold text-blue-600">84/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Improvement</span>
                <span className="font-semibold text-green-600">+15%</span>
              </div>
              <div className="bg-gradient-to-r from-blue-100 to-green-100 p-4 rounded-xl">
                <p className="text-sm text-gray-700">📊 Your eye health has improved significantly this week!</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-sm">⏰</span>
              </span>
              Break Patterns
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Most Active Time</span>
                <span className="font-semibold text-emerald-600">2-4 PM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Break Duration</span>
                <span className="font-semibold text-emerald-600">3.2 min</span>
              </div>
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-xl">
                <p className="text-sm text-gray-700">💡 Consider longer breaks in the afternoon for better results!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPrivacy = () => (
    <div className="space-y-8">
      {/* Privacy Header */}
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 p-8 rounded-2xl shadow-lg border border-purple-200/50">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-purple-800 mb-2">🔒 Privacy & Data</h3>
            <p className="text-purple-600">Manage your data privacy and security settings</p>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
        <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </span>
          📊 Data Management
        </h4>
        
        <div className="space-y-6">
          {/* Export Data */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200/50 hover:border-green-300/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <label className="text-lg font-semibold text-green-800">📤 Export Your Data</label>
                  <p className="text-sm text-green-600 mt-1">Download all your eye health data and analytics</p>
                  <p className="text-xs text-green-500 mt-2">💾 Complete backup • 📋 JSON format • 🔄 Portable</p>
                </div>
              </div>
              <button
                 onClick={() => {
                    // Export user data as JSON
                     const dataToExport = {
                        metrics: state.todayMetrics || [],
                        breaks: state.todayBreaks || [],
                        settings: userData.settings || {},
                        weeklyData: state.weeklyData || null,
                        exportDate: new Date().toISOString()
                      };
                    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `eye-health-data-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                 className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
               >
                 Export Data
               </button>
            </div>
          </div>

          {/* Delete Data */}
          <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl border border-red-200/50 hover:border-red-300/50 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <label className="text-lg font-semibold text-red-800">🗑️ Delete All Data</label>
                  <p className="text-sm text-red-600 mt-1">Permanently remove all your stored data</p>
                  <p className="text-xs text-red-500 mt-2">⚠️ Irreversible action • 🔥 Complete removal • 💀 No recovery</p>
                </div>
              </div>
              <button
                 onClick={() => {
                   if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
                     chrome.storage.local.clear(() => {
                        setState(prev => ({
                          ...prev,
                          todayMetrics: [],
                          todayBreaks: [],
                          weeklyData: null,
                          isLoggedIn: false,
                          userEmail: ''
                        }));
                        alert('All data has been deleted successfully.');
                      });
                   }
                 }}
                 className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
               >
                 Delete Data
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Information */}
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
        <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          ℹ️ Privacy Information
        </h4>
        
        <div className="space-y-4 text-gray-600">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h5 className="font-semibold text-blue-800 mb-2">🔐 Data Storage</h5>
            <p className="text-sm text-blue-700">All your data is stored locally on your device. We do not collect or transmit any personal information to external servers.</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h5 className="font-semibold text-green-800 mb-2">📹 Camera Usage</h5>
            <p className="text-sm text-green-700">Camera access is used only for real-time eye tracking analysis. No images or videos are stored or transmitted.</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h5 className="font-semibold text-purple-800 mb-2">🛡️ Your Control</h5>
            <p className="text-sm text-purple-700">You have complete control over your data. You can export or delete all information at any time using the options above.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (state.activeTab) {
      case 'overview':
        return renderOverview();
      case 'detection':
        return renderDetection();
      case 'analytics':
        return renderAnalytics();
      case 'goals':
        return renderGoals();
      case 'settings':
        return renderSettings();
      case 'privacy':
        return renderPrivacy();
      default:
        return renderOverview();
    }
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Enhanced Header */}
      <div className="relative z-10 bg-gradient-to-r from-slate-800/95 via-indigo-900/95 to-purple-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">👁️ EyeZen Dashboard</h1>
                <p className="text-blue-200/80 text-sm font-medium">Advanced Digital Eye Health Analytics</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {state.isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{state.userEmail.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-white/90 text-sm font-medium">Welcome, {state.userEmail.split('@')[0]}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-red-300 hover:text-red-100 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-500/20 transition-all duration-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setState(prev => ({ ...prev, showLoginModal: true }))}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative z-10 bg-gradient-to-r from-white/90 via-slate-50/90 to-white/90 backdrop-blur-xl border-b border-slate-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 py-6">
            {[
              { 
                id: 'overview', 
                label: 'Overview', 
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l4-4 4 4" />
                  </svg>
                )
              },
              { 
                id: 'detection', 
                label: 'Detection', 
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )
              },
              { 
                id: 'analytics', 
                label: 'Analytics', 
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )
              },
              { 
                id: 'goals', 
                label: 'Goals', 
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                )
              },
              { 
                id: 'settings', 
                label: 'Settings', 
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )
              },
              { 
                id: 'privacy', 
                label: 'Privacy', 
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )
              }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setState(prev => ({ ...prev, activeTab: tab.id as any }))}
                className={`group flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  state.activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/25'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-white/80 hover:shadow-lg'
                }`}
              >
                <span className={`transition-colors duration-300 ${
                  state.activeTab === tab.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-500'
                }`}>
                  {tab.icon}
                </span>
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 min-h-[600px]">
          {renderContent()}
        </div>
      </div>
      
      {/* Login Modal */}
      <LoginModal
        isVisible={state.showLoginModal}
        onClose={() => setState(prev => ({ ...prev, showLoginModal: false, loginError: null }))}
        onLogin={handleLogin}
        onSignup={handleSignup}
      />
      
      {/* Login Error Display */}
      {state.loginError && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md z-50">
          <h3 className="text-red-800 font-medium">Login Error</h3>
          <p className="text-red-600 text-sm">{state.loginError}</p>
          <button
            onClick={() => setState(prev => ({ ...prev, loginError: null }))}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;