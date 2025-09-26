/**
 * Chrome AI Vision Service
 * Integrates Chrome's built-in AI with multimodal support for eye strain analysis
 * Uses Prompt API with image input to analyze camera feed and provide AI-powered insights
 */
import { EyeMetrics } from '../../types/index';
export interface AIEyeAnalysis {
    strainLevel: number;
    fatigueIndicators: string[];
    recommendations: string[];
    blinkQuality: 'poor' | 'fair' | 'good' | 'excellent';
    postureAssessment: string;
    confidenceScore: number;
}
export declare class ChromeAIVisionService {
    private static isInitialized;
    private static readonly VISION_TEMPERATURE;
    private static readonly VISION_TOP_K;
    /**
     * Initialize the Chrome AI Vision service
     */
    static initialize(): Promise<boolean>;
    /**
     * Analyze eye strain from camera image using Chrome AI multimodal capabilities
     */
    static analyzeEyeStrain(imageData: string, // Base64 encoded image
    currentMetrics?: EyeMetrics, contextInfo?: {
        sessionDuration: number;
        breakCount: number;
        timeOfDay: string;
        screenBrightness?: number;
    }): Promise<AIEyeAnalysis>;
    /**
     * Generate personalized recommendations based on AI analysis and user history
     */
    static generatePersonalizedRecommendations(analysis: AIEyeAnalysis, userHistory: {
        averageStrainLevel: number;
        commonIssues: string[];
        preferredBreakTypes: string[];
        workingHours: {
            start: string;
            end: string;
        };
    }): Promise<string[]>;
    /**
     * Analyze a static image for eye strain and provide a score
     * This method is designed for user-uploaded images
     */
    static analyzeStaticImage(imageData: string, // Base64 encoded image or File object
    options?: {
        includeRecommendations?: boolean;
        detailedAnalysis?: boolean;
    }): Promise<{
        eyeStrainScore: number;
        confidence: number;
        analysis: AIEyeAnalysis;
        summary: string;
    }>;
    /**
     * Analyze trends and provide weekly insights
     */
    static analyzeWeeklyTrends(weeklyData: Array<{
        date: string;
        averageStrain: number;
        breakCount: number;
        workingHours: number;
        aiAnalysis?: AIEyeAnalysis;
    }>): Promise<{
        trends: string[];
        insights: string[];
        goalRecommendations: string[];
    }>;
    /**
     * Clean up resources
     */
    static destroy(): void;
    private static buildContextPrompt;
    private static parseAIResponse;
    private static parseRecommendations;
    private static parseWeeklyAnalysis;
    private static getFallbackAnalysis;
    private static calculateBasicStrainLevel;
    private static getDefaultRecommendations;
    private static getDefaultWeeklyInsights;
    /**
     * Calculate overall strain score from AI analysis
     */
    private static calculateOverallStrainScore;
    /**
     * Convert blink quality to numeric score
     */
    private static getBlinkQualityScore;
    /**
     * Generate a human-readable summary of the analysis
     */
    private static generateAnalysisSummary;
}
export default ChromeAIVisionService;
