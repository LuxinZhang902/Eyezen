// MediaPipe Face Landmarker types and utilities
import { PostureStatus } from './index';

// MediaPipe specific types
export interface MediaPipeConfig {
  baseOptions: {
    modelAssetPath: string;
    delegate?: 'CPU' | 'GPU';
  };
  runningMode: 'IMAGE' | 'VIDEO';
  numFaces?: number;
  minFaceDetectionConfidence?: number;
  minFacePresenceConfidence?: number;
  minTrackingConfidence?: number;
  outputFaceBlendshapes?: boolean;
  outputFacialTransformationMatrixes?: boolean;
}

export interface MediaPipeResults {
  faceLandmarks: NormalizedLandmark[][];
  faceBlendshapes?: Classifications[];
  facialTransformationMatrixes?: Matrix[];
  image: ImageSource;
  timestampMs: number;
}

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
}

export interface Classifications {
  categories: Category[];
  headIndex?: number;
  headName?: string;
}

export interface Category {
  index: number;
  score: number;
  categoryName: string;
  displayName?: string;
}

export interface Matrix {
  rows: number;
  cols: number;
  data: Float32Array;
}

export interface ImageSource {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

// Eye landmark indices for MediaPipe Face Landmarker
export const EYE_LANDMARKS = {
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
} as const;

// Face outline landmarks
export const FACE_LANDMARKS = {
  FACE_OVAL: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
  NOSE_BRIDGE: [6, 168, 8, 9, 10, 151],
  NOSE_TIP: [1, 2, 5, 4, 19, 94, 125],
  MOUTH_OUTER: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318],
  MOUTH_INNER: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308]
} as const;

// Eye Aspect Ratio (EAR) calculation utilities
export class EARCalculator {
  /**
   * Calculate Eye Aspect Ratio for fatigue detection
   * EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
   */
  static calculateEAR(eyeLandmarks: NormalizedLandmark[]): number {
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
  static calculateAverageEAR(
    leftEyeLandmarks: NormalizedLandmark[],
    rightEyeLandmarks: NormalizedLandmark[]
  ): number {
    const leftEAR = this.calculateEAR(leftEyeLandmarks);
    const rightEAR = this.calculateEAR(rightEyeLandmarks);
    return (leftEAR + rightEAR) / 2.0;
  }

  private static euclideanDistance(
    point1: NormalizedLandmark,
    point2: NormalizedLandmark
  ): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

// PERCLOS (Percentage of Eye Closure) calculation
export class PERCLOSCalculator {
  private earHistory: number[] = [];
  private readonly windowSize: number;
  private readonly closureThreshold: number;

  constructor(windowSize: number = 30, closureThreshold: number = 0.2) {
    this.windowSize = windowSize;
    this.closureThreshold = closureThreshold;
  }

  /**
   * Add new EAR value and calculate PERCLOS
   */
  addEARValue(ear: number): number {
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
  private calculatePERCLOS(): number {
    if (this.earHistory.length === 0) return 0;

    const closedFrames = this.earHistory.filter(
      ear => ear < this.closureThreshold
    ).length;

    return (closedFrames / this.earHistory.length) * 100;
  }

  /**
   * Reset the calculation window
   */
  reset(): void {
    this.earHistory = [];
  }

  /**
   * Get current window size
   */
  getWindowSize(): number {
    return this.earHistory.length;
  }
}

// Blink detection utilities
export class BlinkDetector {
  private earHistory: number[] = [];
  private blinkCount: number = 0;
  private lastBlinkTime: number = 0;
  private readonly blinkThreshold: number;
  private readonly minBlinkDuration: number;
  private readonly maxBlinkDuration: number;

  constructor(
    blinkThreshold: number = 0.2,
    minBlinkDuration: number = 100, // ms
    maxBlinkDuration: number = 400 // ms
  ) {
    this.blinkThreshold = blinkThreshold;
    this.minBlinkDuration = minBlinkDuration;
    this.maxBlinkDuration = maxBlinkDuration;
  }

  /**
   * Process new EAR value and detect blinks
   */
  processEAR(ear: number, timestamp: number): boolean {
    this.earHistory.push(ear);
    
    // Keep only recent history for blink detection
    if (this.earHistory.length > 10) {
      this.earHistory.shift();
    }

    // Detect blink pattern: high -> low -> high
    if (this.detectBlinkPattern(timestamp)) {
      this.blinkCount++;
      this.lastBlinkTime = timestamp;
      return true;
    }

    return false;
  }

  /**
   * Get blink rate (blinks per minute)
   */
  getBlinkRate(timeWindowMs: number = 60000): number {
    const currentTime = Date.now();
    const timeElapsed = Math.min(timeWindowMs, currentTime - this.lastBlinkTime);
    
    if (timeElapsed === 0) return 0;
    
    return (this.blinkCount / timeElapsed) * 60000; // Convert to per minute
  }

  /**
   * Reset blink counter
   */
  reset(): void {
    this.earHistory = [];
    this.blinkCount = 0;
    this.lastBlinkTime = Date.now();
  }

  private detectBlinkPattern(timestamp: number): boolean {
    if (this.earHistory.length < 3) return false;

    const recent = this.earHistory.slice(-3);
    const [prev, current, next] = recent;

    // Simple blink detection: EAR drops below threshold then rises
    return (
      prev > this.blinkThreshold &&
      current <= this.blinkThreshold &&
      (next === undefined || next > this.blinkThreshold)
    );
  }
}

// Head pose estimation
export class HeadPoseEstimator {
  /**
   * Estimate head pose from face landmarks
   */
  static estimatePose(faceLandmarks: NormalizedLandmark[]): {
    pitch: number;
    yaw: number;
    roll: number;
  } {
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
  static classifyPosture(pose: { pitch: number; yaw: number; roll: number }): PostureStatus {
    const { pitch, yaw, roll } = pose;
    
    // Define thresholds
    const PITCH_THRESHOLD = 15;
    const YAW_THRESHOLD = 20;
    const ROLL_THRESHOLD = 15;

    if (Math.abs(pitch) > PITCH_THRESHOLD) {
      return pitch > 0 ? 
        PostureStatus.FORWARD : 
        PostureStatus.GOOD;
    }

    if (Math.abs(yaw) > YAW_THRESHOLD || Math.abs(roll) > ROLL_THRESHOLD) {
      return PostureStatus.TILTED;
    }

    return PostureStatus.GOOD;
  }
}

// MediaPipe initialization utilities
export class MediaPipeInitializer {
  static async loadModel(modelPath: string): Promise<any> {
    // This will be implemented with actual MediaPipe Face Landmarker
    // when the worker is created
    throw new Error('MediaPipe model loading not implemented yet');
  }

  static createConfig(options: Partial<MediaPipeConfig> = {}): MediaPipeConfig {
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