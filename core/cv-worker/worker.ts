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
  type: 'init' | 'process' | 'stop' | 'cleanup';
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
    console.log('🔧 CV Worker received message:', type, data ? 'with data' : 'no data');

    try {
      switch (type) {
        case 'init':
          await this.initialize(data);
          break;
        case 'process':
          await this.processFrame(data);
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
      
      // Initialize MediaPipe FilesetResolver with local WASM files
      const vision = await FilesetResolver.forVisionTasks(
        '/assets/wasm'
      );

      // Create Face Landmarker
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: config.modelPath || '/assets/wasm/face_landmarker.task',
          delegate: 'CPU' // Use CPU for better compatibility
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false
      });

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
        importScripts('/assets/mediapipe-worker-loader.js');
        
        // Initialize MediaPipe using the worker loader
        await (globalThis as any).MediaPipeWorkerLoader.loadVisionTasks();
        
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
      return;
    }

    const currentTime = performance.now();
    
    // Throttle processing to target FPS
    if (currentTime - this.lastFrameTime < this.frameInterval) {
      return;
    }

    try {
      const { imageData, timestamp } = frameData;
      
      this.frameCount++;
      
      if (this.frameCount % 30 === 0) { // Log every 30 frames (~2 seconds)
        console.log(`📊 CV Worker: Processing frame ${this.frameCount}, FPS: ${(1000 / this.frameInterval).toFixed(1)}`);
      }
      
      // Create HTMLCanvasElement from ImageData for MediaPipe
      const canvas = new OffscreenCanvas(imageData.width, imageData.height);
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(imageData, 0, 0);

      // Process frame with MediaPipe
      const results = await this.faceLandmarker.detectForVideo(
        canvas as any,
        timestamp
      );

      // Extract metrics if face is detected
      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const metrics = this.extractMetrics(results.faceLandmarks[0], timestamp);
        
        console.log('👁️ CV Worker: Eye metrics calculated:', {
          blinkRate: metrics.blinkRate,
          fatigueIndex: metrics.fatigueIndex,
          earValue: metrics.earValue,
          perclosValue: metrics.perclosValue
        });
        
        this.postMessage({
          type: 'metrics',
          data: metrics
        });
      } else {
        if (this.frameCount % 60 === 0) { // Log every 60 frames when no face detected
          console.log('👤 CV Worker: No face detected in frame');
        }
      }

      // Clean up canvas immediately
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      this.lastFrameTime = currentTime;

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

      // Calculate PERCLOS (Percentage of Eye Closure)
      const perclosValue = this.perclosCalculator.addEARValue(earValue);

      // Detect blinks
      const isBlinking = this.blinkDetector.processEAR(earValue, timestamp);
      const blinkRate = this.blinkDetector.getBlinkRate();

      // Estimate head pose
      const headPose = HeadPoseEstimator.estimatePose(faceLandmarks);
      const posture = HeadPoseEstimator.classifyPosture(headPose);

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
    // MediaPipe Face Landmarker eye indices
    const leftEyeIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
    const rightEyeIndices = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
    
    const indices = eye === 'left' ? leftEyeIndices : rightEyeIndices;
    return indices.map(index => faceLandmarks[index]).filter(Boolean);
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
    
    // Normalize metrics to 0-100 scale
    let fatigueScore = 0;
    
    // EAR contribution (lower EAR = more fatigue)
    const normalEAR = 0.3; // Typical EAR for alert state
    const earScore = Math.max(0, (normalEAR - ear) / normalEAR * 40);
    fatigueScore += earScore;
    
    // PERCLOS contribution (higher PERCLOS = more fatigue)
    const perclosScore = Math.min(40, perclos * 2); // Cap at 40 points
    fatigueScore += perclosScore;
    
    // Blink rate contribution
    const normalBlinkRate = 15; // Normal blinks per minute
    const blinkRateDeviation = Math.abs(blinkRate - normalBlinkRate);
    const blinkScore = Math.min(10, blinkRateDeviation / 2);
    fatigueScore += blinkScore;
    
    // Posture contribution
    const postureScore = posture === PostureStatus.GOOD ? 0 : 
                        posture === PostureStatus.FORWARD ? 8 :
                        posture === PostureStatus.TILTED ? 5 : 10;
    fatigueScore += postureScore;
    
    return Math.min(100, Math.max(0, fatigueScore));
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