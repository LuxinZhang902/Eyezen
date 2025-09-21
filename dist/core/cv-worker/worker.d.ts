/**
 * CV Worker for EyeZen Chrome Extension
 * Uses MediaPipe Face Landmarker (WASM) to compute EAR/PERCLOS from camera frames
 * Ensures proper frame cleanup and memory management
 */
declare class CVWorker {
    private faceLandmarker;
    private perclosCalculator;
    private blinkDetector;
    private isProcessing;
    private lastFrameTime;
    private frameCount;
    private readonly targetFPS;
    private readonly frameInterval;
    constructor();
    /**
     * Handle messages from the main thread
     */
    private handleMessage;
    /**
     * Initialize MediaPipe Face Landmarker
     */
    private initialize;
    /**
     * Load MediaPipe scripts dynamically in worker context
     */
    private loadMediaPipeScripts;
    /**
     * Process a single video frame
     */
    private processFrame;
    /**
     * Extract eye metrics from face landmarks
     */
    private extractMetrics;
    /**
     * Extract eye landmarks for a specific eye
     */
    private getEyeLandmarks;
    /**
     * Calculate fatigue index based on multiple metrics
     */
    private calculateFatigueIndex;
    /**
     * Start processing frames
     */
    startProcessing(): void;
    /**
     * Stop processing frames
     */
    private stopProcessing;
    /**
     * Clean up resources
     */
    private cleanup;
    /**
     * Post message to main thread
     */
    private postMessage;
    /**
     * Post error to main thread
     */
    private postError;
}
declare const cvWorker: CVWorker;
export default cvWorker;
