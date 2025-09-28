/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./ui/components/Popup.tsx":
/*!*********************************!*\
  !*** ./ui/components/Popup.tsx ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _types_index__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../types/index */ "./types/index.ts");
/* harmony import */ var _core_storage_index__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../core/storage/index */ "./core/storage/index.ts");

/**
 * Popup Component
 * Main popup interface for the EyeZen Chrome Extension
 */



// Lazy load heavy components
const CameraPermissionPopup = (0,react__WEBPACK_IMPORTED_MODULE_1__.lazy)(() => __webpack_require__.e(/*! import() */ "ui_components_CameraPermissionPopup_tsx").then(__webpack_require__.bind(__webpack_require__, /*! ./CameraPermissionPopup */ "./ui/components/CameraPermissionPopup.tsx")));
const LoginModal = (0,react__WEBPACK_IMPORTED_MODULE_1__.lazy)(() => __webpack_require__.e(/*! import() */ "ui_components_LoginModal_tsx").then(__webpack_require__.bind(__webpack_require__, /*! ./LoginModal */ "./ui/components/LoginModal.tsx")));
const BreakDetailModal = (0,react__WEBPACK_IMPORTED_MODULE_1__.lazy)(() => __webpack_require__.e(/*! import() */ "ui_components_BreakDetailModal_tsx").then(__webpack_require__.bind(__webpack_require__, /*! ./BreakDetailModal */ "./ui/components/BreakDetailModal.tsx")));
// Lazy load heavy services
const loadAIServices = () => Promise.all([
    __webpack_require__.e(/*! import() */ "core_api_openai-service_ts").then(__webpack_require__.bind(__webpack_require__, /*! ../../core/api/openai-service */ "./core/api/openai-service.ts")).then(m => m.ChromeAIService),
    Promise.all(/*! import() */[__webpack_require__.e("core_api_openai-service_ts"), __webpack_require__.e("core_coach_index_ts")]).then(__webpack_require__.bind(__webpack_require__, /*! ../../core/coach/index */ "./core/coach/index.ts")).then(m => m.AICoachService),
    Promise.all(/*! import() */[__webpack_require__.e("core_api_openai-service_ts"), __webpack_require__.e("core_ai_chrome-ai-vision_ts")]).then(__webpack_require__.bind(__webpack_require__, /*! ../../core/ai/chrome-ai-vision */ "./core/ai/chrome-ai-vision.ts")).then(m => m.ChromeAIVisionService)
]);
const loadMetricsService = () => __webpack_require__.e(/*! import() */ "core_metrics_index_ts").then(__webpack_require__.bind(__webpack_require__, /*! ../../core/metrics/index */ "./core/metrics/index.ts")).then(m => m.EyeHealthScorer);
const Popup = ({ onStartBreak, onOpenSettings }) => {
    const lastLogTimeRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(0);
    const [state, setState] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({
        status: _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.GOOD,
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
        recommendedBreakType: _types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.MICRO,
        aiLoading: true,
        showLoginModal: false,
        isLoggedIn: false,
        userEmail: '',
        isModalOpen: false,
        selectedBreakType: null
    });
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
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
        const messageListener = (message, sender, sendResponse) => {
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
                }
                catch (error) {
                    console.log('🔄 POPUP: Error polling storage for metrics:', error);
                }
            }, 1000); // Check every second
            // Store the storage polling interval for cleanup
            window.storagePollingInterval = storagePollingInterval;
        }
        return () => {
            clearInterval(interval);
            clearInterval(permissionCheckInterval);
            clearInterval(stateValidationInterval);
            if (window.storagePollingInterval) {
                clearInterval(window.storagePollingInterval);
            }
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.onMessage.removeListener(messageListener);
            }
        };
        // removed by dead control flow

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
        }
        catch (error) {
            console.error('Failed to load login state:', error);
        }
    };
    const loadUserData = async () => {
        console.log('🔥 POPUP: loadUserData function called');
        try {
            let userData = await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.getUserData();
            // Initialize storage if no user data exists
            if (!userData) {
                await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.initialize();
                userData = await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.getUserData();
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
                    .sort((a, b) => b.endTime - a.endTime)[0];
                // Generate AI recommendation
                const avgFatigue = recentMetrics.reduce((sum, m) => sum + (m.fatigueIndex || 0), 0) / recentMetrics.length;
                let recommendedType = _types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.MICRO;
                let recommendation = 'Take a quick 20-second eye break using the 20-20-20 rule.';
                if (avgFatigue > 0.7) {
                    recommendedType = _types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.LONG;
                    recommendation = 'High eye strain detected! Take a 15-minute wellness break with TCM massage.';
                }
                else if (avgFatigue > 0.4) {
                    recommendedType = _types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.SHORT;
                    recommendation = 'Moderate eye fatigue. A 5-minute guided relaxation break is recommended.';
                }
                // Calculate initial real-time score from most recent metrics
                const mostRecentMetric = recentMetrics[recentMetrics.length - 1];
                const initialRealtimeScore = mostRecentMetric
                    ? Math.round(Math.max(0, Math.min(100, 100 - (mostRecentMetric.fatigueIndex * 100))))
                    : -1; // Use -1 if no recent metrics available
                // Initialize camera stream flag - do NOT automatically start camera
                // Camera should only be activated when user explicitly clicks the toggle
                window.eyeZenCameraStream = null;
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
                    recommendedBreakType: recommendedType,
                    aiLoading: false,
                    showLoginModal: false
                    // Preserve existing login state (isLoggedIn, userEmail)
                }));
            }
        }
        catch (error) {
            console.error('🔥 POPUP: Failed to load user data:', error);
            console.error('🔥 POPUP: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    };
    // Handle eye metrics from CV worker
    const handleEyeMetrics = async (eyeMetrics) => {
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
            await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.addMetrics(metricsData);
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
            // Generate AI recommendation using Chrome AI Vision (with fallback)
            let aiRecommendation = 'Your eyes are healthy! Keep up the good work.';
            let recommendedBreakType = _types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.MICRO;
            try {
                // Load Chrome AI Vision service
                const [ChromeAIService, AICoachService, ChromeAIVisionService] = await loadAIServices();
                // Try to get camera frame for AI analysis
                const cameraStream = window.eyeZenCameraStream;
                if (cameraStream && cameraStream.getVideoTracks().length > 0) {
                    // Create a canvas to capture current frame
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
                            aiRecommendation = aiAnalysis.recommendations[0] || 'AI analysis completed';
                            // Map AI strain level to break type
                            if (aiAnalysis.strainLevel > 70) {
                                recommendedBreakType = _types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.LONG;
                            }
                            else if (aiAnalysis.strainLevel > 40) {
                                recommendedBreakType = _types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.SHORT;
                            }
                            else {
                                recommendedBreakType = _types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.MICRO;
                            }
                            console.log('🤖 Chrome AI Vision Analysis:', aiAnalysis);
                        }
                    }
                }
            }
            catch (error) {
                console.warn('Chrome AI Vision analysis failed, using fallback:', error);
                // Fallback to basic rule-based recommendations
                if (eyeMetrics.fatigueIndex > 0.7) {
                    aiRecommendation = 'High eye strain detected! Take a 15-minute wellness break immediately.';
                    recommendedBreakType = _types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.LONG;
                }
                else if (eyeMetrics.fatigueIndex > 0.4) {
                    aiRecommendation = 'Moderate eye fatigue detected. A 5-minute guided relaxation break is recommended.';
                    recommendedBreakType = _types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.SHORT;
                }
                else if (eyeMetrics.blinkRate < 10) {
                    aiRecommendation = 'Low blink rate detected. Remember to blink more frequently!';
                    recommendedBreakType = _types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.MICRO;
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
                recommendedBreakType
            }));
            console.log(`🔥 [${timestamp}] POPUP: Updated realtimeScore:`, Math.round(realtimeFatigueScore));
        }
        catch (error) {
            console.error('Error handling eye metrics:', error);
        }
    };
    const determineUserStatus = (score, metrics) => {
        if (score >= 80)
            return _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.GOOD;
        if (score >= 60)
            return _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.TIRED;
        return _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.CRITICAL;
    };
    const calculateStreakDays = (breaks) => {
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
            }
            else if (i === 0) {
                // If today doesn't have enough breaks, no streak
                break;
            }
            else {
                // Streak broken
                break;
            }
        }
        return streak;
    };
    const getStatusColor = (status) => {
        switch (status) {
            case _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.GOOD:
                return 'text-green-600';
            case _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.TIRED:
                return 'text-yellow-600';
            case _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.CRITICAL:
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.GOOD:
                return '😊';
            case _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.TIRED:
                return '😴';
            case _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.CRITICAL:
                return '😵';
            default:
                return '😐';
        }
    };
    const getScoreColor = (score) => {
        if (score >= 80)
            return 'text-green-600';
        if (score >= 60)
            return 'text-yellow-600';
        return 'text-red-600';
    };
    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'improving':
                return '📈';
            case 'declining':
                return '📉';
            default:
                return '➡️';
        }
    };
    const formatLastBreakTime = (timestamp) => {
        if (!timestamp)
            return 'No recent breaks';
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ago`;
        }
        return `${minutes}m ago`;
    };
    const handleBreakClick = (breakType) => {
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
    const toggleCamera = async () => {
        try {
            // Use state.cameraEnabled instead of window flag for more reliable state
            if (state.cameraEnabled) {
                await stopCameraStream();
            }
            else {
                // Direct camera access - try to request permission immediately
                await requestCameraDirectly();
            }
        }
        catch (error) {
            console.error('Failed to toggle camera:', error);
        }
    };
    const downloadCurrentFrame = async () => {
        try {
            if (!state.cameraEnabled) {
                alert('Camera must be enabled to capture frames');
                return;
            }
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ type: 'DOWNLOAD_FRAME' }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    if (!response) {
                        reject(new Error('No response received from offscreen document'));
                        return;
                    }
                    resolve(response);
                });
            });
            if (response.success) {
                console.log('📸 Frame downloaded successfully:', response.filename);
                // Show success feedback
                alert(`Frame saved as: ${response.filename}`);
            }
            else {
                console.error('❌ Failed to download frame:', response.error);
                alert(`Failed to download frame: ${response.error}`);
            }
        }
        catch (error) {
            console.error('Failed to download frame:', error);
            alert('Failed to download frame. Please try again.');
        }
    };
    const stopCameraStream = async () => {
        try {
            // Stop camera through offscreen document
            chrome.runtime.sendMessage({ type: 'STOP_CAMERA' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('❌ Error stopping camera:', chrome.runtime.lastError.message);
                    return;
                }
                if (response?.success) {
                    console.log('Camera stopped successfully');
                }
            });
            // Clear camera stream flag
            window.eyeZenCameraStream = null;
            await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.updateSettings({
                cameraEnabled: false
            });
            setState(prev => ({
                ...prev,
                cameraEnabled: false,
                showCameraPermissionPopup: false,
                realtimeScore: 0 // Reset real-time score when camera is disabled
            }));
            console.log('Camera deactivated');
        }
        catch (error) {
            console.error('Failed to stop camera:', error);
        }
    };
    const checkCameraPermissionStatus = async () => {
        try {
            // Check if camera permission is still granted
            const permissionStatus = await navigator.permissions.query({ name: 'camera' });
            const currentStream = window.eyeZenCameraStream;
            if (permissionStatus.state === 'denied' && currentStream) {
                // Permission was revoked but extension still thinks camera is active
                console.log('Camera permission revoked, updating extension state');
                // Clear camera stream flag
                window.eyeZenCameraStream = null;
                // Update settings and state
                await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.updateSettings({
                    cameraEnabled: false
                });
                setState(prev => ({
                    ...prev,
                    cameraEnabled: false,
                    showCameraPermissionPopup: false,
                    realtimeScore: 0 // Reset real-time score when permission is revoked
                }));
                // Stop any active camera stream in offscreen document
                chrome.runtime.sendMessage({ type: 'STOP_CAMERA' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('❌ Error stopping camera due to permission revocation:', chrome.runtime.lastError.message);
                        return;
                    }
                    if (response?.success) {
                        console.log('Camera stopped due to permission revocation');
                    }
                });
            }
            // Note: We do NOT automatically initialize camera when permission is granted
            // Camera should only be activated when user explicitly clicks the toggle button
        }
        catch (error) {
            console.log('Could not check camera permission status:', error);
        }
    };
    const validateCameraState = async () => {
        try {
            // Query offscreen document for actual camera state
            chrome.runtime.sendMessage({ type: 'GET_CAMERA_STATE' }, (response) => {
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
                        window.eyeZenCameraStream = offscreenCameraState ? true : null;
                        setState(prev => ({
                            ...prev,
                            cameraEnabled: offscreenCameraState
                        }));
                        // Update storage settings
                        _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.updateSettings({
                            cameraEnabled: offscreenCameraState
                        });
                    }
                }
            });
        }
        catch (error) {
            console.log('Could not validate camera state:', error);
        }
    };
    const initializeCameraStream = async () => {
        try {
            // Create offscreen document if it doesn't exist
            const existingContexts = await chrome.runtime.getContexts({});
            const offscreenDocument = existingContexts.find((context) => context.contextType === 'OFFSCREEN_DOCUMENT');
            if (!offscreenDocument) {
                await chrome.offscreen.createDocument({
                    url: 'offscreen.html',
                    reasons: [chrome.offscreen.Reason.USER_MEDIA],
                    justification: 'Camera access for eye health monitoring'
                });
            }
            // Request camera access through offscreen document
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ type: 'REQUEST_CAMERA' }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    if (!response) {
                        reject(new Error('No response received from offscreen document'));
                        return;
                    }
                    resolve(response);
                });
            });
            if (response.success) {
                // Set camera stream flag
                window.eyeZenCameraStream = true;
                console.log('Camera stream initialized successfully');
            }
            else {
                window.eyeZenCameraStream = null;
                console.log('Failed to initialize camera stream:', response.error);
            }
        }
        catch (error) {
            console.error('Failed to initialize camera stream:', error);
            window.eyeZenCameraStream = null;
        }
    };
    const requestCameraDirectly = async () => {
        try {
            // Show user instruction with better explanation of Chrome extension limitations
            const userConfirmed = confirm('📹 Camera Permission Setup\n\n' +
                '🔒 Your privacy is protected - no video is recorded or transmitted, and images are only used for one-time analysis.\n' +
                'Continue? (Cancel for timer-only mode)');
            if (!userConfirmed) {
                // User cancelled - set to metrics-only mode
                await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.updateSettings({
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
            const offscreenDocument = existingContexts.find((context) => context.contextType === 'OFFSCREEN_DOCUMENT');
            if (!offscreenDocument) {
                await chrome.offscreen.createDocument({
                    url: 'offscreen.html',
                    reasons: [chrome.offscreen.Reason.USER_MEDIA],
                    justification: 'Camera access for eye health monitoring'
                });
            }
            // Request camera access through offscreen document
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ type: 'REQUEST_CAMERA' }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    if (!response) {
                        reject(new Error('No response received from offscreen document'));
                        return;
                    }
                    resolve(response);
                });
            });
            if (response.success) {
                // Update settings to allow camera access
                await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.updateSettings({
                    cameraEnabled: true,
                    metricsOnly: false
                });
                // Set camera stream flag
                window.eyeZenCameraStream = true;
                setState(prev => ({
                    ...prev,
                    cameraEnabled: true,
                    showCameraPermissionPopup: false,
                    isFeatureRestricted: false
                }));
                console.log('Camera activated successfully');
                // Show brief success notification
                alert(' Success! Camera is now active and AI eye health monitoring is running.');
            }
            else {
                // Handle camera permission denial gracefully
                console.warn('Camera access denied:', response.error);
                // Update settings to metrics-only mode
                await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.updateSettings({
                    cameraEnabled: false,
                    metricsOnly: true
                });
                // Clear camera stream flag
                window.eyeZenCameraStream = null;
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
        }
        catch (error) {
            console.error('Failed to request camera access:', error);
            alert('Failed to request camera access. Please try again.');
        }
    };
    const handleCameraPermissionApprove = async () => {
        try {
            await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.updateSettings({
                cameraEnabled: true,
                metricsOnly: false
            });
            // Set a flag to indicate camera stream should be active
            // The actual stream is managed by the offscreen document
            window.eyeZenCameraStream = true;
            setState(prev => ({
                ...prev,
                cameraEnabled: true,
                showCameraPermissionPopup: false,
                isFeatureRestricted: false
            }));
        }
        catch (error) {
            console.error('Failed to approve camera access:', error);
        }
    };
    const handleCameraPermissionReject = async () => {
        try {
            await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.updateSettings({
                cameraEnabled: false,
                metricsOnly: true
            });
            // Clear camera stream flag
            window.eyeZenCameraStream = null;
            setState(prev => ({
                ...prev,
                cameraEnabled: false,
                showCameraPermissionPopup: false,
                isFeatureRestricted: true
            }));
        }
        catch (error) {
            console.error('Failed to reject camera access:', error);
        }
    };
    const handleLogin = async (email, password) => {
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
        }
        catch (error) {
            // Re-throw the error to be handled by LoginModal
            throw error;
        }
    };
    const handleSignup = async (email, password, name) => {
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
        }
        catch (error) {
            // Re-throw the error to be handled by LoginModal
            throw error;
        }
    };
    if (state.isLoading) {
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-[380px] h-[550px] bg-white flex items-center justify-center", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "text-center", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-gray-600", children: "Loading EyeZen..." })] }) }));
    }
    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, { children: [state.showCameraPermissionPopup && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(react__WEBPACK_IMPORTED_MODULE_1__.Suspense, { fallback: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-white" }) }), children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(CameraPermissionPopup, { isVisible: state.showCameraPermissionPopup, onApprove: handleCameraPermissionApprove, onReject: handleCameraPermissionReject, onClose: () => setState(prev => ({ ...prev, showCameraPermissionPopup: false })) }) })), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(react__WEBPACK_IMPORTED_MODULE_1__.Suspense, { fallback: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-white" }) }), children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(LoginModal, { isVisible: state.showLoginModal, onClose: () => setState(prev => ({ ...prev, showLoginModal: false })), onLogin: handleLogin, onSignup: handleSignup }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "w-[380px] h-[650px] bg-white flex flex-col relative", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between mb-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center space-x-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-2xl", children: "\uD83D\uDC41\uFE0F" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h1", { className: "text-lg font-bold", children: "EyeZen" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-blue-100 text-xs opacity-90", children: "Eye Health Monitor" })] })] }), state.isLoggedIn ? ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center space-x-2", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-xs text-blue-100 opacity-90 truncate max-w-20", children: state.userEmail.split('@')[0] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: async () => {
                                                    await chrome.storage.local.remove(['eyezen_login_state']);
                                                    setState(prev => ({ ...prev, isLoggedIn: false, userEmail: '' }));
                                                }, className: "p-1 hover:bg-white/20 rounded transition-colors", title: "Logout", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }) }) })] })) : ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => setState(prev => ({ ...prev, showLoginModal: true })), className: "p-2 hover:bg-white/20 rounded-lg transition-colors", title: "Login", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }) }) }))] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center space-x-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-lg", children: "\uD83D\uDCF9" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex-1", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "font-semibold text-sm", children: "Camera Monitoring" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-xs text-blue-100 opacity-90", children: state.cameraEnabled ? 'Active - Tracking eye health' : 'Inactive - Click to enable' }), !state.cameraEnabled && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => setState(prev => ({ ...prev, showCameraPermissionPopup: true })), className: "text-xs text-blue-200 hover:text-white underline mt-1 transition-colors", children: "Need help? View setup guide" })), state.cameraEnabled && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("button", { onClick: downloadCurrentFrame, className: "text-xs text-blue-200 hover:text-white underline mt-1 transition-colors flex items-center space-x-1", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { children: "\uD83D\uDCF8" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { children: "Download Current Frame" })] }))] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: toggleCamera, className: `relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 ${state.cameraEnabled ? 'bg-green-500 shadow-lg' : 'bg-white/30'}`, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-md ${state.cameraEnabled ? 'translate-x-6' : 'translate-x-1'}` }) })] }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "p-3 relative", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-center mb-3", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 mx-1 mb-2 border border-gray-100 shadow-sm", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-lg mr-2", children: state.eyeScore.current >= 80 ? '😊' : state.eyeScore.current >= 60 ? '😐' : state.eyeScore.current >= 40 ? '😟' : '😵' }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", { className: "text-sm font-semibold text-gray-800", children: "Eye Health Score" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: `text-xl font-bold ${getScoreColor(state.eyeScore.current)}`, children: state.eyeScore.current }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-sm text-gray-500 ml-1", children: "/100" }), state.cameraEnabled && state.eyeScore.current === 50 && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", { className: "ml-2 text-xs text-blue-600 font-medium flex items-center", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "animate-spin mr-1", children: "\uD83D\uDD04" }), "Analyzing..."] }))] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-full bg-gray-200 rounded-full h-1.5 mb-2", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: `h-1.5 rounded-full transition-all duration-500 ${getScoreColor(state.eyeScore.current).includes('green') ? 'bg-green-500' : getScoreColor(state.eyeScore.current).includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`, style: { width: `${state.eyeScore.current}%` } }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-xs text-gray-500 text-center mb-2", children: "Based on eye strain, posture, fatigue levels" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "mt-3", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("button", { onClick: () => handleBreakClick(_types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.MICRO), className: "w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-400 hover:to-emerald-400 transition-all duration-200 font-medium flex items-center justify-center space-x-2 text-sm", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { children: "\u26A1" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { children: "Start Recommended Break with AI" })] }) })] }) }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "px-4 pb-4 flex-1 overflow-y-auto", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "mb-2", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-xs font-medium text-gray-600 mb-1", children: "Choose Your Break" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "grid grid-cols-3 gap-1", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("button", { onClick: () => handleBreakClick(_types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.MICRO), className: "flex flex-col items-center p-2 bg-gradient-to-br from-yellow-300 to-orange-400 hover:from-yellow-400 hover:to-orange-500 rounded border border-orange-300 transition-all duration-200 hover:shadow-md text-white", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-lg mb-1", children: "\u26A1" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-xs font-medium text-white", children: "Quick" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-xs text-white opacity-90", children: "20 sec" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("button", { onClick: () => handleBreakClick(_types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.SHORT), className: "flex flex-col items-center p-2 bg-gradient-to-br from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 rounded border border-emerald-400 transition-all duration-200 hover:shadow-md text-white", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-lg mb-1", children: "\uD83D\uDC41\uFE0F" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-xs font-medium text-white", children: "Eye Break" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-xs text-white opacity-90", children: "5 min" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("button", { onClick: () => handleBreakClick(_types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.LONG), className: "flex flex-col items-center p-2 bg-gradient-to-br from-purple-400 to-indigo-500 hover:from-purple-500 hover:to-indigo-600 rounded border border-indigo-400 transition-all duration-200 hover:shadow-md text-white", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-lg mb-1", children: "\uD83E\uDDD8" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-xs font-medium text-white", children: "Wellness" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-xs text-white opacity-90", children: "15 min" })] })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: onOpenSettings, className: "w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors", children: "View detailed dashboard \u2192" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(react__WEBPACK_IMPORTED_MODULE_1__.Suspense, { fallback: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-white" }) }), children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(BreakDetailModal, { isOpen: state.isModalOpen, breakType: state.selectedBreakType, onClose: handleCloseModal, onStartBreak: onStartBreak }) })] })] }));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Popup);


/***/ }),

/***/ "./ui/popup.tsx":
/*!**********************!*\
  !*** ./ui/popup.tsx ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
/* harmony import */ var react_dom_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-dom/client */ "./node_modules/react-dom/client.js");
/* harmony import */ var _components_Popup__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./components/Popup */ "./ui/components/Popup.tsx");
/* harmony import */ var _styles_popup_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./styles/popup.css */ "./ui/styles/popup.css");




// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('popup-root');
    if (!container) {
        console.error('Popup root element not found');
        return;
    }
    const root = (0,react_dom_client__WEBPACK_IMPORTED_MODULE_1__.createRoot)(container);
    const handleStartBreak = (breakType) => {
        // Send message to background script to start break
        chrome.runtime.sendMessage({
            action: 'START_BREAK',
            breakType: breakType
        }, (response) => {
            if (response?.success) {
                // Close popup after starting break
                window.close();
            }
            else {
                console.error('Failed to start break:', response?.error);
            }
        });
    };
    const handleOpenSettings = () => {
        // Open options page (dashboard)
        chrome.runtime.openOptionsPage();
        window.close();
    };
    root.render((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_components_Popup__WEBPACK_IMPORTED_MODULE_2__["default"], { onStartBreak: handleStartBreak, onOpenSettings: handleOpenSettings }));
});
// Handle any runtime errors
window.addEventListener('error', (event) => {
    console.error('Popup error:', event.error);
});
window.addEventListener('unhandledrejection', (event) => {
    console.error('Popup unhandled promise rejection:', event.reason);
});


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
/******/ 			"popup": 0,
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["react","vendors","core_storage_index_ts","ui_styles_popup_css"], () => (__webpack_require__("./ui/popup.tsx")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=popup.js.map