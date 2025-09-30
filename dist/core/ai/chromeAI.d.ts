/**
 * Chrome AI Service
 * Interfaces with Chrome's built-in AI Prompt API (Gemini Nano) to provide
 * personalized eye health suggestions based on user metrics and scores.
 */
import { EyeMetrics } from '../../types/index';
export interface AIHealthSuggestion {
    message: string;
    severity: 'low' | 'medium' | 'high';
    category: 'environment' | 'posture' | 'habits' | 'nutrition' | 'workspace';
    confidence: number;
}
export declare class ChromeAIService {
    private session;
    private isInitialized;
    /**
     * Initialize the Chrome AI session
     */
    initialize(): Promise<boolean>;
    /**
     * Generate personalized eye health suggestions based on metrics
     */
    generateHealthSuggestion(eyeScore: number, fatigueScore: number, eyeMetrics: EyeMetrics): Promise<AIHealthSuggestion>;
    /**
     * Build a structured prompt for eye health analysis
     */
    private buildHealthPrompt;
    /**
     * Parse AI response into structured suggestion
     */
    private parseAIResponse;
    /**
     * Normalize severity from AI response
     */
    private normalizeSeverity;
    /**
     * Normalize category from AI response
     */
    private normalizeCategory;
    /**
     * Determine severity based on scores
     */
    private determineSeverity;
    /**
     * Determine category based on metrics
     */
    private determineCategory;
    /**
     * Fallback suggestions when AI is not available
     */
    private getFallbackSuggestion;
    /**
     * Clean up resources
     */
    destroy(): Promise<void>;
}
export declare const chromeAIService: ChromeAIService;
