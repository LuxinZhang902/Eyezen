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



const Dashboard = ({ userData, onUpdateSettings, onExportData, onEraseData }) => {
    const [state, setState] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({
        activeTab: 'overview',
        isLoading: true,
        error: null,
        weeklyData: null,
        todayMetrics: [],
        todayBreaks: []
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
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-4 sm:space-y-6", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-4 sm:p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs sm:text-sm font-medium text-gray-600", children: "Eye Score" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xl sm:text-2xl font-bold text-blue-600", children: userData.score.daily })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-5 h-5 sm:w-6 sm:h-6 text-blue-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }) }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "mt-2", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: `text-xs px-2 py-1 rounded-full ${userData.score.trend === 'improving' ? 'bg-green-100 text-green-800' :
                                            userData.score.trend === 'declining' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'}`, children: userData.score.trend }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-4 sm:p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs sm:text-sm font-medium text-gray-600", children: "Breaks Today" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xl sm:text-2xl font-bold text-green-600", children: stats.completedBreaks })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-5 h-5 sm:w-6 sm:h-6 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }) }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "mt-2", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-full bg-gray-200 rounded-full h-2", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "bg-green-600 h-2 rounded-full transition-all duration-300", style: { width: `${Math.min(stats.goalProgress, 100)}%` } }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", { className: "text-xs text-gray-500 mt-1", children: [stats.goalProgress, "% of daily goal"] })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-4 sm:p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs sm:text-sm font-medium text-gray-600", children: "Avg Fatigue" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", { className: "text-xl sm:text-2xl font-bold text-orange-600", children: [stats.avgFatigue, "%"] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-5 h-5 sm:w-6 sm:h-6 text-orange-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 10V3L4 14h7v7l9-11h-7z" }) }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "mt-2", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: `text-xs px-2 py-1 rounded-full ${stats.avgFatigue < 30 ? 'bg-green-100 text-green-800' :
                                            stats.avgFatigue < 70 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'}`, children: stats.avgFatigue < 30 ? 'Low' : stats.avgFatigue < 70 ? 'Moderate' : 'High' }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-4 sm:p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs sm:text-sm font-medium text-gray-600", children: "Break Time" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", { className: "text-xl sm:text-2xl font-bold text-purple-600", children: [stats.totalBreakTime, "m"] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-5 h-5 sm:w-6 sm:h-6 text-purple-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }) }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "mt-2", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs text-gray-500", children: "Time invested in eye health" }) })] })] }), state.weeklyData && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-4 sm:p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4", children: "Weekly Summary" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h4", { className: "font-medium text-gray-700 mb-2 text-sm sm:text-base", children: "Improvements" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ul", { className: "space-y-2", children: state.weeklyData.improvements.map((improvement, index) => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("li", { className: "text-xs sm:text-sm text-green-700 flex items-start", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-3 h-3 sm:w-4 sm:h-4 mr-2 mt-0.5 flex-shrink-0", fill: "currentColor", viewBox: "0 0 20 20", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }), improvement] }, index))) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h4", { className: "font-medium text-gray-700 mb-2 text-sm sm:text-base", children: "Recommendations" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ul", { className: "space-y-2", children: state.weeklyData.recommendations.map((rec, index) => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("li", { className: "text-xs sm:text-sm text-blue-700 flex items-start", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-3 h-3 sm:w-4 sm:h-4 mr-2 mt-0.5 flex-shrink-0", fill: "currentColor", viewBox: "0 0 20 20", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }) }), rec] }, index))) })] })] })] }))] }));
    };
    const renderSettings = () => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-6", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Detection Settings" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", { className: "text-sm font-medium text-gray-700", children: "Camera Detection" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs text-gray-500", children: "Enable real-time eye tracking" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => handleSettingChange('cameraEnabled', !userData.settings.cameraEnabled), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${userData.settings.cameraEnabled ? 'bg-blue-600' : 'bg-gray-200'}`, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${userData.settings.cameraEnabled ? 'translate-x-6' : 'translate-x-1'}` }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", { className: "text-sm font-medium text-gray-700", children: "Detection Sensitivity" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("select", { value: userData.settings.detectionSensitivity, onChange: (e) => handleSettingChange('detectionSensitivity', e.target.value), className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("option", { value: "low", children: "Low" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("option", { value: "medium", children: "Medium" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("option", { value: "high", children: "High" })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", { className: "text-sm font-medium text-gray-700", children: ["Fatigue Threshold: ", userData.settings.fatigueThreshold, "%"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { type: "range", min: "30", max: "90", value: userData.settings.fatigueThreshold, onChange: (e) => handleSettingChange('fatigueThreshold', parseInt(e.target.value)), className: "mt-1 block w-full" })] })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Reminder Settings" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", { className: "text-sm font-medium text-gray-700", children: "Break Reminders" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs text-gray-500", children: "Get notified when it's time for a break" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => handleSettingChange('reminderEnabled', !userData.settings.reminderEnabled), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${userData.settings.reminderEnabled ? 'bg-blue-600' : 'bg-gray-200'}`, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${userData.settings.reminderEnabled ? 'translate-x-6' : 'translate-x-1'}` }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", { className: "text-sm font-medium text-gray-700", children: ["Reminder Interval: ", userData.settings.reminderInterval, " minutes"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { type: "range", min: "10", max: "60", value: userData.settings.reminderInterval, onChange: (e) => handleSettingChange('reminderInterval', parseInt(e.target.value)), className: "mt-1 block w-full" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", { className: "text-sm font-medium text-gray-700", children: ["Break Duration: ", userData.settings.breakDuration, " seconds"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { type: "range", min: "20", max: "300", step: "10", value: userData.settings.breakDuration, onChange: (e) => handleSettingChange('breakDuration', parseInt(e.target.value)), className: "mt-1 block w-full" })] })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Goals" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", { className: "text-sm font-medium text-gray-700", children: ["Daily Break Goal: ", userData.settings.dailyBreakGoal, " breaks"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { type: "range", min: "3", max: "20", value: userData.settings.dailyBreakGoal, onChange: (e) => handleSettingChange('dailyBreakGoal', parseInt(e.target.value)), className: "mt-1 block w-full" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", { className: "text-sm font-medium text-gray-700", children: ["Eye Score Goal: ", userData.settings.eyeScoreGoal] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { type: "range", min: "60", max: "100", value: userData.settings.eyeScoreGoal, onChange: (e) => handleSettingChange('eyeScoreGoal', parseInt(e.target.value)), className: "mt-1 block w-full" })] })] })] })] }));
    const renderPrivacy = () => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-6", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Privacy Settings" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", { className: "text-sm font-medium text-gray-700", children: "Metrics Only Mode" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs text-gray-500", children: "Store only aggregated metrics, no raw data" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => handleSettingChange('metricsOnly', !userData.settings.metricsOnly), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${userData.settings.metricsOnly ? 'bg-blue-600' : 'bg-gray-200'}`, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${userData.settings.metricsOnly ? 'translate-x-6' : 'translate-x-1'}` }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", { className: "text-sm font-medium text-gray-700", children: ["Data Retention: ", userData.settings.dataRetention, " days"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { type: "range", min: "7", max: "365", value: userData.settings.dataRetention, onChange: (e) => handleSettingChange('dataRetention', parseInt(e.target.value)), className: "mt-1 block w-full" })] })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white p-6 rounded-lg shadow-sm border", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Data Management" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "space-y-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: onExportData, className: "w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors", children: "Export My Data" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: onEraseData, className: "w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors", children: "Erase All Data" })] })] })] }));
    if (state.isLoading) {
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "flex items-center justify-center min-h-screen", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }));
    }
    if (state.error) {
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "flex items-center justify-center min-h-screen", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-red-50 border border-red-200 rounded-lg p-6 max-w-md", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-red-800 font-medium", children: "Error" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-red-600 text-sm", children: state.error })] }) }));
    }
    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "min-h-screen bg-gray-50", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "mb-6 sm:mb-8", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h1", { className: "text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900", children: "EyeZen Dashboard" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm sm:text-base text-gray-600 mt-1", children: "Monitor your eye health and manage your settings" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "border-b border-gray-200 mb-4 sm:mb-6", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("nav", { className: "-mb-px flex space-x-4 sm:space-x-6 lg:space-x-8 overflow-x-auto scrollbar-hide", children: [
                            { id: 'overview', label: 'Overview', icon: '📊' },
                            { id: 'analytics', label: 'Analytics', icon: '📈' },
                            { id: 'goals', label: 'Goals', icon: '🎯' },
                            { id: 'settings', label: 'Settings', icon: '⚙️' },
                            { id: 'privacy', label: 'Privacy', icon: '🔒' }
                        ].map((tab) => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("button", { onClick: () => setState(prev => ({ ...prev, activeTab: tab.id })), className: `py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${state.activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "mr-1 sm:mr-2 text-sm sm:text-base", children: tab.icon }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "hidden sm:inline", children: tab.label }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "sm:hidden", children: tab.label.slice(0, 3) })] }, tab.id))) }) }), state.activeTab === 'overview' && renderOverview(), state.activeTab === 'settings' && renderSettings(), state.activeTab === 'privacy' && renderPrivacy(), state.activeTab === 'analytics' && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-center py-12", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-gray-500", children: "Analytics view coming soon..." }) })), state.activeTab === 'goals' && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-center py-12", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-gray-500", children: "Goals management coming soon..." }) }))] }) }));
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
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
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
/******/ 		// no chunk on demand loading
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["vendors","core_storage_index_ts","ui_styles_popup_css"], () => (__webpack_require__("./ui/options.tsx")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=options.js.map