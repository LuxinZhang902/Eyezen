/**
 * OpenAI API Service
 * Handles AI-powered features: coaching scripts, weekly summaries, and translations
 */

import { OpenAIRequest, ChatMessage, CoachingScript, WeeklySummary, UserData } from '../../types/index';

export class OpenAIService {
  private static readonly API_BASE_URL = 'https://api.openai.com/v1';
  private static readonly DEFAULT_MODEL = 'gpt-3.5-turbo';
  private static readonly MAX_RETRIES = 3;
  private static readonly TIMEOUT_MS = 30000;

  private static apiKey: string | null = null;

  /**
   * Initialize the service with API key
   */
  static async initialize(): Promise<void> {
    try {
      // In a real implementation, you'd get this from secure storage or environment
      // For demo purposes, we'll use a placeholder
      this.apiKey = process.env.OPENAI_API_KEY || 'your-openai-api-key-here';
      
      if (!this.apiKey || this.apiKey === 'your-openai-api-key-here') {
        console.warn('OpenAI API key not configured. AI features will use mock data.');
      }
    } catch (error) {
      console.error('Failed to initialize OpenAI service:', error);
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
      if (!this.apiKey || this.apiKey === 'your-openai-api-key-here') {
        return this.getMockCoachingScript(type, userContext.language);
      }

      const prompt = this.buildCoachingPrompt(type, userContext);
      const response = await this.makeAPIRequest({
        model: this.DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert eye health coach specializing in Traditional Chinese Medicine and modern ergonomics. Generate helpful, encouraging, and practical coaching scripts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      const content = response.choices[0]?.message?.content || this.getMockCoachingScript(type, userContext.language).content;

      return {
        id: Date.now().toString(),
        type,
        content: content.trim(),
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
      if (!this.apiKey || this.apiKey === 'your-openai-api-key-here') {
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

      const response = await this.makeAPIRequest({
        model: this.DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an eye health analyst. Analyze weekly data and provide actionable insights, improvements, and recommendations in a supportive tone.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 400
      });

      const analysis = response.choices[0]?.message?.content || '';
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
      if (!this.apiKey || this.apiKey === 'your-openai-api-key-here') {
        return `[${targetLanguage.toUpperCase()}] ${text}`; // Mock translation
      }

      const response = await this.makeAPIRequest({
        model: this.DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text to ${targetLanguage}. Maintain the tone and context, especially for health and wellness content.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      return response.choices[0]?.message?.content?.trim() || text;
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
      if (!this.apiKey || this.apiKey === 'your-openai-api-key-here') {
        return `[${style.toUpperCase()}] ${text}`; // Mock rewrite
      }

      const stylePrompts = {
        formal: 'Rewrite this text in a formal, professional tone',
        casual: 'Rewrite this text in a casual, friendly tone',
        encouraging: 'Rewrite this text to be more encouraging and motivational',
        concise: 'Rewrite this text to be more concise while keeping the key message'
      };

      const response = await this.makeAPIRequest({
        model: this.DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `${stylePrompts[style]}. Maintain the original meaning and context.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.4,
        max_tokens: 250
      });

      return response.choices[0]?.message?.content?.trim() || text;
    } catch (error) {
      console.error('Failed to rewrite text:', error);
      return text;
    }
  }

  /**
   * Make API request to OpenAI
   */
  private static async makeAPIRequest(request: OpenAIRequest): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch(`${this.API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
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
OpenAIService.initialize();