/**
 * Chrome AI Service
 * Interfaces with Chrome's built-in AI Prompt API (Gemini Nano) to provide
 * personalized eye health suggestions based on user metrics and scores.
 */

import { EyeMetrics, BreakType, PostureStatus } from '../../types/index';

export interface AIHealthSuggestion {
  message: string;
  severity: 'low' | 'medium' | 'high';
  category: 'environment' | 'posture' | 'habits' | 'nutrition' | 'workspace';
  confidence: number;
}

export class ChromeAIService {
  private session: any = null;
  private isInitialized = false;

  /**
   * Initialize the Chrome AI session
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if Chrome AI is available
      if (!('LanguageModel' in window)) {
        console.warn('Chrome AI Prompt API not available');
        return false;
      }

      // Check availability
      const availability = await (window as any).LanguageModel.availability();
      console.log('Chrome AI model availability:', availability);
      
      if (availability === 'no') {
        console.warn('Chrome AI model not available on this device');
        return false;
      }

      // Handle downloadable status - model needs to be downloaded first
      if (availability === 'downloadable' || availability === 'downloading') {
        console.log('Chrome AI model needs to be downloaded. Starting download...');
        
        // Create session which will trigger download with progress monitoring
        this.session = await (window as any).LanguageModel.create({
          topK: 3,        // Focus on top 3 most relevant responses
          temperature: 0.3, // Lower temperature for more consistent health advice
          monitor(m: any) {
            m.addEventListener('downloadprogress', (e: any) => {
              const progress = Math.round(e.loaded * 100);
              console.log(`Chrome AI model download progress: ${progress}%`);
            });
          }
        });
      } else if (availability === 'readily') {
        // Model is ready, create session normally
        this.session = await (window as any).LanguageModel.create({
          topK: 3,        // Focus on top 3 most relevant responses
          temperature: 0.3 // Lower temperature for more consistent health advice
        });
      } else {
        console.warn('Unknown Chrome AI availability status:', availability);
        return false;
      }

      this.isInitialized = true;
      console.log('Chrome AI service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Chrome AI service:', error);
      return false;
    }
  }

  /**
   * Generate personalized eye health suggestions based on metrics
   */
  async generateHealthSuggestion(
    eyeScore: number,
    fatigueScore: number,
    eyeMetrics: EyeMetrics
  ): Promise<AIHealthSuggestion> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return this.getFallbackSuggestion(eyeScore, fatigueScore, eyeMetrics);
      }
    }

    try {
      const prompt = this.buildHealthPrompt(eyeScore, fatigueScore, eyeMetrics);
      const response = await this.session.prompt(prompt);
      
      return this.parseAIResponse(response, eyeScore, fatigueScore, eyeMetrics);
    } catch (error) {
      console.error('Chrome AI suggestion generation failed:', error);
      return this.getFallbackSuggestion(eyeScore, fatigueScore, eyeMetrics);
    }
  }

  /**
   * Build a structured prompt for eye health analysis
   */
  private buildHealthPrompt(eyeScore: number, fatigueScore: number, eyeMetrics: EyeMetrics): string {
    return `As an eye health expert, provide a brief personalized tip (max 40 words) based on these metrics:

Eye Health Score: ${eyeScore}/100
Fatigue Level: ${fatigueScore}/100
Blink Rate: ${eyeMetrics.blinkRate} blinks/min (normal: 15-20)
Eye Strain Index: ${(eyeMetrics.fatigueIndex * 100).toFixed(1)}%
Posture Status: ${eyeMetrics.posture}

Provide a unique suggestion that is NOT a break activity. Focus on:
- Environment adjustments (lighting, screen distance, humidity)
- Workspace ergonomics (monitor height, chair position)
- Daily habits (hydration, nutrition, sleep)
- Posture improvements

Provide:
1. One specific actionable tip
2. Urgency level (low/medium/high)
3. Category (environment/posture/habits/nutrition/workspace)

Format: "[Tip] | [Urgency] | [Category]"`;
  }

  /**
   * Parse AI response into structured suggestion
   */
  private parseAIResponse(
    response: string,
    eyeScore: number,
    fatigueScore: number,
    eyeMetrics: EyeMetrics
  ): AIHealthSuggestion {
    try {
      const parts = response.split('|').map(part => part.trim());
      
      if (parts.length >= 3) {
        const message = parts[0];
        const severity = this.normalizeSeverity(parts[1]);
        const category = this.normalizeCategory(parts[2]);
        
        return {
          message,
          severity,
          category,
          confidence: 0.85
        };
      }
    } catch (error) {
      console.warn('Failed to parse AI response:', error);
    }

    // Fallback to using the raw response as message
    return {
      message: response.substring(0, 100), // Limit length
      severity: this.determineSeverity(eyeScore, fatigueScore),
      category: this.determineCategory(fatigueScore, eyeMetrics),
      confidence: 0.7
    };
  }

  /**
   * Normalize severity from AI response
   */
  private normalizeSeverity(severityText: string): 'low' | 'medium' | 'high' {
    const text = severityText.toLowerCase();
    if (text.includes('high') || text.includes('urgent') || text.includes('critical')) {
      return 'high';
    } else if (text.includes('medium') || text.includes('moderate')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Normalize category from AI response
   */
  private normalizeCategory(categoryText: string): 'environment' | 'posture' | 'habits' | 'nutrition' | 'workspace' {
    const text = categoryText.toLowerCase();
    
    if (text.includes('environment') || text.includes('lighting') || text.includes('humidity')) {
      return 'environment';
    } else if (text.includes('posture') || text.includes('position')) {
      return 'posture';
    } else if (text.includes('habits') || text.includes('sleep') || text.includes('routine')) {
      return 'habits';
    } else if (text.includes('nutrition') || text.includes('hydration') || text.includes('food')) {
      return 'nutrition';
    } else if (text.includes('workspace') || text.includes('ergonomic') || text.includes('monitor')) {
      return 'workspace';
    }
    
    return 'environment'; // Default
  }

  /**
   * Determine severity based on scores
   */
  private determineSeverity(eyeScore: number, fatigueScore: number): 'low' | 'medium' | 'high' {
    if (fatigueScore > 70 || eyeScore < 30) return 'high';
    if (fatigueScore > 40 || eyeScore < 60) return 'medium';
    return 'low';
  }

  /**
   * Determine category based on metrics
   */
  private determineCategory(fatigueScore: number, eyeMetrics: EyeMetrics): 'environment' | 'posture' | 'habits' | 'nutrition' | 'workspace' {
    if (eyeMetrics.posture === PostureStatus.FORWARD || eyeMetrics.posture === PostureStatus.TILTED) {
      return 'posture';
    } else if (fatigueScore > 60) {
      return 'habits';
    } else if (eyeMetrics.blinkRate < 10) {
      return 'environment';
    } else if (eyeMetrics.fatigueIndex > 0.5) {
      return 'workspace';
    }
    return 'environment';
  }

  /**
   * Fallback suggestions when AI is not available
   */
  private getFallbackSuggestion(
    eyeScore: number,
    fatigueScore: number,
    eyeMetrics: EyeMetrics
  ): AIHealthSuggestion {
    const severity = this.determineSeverity(eyeScore, fatigueScore);
    const category = this.determineCategory(fatigueScore, eyeMetrics);
    
    const suggestions = {
      environment: 'Adjust your screen brightness to match room lighting and increase humidity.',
      posture: 'Position your monitor 20-26 inches away and top of screen at eye level.',
      habits: 'Stay hydrated with 8 glasses of water daily and get 7-8 hours of sleep.',
      nutrition: 'Include omega-3 rich foods and leafy greens in your diet for eye health.',
      workspace: 'Use proper lighting behind your screen and consider blue light filters.'
    };
    
    return {
      message: suggestions[category],
      severity,
      category,
      confidence: 0.6
    };
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    if (this.session) {
      try {
        await this.session.destroy();
      } catch (error) {
        console.warn('Error destroying Chrome AI session:', error);
      }
      this.session = null;
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const chromeAIService = new ChromeAIService();