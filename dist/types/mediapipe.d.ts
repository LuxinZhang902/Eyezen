import { PostureStatus } from './index';
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
export declare const EYE_LANDMARKS: {
    readonly LEFT_EYE: {
        readonly OUTER_CORNER: 33;
        readonly INNER_CORNER: 133;
        readonly TOP_LID: readonly [159, 158, 157, 173];
        readonly BOTTOM_LID: readonly [144, 145, 153, 154];
        readonly PUPIL: 468;
    };
    readonly RIGHT_EYE: {
        readonly OUTER_CORNER: 362;
        readonly INNER_CORNER: 263;
        readonly TOP_LID: readonly [386, 385, 384, 398];
        readonly BOTTOM_LID: readonly [373, 374, 380, 381];
        readonly PUPIL: 473;
    };
};
export declare const FACE_LANDMARKS: {
    readonly FACE_OVAL: readonly [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
    readonly NOSE_BRIDGE: readonly [6, 168, 8, 9, 10, 151];
    readonly NOSE_TIP: readonly [1, 2, 5, 4, 19, 94, 125];
    readonly MOUTH_OUTER: readonly [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318];
    readonly MOUTH_INNER: readonly [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308];
};
export declare class EARCalculator {
    /**
     * Calculate Eye Aspect Ratio for fatigue detection
     * EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
     */
    static calculateEAR(eyeLandmarks: NormalizedLandmark[]): number;
    /**
     * Calculate average EAR for both eyes
     */
    static calculateAverageEAR(leftEyeLandmarks: NormalizedLandmark[], rightEyeLandmarks: NormalizedLandmark[]): number;
    private static euclideanDistance;
}
export declare class PERCLOSCalculator {
    private earHistory;
    private readonly windowSize;
    private readonly closureThreshold;
    constructor(windowSize?: number, closureThreshold?: number);
    /**
     * Add new EAR value and calculate PERCLOS
     */
    addEARValue(ear: number): number;
    /**
     * Calculate PERCLOS as percentage of time eyes are closed
     */
    private calculatePERCLOS;
    /**
     * Reset the calculation window
     */
    reset(): void;
    /**
     * Get current window size
     */
    getWindowSize(): number;
}
export declare class BlinkDetector {
    private earHistory;
    private blinkTimestamps;
    private startTime;
    private readonly blinkThreshold;
    private readonly minBlinkDuration;
    private readonly maxBlinkDuration;
    private isInBlink;
    private blinkStartTime;
    constructor(blinkThreshold?: number, minBlinkDuration?: number, // ms
    maxBlinkDuration?: number);
    /**
     * Process new EAR value and detect blinks
     */
    processEAR(ear: number, timestamp: number): boolean;
    /**
     * Get blink rate (blinks per minute)
     */
    getBlinkRate(timeWindowMs?: number): number;
    /**
     * Reset blink counter
     */
    reset(): void;
    private detectBlinkTransition;
}
export declare class HeadPoseEstimator {
    /**
     * Estimate head pose from face landmarks
     */
    static estimatePose(faceLandmarks: NormalizedLandmark[]): {
        pitch: number;
        yaw: number;
        roll: number;
    };
    /**
     * Classify posture based on head pose
     */
    static classifyPosture(pose: {
        pitch: number;
        yaw: number;
        roll: number;
    }): PostureStatus;
}
export declare class MediaPipeInitializer {
    static loadModel(modelPath: string): Promise<any>;
    static createConfig(options?: Partial<MediaPipeConfig>): MediaPipeConfig;
}
