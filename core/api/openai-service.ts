/**
 * Chrome AI Service
 * Handles AI-powered features using Chrome's built-in Gemini Nano model
 * Replaces OpenAI API with Chrome's Prompt API for coaching scripts, weekly summaries, and translations
 */

import { CoachingScript, WeeklySummary, UserData } from '../../types/index';

// Chrome AI API types
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
        prompt(input: string | Array<{ role: 'system' | 'user' | 'assistant'; content: string | { type: 'text' | 'image'; text?: string; image?: string; }; }>): Promise<string>;
        destroy(): void;
      }>;
    };
  }
}

export class ChromeAIService {
  private static session: any = null;
  private static isInitialized = false;
  private static readonly DEFAULT_TEMPERATURE = 0.7;
  private static readonly DEFAULT_TOP_K = 3;

  /**
   * Initialize the Chrome AI service
   */
  static async initialize(): Promise<void> {
    try {
      if (!('LanguageModel' in window)) {
        console.warn('Chrome AI not available. AI features will use mock data.');
        return;
      }

      const availability = await (window as any).LanguageModel.availability();
      
      if (availability === 'no') {
        console.warn('Chrome AI model not available. AI features will use mock data.');
        return;
      }

      if (availability === 'after-download') {
        console.log('Chrome AI model downloading...');
      }

      // Create a session for general use
      this.session = await (window as any).LanguageModel.create({
        temperature: this.DEFAULT_TEMPERATURE,
        topK: this.DEFAULT_TOP_K,
        monitor: (m: any) => {
          m.addEventListener('downloadprogress', (e: any) => {
            console.log(`Chrome AI model download progress: ${Math.round(e.loaded * 100)}%`);
          });
        }
      });

      this.isInitialized = true;
      console.log('Chrome AI service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Chrome AI service:', error);
    }
  }

  /**
   * Send multimodal prompt to Chrome AI (text + image)
   */
  static async promptWithImage(
    textPrompt: string,
    imageData?: string,
    options?: {
      temperature?: number;
      topK?: number;
    }
  ): Promise<string> {
    try {
      await this.initialize();
      
      if (!this.session) {
        console.warn('Chrome AI session not available for multimodal prompt');
        return 'Chrome AI not available for image analysis';
      }

      const messages = [];
      
      if (imageData) {
        messages.push({
          role: 'user' as const,
          content: {
            type: 'image' as const,
            image: imageData
          }
        });
      }
      
      messages.push({
        role: 'user' as const,
        content: textPrompt
      });

      const response = await this.session.prompt(messages);
      return response;
    } catch (error) {
      console.error('Chrome AI multimodal prompt failed:', error);
      return 'Unable to analyze image with Chrome AI';
    }
  }

  /**
   * Send text prompt to Chrome AI
   */
  static async prompt(
    textPrompt: string,
    options?: {
      temperature?: number;
      topK?: number;
    }
  ): Promise<string> {
    try {
      await this.initialize();
      
      if (!this.session) {
        console.warn('Chrome AI session not available for text prompt');
        return 'Chrome AI not available';
      }

      const response = await this.session.prompt(textPrompt);
      return response;
    } catch (error) {
      console.error('Chrome AI text prompt failed:', error);
      return 'Unable to process request with Chrome AI';
    }
  }

  /**
   * Generate a personalized coaching script
   */
  static async generateCoachingScript(
    type: 'motivation' | 'instruction' | 'relaxation',
    userContext: {
      fatigueLevel: number;
      breakCount: number;
      timeOfDay: string;
      language: string;
    }
  ): Promise<CoachingScript> {
    try {
      if (!this.isInitialized || !this.session) {
        return this.getMockCoachingScript(type, userContext.language);
      }

      const prompt = this.buildCoachingPrompt(type, userContext);
      const systemPrompt = 'You are an expert eye health coach specializing in Traditional Chinese Medicine and modern ergonomics. Generate helpful, encouraging, and practical coaching scripts.';
      
      const response = await this.session.prompt([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]);

      const content = response?.trim() || this.getMockCoachingScript(type, userContext.language).content;

      return {
        id: Date.now().toString(),
        type,
        content: content.substring(0, 300), // Limit content length
        duration: this.estimateDuration(content),
        language: userContext.language,
        generated: Date.now()
      };
    } catch (error) {
      console.error('Failed to generate coaching script:', error);
      return this.getMockCoachingScript(type, userContext.language);
    }
  }

  /**
   * Generate weekly summary with insights and recommendations
   */
  static async generateWeeklySummary(userData: UserData): Promise<WeeklySummary> {
    try {
      if (!this.isInitialized || !this.session) {
        return this.getMockWeeklySummary(userData);
      }

      const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const weekEnd = Date.now();
      
      // Filter data for the past week
      const weeklyMetrics = userData.metrics.filter(m => m.timestamp >= weekStart);
      const weeklyBreaks = userData.breaks.filter(b => b.startTime >= weekStart);
      
      const prompt = this.buildWeeklySummaryPrompt({
        metrics: weeklyMetrics,
        breaks: weeklyBreaks,
        settings: userData.settings,
        currentScore: userData.score
      });

      const systemPrompt = 'You are an eye health analyst. Analyze weekly data and provide actionable insights, improvements, and recommendations in a supportive tone.';
      
      const response = await this.session.prompt([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]);

      const analysis = response || '';
      const parsedAnalysis = this.parseWeeklySummary(analysis);

      return {
        weekStart,
        weekEnd,
        totalBreaks: weeklyBreaks.filter(b => b.completed).length,
        averageEyeScore: userData.score.weekly,
        fatigueEvents: weeklyMetrics.filter(m => m.fatigueIndex > userData.settings.fatigueThreshold).length,
        improvements: parsedAnalysis.improvements,
        recommendations: parsedAnalysis.recommendations,
        generated: Date.now()
      };
    } catch (error) {
      console.error('Failed to generate weekly summary:', error);
      return this.getMockWeeklySummary(userData);
    }
  }

  /**
   * Translate text to specified language
   */
  static async translateText(text: string, targetLanguage: string): Promise<string> {
    try {
      if (!this.isInitialized || !this.session) {
        return `[${targetLanguage.toUpperCase()}] ${text}`; // Mock translation
      }

      const prompt = `Translate the following text to ${targetLanguage}. Maintain the tone and context, especially for health and wellness content: "${text}"`;
      const systemPrompt = 'You are a professional translator. Provide accurate translations while maintaining the original meaning and tone.';
      
      const response = await this.session.prompt([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]);

      return response?.trim() || text;
    } catch (error) {
      console.error('Failed to translate text:', error);
      return text;
    }
  }

  /**
   * Rewrite text for better clarity or tone
   */
  static async rewriteText(
    text: string, 
    style: 'formal' | 'casual' | 'encouraging' | 'concise'
  ): Promise<string> {
    try {
      if (!this.isInitialized || !this.session) {
        return `[${style.toUpperCase()}] ${text}`; // Mock rewrite
      }

      const stylePrompts = {
        formal: 'Rewrite this text in a formal, professional tone',
        casual: 'Rewrite this text in a casual, friendly tone',
        encouraging: 'Rewrite this text to be more encouraging and motivational',
        concise: 'Rewrite this text to be more concise while keeping the key message'
      };

      const prompt = `${stylePrompts[style]}. Maintain the original meaning and context: "${text}"`;
      const systemPrompt = 'You are a skilled writer. Rewrite text according to the specified style while preserving the original meaning.';
      
      const response = await this.session.prompt([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]);

      return response?.trim() || text;
    } catch (error) {
      console.error('Failed to rewrite text:', error);
      return text;
    }
  }

  /**
   * Destroy the current session and cleanup
   */
  static destroy(): void {
    if (this.session) {
      try {
        this.session.destroy();
      } catch (error) {
        console.error('Error destroying Chrome AI session:', error);
      }
      this.session = null;
      this.isInitialized = false;
    }
  }

  /**
   * Build coaching prompt based on context
   */
  private static buildCoachingPrompt(
    type: 'motivation' | 'instruction' | 'relaxation',
    context: { fatigueLevel: number; breakCount: number; timeOfDay: string; language: string }
  ): string {
    const baseContext = `Current fatigue level: ${context.fatigueLevel}%, breaks taken today: ${context.breakCount}, time: ${context.timeOfDay}`;
    
    switch (type) {
      case 'motivation':
        return `Generate a motivational message for someone taking an eye break. ${baseContext}. Keep it under 50 words, encouraging, and focused on eye health benefits.`;
      
      case 'instruction':
        return `Generate clear instructions for eye exercises during a break. ${baseContext}. Include specific techniques like the 20-20-20 rule or TCM massage points. Keep it under 60 words.`;
      
      case 'relaxation':
        return `Generate a calming, mindful message for relaxation during an eye break. ${baseContext}. Focus on breathing, mindfulness, and letting go of screen tension. Keep it under 50 words.`;
      
      default:
        return `Generate a helpful eye health message. ${baseContext}.`;
    }
  }

  /**
   * Build weekly summary prompt
   */
  private static buildWeeklySummaryPrompt(data: any): string {
    return `Analyze this week's eye health data and provide insights:

Metrics: ${data.metrics.length} readings, average fatigue: ${data.metrics.reduce((sum: number, m: any) => sum + m.fatigueIndex, 0) / data.metrics.length || 0}%
Breaks: ${data.breaks.length} total, ${data.breaks.filter((b: any) => b.completed).length} completed
Current eye score: ${data.currentScore.current}
Settings: ${data.settings.reminderInterval}min intervals, ${data.settings.dailyBreakGoal} daily goal

Provide:
1. 2-3 key improvements this week
2. 2-3 actionable recommendations

Format as JSON: {"improvements": ["..."], "recommendations": ["..."]}`;
  }

  /**
   * Parse weekly summary response
   */
  private static parseWeeklySummary(analysis: string): { improvements: string[]; recommendations: string[] } {
    try {
      const parsed = JSON.parse(analysis);
      return {
        improvements: parsed.improvements || [],
        recommendations: parsed.recommendations || []
      };
    } catch {
      // Fallback parsing
      const improvements = analysis.match(/improvements?[:\s]*([^\n]*)/gi)?.[0]?.split(',') || [];
      const recommendations = analysis.match(/recommendations?[:\s]*([^\n]*)/gi)?.[0]?.split(',') || [];
      
      return {
        improvements: improvements.slice(0, 3),
        recommendations: recommendations.slice(0, 3)
      };
    }
  }

  /**
   * Estimate reading duration in seconds
   */
  private static estimateDuration(text: string): number {
    const wordsPerMinute = 200;
    const words = text.split(' ').length;
    return Math.max(Math.ceil((words / wordsPerMinute) * 60), 10);
  }

  /**
   * Get mock coaching script for fallback
   */
  private static getMockCoachingScript(type: 'motivation' | 'instruction' | 'relaxation', language: string): CoachingScript {
    const scripts = {
      motivation: {
        en: "Great job taking this break! Your eyes will thank you for this moment of rest. Every break brings you closer to better eye health.",
        zh: "很好，你正在休息！你的眼睛会感谢你给它们这个休息的时刻。每次休息都让你更接近更好的眼部健康。",
        es: "¡Excelente trabajo tomando este descanso! Tus ojos te agradecerán este momento de descanso. Cada pausa te acerca a una mejor salud ocular."
      },
      instruction: {
        en: "Look at something 20 feet away for 20 seconds. Blink slowly and deliberately. Gently massage the temples in circular motions.",
        zh: "看向20英尺外的物体20秒钟。缓慢而有意识地眨眼。轻柔地以圆周运动按摩太阳穴。",
        es: "Mira algo a 20 pies de distancia durante 20 segundos. Parpadea lenta y deliberadamente. Masajea suavemente las sienes con movimientos circulares."
      },
      relaxation: {
        en: "Take a deep breath and let your shoulders drop. Feel the tension leaving your eye muscles. You are giving yourself the gift of rest.",
        zh: "深呼吸，让肩膀放松下来。感受眼部肌肉的紧张感消失。你正在给自己休息的礼物。",
        es: "Respira profundamente y deja caer los hombros. Siente cómo la tensión abandona los músculos de tus ojos. Te estás dando el regalo del descanso."
      }
    };

    const content = scripts[type][language as keyof typeof scripts[typeof type]] || scripts[type].en;
    
    return {
      id: Date.now().toString(),
      type,
      content,
      duration: this.estimateDuration(content),
      language,
      generated: Date.now()
    };
  }

  /**
   * Get mock weekly summary for fallback
   */
  private static getMockWeeklySummary(userData: UserData): WeeklySummary {
    return {
      weekStart: Date.now() - 7 * 24 * 60 * 60 * 1000,
      weekEnd: Date.now(),
      totalBreaks: userData.breaks.filter(b => b.completed).length,
      averageEyeScore: userData.score.weekly,
      fatigueEvents: userData.metrics.filter(m => m.fatigueIndex > userData.settings.fatigueThreshold).length,
      improvements: [
        'Maintained consistent break schedule',
        'Reduced peak fatigue incidents',
        'Improved overall eye score trend'
      ],
      recommendations: [
        'Continue with regular 20-20-20 breaks',
        'Consider adjusting screen brightness in the evening',
        'Try the TCM massage techniques during longer breaks'
      ],
      generated: Date.now()
    };
  }
}

// Initialize the service
ChromeAIService.initialize();

// Export as OpenAIService for backward compatibility
export const OpenAIService = ChromeAIService;
export default ChromeAIService;