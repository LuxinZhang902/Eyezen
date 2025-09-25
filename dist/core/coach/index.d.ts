/**
 * AI Coach Module
 * Handles coaching script generation, break guidance, and motivational content
 */
import { CoachingScript, EyeMetrics, UserSettings, BreakType } from '../../types/index';
/**
 * AI Coach Service
 * Generates personalized coaching content using Chrome's built-in AI
 */
export declare class AICoachService {
    private scriptCache;
    constructor();
    /**
     * Generate a coaching script based on user metrics and break type
     */
    generateCoachingScript(breakType: BreakType, userMetrics: EyeMetrics[], settings: UserSettings): Promise<CoachingScript>;
    /**
     * Generate motivational content based on user progress
     */
    generateMotivationalMessage(eyeHealthScore: number, streak: number, settings: UserSettings): Promise<string>;
    /**
     * Generate weekly summary insights
     */
    generateWeeklySummary(weeklyData: any, settings: UserSettings): Promise<string>;
    private getAverageFatigue;
    private getDailyBreakCount;
    private getTimeOfDay;
    private callChromeAI;
    private buildPrompt;
    private buildMotivationalPrompt;
    private buildSummaryPrompt;
    private getScriptType;
    private calculateDuration;
    private generateCacheKey;
    private generateId;
    private getFallbackScript;
    private getFallbackMotivation;
    private getFallbackSummary;
}
/**
 * Break Activity Generator
 * Provides structured break activities and guidance
 */
export declare class BreakActivityGenerator {
    /**
     * Generate activities for a break session
     */
    static generateActivities(breakType: BreakType, language?: string): ({
        type: "exercise";
        name: string;
        duration: number;
        instructions: string;
    } | {
        type: "massage";
        name: string;
        duration: number;
        instructions: string;
    } | {
        type: "hydration";
        name: string;
        duration: number;
        instructions: string;
    })[];
    private static getMicroBreakActivities;
    private static getShortBreakActivities;
    private static getLongBreakActivities;
}
/**
 * Text-to-Speech Service
 * Handles audio coaching using Web Speech API
 */
export declare class TextToSpeechService {
    private synthesis;
    private currentUtterance;
    constructor();
    /**
     * Speak coaching script content
     */
    speak(text: string, language?: string, rate?: number): Promise<void>;
    /**
     * Stop current speech
     */
    stop(): void;
    /**
     * Pause current speech
     */
    pause(): void;
    /**
     * Resume paused speech
     */
    resume(): void;
    /**
     * Check if currently speaking
     */
    isSpeaking(): boolean;
    /**
     * Get available voices
     */
    getVoices(): SpeechSynthesisVoice[];
}
