/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./background/service-worker.ts":
/*!**************************************!*\
  !*** ./background/service-worker.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _core_storage_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/storage/index */ "./core/storage/index.ts");
/* harmony import */ var _types_index__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../types/index */ "./types/index.ts");
/**
 * Background Service Worker
 * Handles alarms, notifications, and background tasks for EyeZen
 */


// Constants
const ALARM_NAMES = {
    BREAK_REMINDER: 'break-reminder',
    DAILY_SUMMARY: 'daily-summary',
    WEEKLY_SUMMARY: 'weekly-summary',
    POSTURE_CHECK: 'posture-check'
};
const DEFAULT_INTERVALS = {
    BREAK_REMINDER: 20, // 20 minutes for 20-20-20 rule
    POSTURE_CHECK: 30, // 30 minutes for posture reminders
    DAILY_SUMMARY: 24 * 60, // Daily at end of day
    WEEKLY_SUMMARY: 7 * 24 * 60 // Weekly summary
};
class BackgroundService {
    constructor() {
        this.isInitialized = false;
        this.activeBreakTabId = null;
    }
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            // Set up alarm listeners
            chrome.alarms.onAlarm.addListener(this.handleAlarm.bind(this));
            // Set up message listeners
            chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
            // Set up installation/startup listeners
            chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
            chrome.runtime.onStartup.addListener(this.handleStartup.bind(this));
            // Set up tab listeners for break management
            chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));
            // Initialize default alarms
            await this.setupDefaultAlarms();
            this.isInitialized = true;
            console.log('EyeZen Background Service initialized');
        }
        catch (error) {
            console.error('Failed to initialize background service:', error);
        }
    }
    async handleAlarm(alarm) {
        console.log('Alarm triggered:', alarm.name);
        try {
            switch (alarm.name) {
                case ALARM_NAMES.BREAK_REMINDER:
                    await this.handleBreakReminder();
                    break;
                case ALARM_NAMES.POSTURE_CHECK:
                    await this.handlePostureCheck();
                    break;
                case ALARM_NAMES.DAILY_SUMMARY:
                    await this.handleDailySummary();
                    break;
                case ALARM_NAMES.WEEKLY_SUMMARY:
                    await this.handleWeeklySummary();
                    break;
                default:
                    console.log('Unknown alarm:', alarm.name);
            }
        }
        catch (error) {
            console.error('Error handling alarm:', alarm.name, error);
        }
    }
    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'START_BREAK':
                    await this.startBreak(message.breakType);
                    sendResponse({ success: true });
                    break;
                case 'END_BREAK':
                    await this.endBreak(message.breakId);
                    sendResponse({ success: true });
                    break;
                case 'UPDATE_SETTINGS':
                    await this.updateSettings(message.settings);
                    sendResponse({ success: true });
                    break;
                case 'GET_STATUS':
                    const status = await this.getStatus();
                    sendResponse({ success: true, data: status });
                    break;
                case 'SNOOZE_REMINDER':
                    await this.snoozeReminder(message.minutes || 5);
                    sendResponse({ success: true });
                    break;
                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        }
        catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: String(error) });
        }
        return true; // Keep message channel open for async response
    }
    async handleInstall(details) {
        if (details.reason === 'install') {
            console.log('EyeZen installed for the first time');
            await this.setupInitialData();
            // Show welcome notification
            await this.showNotification({
                type: 'basic',
                iconUrl: 'assets/icons/icon-48.svg',
                title: 'Welcome to EyeZen! 👁️',
                message: 'Your AI eye health companion is ready. Click to get started!'
            });
        }
        else if (details.reason === 'update') {
            console.log('EyeZen updated to version:', chrome.runtime.getManifest().version);
        }
    }
    async handleStartup() {
        console.log('EyeZen service worker started');
        await this.setupDefaultAlarms();
    }
    async handleTabRemoved(tabId) {
        if (this.activeBreakTabId === tabId) {
            this.activeBreakTabId = null;
            console.log('Break tab closed');
        }
    }
    async setupDefaultAlarms() {
        try {
            const userData = await _core_storage_index__WEBPACK_IMPORTED_MODULE_0__.ChromeStorageService.getUserData();
            const settings = userData?.settings || _types_index__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_SETTINGS;
            // Clear existing alarms
            await chrome.alarms.clearAll();
            // Set up break reminder alarm
            if (settings.reminderEnabled ?? true) {
                const interval = settings.reminderInterval ?? DEFAULT_INTERVALS.BREAK_REMINDER;
                await chrome.alarms.create(ALARM_NAMES.BREAK_REMINDER, {
                    delayInMinutes: interval,
                    periodInMinutes: interval
                });
            }
            // Set up posture check alarm
            if (settings.reminderEnabled ?? true) {
                await chrome.alarms.create(ALARM_NAMES.POSTURE_CHECK, {
                    delayInMinutes: DEFAULT_INTERVALS.POSTURE_CHECK,
                    periodInMinutes: DEFAULT_INTERVALS.POSTURE_CHECK
                });
            }
            // Set up daily summary alarm (8 PM)
            const now = new Date();
            const dailySummaryTime = new Date();
            dailySummaryTime.setHours(20, 0, 0, 0); // 8 PM
            if (dailySummaryTime <= now) {
                dailySummaryTime.setDate(dailySummaryTime.getDate() + 1);
            }
            await chrome.alarms.create(ALARM_NAMES.DAILY_SUMMARY, {
                when: dailySummaryTime.getTime(),
                periodInMinutes: DEFAULT_INTERVALS.DAILY_SUMMARY
            });
            console.log('Default alarms set up successfully');
        }
        catch (error) {
            console.error('Failed to setup default alarms:', error);
        }
    }
    async handleBreakReminder() {
        try {
            const userData = await _core_storage_index__WEBPACK_IMPORTED_MODULE_0__.ChromeStorageService.getUserData();
            if (!userData || !userData.settings.reminderEnabled) {
                return;
            }
            // Check if user is currently in a break
            const activeBreak = userData.breaks.find(b => !b.completed);
            if (activeBreak) {
                console.log('User is already in a break, skipping reminder');
                return;
            }
            // Check recent activity to determine reminder urgency
            const recentMetrics = userData.metrics.slice(-5);
            const avgEyeStrain = recentMetrics.reduce((sum, m) => sum + (m.fatigueIndex || 0), 0) / recentMetrics.length;
            let title = '👁️ Time for an Eye Break!';
            let message = 'Follow the 20-20-20 rule: Look at something 20 feet away for 20 seconds.';
            let priority = 0;
            if (avgEyeStrain > 0.7) {
                title = '⚠️ High Eye Strain Detected!';
                message = 'Your eyes need immediate rest. Take a break now to prevent fatigue.';
                priority = 2;
            }
            else if (avgEyeStrain > 0.5) {
                title = '😴 Eyes Getting Tired';
                message = 'Time for a refreshing eye break. Your future self will thank you!';
                priority = 1;
            }
            await this.showNotification({
                type: 'basic',
                iconUrl: 'assets/icons/icon-48.svg',
                title,
                message,
                priority,
                buttons: [
                    { title: 'Start Break' },
                    { title: 'Snooze 5min' }
                ]
            });
        }
        catch (error) {
            console.error('Error in break reminder:', error);
        }
    }
    async handlePostureCheck() {
        try {
            const userData = await _core_storage_index__WEBPACK_IMPORTED_MODULE_0__.ChromeStorageService.getUserData();
            if (!userData || !userData.settings.reminderEnabled) {
                return;
            }
            await this.showNotification({
                type: 'basic',
                iconUrl: 'assets/icons/icon-48.svg',
                title: '🧘 Posture Check',
                message: 'Sit up straight, relax your shoulders, and adjust your screen height.',
                priority: 0
            });
        }
        catch (error) {
            console.error('Error in posture check:', error);
        }
    }
    async handleDailySummary() {
        try {
            // Generate and show daily summary
            const userData = await _core_storage_index__WEBPACK_IMPORTED_MODULE_0__.ChromeStorageService.getUserData();
            if (!userData)
                return;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayMetrics = userData.metrics.filter(m => {
                const metricDate = new Date(m.timestamp);
                metricDate.setHours(0, 0, 0, 0);
                return metricDate.getTime() === today.getTime();
            });
            const todayBreaks = userData.breaks.filter(b => {
                const breakDate = new Date(b.startTime);
                breakDate.setHours(0, 0, 0, 0);
                return breakDate.getTime() === today.getTime() && b.completed;
            });
            const avgEyeHealth = todayMetrics.length > 0
                ? todayMetrics.reduce((sum, m) => sum + (100 - (m.fatigueIndex || 0) * 100), 0) / todayMetrics.length
                : 50;
            await this.showNotification({
                type: 'basic',
                iconUrl: 'assets/icons/icon-48.svg',
                title: '📊 Daily Eye Health Summary',
                message: `Eye Health Score: ${Math.round(avgEyeHealth)}/100 | Breaks Taken: ${todayBreaks.length}`,
                priority: 0
            });
        }
        catch (error) {
            console.error('Error in daily summary:', error);
        }
    }
    async handleWeeklySummary() {
        try {
            // Generate weekly summary - placeholder for now
            await this.showNotification({
                type: 'basic',
                iconUrl: 'assets/icons/icon-48.svg',
                title: '📈 Weekly Eye Health Report',
                message: 'Your weekly eye health report is ready! Click to view insights.',
                priority: 1
            });
        }
        catch (error) {
            console.error('Error in weekly summary:', error);
        }
    }
    async startBreak(breakType) {
        try {
            // Create break record
            const breakId = Date.now().toString();
            const breakData = {
                id: breakId,
                type: breakType,
                duration: breakType === _types_index__WEBPACK_IMPORTED_MODULE_1__.BreakType.MICRO ? 20 : breakType === _types_index__WEBPACK_IMPORTED_MODULE_1__.BreakType.SHORT ? 300 : 900,
                startTime: Date.now(),
                completed: false,
                activities: []
            };
            // Save break to storage
            const userData = await _core_storage_index__WEBPACK_IMPORTED_MODULE_0__.ChromeStorageService.getUserData();
            if (userData) {
                userData.breaks.push(breakData);
                await _core_storage_index__WEBPACK_IMPORTED_MODULE_0__.ChromeStorageService.saveUserData(userData);
            }
            // Open break ritual page
            const breakUrl = chrome.runtime.getURL(`break-ritual.html?type=${breakType}&id=${breakId}`);
            const tab = await chrome.tabs.create({ url: breakUrl });
            this.activeBreakTabId = tab.id || null;
            console.log('Break started:', breakType, breakId);
        }
        catch (error) {
            console.error('Error starting break:', error);
            throw error;
        }
    }
    async endBreak(breakId) {
        try {
            const userData = await _core_storage_index__WEBPACK_IMPORTED_MODULE_0__.ChromeStorageService.getUserData();
            if (userData) {
                const breakIndex = userData.breaks.findIndex(b => b.id === breakId);
                if (breakIndex !== -1) {
                    userData.breaks[breakIndex].completed = true;
                    userData.breaks[breakIndex].endTime = Date.now();
                    await _core_storage_index__WEBPACK_IMPORTED_MODULE_0__.ChromeStorageService.saveUserData(userData);
                }
            }
            console.log('Break completed:', breakId);
        }
        catch (error) {
            console.error('Error ending break:', error);
            throw error;
        }
    }
    async updateSettings(settings) {
        try {
            await _core_storage_index__WEBPACK_IMPORTED_MODULE_0__.ChromeStorageService.updateSettings(settings);
            // Recreate alarms with new settings
            await this.setupDefaultAlarms();
            console.log('Settings updated:', settings);
        }
        catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    }
    async getStatus() {
        try {
            const userData = await _core_storage_index__WEBPACK_IMPORTED_MODULE_0__.ChromeStorageService.getUserData();
            return {
                isActive: true,
                settings: userData?.settings || {},
                lastBreak: userData?.breaks.slice(-1)[0] || null,
                todayMetrics: userData?.metrics.filter(m => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const metricDate = new Date(m.timestamp);
                    metricDate.setHours(0, 0, 0, 0);
                    return metricDate.getTime() === today.getTime();
                }) || []
            };
        }
        catch (error) {
            console.error('Error getting status:', error);
            throw error;
        }
    }
    async snoozeReminder(minutes) {
        try {
            // Clear current break reminder
            await chrome.alarms.clear(ALARM_NAMES.BREAK_REMINDER);
            // Set new alarm for snooze duration
            await chrome.alarms.create(ALARM_NAMES.BREAK_REMINDER, {
                delayInMinutes: minutes
            });
            console.log(`Break reminder snoozed for ${minutes} minutes`);
        }
        catch (error) {
            console.error('Error snoozing reminder:', error);
            throw error;
        }
    }
    async setupInitialData() {
        try {
            const initialData = {
                settings: {
                    cameraEnabled: true,
                    detectionSensitivity: 'medium',
                    fatigueThreshold: 70,
                    reminderEnabled: true,
                    reminderInterval: 20,
                    breakDuration: 20,
                    dataRetention: 30,
                    metricsOnly: false,
                    language: 'en',
                    theme: 'light',
                    notifications: true,
                    sounds: true,
                    dailyBreakGoal: 8,
                    eyeScoreGoal: 80
                },
                metrics: [],
                breaks: [],
                events: [],
                score: {
                    current: 50,
                    daily: 50,
                    weekly: 50,
                    trend: 'stable'
                },
                lastUpdated: Date.now()
            };
            await _core_storage_index__WEBPACK_IMPORTED_MODULE_0__.ChromeStorageService.saveUserData(initialData);
            console.log('Initial data setup completed');
        }
        catch (error) {
            console.error('Error setting up initial data:', error);
        }
    }
    async showNotification(options) {
        try {
            const notificationId = `eyezen-${Date.now()}`;
            // Set default options
            const notificationOptions = {
                type: 'basic',
                iconUrl: 'assets/icons/icon-48.svg',
                title: 'EyeZen',
                message: '',
                priority: 0,
                ...options
            };
            // Create notification with required properties only
            const createOptions = {
                type: 'basic',
                iconUrl: notificationOptions.iconUrl || 'assets/icons/icon-48.svg',
                title: notificationOptions.title || 'EyeZen',
                message: notificationOptions.message || ''
            };
            // Add optional properties if they exist
            if (notificationOptions.buttons) {
                createOptions.buttons = notificationOptions.buttons;
            }
            await chrome.notifications.create(notificationId, createOptions);
            // Auto-clear notification after 10 seconds for low priority
            if ((options.priority || 0) === 0) {
                setTimeout(() => {
                    chrome.notifications.clear(notificationId);
                }, 10000);
            }
        }
        catch (error) {
            console.error('Error showing notification:', error);
        }
    }
}
// Initialize the background service
const backgroundService = new BackgroundService();
backgroundService.initialize();
// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId.startsWith('eyezen-')) {
        // Open popup or options page
        chrome.action.openPopup();
        chrome.notifications.clear(notificationId);
    }
});
// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (notificationId.startsWith('eyezen-')) {
        if (buttonIndex === 0) {
            // Start Break button
            backgroundService.initialize().then(() => {
                chrome.runtime.sendMessage({ action: 'START_BREAK', breakType: _types_index__WEBPACK_IMPORTED_MODULE_1__.BreakType.SHORT });
            });
        }
        else if (buttonIndex === 1) {
            // Snooze button
            backgroundService.initialize().then(() => {
                chrome.runtime.sendMessage({ action: 'SNOOZE_REMINDER', minutes: 5 });
            });
        }
        chrome.notifications.clear(notificationId);
    }
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (backgroundService);


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
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
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
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"background": 0
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["core_storage_index_ts"], () => (__webpack_require__("./background/service-worker.ts")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=background.js.map