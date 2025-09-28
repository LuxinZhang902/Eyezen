/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./ui/components/Dashboard.tsx":
/*!*************************************!*\
  !*** ./ui/components/Dashboard.tsx ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _core_storage_index__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../core/storage/index */ "./core/storage/index.ts");



// Lazy load AI services
const loadAIServices = () => Promise.all([
    __webpack_require__.e(/*! import() */ "core_api_openai-service_ts").then(__webpack_require__.bind(__webpack_require__, /*! ../../core/api/openai-service */ "./core/api/openai-service.ts")).then(m => m.ChromeAIService),
    Promise.all(/*! import() */[__webpack_require__.e("core_api_openai-service_ts"), __webpack_require__.e("core_coach_index_ts")]).then(__webpack_require__.bind(__webpack_require__, /*! ../../core/coach/index */ "./core/coach/index.ts")).then(m => m.AICoachService),
    Promise.all(/*! import() */[__webpack_require__.e("core_api_openai-service_ts"), __webpack_require__.e("core_ai_chrome-ai-vision_ts")]).then(__webpack_require__.bind(__webpack_require__, /*! ../../core/ai/chrome-ai-vision */ "./core/ai/chrome-ai-vision.ts")).then(m => m.ChromeAIVisionService)
]);
const Dashboard = ({ userData, onUpdateSettings, onExportData, onEraseData }) => {
    const [state, setState] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({
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
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
        loadDashboardData();
    }, []);
    const loadDashboardData = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const [todayMetrics, todayBreaks] = await Promise.all([
                _core_storage_index__WEBPACK_IMPORTED_MODULE_2__.ChromeStorageService.getMetrics(today, tomorrow),
                _core_storage_index__WEBPACK_IMPORTED_MODULE_2__.ChromeStorageService.getBreakSessions(today, tomorrow)
            ]);
            // Generate mock weekly summary for now
            const weeklyData = {
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
        }
        catch (error) {
            console.error('Failed to load dashboard data:', error);
            setState(prev => ({
                ...prev,
                error: 'Failed to load dashboard data',
                isLoading: false
            }));
        }
    };
    const handleSettingChange = (key, value) => {
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
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-6 sm:space-y-8", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-gradient-to-br from-blue-50 to-indigo-100 p-6 sm:p-8 rounded-2xl shadow-lg border border-blue-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm font-medium text-blue-700 mb-2", children: "Eye Score" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-3xl sm:text-4xl font-bold text-blue-800", children: userData.score.daily }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs text-blue-600 mt-1", children: "stable" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-7 h-7 sm:w-8 sm:h-8 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }) }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "mt-4", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: `text-xs px-3 py-1 rounded-full font-medium ${userData.score.trend === 'improving' ? 'bg-green-200 text-green-800' :
                                            userData.score.trend === 'declining' ? 'bg-red-200 text-red-800' :
                                                'bg-blue-200 text-blue-800'}`, children: userData.score.trend }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-gradient-to-br from-green-50 to-emerald-100 p-6 sm:p-8 rounded-2xl shadow-lg border border-green-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm font-medium text-green-700 mb-2", children: "Breaks Today" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-3xl sm:text-4xl font-bold text-green-800", children: stats.completedBreaks }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs text-green-600 mt-1", children: "0% of daily goal" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-7 h-7 sm:w-8 sm:h-8 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }) }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "mt-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-full bg-green-200/50 rounded-full h-3", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm", style: { width: `${Math.min(stats.goalProgress, 100)}%` } }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", { className: "text-xs text-green-700 mt-2 font-medium", children: [stats.goalProgress, "% of daily goal"] })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-gradient-to-br from-orange-50 to-amber-100 p-6 sm:p-8 rounded-2xl shadow-lg border border-orange-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm font-medium text-orange-700 mb-2", children: "Avg Fatigue" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", { className: "text-3xl sm:text-4xl font-bold text-orange-800", children: [stats.avgFatigue, "%"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs text-orange-600 mt-1", children: "Low" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-7 h-7 sm:w-8 sm:h-8 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 10V3L4 14h7v7l9-11h-7z" }) }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "mt-4", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: `text-xs px-3 py-1 rounded-full font-medium ${stats.avgFatigue < 30 ? 'bg-green-200 text-green-800' :
                                            stats.avgFatigue < 70 ? 'bg-yellow-200 text-yellow-800' :
                                                'bg-red-200 text-red-800'}`, children: stats.avgFatigue < 30 ? 'Low' : stats.avgFatigue < 70 ? 'Moderate' : 'High' }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-gradient-to-br from-purple-50 to-violet-100 p-6 sm:p-8 rounded-2xl shadow-lg border border-purple-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm font-medium text-purple-700 mb-2", children: "Break Time" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", { className: "text-3xl sm:text-4xl font-bold text-purple-800", children: [stats.totalBreakTime, "m"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs text-purple-600 mt-1", children: "Time invested in eye health" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-7 h-7 sm:w-8 sm:h-8 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" }) }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "mt-4", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-xs px-3 py-1 rounded-full font-medium bg-purple-200 text-purple-800", children: "Excellent" }) })] })] }), state.weeklyData && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-gradient-to-br from-slate-50 to-gray-100 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("h3", { className: "text-xl sm:text-2xl font-bold text-gray-800 mb-6 flex items-center", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center mr-3", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-5 h-5 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }) }) }), "Weekly Summary"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200/50", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("h4", { className: "font-bold text-green-800 mb-4 text-lg flex items-center", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-4 h-4 text-white", fill: "currentColor", viewBox: "0 0 20 20", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }) }), "Improvements"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ul", { className: "space-y-3", children: state.weeklyData.improvements.map((improvement, index) => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("li", { className: "text-sm text-green-800 flex items-start bg-white/60 p-3 rounded-lg", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-4 h-4 mr-3 mt-0.5 flex-shrink-0 text-green-600", fill: "currentColor", viewBox: "0 0 20 20", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }), improvement] }, index))) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200/50", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("h4", { className: "font-bold text-blue-800 mb-4 text-lg flex items-center", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-4 h-4 text-white", fill: "currentColor", viewBox: "0 0 20 20", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }) }) }), "Recommendations"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ul", { className: "space-y-3", children: state.weeklyData.recommendations.map((rec, index) => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("li", { className: "text-sm text-blue-800 flex items-start bg-white/60 p-3 rounded-lg", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-4 h-4 mr-3 mt-0.5 flex-shrink-0 text-blue-600", fill: "currentColor", viewBox: "0 0 20 20", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }) }), rec] }, index))) })] })] })] }))] }));
    };
    const renderSettings = () => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-6", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Detection Settings" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", { className: "text-sm font-medium text-gray-700", children: "Camera Detection" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs text-gray-500", children: "Enable real-time eye tracking" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => handleSettingChange('cameraEnabled', !userData.settings.cameraEnabled), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${userData.settings.cameraEnabled ? 'bg-blue-600' : 'bg-gray-200'}`, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${userData.settings.cameraEnabled ? 'translate-x-6' : 'translate-x-1'}` }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", { className: "text-sm font-medium text-gray-700", children: "Detection Sensitivity" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("select", { value: userData.settings.detectionSensitivity, onChange: (e) => handleSettingChange('detectionSensitivity', e.target.value), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("option", { value: "low", children: "Low" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("option", { value: "medium", children: "Medium" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("option", { value: "high", children: "High" })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", { className: "text-sm font-medium text-gray-700", children: ["Fatigue Threshold: ", userData.settings.fatigueThreshold, "%"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { type: "range", min: "30", max: "90", value: userData.settings.fatigueThreshold, onChange: (e) => handleSettingChange('fatigueThreshold', parseInt(e.target.value)), className: "mt-1 block w-full" })] })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Reminder Settings" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", { className: "text-sm font-medium text-gray-700", children: "Break Reminders" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs text-gray-500", children: "Get notified when it's time for a break" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => handleSettingChange('reminderEnabled', !userData.settings.reminderEnabled), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${userData.settings.reminderEnabled ? 'bg-blue-600' : 'bg-gray-200'}`, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${userData.settings.reminderEnabled ? 'translate-x-6' : 'translate-x-1'}` }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", { className: "text-sm font-medium text-gray-700", children: ["Reminder Interval: ", userData.settings.reminderInterval, " minutes"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { type: "range", min: "10", max: "60", value: userData.settings.reminderInterval, onChange: (e) => handleSettingChange('reminderInterval', parseInt(e.target.value)), className: "mt-1 block w-full" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", { className: "text-sm font-medium text-gray-700", children: ["Break Duration: ", userData.settings.breakDuration, " seconds"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { type: "range", min: "20", max: "300", step: "10", value: userData.settings.breakDuration, onChange: (e) => handleSettingChange('breakDuration', parseInt(e.target.value)), className: "mt-1 block w-full" })] })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Goals" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", { className: "text-sm font-medium text-gray-700", children: ["Daily Break Goal: ", userData.settings.dailyBreakGoal, " breaks"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { type: "range", min: "3", max: "20", value: userData.settings.dailyBreakGoal, onChange: (e) => handleSettingChange('dailyBreakGoal', parseInt(e.target.value)), className: "mt-1 block w-full" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", { className: "text-sm font-medium text-gray-700", children: ["Eye Score Goal: ", userData.settings.eyeScoreGoal] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { type: "range", min: "60", max: "100", value: userData.settings.eyeScoreGoal, onChange: (e) => handleSettingChange('eyeScoreGoal', parseInt(e.target.value)), className: "mt-1 block w-full" })] })] })] })] }));
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
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-6", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Real-time Eye Metrics" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-blue-50 p-4 rounded-lg", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h4", { className: "text-sm font-medium text-blue-800", children: "Fatigue Score" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", { className: "text-2xl font-bold text-blue-600", children: [eyeMetrics.fatigueScore, "%"] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-green-50 p-4 rounded-lg", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h4", { className: "text-sm font-medium text-green-800", children: "Blink Rate" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", { className: "text-2xl font-bold text-green-600", children: [eyeMetrics.blinkRate, "/min"] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-purple-50 p-4 rounded-lg", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h4", { className: "text-sm font-medium text-purple-800", children: "Posture" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-2xl font-bold text-purple-600", children: eyeMetrics.posture })] })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Connection Status" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm text-gray-600", children: connectionStatus }), alerts.map((alert, index) => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm text-blue-800", children: alert.message }) }, index)))] })] }));
    };
    const renderAnalysis = () => {
        const handleImageUpload = async (event) => {
            const file = event.target.files?.[0];
            if (!file)
                return;
            setState(prev => ({ ...prev, aiLoading: true }));
            try {
                const [ChromeAIService, AICoachService, ChromeAIVisionService] = await loadAIServices();
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const imageData = e.target?.result;
                    try {
                        const analysis = await ChromeAIVisionService.analyzeEyeStrain(imageData);
                        const result = {
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
                    }
                    catch (error) {
                        console.error('Analysis failed:', error);
                        setState(prev => ({ ...prev, aiLoading: false }));
                    }
                };
                reader.readAsDataURL(file);
            }
            catch (error) {
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
                        const result = {
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
                    }
                    catch (error) {
                        console.error('Camera analysis failed:', error);
                        setState(prev => ({ ...prev, aiLoading: false }));
                    }
                };
            }
            catch (error) {
                console.error('Camera access failed:', error);
                setState(prev => ({ ...prev, aiLoading: false }));
            }
        };
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-6", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "AI Eye Strain Analysis" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex space-x-4 mb-6", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => setState(prev => ({ ...prev, analysisMode: 'camera-capture' })), className: `px-4 py-2 rounded-lg transition-colors ${state.analysisMode === 'camera-capture'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "\uD83D\uDCF7 Camera Capture" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => setState(prev => ({ ...prev, analysisMode: 'upload-photo' })), className: `px-4 py-2 rounded-lg transition-colors ${state.analysisMode === 'upload-photo'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "\uD83D\uDCC1 Upload Photo" })] }), state.analysisMode === 'camera-capture' ? ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: handleCameraCapture, disabled: state.aiLoading, className: "w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: state.aiLoading ? 'Analyzing...' : '📷 Capture & Analyze' }), state.cameraAnalysisResult && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "mt-4 p-4 bg-blue-50 rounded-lg", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h4", { className: "font-medium text-blue-800 mb-2", children: "Camera Analysis Result" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "grid grid-cols-2 gap-4 mb-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-sm text-blue-600", children: "Eye Strain Score:" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", { className: "ml-2 font-bold text-blue-800", children: [state.cameraAnalysisResult.eyeStrainScore, "%"] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-sm text-blue-600", children: "Confidence:" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", { className: "ml-2 font-bold text-blue-800", children: [state.cameraAnalysisResult.confidence, "%"] })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm text-blue-700", children: state.cameraAnalysisResult.summary })] }))] })) : ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "border-2 border-dashed border-gray-300 rounded-lg p-6 text-center", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { type: "file", accept: "image/*", onChange: handleImageUpload, disabled: state.aiLoading, className: "hidden", id: "image-upload" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", { htmlFor: "image-upload", className: `cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${state.aiLoading ? 'opacity-50 cursor-not-allowed' : ''}`, children: state.aiLoading ? 'Analyzing...' : '📁 Choose Image' }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm text-gray-500 mt-2", children: "Upload a photo for AI eye strain analysis" })] }), state.imageAnalysisResult && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "mt-4 p-4 bg-green-50 rounded-lg", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h4", { className: "font-medium text-green-800 mb-2", children: "Image Analysis Result" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "grid grid-cols-2 gap-4 mb-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-sm text-green-600", children: "Eye Strain Score:" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", { className: "ml-2 font-bold text-green-800", children: [state.imageAnalysisResult.eyeStrainScore, "%"] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-sm text-green-600", children: "Confidence:" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", { className: "ml-2 font-bold text-green-800", children: [state.imageAnalysisResult.confidence, "%"] })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm text-green-700", children: state.imageAnalysisResult.summary })] }))] }))] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Analysis Tips" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-start space-x-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-blue-600", children: "\uD83D\uDCA1" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm text-gray-600", children: "For best results, ensure good lighting and look directly at the camera" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-start space-x-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-green-600", children: "\uD83D\uDCF8" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm text-gray-600", children: "Photos should clearly show your eyes and facial expression" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-start space-x-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-purple-600", children: "\uD83D\uDD12" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm text-gray-600", children: "All analysis is performed locally - your images are not stored or transmitted" })] })] })] })] }));
    };
    const renderPrivacy = () => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-6", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Privacy Settings" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", { className: "text-sm font-medium text-gray-700", children: "Metrics Only Mode" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs text-gray-500", children: "Store only aggregated metrics, no raw data" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => handleSettingChange('metricsOnly', !userData.settings.metricsOnly), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${userData.settings.metricsOnly ? 'bg-blue-600' : 'bg-gray-200'}`, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${userData.settings.metricsOnly ? 'translate-x-6' : 'translate-x-1'}` }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", { className: "text-sm font-medium text-gray-700", children: ["Data Retention: ", userData.settings.dataRetention, " days"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { type: "range", min: "7", max: "365", value: userData.settings.dataRetention, onChange: (e) => handleSettingChange('dataRetention', parseInt(e.target.value)), className: "mt-1 block w-full" })] })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Data Management" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: onExportData, className: "w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors", children: "Export My Data" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: onEraseData, className: "w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors", children: "Erase All Data" })] })] })] }));
    if (state.isLoading) {
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "flex items-center justify-center min-h-screen", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }));
    }
    if (state.error) {
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "flex items-center justify-center min-h-screen", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-red-50 border border-red-200 rounded-lg p-6 max-w-md", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-red-800 font-medium", children: "Error" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-red-600 text-sm", children: state.error })] }) }));
    }
    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "mb-8 sm:mb-12 text-center", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h1", { className: "text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4", children: "EyeZen Dashboard" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-base sm:text-lg text-gray-700 max-w-2xl mx-auto", children: "Monitor your eye health and manage your settings with our comprehensive analytics platform" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "mb-8 sm:mb-12", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-2", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("nav", { className: "flex space-x-2 overflow-x-auto scrollbar-hide", children: [
                                { id: 'overview', label: 'Overview', icon: '📊' },
                                { id: 'eyeinfo', label: 'Eye Info', icon: '👁️' },
                                { id: 'analysis', label: 'Analysis', icon: '🔬' },
                                { id: 'analytics', label: 'Analytics', icon: '📈' },
                                { id: 'goals', label: 'Goals', icon: '🎯' },
                                { id: 'settings', label: 'Settings', icon: '⚙️' },
                                { id: 'privacy', label: 'Privacy', icon: '🔒' }
                            ].map((tab) => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("button", { onClick: () => setState(prev => ({ ...prev, activeTab: tab.id })), className: `py-3 px-4 sm:px-6 rounded-xl font-medium text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 ${state.activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/60'}`, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "mr-2 text-base", children: tab.icon }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "hidden sm:inline", children: tab.label }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "sm:hidden", children: tab.label.slice(0, 3) })] }, tab.id))) }) }) }), state.activeTab === 'overview' && renderOverview(), state.activeTab === 'eyeinfo' && renderEyeInfo(), state.activeTab === 'analysis' && renderAnalysis(), state.activeTab === 'settings' && renderSettings(), state.activeTab === 'privacy' && renderPrivacy(), state.activeTab === 'analytics' && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-center py-12", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-gray-500", children: "Analytics view coming soon..." }) })), state.activeTab === 'goals' && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-center py-12", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-gray-500", children: "Goals management coming soon..." }) }))] }) }));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Dashboard);


/***/ }),

/***/ "./ui/options.tsx":
/*!************************!*\
  !*** ./ui/options.tsx ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_dom_client__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-dom/client */ "./node_modules/react-dom/client.js");
/* harmony import */ var _components_Dashboard__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./components/Dashboard */ "./ui/components/Dashboard.tsx");
/* harmony import */ var _core_storage_index__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../core/storage/index */ "./core/storage/index.ts");
/* harmony import */ var _styles_popup_css__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./styles/popup.css */ "./ui/styles/popup.css");






const OptionsPage = () => {
    const [state, setState] = react__WEBPACK_IMPORTED_MODULE_1___default().useState({
        userData: null,
        isLoading: true,
        error: null
    });
    react__WEBPACK_IMPORTED_MODULE_1___default().useEffect(() => {
        loadUserData();
    }, []);
    const loadUserData = async () => {
        try {
            const userData = await _core_storage_index__WEBPACK_IMPORTED_MODULE_4__.ChromeStorageService.getUserData();
            if (!userData) {
                // Initialize with default data if none exists
                await _core_storage_index__WEBPACK_IMPORTED_MODULE_4__.ChromeStorageService.initialize();
                const newUserData = await _core_storage_index__WEBPACK_IMPORTED_MODULE_4__.ChromeStorageService.getUserData();
                setState(prev => ({
                    ...prev,
                    userData: newUserData,
                    isLoading: false
                }));
            }
            else {
                setState(prev => ({
                    ...prev,
                    userData,
                    isLoading: false
                }));
            }
        }
        catch (error) {
            console.error('Failed to load user data:', error);
            setState(prev => ({
                ...prev,
                error: 'Failed to load user data',
                isLoading: false
            }));
        }
    };
    const handleUpdateSettings = async (newSettings) => {
        if (!state.userData)
            return;
        try {
            const updatedUserData = {
                ...state.userData,
                settings: {
                    ...state.userData.settings,
                    ...newSettings
                },
                lastUpdated: Date.now()
            };
            await _core_storage_index__WEBPACK_IMPORTED_MODULE_4__.ChromeStorageService.saveUserData(updatedUserData);
            setState(prev => ({
                ...prev,
                userData: updatedUserData
            }));
            // Notify background script of settings change
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({
                    type: 'SETTINGS_UPDATED',
                    data: { settings: updatedUserData.settings },
                    timestamp: Date.now()
                });
            }
        }
        catch (error) {
            console.error('Failed to update settings:', error);
            setState(prev => ({
                ...prev,
                error: 'Failed to update settings'
            }));
        }
    };
    const handleExportData = async () => {
        try {
            const exportedData = await _core_storage_index__WEBPACK_IMPORTED_MODULE_4__.ChromeStorageService.exportData();
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
        }
        catch (error) {
            console.error('Failed to export data:', error);
            alert('Failed to export data. Please try again.');
        }
    };
    const handleEraseData = async () => {
        const confirmed = confirm('Are you sure you want to erase all your data? This action cannot be undone.');
        if (!confirmed)
            return;
        try {
            await _core_storage_index__WEBPACK_IMPORTED_MODULE_4__.ChromeStorageService.clearAllData();
            // Reinitialize with default data
            await _core_storage_index__WEBPACK_IMPORTED_MODULE_4__.ChromeStorageService.initialize();
            const newUserData = await _core_storage_index__WEBPACK_IMPORTED_MODULE_4__.ChromeStorageService.getUserData();
            setState(prev => ({
                ...prev,
                userData: newUserData
            }));
            // Notify background script
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({
                    type: 'DATA_ERASED',
                    timestamp: Date.now()
                });
            }
            alert('All data has been erased successfully.');
        }
        catch (error) {
            console.error('Failed to erase data:', error);
            alert('Failed to erase data. Please try again.');
        }
    };
    if (state.isLoading) {
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "flex items-center justify-center min-h-screen", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "text-center", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-gray-600", children: "Loading dashboard..." })] }) }));
    }
    if (state.error) {
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "flex items-center justify-center min-h-screen", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-red-50 border border-red-200 rounded-lg p-6 max-w-md", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center space-x-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-6 h-6 text-red-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-red-800 font-medium", children: "Error" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-red-600 text-sm", children: state.error })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: loadUserData, className: "mt-4 w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors", children: "Retry" })] }) }));
    }
    if (!state.userData) {
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "flex items-center justify-center min-h-screen", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "text-center", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-gray-600", children: "No user data found" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: loadUserData, className: "mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors", children: "Initialize Data" })] }) }));
    }
    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_components_Dashboard__WEBPACK_IMPORTED_MODULE_3__["default"], { userData: state.userData, onUpdateSettings: handleUpdateSettings, onExportData: handleExportData, onEraseData: handleEraseData }));
};
// Initialize the React app
const container = document.getElementById('options-root');
if (container) {
    const root = (0,react_dom_client__WEBPACK_IMPORTED_MODULE_2__.createRoot)(container);
    root.render((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(OptionsPage, {}));
}
else {
    console.error('Options root element not found');
}


/***/ }),

/***/ "./ui/styles/popup.css":
/*!*****************************!*\
  !*** ./ui/styles/popup.css ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get mini-css chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.miniCssF = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return undefined;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	(() => {
/******/ 		var inProgress = {};
/******/ 		var dataWebpackPrefix = "eyezen-chrome-extension:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = (url, done, key, chunkId) => {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			var script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					var s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 		
/******/ 				script.src = url;
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			var onScriptComplete = (prev, event) => {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				var doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode && script.parentNode.removeChild(script);
/******/ 				doneFns && doneFns.forEach((fn) => (fn(event)));
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/^blob:/, "").replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"options": 0,
/******/ 			"ui_styles_popup_css": 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.j = (chunkId, promises) => {
/******/ 				// JSONP chunk loading for javascript
/******/ 				var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 				if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 		
/******/ 					// a Promise means "currently loading".
/******/ 					if(installedChunkData) {
/******/ 						promises.push(installedChunkData[2]);
/******/ 					} else {
/******/ 						if("ui_styles_popup_css" != chunkId) {
/******/ 							// setup Promise in chunk cache
/******/ 							var promise = new Promise((resolve, reject) => (installedChunkData = installedChunks[chunkId] = [resolve, reject]));
/******/ 							promises.push(installedChunkData[2] = promise);
/******/ 		
/******/ 							// start chunk loading
/******/ 							var url = __webpack_require__.p + __webpack_require__.u(chunkId);
/******/ 							// create error before stack unwound to get useful stacktrace later
/******/ 							var error = new Error();
/******/ 							var loadingEnded = (event) => {
/******/ 								if(__webpack_require__.o(installedChunks, chunkId)) {
/******/ 									installedChunkData = installedChunks[chunkId];
/******/ 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
/******/ 									if(installedChunkData) {
/******/ 										var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 										var realSrc = event && event.target && event.target.src;
/******/ 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 										error.name = 'ChunkLoadError';
/******/ 										error.type = errorType;
/******/ 										error.request = realSrc;
/******/ 										installedChunkData[1](error);
/******/ 									}
/******/ 								}
/******/ 							};
/******/ 							__webpack_require__.l(url, loadingEnded, "chunk-" + chunkId, chunkId);
/******/ 						} else installedChunks[chunkId] = 0;
/******/ 					}
/******/ 				}
/******/ 		};
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkeyezen_chrome_extension"] = self["webpackChunkeyezen_chrome_extension"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["react","vendors","core_storage_index_ts","ui_styles_popup_css"], () => (__webpack_require__("./ui/options.tsx")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=options.js.map