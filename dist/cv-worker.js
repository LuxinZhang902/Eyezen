/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./types/index.ts":
/*!************************!*\
  !*** ./types/index.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BreakType: () => (/* binding */ BreakType),
/* harmony export */   DEFAULT_SETTINGS: () => (/* binding */ DEFAULT_SETTINGS),
/* harmony export */   EyeZenError: () => (/* binding */ EyeZenError),
/* harmony export */   MASSAGE_POINTS: () => (/* binding */ MASSAGE_POINTS),
/* harmony export */   MassagePointType: () => (/* binding */ MassagePointType),
/* harmony export */   PostureStatus: () => (/* binding */ PostureStatus),
/* harmony export */   UserStatus: () => (/* binding */ UserStatus)
/* harmony export */ });
// Core types for EyeZen Chrome Extension
var PostureStatus;
(function (PostureStatus) {
    PostureStatus["GOOD"] = "good";
    PostureStatus["FORWARD"] = "forward";
    PostureStatus["TILTED"] = "tilted";
    PostureStatus["TOO_CLOSE"] = "too_close";
    PostureStatus["TOO_FAR"] = "too_far";
})(PostureStatus || (PostureStatus = {}));
// User status and scoring
var UserStatus;
(function (UserStatus) {
    UserStatus["GOOD"] = "good";
    UserStatus["TIRED"] = "tired";
    UserStatus["CRITICAL"] = "critical";
})(UserStatus || (UserStatus = {}));
var BreakType;
(function (BreakType) {
    BreakType["MICRO"] = "micro";
    BreakType["SHORT"] = "short";
    BreakType["LONG"] = "long"; // 15 minutes
})(BreakType || (BreakType = {}));
var MassagePointType;
(function (MassagePointType) {
    MassagePointType["ZAN_ZHU"] = "zan_zhu";
    MassagePointType["SI_BAI"] = "si_bai";
    MassagePointType["JING_MING"] = "jing_ming"; // 睛明
})(MassagePointType || (MassagePointType = {}));
// Error types
class EyeZenError extends Error {
    constructor(message, code, severity = 'medium') {
        super(message);
        this.code = code;
        this.severity = severity;
        this.name = 'EyeZenError';
    }
}
// Constants
const DEFAULT_SETTINGS = {
    cameraEnabled: true,
    detectionSensitivity: 'medium',
    fatigueThreshold: 70,
    reminderEnabled: true,
    reminderInterval: 20,
    breakDuration: 20,
    dataRetention: 30,
    metricsOnly: false,
    language: 'en',
    theme: 'auto',
    notifications: true,
    sounds: true,
    dailyBreakGoal: 8,
    eyeScoreGoal: 80
};
const MASSAGE_POINTS = {
    [MassagePointType.ZAN_ZHU]: {
        name: 'Zan Zhu',
        chineseName: '攒竹',
        position: { x: 0.3, y: 0.25 },
        description: 'Inner end of eyebrow',
        benefits: ['Relieves eye strain', 'Reduces headaches', 'Improves focus'],
        duration: 30
    },
    [MassagePointType.SI_BAI]: {
        name: 'Si Bai',
        chineseName: '四白',
        position: { x: 0.35, y: 0.45 },
        description: 'Below the center of the eye',
        benefits: ['Brightens eyes', 'Reduces dark circles', 'Improves circulation'],
        duration: 30
    },
    [MassagePointType.JING_MING]: {
        name: 'Jing Ming',
        chineseName: '睛明',
        position: { x: 0.25, y: 0.35 },
        description: 'Inner corner of the eye',
        benefits: ['Clears vision', 'Reduces eye fatigue', 'Calms the mind'],
        duration: 30
    }
};
// Export all types
// Note: Chrome types will be available via @types/chrome package
// Additional type exports can be added here as needed


/***/ }),

/***/ "./types/mediapipe.ts":
/*!****************************!*\
  !*** ./types/mediapipe.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BlinkDetector: () => (/* binding */ BlinkDetector),
/* harmony export */   EARCalculator: () => (/* binding */ EARCalculator),
/* harmony export */   EYE_LANDMARKS: () => (/* binding */ EYE_LANDMARKS),
/* harmony export */   FACE_LANDMARKS: () => (/* binding */ FACE_LANDMARKS),
/* harmony export */   HeadPoseEstimator: () => (/* binding */ HeadPoseEstimator),
/* harmony export */   MediaPipeInitializer: () => (/* binding */ MediaPipeInitializer),
/* harmony export */   PERCLOSCalculator: () => (/* binding */ PERCLOSCalculator)
/* harmony export */ });
/* harmony import */ var _index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./index */ "./types/index.ts");
// MediaPipe Face Landmarker types and utilities

// Eye landmark indices for MediaPipe Face Landmarker
const EYE_LANDMARKS = {
    LEFT_EYE: {
        OUTER_CORNER: 33,
        INNER_CORNER: 133,
        TOP_LID: [159, 158, 157, 173],
        BOTTOM_LID: [144, 145, 153, 154],
        PUPIL: 468
    },
    RIGHT_EYE: {
        OUTER_CORNER: 362,
        INNER_CORNER: 263,
        TOP_LID: [386, 385, 384, 398],
        BOTTOM_LID: [373, 374, 380, 381],
        PUPIL: 473
    }
};
// Face outline landmarks
const FACE_LANDMARKS = {
    FACE_OVAL: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
    NOSE_BRIDGE: [6, 168, 8, 9, 10, 151],
    NOSE_TIP: [1, 2, 5, 4, 19, 94, 125],
    MOUTH_OUTER: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318],
    MOUTH_INNER: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308]
};
// Eye Aspect Ratio (EAR) calculation utilities
class EARCalculator {
    /**
     * Calculate Eye Aspect Ratio for fatigue detection
     * EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
     */
    static calculateEAR(eyeLandmarks) {
        if (eyeLandmarks.length < 6) {
            throw new Error('Insufficient eye landmarks for EAR calculation');
        }
        // Extract key points (assuming 6-point eye model)
        const [p1, p2, p3, p4, p5, p6] = eyeLandmarks;
        // Calculate distances
        const vertical1 = this.euclideanDistance(p2, p6);
        const vertical2 = this.euclideanDistance(p3, p5);
        const horizontal = this.euclideanDistance(p1, p4);
        // Calculate EAR
        const ear = (vertical1 + vertical2) / (2.0 * horizontal);
        return ear;
    }
    /**
     * Calculate average EAR for both eyes
     */
    static calculateAverageEAR(leftEyeLandmarks, rightEyeLandmarks) {
        const leftEAR = this.calculateEAR(leftEyeLandmarks);
        const rightEAR = this.calculateEAR(rightEyeLandmarks);
        return (leftEAR + rightEAR) / 2.0;
    }
    static euclideanDistance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        const dz = point1.z - point2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
}
// PERCLOS (Percentage of Eye Closure) calculation
class PERCLOSCalculator {
    constructor(windowSize = 30, closureThreshold = 0.2) {
        this.earHistory = [];
        this.windowSize = windowSize;
        this.closureThreshold = closureThreshold;
    }
    /**
     * Add new EAR value and calculate PERCLOS
     */
    addEARValue(ear) {
        this.earHistory.push(ear);
        // Maintain sliding window
        if (this.earHistory.length > this.windowSize) {
            this.earHistory.shift();
        }
        return this.calculatePERCLOS();
    }
    /**
     * Calculate PERCLOS as percentage of time eyes are closed
     */
    calculatePERCLOS() {
        if (this.earHistory.length === 0)
            return 0;
        const closedFrames = this.earHistory.filter(ear => ear < this.closureThreshold).length;
        return (closedFrames / this.earHistory.length) * 100;
    }
    /**
     * Reset the calculation window
     */
    reset() {
        this.earHistory = [];
    }
    /**
     * Get current window size
     */
    getWindowSize() {
        return this.earHistory.length;
    }
}
// Blink detection utilities
class BlinkDetector {
    constructor(blinkThreshold = 0.2, minBlinkDuration = 100, // ms
    maxBlinkDuration = 400 // ms
    ) {
        this.earHistory = [];
        this.blinkTimestamps = [];
        this.startTime = 0;
        this.isInBlink = false;
        this.blinkStartTime = 0;
        this.blinkThreshold = blinkThreshold;
        this.minBlinkDuration = minBlinkDuration;
        this.maxBlinkDuration = maxBlinkDuration;
        this.startTime = Date.now();
    }
    /**
     * Process new EAR value and detect blinks
     */
    processEAR(ear, timestamp) {
        this.earHistory.push({ value: ear, timestamp });
        // Keep only recent history (last 2 seconds)
        const cutoffTime = timestamp - 2000;
        this.earHistory = this.earHistory.filter(entry => entry.timestamp > cutoffTime);
        // Clean old blink timestamps (keep only last minute)
        const oneMinuteAgo = timestamp - 60000;
        this.blinkTimestamps = this.blinkTimestamps.filter(t => t > oneMinuteAgo);
        // Detect blink state changes
        const blinkDetected = this.detectBlinkTransition(ear, timestamp);
        if (blinkDetected) {
            this.blinkTimestamps.push(timestamp);
            console.log('🔍 Blink detected! Total blinks in last minute:', this.blinkTimestamps.length);
            return true;
        }
        return false;
    }
    /**
     * Get blink rate (blinks per minute)
     */
    getBlinkRate(timeWindowMs = 60000) {
        const currentTime = Date.now();
        const windowStart = currentTime - timeWindowMs;
        // Count blinks in the time window
        const blinksInWindow = this.blinkTimestamps.filter(t => t > windowStart).length;
        // Calculate elapsed time since start or window size, whichever is smaller
        const elapsedTime = Math.min(timeWindowMs, currentTime - this.startTime);
        if (elapsedTime < 1000)
            return 0; // Need at least 1 second of data
        // Convert to blinks per minute
        const blinkRate = (blinksInWindow / elapsedTime) * 60000;
        console.log(`📊 Blink rate calculation: ${blinksInWindow} blinks in ${(elapsedTime / 1000).toFixed(1)}s = ${blinkRate.toFixed(1)} bpm`);
        return blinkRate;
    }
    /**
     * Reset blink counter
     */
    reset() {
        this.earHistory = [];
        this.blinkTimestamps = [];
        this.startTime = Date.now();
        this.isInBlink = false;
        this.blinkStartTime = 0;
    }
    detectBlinkTransition(ear, timestamp) {
        if (!this.isInBlink && ear <= this.blinkThreshold) {
            // Start of blink
            this.isInBlink = true;
            this.blinkStartTime = timestamp;
            return false; // Don't count as complete blink yet
        }
        else if (this.isInBlink && ear > this.blinkThreshold) {
            // End of blink
            this.isInBlink = false;
            const blinkDuration = timestamp - this.blinkStartTime;
            // Validate blink duration
            if (blinkDuration >= this.minBlinkDuration && blinkDuration <= this.maxBlinkDuration) {
                return true; // Valid blink detected
            }
        }
        return false;
    }
}
// Head pose estimation
class HeadPoseEstimator {
    /**
     * Estimate head pose from face landmarks
     */
    static estimatePose(faceLandmarks) {
        // Use key facial landmarks for pose estimation
        const noseTip = faceLandmarks[1];
        const leftEyeCorner = faceLandmarks[33];
        const rightEyeCorner = faceLandmarks[263];
        const leftMouthCorner = faceLandmarks[61];
        const rightMouthCorner = faceLandmarks[291];
        // Calculate yaw (left-right rotation)
        const eyeDistance = Math.abs(leftEyeCorner.x - rightEyeCorner.x);
        const noseCenterX = (leftEyeCorner.x + rightEyeCorner.x) / 2;
        const yaw = (noseTip.x - noseCenterX) / eyeDistance;
        // Calculate pitch (up-down rotation)
        const eyeCenterY = (leftEyeCorner.y + rightEyeCorner.y) / 2;
        const mouthCenterY = (leftMouthCorner.y + rightMouthCorner.y) / 2;
        const faceHeight = Math.abs(mouthCenterY - eyeCenterY);
        const pitch = (noseTip.y - eyeCenterY) / faceHeight;
        // Calculate roll (tilt rotation)
        const eyeSlope = (rightEyeCorner.y - leftEyeCorner.y) / (rightEyeCorner.x - leftEyeCorner.x);
        const roll = Math.atan(eyeSlope);
        return {
            pitch: pitch * 180 / Math.PI, // Convert to degrees
            yaw: yaw * 180 / Math.PI,
            roll: roll * 180 / Math.PI
        };
    }
    /**
     * Classify posture based on head pose
     */
    static classifyPosture(pose) {
        const { pitch, yaw, roll } = pose;
        // Define thresholds
        const PITCH_THRESHOLD = 15;
        const YAW_THRESHOLD = 20;
        const ROLL_THRESHOLD = 15;
        if (Math.abs(pitch) > PITCH_THRESHOLD) {
            return pitch > 0 ?
                _index__WEBPACK_IMPORTED_MODULE_0__.PostureStatus.FORWARD :
                _index__WEBPACK_IMPORTED_MODULE_0__.PostureStatus.GOOD;
        }
        if (Math.abs(yaw) > YAW_THRESHOLD || Math.abs(roll) > ROLL_THRESHOLD) {
            return _index__WEBPACK_IMPORTED_MODULE_0__.PostureStatus.TILTED;
        }
        return _index__WEBPACK_IMPORTED_MODULE_0__.PostureStatus.GOOD;
    }
}
// MediaPipe initialization utilities
class MediaPipeInitializer {
    static async loadModel(modelPath) {
        // This will be implemented with actual MediaPipe Face Landmarker
        // when the worker is created
        throw new Error('MediaPipe model loading not implemented yet');
    }
    static createConfig(options = {}) {
        return {
            baseOptions: {
                modelAssetPath: options.baseOptions?.modelAssetPath || '/assets/wasm/face_landmarker.task',
                delegate: options.baseOptions?.delegate || 'CPU'
            },
            runningMode: options.runningMode || 'VIDEO',
            numFaces: options.numFaces || 1,
            minFaceDetectionConfidence: options.minFaceDetectionConfidence || 0.5,
            minFacePresenceConfidence: options.minFacePresenceConfidence || 0.5,
            minTrackingConfidence: options.minTrackingConfidence || 0.5,
            outputFaceBlendshapes: options.outputFaceBlendshapes || false,
            outputFacialTransformationMatrixes: options.outputFacialTransformationMatrixes || false
        };
    }
}


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
/************************************************************************/
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
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**********************************!*\
  !*** ./core/cv-worker/worker.ts ***!
  \**********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _types_mediapipe__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../types/mediapipe */ "./types/mediapipe.ts");
/* harmony import */ var _types_index__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../types/index */ "./types/index.ts");
/**
 * CV Worker for EyeZen Chrome Extension
 * Uses MediaPipe Face Landmarker (WASM) to compute EAR/PERCLOS from camera frames
 * Ensures proper frame cleanup and memory management
 */


class CVWorker {
    constructor() {
        this.faceLandmarker = null;
        this.isProcessing = false;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.targetFPS = 15; // Limit processing to 15 FPS for performance
        this.frameInterval = 1000 / this.targetFPS;
        this.perclosCalculator = new _types_mediapipe__WEBPACK_IMPORTED_MODULE_0__.PERCLOSCalculator(30, 0.2); // 30 frame window, 0.2 closure threshold
        this.blinkDetector = new _types_mediapipe__WEBPACK_IMPORTED_MODULE_0__.BlinkDetector(0.2, 100, 400); // threshold, min/max blink duration
        // Listen for messages from main thread
        self.addEventListener('message', this.handleMessage.bind(this));
    }
    /**
     * Handle messages from the main thread
     */
    async handleMessage(event) {
        const { type, data } = event.data;
        const messageTimestamp = new Date().toISOString();
        console.log(`📨 [${messageTimestamp}] CV Worker: Received ${type} message`, data ? 'with data' : 'without data');
        // Only log non-process messages to reduce console noise
        if (type !== 'process') {
            console.log('🔧 CV Worker received message:', type, data ? 'with data' : 'no data');
        }
        try {
            switch (type) {
                case 'init':
                    await this.initialize(data);
                    break;
                case 'start':
                    console.log('🚀 CV Worker: Starting processing');
                    this.startProcessing();
                    break;
                case 'process':
                    if (data) {
                        const timestamp = new Date().toISOString();
                        console.log(`🎯 [${timestamp}] CV Worker: Processing frame message received`);
                        await this.processFrame(data);
                    }
                    else {
                        console.warn('⚠️ CV Worker: Process message received without data');
                    }
                    break;
                case 'stop':
                    this.stopProcessing();
                    break;
                case 'cleanup':
                    await this.cleanup();
                    break;
                default:
                    this.postError(`Unknown message type: ${type}`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.postError(`Error handling ${type}: ${errorMessage}`);
        }
    }
    /**
     * Initialize MediaPipe Face Landmarker
     */
    async initialize(config) {
        try {
            console.log('🚀 CV Worker: Initializing MediaPipe Face Landmarker...');
            // Load MediaPipe scripts dynamically
            await this.loadMediaPipeScripts();
            // MediaPipe is now initialized through the worker loader
            // Set a flag to indicate we're ready to process
            this.faceLandmarker = { initialized: true };
            console.log('✅ CV Worker: MediaPipe Face Landmarker initialized successfully');
            this.postMessage({
                type: 'ready',
                data: { message: 'CV Worker initialized successfully' }
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('❌ CV Worker: Failed to initialize MediaPipe:', error);
            this.postError(`Failed to initialize MediaPipe: ${errorMessage}`);
        }
    }
    /**
     * Load MediaPipe scripts dynamically in worker context
     */
    async loadMediaPipeScripts() {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('📦 CV Worker: Loading MediaPipe scripts...');
                // Load MediaPipe worker loader from local assets
                importScripts('./assets/mediapipe-worker-loader.js');
                // Initialize MediaPipe using the worker loader
                const { initializeMediaPipe, detectForVideo } = await globalThis.MediaPipeWorkerLoader.loadVisionTasks();
                // Store the detection function globally for use in processFrame
                globalThis.detectForVideo = detectForVideo;
                console.log('✅ CV Worker: MediaPipe scripts loaded successfully');
                resolve();
            }
            catch (error) {
                console.error('❌ CV Worker: Failed to load MediaPipe scripts:', error);
                reject(error);
            }
        });
    }
    /**
     * Process a single video frame
     */
    async processFrame(frameData) {
        if (!this.faceLandmarker || !this.isProcessing) {
            console.log('🚫 CV Worker: Skipping frame - faceLandmarker:', !!this.faceLandmarker, 'isProcessing:', this.isProcessing);
            return;
        }
        try {
            const { imageData, timestamp } = frameData;
            this.frameCount++;
            const logTimestamp = new Date().toISOString();
            console.log(`🔍 [${logTimestamp}] CV Worker: Processing detection frame ${this.frameCount} at timestamp ${timestamp}`);
            console.log(`🔍 [${logTimestamp}] CV Worker: detectForVideo available?`, typeof globalThis.detectForVideo);
            // Create HTMLCanvasElement from ImageData for MediaPipe
            const canvas = new OffscreenCanvas(imageData.width, imageData.height);
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.putImageData(imageData, 0, 0);
            // Check if detection function is available
            if (typeof globalThis.detectForVideo !== 'function') {
                console.error('❌ CV Worker: detectForVideo function not available in worker context');
                return;
            }
            // Process frame with MediaPipe using the global detection function
            console.log(`🎯 [${logTimestamp}] CV Worker: Calling detectForVideo with canvas:`, canvas.width, 'x', canvas.height);
            const results = await globalThis.detectForVideo(canvas, timestamp);
            console.log('🎯 CV Worker: detectForVideo returned:', results);
            // Extract metrics if face is detected
            if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
                const metrics = this.extractMetrics(results.faceLandmarks[0], timestamp);
                // Only log eye metrics occasionally to reduce console noise
                if (this.frameCount % 150 === 0) { // Log every 10 seconds
                    console.log('👁️ CV Worker: Eye metrics calculated:', {
                        blinkRate: metrics.blinkRate,
                        fatigueIndex: metrics.fatigueIndex,
                        earValue: metrics.earValue,
                        perclosValue: metrics.perclosValue
                    });
                }
                this.postMessage({
                    type: 'metrics',
                    data: metrics
                });
            }
            else {
                if (this.frameCount % 300 === 0) { // Log every 20 seconds when no face detected
                    console.log('👤 CV Worker: No face detected in frame');
                }
            }
            // Clean up canvas immediately
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.lastFrameTime = performance.now();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('❌ CV Worker: Frame processing error:', error);
            this.postError(`Frame processing error: ${errorMessage}`);
        }
    }
    /**
     * Extract eye metrics from face landmarks
     */
    extractMetrics(faceLandmarks, timestamp) {
        try {
            // Extract eye landmarks (MediaPipe Face Landmarker indices)
            const leftEyeLandmarks = this.getEyeLandmarks(faceLandmarks, 'left');
            const rightEyeLandmarks = this.getEyeLandmarks(faceLandmarks, 'right');
            // Calculate EAR (Eye Aspect Ratio)
            const earValue = _types_mediapipe__WEBPACK_IMPORTED_MODULE_0__.EARCalculator.calculateAverageEAR(leftEyeLandmarks, rightEyeLandmarks);
            console.log('👁️ Raw EAR Value:', earValue.toFixed(3));
            // Calculate PERCLOS (Percentage of Eye Closure)
            const perclosValue = this.perclosCalculator.addEARValue(earValue);
            console.log('😴 PERCLOS Value:', perclosValue.toFixed(3), '%');
            // Detect blinks
            const isBlinking = this.blinkDetector.processEAR(earValue, timestamp);
            const blinkRate = this.blinkDetector.getBlinkRate();
            console.log('👀 Blink Detection - Is Blinking:', isBlinking, 'Rate:', blinkRate.toFixed(1), 'bpm');
            // Estimate head pose
            const headPose = _types_mediapipe__WEBPACK_IMPORTED_MODULE_0__.HeadPoseEstimator.estimatePose(faceLandmarks);
            const posture = _types_mediapipe__WEBPACK_IMPORTED_MODULE_0__.HeadPoseEstimator.classifyPosture(headPose);
            console.log('🧍 Head Pose:', headPose, 'Posture:', posture);
            // Calculate fatigue index (0-100 scale)
            const fatigueIndex = this.calculateFatigueIndex({
                ear: earValue,
                perclos: perclosValue,
                blinkRate,
                posture
            });
            return {
                blinkRate,
                fatigueIndex,
                posture,
                earValue,
                perclosValue,
                timestamp
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Metrics extraction failed: ${errorMessage}`);
        }
    }
    /**
     * Extract eye landmarks for a specific eye
     */
    getEyeLandmarks(faceLandmarks, eye) {
        // MediaPipe Face Landmarker 6-point eye model for EAR calculation
        // Format: [outer_corner, top_1, top_2, inner_corner, bottom_2, bottom_1]
        const leftEyeIndices = [33, 159, 158, 133, 153, 144]; // Left eye 6 points
        const rightEyeIndices = [362, 386, 385, 263, 374, 373]; // Right eye 6 points
        const indices = eye === 'left' ? leftEyeIndices : rightEyeIndices;
        const landmarks = indices.map(index => faceLandmarks[index]).filter(Boolean);
        console.log(`👁️ ${eye} eye landmarks (${landmarks.length} points):`, landmarks.map((l, i) => `${indices[i]}: (${l.x.toFixed(3)}, ${l.y.toFixed(3)})`));
        return landmarks;
    }
    /**
     * Calculate fatigue index based on multiple metrics
     */
    calculateFatigueIndex(metrics) {
        const { ear, perclos, blinkRate, posture } = metrics;
        console.log('🔍 Fatigue Calculation Input:', {
            ear: ear.toFixed(3),
            perclos: perclos.toFixed(3),
            blinkRate: blinkRate.toFixed(1),
            posture
        });
        // Normalize metrics to 0-100 scale (lower fatigue score = better health)
        let fatigueScore = 0;
        // EAR contribution (lower EAR = more fatigue) - made less punitive
        const normalEAR = 0.3; // Typical EAR for alert state
        const earDeviation = Math.max(0, normalEAR - ear);
        const earScore = Math.min(25, (earDeviation / normalEAR) * 25); // Reduced from 40 to 25
        fatigueScore += earScore;
        console.log('📊 EAR Score:', earScore.toFixed(1), '(EAR:', ear.toFixed(3), 'vs normal:', normalEAR, ')');
        // PERCLOS contribution (higher PERCLOS = more fatigue) - made less punitive
        const perclosScore = Math.min(25, perclos * 100); // Reduced impact and cap at 25
        fatigueScore += perclosScore;
        console.log('📊 PERCLOS Score:', perclosScore.toFixed(1), '(PERCLOS:', perclos.toFixed(3), '%)');
        // Blink rate contribution - made less punitive
        const normalBlinkRate = 17.5; // Optimal blinks per minute (middle of 15-20 range)
        const blinkRateDeviation = Math.abs(blinkRate - normalBlinkRate);
        const blinkScore = Math.min(15, blinkRateDeviation / 3); // Reduced impact
        fatigueScore += blinkScore;
        console.log('📊 Blink Score:', blinkScore.toFixed(1), '(Rate:', blinkRate.toFixed(1), 'vs normal:', normalBlinkRate, ')');
        // Posture contribution - made less punitive
        const postureScore = posture === _types_index__WEBPACK_IMPORTED_MODULE_1__.PostureStatus.GOOD ? 0 :
            posture === _types_index__WEBPACK_IMPORTED_MODULE_1__.PostureStatus.FORWARD ? 5 : // Reduced from 8
                posture === _types_index__WEBPACK_IMPORTED_MODULE_1__.PostureStatus.TILTED ? 3 : // Reduced from 5
                    7; // Reduced from 10
        fatigueScore += postureScore;
        console.log('📊 Posture Score:', postureScore, '(Status:', posture, ')');
        // Cap the final score at a more reasonable level
        const finalScore = Math.min(70, Math.max(0, fatigueScore)); // Reduced max from 100 to 70
        console.log('🎯 Final Fatigue Index:', finalScore.toFixed(1), '/ 70 (capped)');
        return finalScore;
    }
    /**
     * Start processing frames
     */
    startProcessing() {
        this.isProcessing = true;
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.perclosCalculator.reset();
        this.blinkDetector.reset();
    }
    /**
     * Stop processing frames
     */
    stopProcessing() {
        this.isProcessing = false;
        this.postMessage({
            type: 'stopped',
            data: { frameCount: this.frameCount }
        });
    }
    /**
     * Clean up resources
     */
    async cleanup() {
        this.isProcessing = false;
        if (this.faceLandmarker) {
            this.faceLandmarker.close();
            this.faceLandmarker = null;
        }
        this.perclosCalculator.reset();
        this.blinkDetector.reset();
        this.postMessage({
            type: 'stopped',
            data: { message: 'CV Worker cleaned up' }
        });
    }
    /**
     * Post message to main thread
     */
    postMessage(response) {
        self.postMessage(response);
    }
    /**
     * Post error to main thread
     */
    postError(message) {
        this.postMessage({
            type: 'error',
            data: { error: message }
        });
    }
}
// Initialize worker
const cvWorker = new CVWorker();
// Export for TypeScript
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (cvWorker);

})();

/******/ })()
;
//# sourceMappingURL=cv-worker.js.map