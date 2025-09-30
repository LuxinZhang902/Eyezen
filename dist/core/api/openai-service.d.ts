/**
 * Chrome AI Service
 * Handles AI-powered features using Chrome's built-in Gemini Nano model
 * Replaces OpenAI API with Chrome's Prompt API for coaching scripts, weekly summaries, and translations
 */
import { CoachingScript, WeeklySummary, UserData } from '../../types/index';
declare global {
    interface Window {
        LanguageModel?: {
            availability(): Promise<'readily' | 'after-download' | 'no'>;
            params(): Promise<{
                defaultTopK: number;
                maxTopK: number;
                defaultTemperature: number;
                maxTemperature: number;
            }>;
            create(options?: {
                temperature?: number;
                topK?: number;
                signal?: AbortSignal;
                monitor?: (monitor: any) => void;
                initialPrompts?: Array<{
                    role: 'system' | 'user' | 'assistant';
                    content: string;
                }>;
            }): Promise<{
                prompt(input: string | Array<{
                    role: 'system' | 'user' | 'assistant';
                    content: string | {
                        type: 'text' | 'image';
                        text?: string;
                        image?: string;
                    };
                }>): Promise<string>;
                destroy(): void;
            }>;
        };
    }
}
export declare class ChromeAIService {
    private static session;
    private static isInitialized;
    private static readonly DEFAULT_TEMPERATURE;
    private static readonly DEFAULT_TOP_K;
    /**
     * Initialize the Chrome AI service
     */
    static initialize(): Promise<void>;
    /**
     * Send multimodal prompt to Chrome AI (text + image)
     */
    static promptWithImage(textPrompt: string, imageData?: string, options?: {
        temperature?: number;
        topK?: number;
    }): Promise<string>;
    /**
     * Send text prompt to Chrome AI
     */
    static prompt(textPrompt: string, options?: {
        temperature?: number;
        topK?: number;
    }): Promise<string>;
    /**
     * Generate a personalized coaching script
     */
    static generateCoachingScript(type: 'motivation' | 'instruction' | 'relaxation', userContext: {
        fatigueLevel: number;
        breakCount: number;
        timeOfDay: string;
        language: string;
    }): Promise<CoachingScript>;
    /**
     * Generate weekly summary with insights and recommendations
     */
    static generateWeeklySummary(userData: UserData): Promise<WeeklySummary>;
    /**
     * Translate text to specified language
     */
    static translateText(text: string, targetLanguage: string): Promise<string>;
    /**
     * Rewrite text for better clarity or tone
     */
    static rewriteText(text: string, style: 'formal' | 'casual' | 'encouraging' | 'concise'): Promise<string>;
    /**
     * Destroy the current session and cleanup
     */
    static destroy(): void;
    /**
     * Build coaching prompt based on context
     */
    private static buildCoachingPrompt;
    /**
     * Build weekly summary prompt
     */
    private static buildWeeklySummaryPrompt;
    /**
     * Parse weekly summary response
     */
    private static parseWeeklySummary;
    /**
     * Estimate reading duration in seconds
     */
    private static estimateDuration;
    /**
     * Get mock coaching script for fallback
     */
    private static getMockCoachingScript;
    /**
     * Get mock weekly summary for fallback
     */
    private static getMockWeeklySummary;
}
export declare const OpenAIService: typeof ChromeAIService;
export default ChromeAIService;
