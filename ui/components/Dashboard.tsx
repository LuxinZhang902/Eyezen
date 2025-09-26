import React, { useState, useEffect } from 'react';
import { DashboardProps, UserData, UserSettings, EyeMetrics, BreakSession, WeeklySummary } from '../../types/index';
import { ChromeStorageService } from '../../core/storage/index';

// Analysis interfaces
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

// Lazy load AI services
const loadAIServices = () => Promise.all([
  import('../../core/api/openai-service').then(m => m.ChromeAIService),
  import('../../core/coach/index').then(m => m.AICoachService),
  import('../../core/ai/chrome-ai-vision').then(m => m.ChromeAIVisionService)
]);

interface DashboardState {
  activeTab: 'overview' | 'eyeinfo' | 'analysis' | 'analytics' | 'goals' | 'settings' | 'privacy';
  isLoading: boolean;
  error: string | null;
  weeklyData: WeeklySummary | null;
  todayMetrics: EyeMetrics[];
  todayBreaks: BreakSession[];
  // Analysis state
  imageAnalysisResult: ImageAnalysisResult | null;
  cameraAnalysisResult: CameraAnalysisResult | null;
  analysisMode: AnalysisMode;
  aiLoading: boolean;
  cameraEnabled: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ userData, onUpdateSettings, onExportData, onEraseData }) => {
  const [state, setState] = useState<DashboardState>({
    activeTab: 'overview',
    isLoading: true,
    error: null,
    weeklyData: null,
    todayMetrics: [],
    todayBreaks: [],
    // Analysis state
    imageAnalysisResult: null,
    cameraAnalysisResult: null,
    analysisMode: 'camera-capture',
    aiLoading: false,
    cameraEnabled: false
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
      <div className="space-y-6 sm:space-y-8">
        {/* Today's KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 sm:p-8 rounded-2xl shadow-lg border border-blue-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-2">Eye Score</p>
                <p className="text-3xl sm:text-4xl font-bold text-blue-800">{userData.score.daily}</p>
                <p className="text-xs text-blue-600 mt-1">stable</p>
              </div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                userData.score.trend === 'improving' ? 'bg-green-200 text-green-800' :
                userData.score.trend === 'declining' ? 'bg-red-200 text-red-800' :
                'bg-blue-200 text-blue-800'
              }`}>
                {userData.score.trend}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 sm:p-8 rounded-2xl shadow-lg border border-green-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-2">Breaks Today</p>
                <p className="text-3xl sm:text-4xl font-bold text-green-800">{stats.completedBreaks}</p>
                <p className="text-xs text-green-600 mt-1">0% of daily goal</p>
              </div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-green-200/50 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min(stats.goalProgress, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-green-700 mt-2 font-medium">{stats.goalProgress}% of daily goal</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-100 p-6 sm:p-8 rounded-2xl shadow-lg border border-orange-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 mb-2">Avg Fatigue</p>
                <p className="text-3xl sm:text-4xl font-bold text-orange-800">{stats.avgFatigue}%</p>
                <p className="text-xs text-orange-600 mt-1">Low</p>
              </div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                stats.avgFatigue < 30 ? 'bg-green-200 text-green-800' :
                stats.avgFatigue < 70 ? 'bg-yellow-200 text-yellow-800' :
                'bg-red-200 text-red-800'
              }`}>
                {stats.avgFatigue < 30 ? 'Low' : stats.avgFatigue < 70 ? 'Moderate' : 'High'}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-violet-100 p-6 sm:p-8 rounded-2xl shadow-lg border border-purple-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-2">Break Time</p>
                <p className="text-3xl sm:text-4xl font-bold text-purple-800">{stats.totalBreakTime}m</p>
                <p className="text-xs text-purple-600 mt-1">Time invested in eye health</p>
              </div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xs px-3 py-1 rounded-full font-medium bg-purple-200 text-purple-800">
                Excellent
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Summary */}
        {state.weeklyData && (
          <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              Weekly Summary
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200/50">
                <h4 className="font-bold text-green-800 mb-4 text-lg flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Improvements
                </h4>
                <ul className="space-y-3">
                  {state.weeklyData.improvements.map((improvement, index) => (
                    <li key={index} className="text-sm text-green-800 flex items-start bg-white/60 p-3 rounded-lg">
                      <svg className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200/50">
                <h4 className="font-bold text-blue-800 mb-4 text-lg flex items-center">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Recommendations
                </h4>
                <ul className="space-y-3">
                  {state.weeklyData.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start bg-white/60 p-3 rounded-lg">
                      <svg className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
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

  const renderEyeInfo = () => {
    // Static demo data for now
    const eyeMetrics = {
      fatigueScore: 25.5,
      blinkRate: 18.2,
      earValue: 0.285,
      perclosValue: 12.3,
      posture: 'GOOD'
    };
    const connectionStatus = 'Demo Mode - Static Data';
    const alerts = [{ type: 'info', message: '👁️ Eye Info dashboard is now integrated into the main dashboard!' }];

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Real-time Eye Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800">Fatigue Score</h4>
              <p className="text-2xl font-bold text-blue-600">{eyeMetrics.fatigueScore}%</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-800">Blink Rate</h4>
              <p className="text-2xl font-bold text-green-600">{eyeMetrics.blinkRate}/min</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-purple-800">Posture</h4>
              <p className="text-2xl font-bold text-purple-600">{eyeMetrics.posture}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Connection Status</h3>
          <p className="text-sm text-gray-600">{connectionStatus}</p>
          {alerts.map((alert, index) => (
            <div key={index} className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">{alert.message}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAnalysis = () => {
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setState(prev => ({ ...prev, aiLoading: true }));

      try {
        const [ChromeAIService, AICoachService, ChromeAIVisionService] = await loadAIServices();
        
        const reader = new FileReader();
        reader.onload = async (e) => {
          const imageData = e.target?.result as string;
          
          try {
             const analysis = await ChromeAIVisionService.analyzeEyeStrain(imageData);
             const result: ImageAnalysisResult = {
               eyeStrainScore: analysis.strainLevel || 0,
               confidence: analysis.confidenceScore || 0,
               analysis: analysis,
               summary: `Eye strain level: ${analysis.strainLevel}%. ${analysis.recommendations[0] || 'Analysis completed'}`
             };
            
            setState(prev => ({ 
              ...prev, 
              imageAnalysisResult: result,
              aiLoading: false 
            }));
          } catch (error) {
            console.error('Analysis failed:', error);
            setState(prev => ({ ...prev, aiLoading: false }));
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Failed to load AI services:', error);
        setState(prev => ({ ...prev, aiLoading: false }));
      }
    };

    const handleCameraCapture = async () => {
      setState(prev => ({ ...prev, aiLoading: true }));

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        video.onloadedmetadata = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);
          
          const imageData = canvas.toDataURL('image/jpeg');
          stream.getTracks().forEach(track => track.stop());

          try {
            const [ChromeAIService, AICoachService, ChromeAIVisionService] = await loadAIServices();
            const analysis = await ChromeAIVisionService.analyzeEyeStrain(imageData);
             
             const result: CameraAnalysisResult = {
               eyeStrainScore: analysis.strainLevel || 0,
               confidence: analysis.confidenceScore || 0,
               analysis: analysis,
               summary: `Eye strain level: ${analysis.strainLevel}%. ${analysis.recommendations[0] || 'Camera analysis completed'}`
             };
            
            setState(prev => ({ 
              ...prev, 
              cameraAnalysisResult: result,
              aiLoading: false 
            }));
          } catch (error) {
            console.error('Camera analysis failed:', error);
            setState(prev => ({ ...prev, aiLoading: false }));
          }
        };
      } catch (error) {
        console.error('Camera access failed:', error);
        setState(prev => ({ ...prev, aiLoading: false }));
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Eye Strain Analysis</h3>
          
          {/* Mode Selection */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setState(prev => ({ ...prev, analysisMode: 'camera-capture' }))}
              className={`px-4 py-2 rounded-lg transition-colors ${
                state.analysisMode === 'camera-capture'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📷 Camera Capture
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, analysisMode: 'upload-photo' }))}
              className={`px-4 py-2 rounded-lg transition-colors ${
                state.analysisMode === 'upload-photo'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📁 Upload Photo
            </button>
          </div>

          {/* Analysis Controls */}
          {state.analysisMode === 'camera-capture' ? (
            <div className="space-y-4">
              <button
                onClick={handleCameraCapture}
                disabled={state.aiLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {state.aiLoading ? 'Analyzing...' : '📷 Capture & Analyze'}
              </button>
              
              {state.cameraAnalysisResult && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Camera Analysis Result</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-blue-600">Eye Strain Score:</span>
                      <span className="ml-2 font-bold text-blue-800">{state.cameraAnalysisResult.eyeStrainScore}%</span>
                    </div>
                    <div>
                      <span className="text-sm text-blue-600">Confidence:</span>
                      <span className="ml-2 font-bold text-blue-800">{state.cameraAnalysisResult.confidence}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700">{state.cameraAnalysisResult.summary}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={state.aiLoading}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className={`cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                    state.aiLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {state.aiLoading ? 'Analyzing...' : '📁 Choose Image'}
                </label>
                <p className="text-sm text-gray-500 mt-2">Upload a photo for AI eye strain analysis</p>
              </div>
              
              {state.imageAnalysisResult && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Image Analysis Result</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-green-600">Eye Strain Score:</span>
                      <span className="ml-2 font-bold text-green-800">{state.imageAnalysisResult.eyeStrainScore}%</span>
                    </div>
                    <div>
                      <span className="text-sm text-green-600">Confidence:</span>
                      <span className="ml-2 font-bold text-green-800">{state.imageAnalysisResult.confidence}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-green-700">{state.imageAnalysisResult.summary}</p>
                </div>
              )}
            </div>
          )}


        </div>

        {/* Analysis Tips */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Analysis Tips</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-blue-600">💡</span>
              <p className="text-sm text-gray-600">For best results, ensure good lighting and look directly at the camera</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-600">📸</span>
              <p className="text-sm text-gray-600">Photos should clearly show your eyes and facial expression</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-purple-600">🔒</span>
              <p className="text-sm text-gray-600">All analysis is performed locally - your images are not stored or transmitted</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">EyeZen Dashboard</h1>
          <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">Monitor your eye health and manage your settings with our comprehensive analytics platform</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 sm:mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-2">
            <nav className="flex space-x-2 overflow-x-auto scrollbar-hide">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'eyeinfo', label: 'Eye Info', icon: '👁️' },
                { id: 'analysis', label: 'Analysis', icon: '🔬' },
                { id: 'analytics', label: 'Analytics', icon: '📈' },
                { id: 'goals', label: 'Goals', icon: '🎯' },
                { id: 'settings', label: 'Settings', icon: '⚙️' },
                { id: 'privacy', label: 'Privacy', icon: '🔒' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setState(prev => ({ ...prev, activeTab: tab.id as any }))}
                  className={`py-3 px-4 sm:px-6 rounded-xl font-medium text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                    state.activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/60'
                  }`}
                >
                  <span className="mr-2 text-base">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {state.activeTab === 'overview' && renderOverview()}
        {state.activeTab === 'eyeinfo' && renderEyeInfo()}
        {state.activeTab === 'analysis' && renderAnalysis()}
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