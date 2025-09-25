/**
 * CV Worker for EyeZen Chrome Extension
 * Uses MediaPipe Face Landmarker (WASM) to compute EAR/PERCLOS from camera frames
 * Ensures proper frame cleanup and memory management
 */

// MediaPipe imports - will be loaded dynamically
declare const FaceLandmarker: any;
declare const FilesetResolver: any;
declare const ModuleFactory: any;

// Worker context declarations
declare function importScripts(...urls: string[]): void;

import { EARCalculator, PERCLOSCalculator, BlinkDetector, HeadPoseEstimator } from '../../types/mediapipe';
import { EyeMetrics, PostureStatus } from '../../types/index';

// Worker message types
interface WorkerMessage {
  type: 'init' | 'start' | 'process' | 'stop' | 'cleanup';
  data?: any;
}

interface WorkerResponse {
  type: 'ready' | 'metrics' | 'error' | 'stopped';
  data?: any;
}

class CVWorker {
  private faceLandmarker: any | null = null;
  private perclosCalculator: PERCLOSCalculator;
  private blinkDetector: BlinkDetector;
  private isProcessing: boolean = false;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private readonly targetFPS: number = 15; // Limit processing to 15 FPS for performance
  private readonly frameInterval: number = 1000 / this.targetFPS;

  constructor() {
    this.perclosCalculator = new PERCLOSCalculator(30, 0.2); // 30 frame window, 0.2 closure threshold
    this.blinkDetector = new BlinkDetector(0.2, 100, 400); // threshold, min/max blink duration
    
    // Listen for messages from main thread
    self.addEventListener('message', this.handleMessage.bind(this));
  }

  /**
   * Handle messages from the main thread
   */
  private async handleMessage(event: MessageEvent<WorkerMessage>): Promise<void> {
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
          } else {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.postError(`Error handling ${type}: ${errorMessage}`);
    }
  }

  /**
   * Initialize MediaPipe Face Landmarker
   */
  private async initialize(config: { modelPath: string }): Promise<void> {
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

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ CV Worker: Failed to initialize MediaPipe:', error);
      this.postError(`Failed to initialize MediaPipe: ${errorMessage}`);
    }
  }

  /**
   * Load MediaPipe scripts dynamically in worker context
   */
  private async loadMediaPipeScripts(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('📦 CV Worker: Loading MediaPipe scripts...');
        
        // Load MediaPipe worker loader from local assets
        importScripts('./assets/mediapipe-worker-loader.js');
        
        // Initialize MediaPipe using the worker loader
        const { initializeMediaPipe, detectForVideo } = await (globalThis as any).MediaPipeWorkerLoader.loadVisionTasks();
        
        // Store the detection function globally for use in processFrame
        (globalThis as any).detectForVideo = detectForVideo;
        
        console.log('✅ CV Worker: MediaPipe scripts loaded successfully');
        resolve();
      } catch (error) {
        console.error('❌ CV Worker: Failed to load MediaPipe scripts:', error);
        reject(error);
      }
    });
  }

  /**
   * Process a single video frame
   */
  private async processFrame(frameData: {
    imageData: ImageData;
    timestamp: number;
  }): Promise<void> {
    if (!this.faceLandmarker || !this.isProcessing) {
      console.log('🚫 CV Worker: Skipping frame - faceLandmarker:', !!this.faceLandmarker, 'isProcessing:', this.isProcessing);
      return;
    }

    try {
      const { imageData, timestamp } = frameData;
      
      this.frameCount++;
      
      const logTimestamp = new Date().toISOString();
      console.log(`🔍 [${logTimestamp}] CV Worker: Processing detection frame ${this.frameCount} at timestamp ${timestamp}`);
      console.log(`🔍 [${logTimestamp}] CV Worker: detectForVideo available?`, typeof (globalThis as any).detectForVideo);
      
      // Create HTMLCanvasElement from ImageData for MediaPipe
      const canvas = new OffscreenCanvas(imageData.width, imageData.height);
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.putImageData(imageData, 0, 0);

      // Check if detection function is available
      if (typeof (globalThis as any).detectForVideo !== 'function') {
        console.error('❌ CV Worker: detectForVideo function not available in worker context');
        return;
      }

      // Process frame with MediaPipe using the global detection function
      console.log(`🎯 [${logTimestamp}] CV Worker: Calling detectForVideo with canvas:`, canvas.width, 'x', canvas.height);
      const results = await (globalThis as any).detectForVideo(
        canvas as any,
        timestamp
      );
      
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
      } else {
        if (this.frameCount % 300 === 0) { // Log every 20 seconds when no face detected
          console.log('👤 CV Worker: No face detected in frame');
        }
      }

      // Clean up canvas immediately
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      this.lastFrameTime = performance.now();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ CV Worker: Frame processing error:', error);
      this.postError(`Frame processing error: ${errorMessage}`);
    }
  }

  /**
   * Extract eye metrics from face landmarks
   */
  private extractMetrics(faceLandmarks: any[], timestamp: number): EyeMetrics {
    try {
      // Extract eye landmarks (MediaPipe Face Landmarker indices)
      const leftEyeLandmarks = this.getEyeLandmarks(faceLandmarks, 'left');
      const rightEyeLandmarks = this.getEyeLandmarks(faceLandmarks, 'right');

      // Calculate EAR (Eye Aspect Ratio)
      const earValue = EARCalculator.calculateAverageEAR(leftEyeLandmarks, rightEyeLandmarks);
      console.log('👁️ Raw EAR Value:', earValue.toFixed(3));

      // Calculate PERCLOS (Percentage of Eye Closure)
      const perclosValue = this.perclosCalculator.addEARValue(earValue);
      console.log('😴 PERCLOS Value:', perclosValue.toFixed(3), '%');

      // Detect blinks
      const isBlinking = this.blinkDetector.processEAR(earValue, timestamp);
      const blinkRate = this.blinkDetector.getBlinkRate();
      console.log('👀 Blink Detection - Is Blinking:', isBlinking, 'Rate:', blinkRate.toFixed(1), 'bpm');

      // Estimate head pose
      const headPose = HeadPoseEstimator.estimatePose(faceLandmarks);
      const posture = HeadPoseEstimator.classifyPosture(headPose);
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

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Metrics extraction failed: ${errorMessage}`);
    }
  }

  /**
   * Extract eye landmarks for a specific eye
   */
  private getEyeLandmarks(faceLandmarks: any[], eye: 'left' | 'right'): any[] {
    // MediaPipe Face Landmarker 6-point eye model for EAR calculation
    // Format: [outer_corner, top_1, top_2, inner_corner, bottom_2, bottom_1]
    const leftEyeIndices = [33, 159, 158, 133, 153, 144];  // Left eye 6 points
    const rightEyeIndices = [362, 386, 385, 263, 374, 373]; // Right eye 6 points
    
    const indices = eye === 'left' ? leftEyeIndices : rightEyeIndices;
    const landmarks = indices.map(index => faceLandmarks[index]).filter(Boolean);
    
    console.log(`👁️ ${eye} eye landmarks (${landmarks.length} points):`, 
      landmarks.map((l, i) => `${indices[i]}: (${l.x.toFixed(3)}, ${l.y.toFixed(3)})`))
    
    return landmarks;
  }

  /**
   * Calculate fatigue index based on multiple metrics
   */
  private calculateFatigueIndex(metrics: {
    ear: number;
    perclos: number;
    blinkRate: number;
    posture: PostureStatus;
  }): number {
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
    const postureScore = posture === PostureStatus.GOOD ? 0 : 
                        posture === PostureStatus.FORWARD ? 5 :  // Reduced from 8
                        posture === PostureStatus.TILTED ? 3 :   // Reduced from 5
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
  public startProcessing(): void {
    this.isProcessing = true;
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.perclosCalculator.reset();
    this.blinkDetector.reset();
  }

  /**
   * Stop processing frames
   */
  private stopProcessing(): void {
    this.isProcessing = false;
    this.postMessage({
      type: 'stopped',
      data: { frameCount: this.frameCount }
    });
  }

  /**
   * Clean up resources
   */
  private async cleanup(): Promise<void> {
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
  private postMessage(response: WorkerResponse): void {
    self.postMessage(response);
  }

  /**
   * Post error to main thread
   */
  private postError(message: string): void {
    this.postMessage({
      type: 'error',
      data: { error: message }
    });
  }
}

// Initialize worker
const cvWorker = new CVWorker();

// Export for TypeScript
export default cvWorker;