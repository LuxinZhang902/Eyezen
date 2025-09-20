import React, { useState, useEffect } from 'react';
import { DashboardProps, UserData, UserSettings, EyeMetrics, BreakSession, WeeklySummary } from '../../types/index';
import { ChromeStorageService } from '../../core/storage/index';

interface DashboardState {
  activeTab: 'overview' | 'analytics' | 'goals' | 'settings' | 'privacy';
  isLoading: boolean;
  error: string | null;
  weeklyData: WeeklySummary | null;
  todayMetrics: EyeMetrics[];
  todayBreaks: BreakSession[];
}

const Dashboard: React.FC<DashboardProps> = ({ userData, onUpdateSettings, onExportData, onEraseData }) => {
  const [state, setState] = useState<DashboardState>({
    activeTab: 'overview',
    isLoading: true,
    error: null,
    weeklyData: null,
    todayMetrics: [],
    todayBreaks: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [todayMetrics, todayBreaks] = await Promise.all([
        ChromeStorageService.getMetrics(today, tomorrow),
        ChromeStorageService.getBreakSessions(today, tomorrow)
      ]);

      // Generate mock weekly summary for now
      const weeklyData: WeeklySummary = {
        weekStart: Date.now() - 7 * 24 * 60 * 60 * 1000,
        weekEnd: Date.now(),
        totalBreaks: todayBreaks.length + 15, // Mock data
        averageEyeScore: userData.score.weekly,
        fatigueEvents: todayMetrics.filter(m => m.fatigueIndex > 70).length + 5,
        improvements: [
          'Increased break frequency by 20%',
          'Reduced average fatigue index',
          'Better posture consistency'
        ],
        recommendations: [
          'Try to maintain regular break intervals',
          'Consider adjusting screen brightness',
          'Practice the TCM massage techniques daily'
        ],
        generated: Date.now()
      };

      setState(prev => ({
        ...prev,
        todayMetrics,
        todayBreaks,
        weeklyData,
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

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    onUpdateSettings({ [key]: value });
  };

  const calculateTodayStats = () => {
    const completedBreaks = state.todayBreaks.filter(b => b.completed).length;
    const avgFatigue = state.todayMetrics.length > 0 
      ? state.todayMetrics.reduce((sum, m) => sum + m.fatigueIndex, 0) / state.todayMetrics.length
      : 0;
    const totalBreakTime = state.todayBreaks.reduce((sum, b) => sum + b.duration, 0);
    
    return {
      completedBreaks,
      avgFatigue: Math.round(avgFatigue),
      totalBreakTime: Math.round(totalBreakTime / 60), // Convert to minutes
      goalProgress: Math.round((completedBreaks / userData.settings.dailyBreakGoal) * 100)
    };
  };

  const renderOverview = () => {
    const stats = calculateTodayStats();
    
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Today's KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Eye Score</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{userData.score.daily}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                userData.score.trend === 'improving' ? 'bg-green-100 text-green-800' :
                userData.score.trend === 'declining' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {userData.score.trend}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Breaks Today</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.completedBreaks}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(stats.goalProgress, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{stats.goalProgress}% of daily goal</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Avg Fatigue</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.avgFatigue}%</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                stats.avgFatigue < 30 ? 'bg-green-100 text-green-800' :
                stats.avgFatigue < 70 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {stats.avgFatigue < 30 ? 'Low' : stats.avgFatigue < 70 ? 'Moderate' : 'High'}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Break Time</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.totalBreakTime}m</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">Time invested in eye health</p>
            </div>
          </div>
        </div>

        {/* Weekly Summary */}
        {state.weeklyData && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Weekly Summary</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Improvements</h4>
                <ul className="space-y-2">
                  {state.weeklyData.improvements.map((improvement, index) => (
                    <li key={index} className="text-xs sm:text-sm text-green-700 flex items-start">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Recommendations</h4>
                <ul className="space-y-2">
                  {state.weeklyData.recommendations.map((rec, index) => (
                    <li key={index} className="text-xs sm:text-sm text-blue-700 flex items-start">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Detection Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Camera Detection</label>
              <p className="text-xs text-gray-500">Enable real-time eye tracking</p>
            </div>
            <button
              onClick={() => handleSettingChange('cameraEnabled', !userData.settings.cameraEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                userData.settings.cameraEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                userData.settings.cameraEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Detection Sensitivity</label>
            <select
              value={userData.settings.detectionSensitivity}
              onChange={(e) => handleSettingChange('detectionSensitivity', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Fatigue Threshold: {userData.settings.fatigueThreshold}%</label>
            <input
              type="range"
              min="30"
              max="90"
              value={userData.settings.fatigueThreshold}
              onChange={(e) => handleSettingChange('fatigueThreshold', parseInt(e.target.value))}
              className="mt-1 block w-full"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Reminder Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Break Reminders</label>
              <p className="text-xs text-gray-500">Get notified when it's time for a break</p>
            </div>
            <button
              onClick={() => handleSettingChange('reminderEnabled', !userData.settings.reminderEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                userData.settings.reminderEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                userData.settings.reminderEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Reminder Interval: {userData.settings.reminderInterval} minutes</label>
            <input
              type="range"
              min="10"
              max="60"
              value={userData.settings.reminderInterval}
              onChange={(e) => handleSettingChange('reminderInterval', parseInt(e.target.value))}
              className="mt-1 block w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Break Duration: {userData.settings.breakDuration} seconds</label>
            <input
              type="range"
              min="20"
              max="300"
              step="10"
              value={userData.settings.breakDuration}
              onChange={(e) => handleSettingChange('breakDuration', parseInt(e.target.value))}
              className="mt-1 block w-full"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Goals</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Daily Break Goal: {userData.settings.dailyBreakGoal} breaks</label>
            <input
              type="range"
              min="3"
              max="20"
              value={userData.settings.dailyBreakGoal}
              onChange={(e) => handleSettingChange('dailyBreakGoal', parseInt(e.target.value))}
              className="mt-1 block w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Eye Score Goal: {userData.settings.eyeScoreGoal}</label>
            <input
              type="range"
              min="60"
              max="100"
              value={userData.settings.eyeScoreGoal}
              onChange={(e) => handleSettingChange('eyeScoreGoal', parseInt(e.target.value))}
              className="mt-1 block w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Privacy Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Metrics Only Mode</label>
              <p className="text-xs text-gray-500">Store only aggregated metrics, no raw data</p>
            </div>
            <button
              onClick={() => handleSettingChange('metricsOnly', !userData.settings.metricsOnly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                userData.settings.metricsOnly ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                userData.settings.metricsOnly ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Data Retention: {userData.settings.dataRetention} days</label>
            <input
              type="range"
              min="7"
              max="365"
              value={userData.settings.dataRetention}
              onChange={(e) => handleSettingChange('dataRetention', parseInt(e.target.value))}
              className="mt-1 block w-full"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h3>
        <div className="space-y-4">
          <button
            onClick={onExportData}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export My Data
          </button>
          <button
            onClick={onEraseData}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Erase All Data
          </button>
        </div>
      </div>
    </div>
  );

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
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600 text-sm">{state.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">EyeZen Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Monitor your eye health and manage your settings</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-4 sm:mb-6">
          <nav className="-mb-px flex space-x-4 sm:space-x-6 lg:space-x-8 overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
              { id: 'goals', label: 'Goals', icon: '🎯' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
              { id: 'privacy', label: 'Privacy', icon: '🔒' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setState(prev => ({ ...prev, activeTab: tab.id as any }))}
                className={`py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  state.activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-1 sm:mr-2 text-sm sm:text-base">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {state.activeTab === 'overview' && renderOverview()}
        {state.activeTab === 'settings' && renderSettings()}
        {state.activeTab === 'privacy' && renderPrivacy()}
        {state.activeTab === 'analytics' && (
          <div className="text-center py-12">
            <p className="text-gray-500">Analytics view coming soon...</p>
          </div>
        )}
        {state.activeTab === 'goals' && (
          <div className="text-center py-12">
            <p className="text-gray-500">Goals management coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;