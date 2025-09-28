"use strict";
(self["webpackChunkeyezen_chrome_extension"] = self["webpackChunkeyezen_chrome_extension"] || []).push([["ui_components_BreakDetailModal_tsx"],{

/***/ "./ui/components/BreakDetailModal.tsx":
/*!********************************************!*\
  !*** ./ui/components/BreakDetailModal.tsx ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _types_index__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../types/index */ "./types/index.ts");



const BREAK_INFO = {
    [_types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.MICRO]: {
        title: 'Quick Break',
        duration: 20,
        icon: '⚡',
        description: 'A quick 20-second eye exercise to refresh your vision and reduce strain.',
        instructions: [
            'Look away from your screen',
            'Focus on an object 20 feet away',
            'Blink slowly and deliberately',
            'Take a deep breath and relax'
        ],
        benefits: [
            'Reduces eye strain',
            'Prevents dry eyes',
            'Improves focus',
            'Quick refresh'
        ],
        color: {
            primary: 'yellow-500',
            secondary: 'orange-400',
            gradient: 'from-yellow-300 to-orange-400'
        }
    },
    [_types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.SHORT]: {
        title: 'Eye Break',
        duration: 300, // 5 minutes
        icon: '👁️',
        description: 'A comprehensive 5-minute break with eye exercises and relaxation techniques.',
        instructions: [
            'Follow the 20-20-20 rule',
            'Perform gentle eye movements',
            'Practice blinking exercises',
            'Do neck and shoulder stretches',
            'Hydrate with water'
        ],
        benefits: [
            'Deep eye relaxation',
            'Improved circulation',
            'Reduced muscle tension',
            'Better posture',
            'Enhanced productivity'
        ],
        color: {
            primary: 'green-500',
            secondary: 'emerald-400',
            gradient: 'from-green-400 to-emerald-500'
        }
    },
    [_types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.LONG]: {
        title: 'Wellness Break',
        duration: 900, // 15 minutes
        icon: '🧘',
        description: 'A complete 15-minute wellness session with meditation, exercises, and eye care.',
        instructions: [
            'Step away from your workspace',
            'Practice mindful breathing',
            'Do comprehensive eye exercises',
            'Perform TCM acupressure massage',
            'Take a short walk if possible',
            'Hydrate and have a healthy snack'
        ],
        benefits: [
            'Complete eye restoration',
            'Stress reduction',
            'Improved mental clarity',
            'Better circulation',
            'Enhanced well-being',
            'Increased energy'
        ],
        color: {
            primary: 'purple-500',
            secondary: 'indigo-400',
            gradient: 'from-purple-400 to-indigo-500'
        }
    }
};
const BreakDetailModal = ({ isOpen, breakType, onClose, onStartBreak }) => {
    const [timerState, setTimerState] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({
        isRunning: false,
        timeRemaining: 0,
        totalTime: 0,
        isCompleted: false
    });
    const timerRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
    const audioRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);
    const breakInfo = breakType ? BREAK_INFO[breakType] : null;
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
        if (breakType && breakInfo) {
            setTimerState({
                isRunning: false,
                timeRemaining: breakInfo.duration,
                totalTime: breakInfo.duration,
                isCompleted: false
            });
        }
    }, [breakType, breakInfo]);
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    const startTimer = () => {
        setTimerState(prev => ({ ...prev, isRunning: true }));
        timerRef.current = setInterval(() => {
            setTimerState(prev => {
                if (prev.timeRemaining <= 1) {
                    // Timer completed
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                    }
                    playCompletionSound();
                    return {
                        ...prev,
                        timeRemaining: 0,
                        isRunning: false,
                        isCompleted: true
                    };
                }
                return {
                    ...prev,
                    timeRemaining: prev.timeRemaining - 1
                };
            });
        }, 1000);
    };
    const pauseTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setTimerState(prev => ({ ...prev, isRunning: false }));
    };
    const resetTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setTimerState(prev => ({
            ...prev,
            isRunning: false,
            timeRemaining: prev.totalTime,
            isCompleted: false
        }));
    };
    const playCompletionSound = () => {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    };
    const handleStartBreak = () => {
        if (breakType) {
            onStartBreak(breakType);
            onClose();
        }
    };
    const getProgressPercentage = () => {
        if (timerState.totalTime === 0)
            return 0;
        return ((timerState.totalTime - timerState.timeRemaining) / timerState.totalTime) * 100;
    };
    if (!isOpen || !breakType || !breakInfo) {
        return null;
    }
    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: `bg-gradient-to-br ${breakInfo.color.gradient} p-6 rounded-t-2xl text-white relative`, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: onClose, className: "absolute top-4 right-4 text-white hover:text-gray-200 transition-colors", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "text-center", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-4xl mb-2", children: breakInfo.icon }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", { className: "text-2xl font-bold mb-2", children: breakInfo.title }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-white/90 text-sm", children: breakInfo.description })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "p-6 border-b border-gray-200", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "text-center mb-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-4xl font-bold text-gray-800 mb-2", children: formatTime(timerState.timeRemaining) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-full bg-gray-200 rounded-full h-3 mb-4", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: `bg-gradient-to-r ${breakInfo.color.gradient} h-3 rounded-full transition-all duration-1000`, style: { width: `${getProgressPercentage()}%` } }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex justify-center space-x-3", children: [!timerState.isRunning && !timerState.isCompleted && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("button", { onClick: startTimer, className: `px-6 py-2 bg-${breakInfo.color.primary} text-white rounded-lg hover:bg-${breakInfo.color.secondary} transition-colors flex items-center space-x-2`, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { children: "Start" })] })), timerState.isRunning && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("button", { onClick: pauseTimer, className: "px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z", clipRule: "evenodd" }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { children: "Pause" })] })), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("button", { onClick: resetTimer, className: "px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors flex items-center space-x-2", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { fillRule: "evenodd", d: "M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z", clipRule: "evenodd" }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { children: "Reset" })] })] }), timerState.isCompleted && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "mt-4 p-4 bg-green-50 border border-green-200 rounded-lg", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-center space-x-2 text-green-800", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z", clipRule: "evenodd" }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "font-medium", children: "Break completed! Great job!" })] }) }))] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "p-6 border-b border-gray-200", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold text-gray-800 mb-3", children: "Instructions" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("ul", { className: "space-y-2", children: breakInfo.instructions.map((instruction, index) => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("li", { className: "flex items-start space-x-2 text-sm text-gray-600", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: `w-5 h-5 rounded-full bg-${breakInfo.color.primary} text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5`, children: index + 1 }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { children: instruction })] }, index))) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "p-6 border-b border-gray-200", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold text-gray-800 mb-3", children: "Benefits" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "grid grid-cols-2 gap-2", children: breakInfo.benefits.map((benefit, index) => ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center space-x-2 text-sm text-gray-600", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: `w-4 h-4 text-${breakInfo.color.primary}`, fill: "currentColor", viewBox: "0 0 20 20", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { children: benefit })] }, index))) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "p-6 flex space-x-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: handleStartBreak, className: `flex-1 bg-gradient-to-r ${breakInfo.color.gradient} text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 font-medium`, children: "Start Full Break Session" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: onClose, className: "px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors", children: "Close" })] })] }) }));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (BreakDetailModal);


/***/ })

}]);
//# sourceMappingURL=ui_components_BreakDetailModal_tsx.js.map