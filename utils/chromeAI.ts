/**
 * Chrome Built-in AI Service
 * Interfaces with Chrome's Prompt API (Gemini Nano) to provide personalized eye health suggestions
 */

export interface EyeHealthData {
  eyeScore: number; // 0-100
  blinkRate?: number;
  eyeStrain?: number;
  posture?: number;
  screenTime?: number; // minutes
  breaksTaken?: number;
  lastBreakTime?: Date;
  fatigue?: 'low' | 'medium' | 'high';
}

export interface AISuggestion {
  type: 'immediate' | 'preventive' | 'lifestyle';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action?: string;
  duration?: string;
}

export interface AIResponse {
  suggestions: AISuggestion[];
  overallAssessment: string;
  recommendedBreakType?: 'MICRO' | 'SHORT' | 'LONG';
}

class ChromeAIService {
  private session: any = null;
  private isInitialized = false;

  /**
   * Check if Chrome's built-in AI is available
   */
  async checkAvailability(): Promise<string> {
    try {
      // Check if the LanguageModel API is available
      if (!('LanguageModel' in window)) {
        return 'unavailable';
      }

      const availability = await (window as any).LanguageModel.availability();
      return availability;
    } catch (error) {
      console.error('Error checking AI availability:', error);
      return 'unavailable';
    }
  }

  /**
   * Initialize the AI session
   */
  async initialize(): Promise<boolean> {
    try {
      const availability = await this.checkAvailability();
      
      if (availability === 'unavailable') {
        console.warn('Chrome AI is not available on this device');
        return false;
      }

      if (availability === 'downloadable') {
        console.log('AI model needs to be downloaded. This may take a while...');
      }

      // Create AI session with optimized parameters for eye health suggestions
      const params = await (window as any).LanguageModel.params();
      
      this.session = await (window as any).LanguageModel.create({
        temperature: Math.min(params.defaultTemperature * 0.8, 1.0), // Lower temperature for more consistent suggestions
        topK: Math.min(params.defaultTopK, 3), // More focused responses
        monitor(m: any) {
          m.addEventListener('downloadprogress', (e: any) => {
            console.log(`AI model download progress: ${Math.round(e.loaded * 100)}%`);
          });
        }
      });

      this.isInitialized = true;
      console.log('Chrome AI initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Chrome AI:', error);
      return false;
    }
  }

  /**
   * Generate eye health suggestions based on current data
   */
  async generateSuggestions(eyeHealthData: EyeHealthData): Promise<AIResponse | null> {
    if (!this.isInitialized || !this.session) {
      const initialized = await this.initialize();
      if (!initialized) {
        return null;
      }
    }

    try {
      const prompt = this.buildPrompt(eyeHealthData);
      const response = await this.session.prompt(prompt);
      
      return this.parseAIResponse(response, eyeHealthData);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      return null;
    }
  }

  /**
   * Build a comprehensive prompt for eye health suggestions
   */
  private buildPrompt(data: EyeHealthData): string {
    const currentTime = new Date();
    const timeOfDay = this.getTimeOfDay(currentTime);
    
    return `You are an expert eye health advisor. Based on the following eye health data, provide personalized suggestions to improve eye comfort and prevent strain.

Current Eye Health Data:
- Eye Health Score: ${data.eyeScore}/100 ${this.getScoreCategory(data.eyeScore)}
- Blink Rate: ${data.blinkRate || 'Unknown'} blinks/minute
- Eye Strain Level: ${data.eyeStrain || 'Unknown'}/10
- Posture Score: ${data.posture || 'Unknown'}/10
- Screen Time Today: ${data.screenTime || 'Unknown'} minutes
- Breaks Taken: ${data.breaksTaken || 0}
- Last Break: ${data.lastBreakTime ? this.formatTimeSince(data.lastBreakTime) : 'No recent breaks'}
- Fatigue Level: ${data.fatigue || 'Unknown'}
- Time of Day: ${timeOfDay}

Please provide:
1. 2-3 immediate actionable suggestions (things to do right now)
2. 1-2 preventive measures (habits to develop)
3. 1 lifestyle recommendation (long-term improvement)
4. An overall assessment of current eye health status
5. Recommended break type: MICRO (20 seconds), SHORT (5 minutes), or LONG (15 minutes)

Format your response as a JSON object with this structure:
{
  "suggestions": [
    {
      "type": "immediate|preventive|lifestyle",
      "priority": "low|medium|high",
      "title": "Brief title",
      "description": "Detailed explanation",
      "action": "Specific action to take (optional)",
      "duration": "Time needed (optional)"
    }
  ],
  "overallAssessment": "Brief assessment of current eye health",
  "recommendedBreakType": "MICRO|SHORT|LONG"
}

Keep suggestions practical, evidence-based, and tailored to the current data. Focus on actionable advice that can be implemented immediately.`;
  }

  /**
   * Parse AI response and structure it properly
   */
  private parseAIResponse(response: string, data: EyeHealthData): AIResponse {
    try {
      // Try to parse as JSON first
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to parse AI response as JSON, using fallback parsing');
    }

    // Fallback: Parse text response and structure it
    return this.createFallbackResponse(response, data);
  }

  /**
   * Create a structured response when JSON parsing fails
   */
  private createFallbackResponse(response: string, data: EyeHealthData): AIResponse {
    const suggestions: AISuggestion[] = [];
    
    // Extract suggestions from text response
    const lines = response.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.includes('immediate') || line.includes('right now') || line.includes('currently')) {
        suggestions.push({
          type: 'immediate',
          priority: data.eyeScore < 50 ? 'high' : 'medium',
          title: 'Immediate Action',
          description: line.trim()
        });
      } else if (line.includes('prevent') || line.includes('habit') || line.includes('regular')) {
        suggestions.push({
          type: 'preventive',
          priority: 'medium',
          title: 'Preventive Measure',
          description: line.trim()
        });
      } else if (line.includes('lifestyle') || line.includes('long-term') || line.includes('overall')) {
        suggestions.push({
          type: 'lifestyle',
          priority: 'low',
          title: 'Lifestyle Improvement',
          description: line.trim()
        });
      }
    }

    // If no suggestions were extracted, create default ones
    if (suggestions.length === 0) {
      suggestions.push(...this.getDefaultSuggestions(data));
    }

    return {
      suggestions: suggestions.slice(0, 5), // Limit to 5 suggestions
      overallAssessment: this.generateAssessment(data),
      recommendedBreakType: this.recommendBreakType(data)
    };
  }

  /**
   * Get default suggestions based on eye health data
   */
  private getDefaultSuggestions(data: EyeHealthData): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    if (data.eyeScore < 50) {
      suggestions.push({
        type: 'immediate',
        priority: 'high',
        title: 'Take a Break Now',
        description: 'Your eye health score is low. Take a 5-minute break to rest your eyes.',
        action: 'Look away from screen and focus on distant objects',
        duration: '5 minutes'
      });
    }

    if (!data.breaksTaken || data.breaksTaken < 3) {
      suggestions.push({
        type: 'immediate',
        priority: 'medium',
        title: 'Follow 20-20-20 Rule',
        description: 'Every 20 minutes, look at something 20 feet away for 20 seconds.',
        action: 'Set a timer for regular eye breaks'
      });
    }

    suggestions.push({
      type: 'preventive',
      priority: 'medium',
      title: 'Improve Blinking',
      description: 'Consciously blink more often to keep your eyes moist and reduce strain.',
      action: 'Practice deliberate blinking exercises'
    });

    if (data.screenTime && data.screenTime > 240) { // More than 4 hours
      suggestions.push({
        type: 'lifestyle',
        priority: 'medium',
        title: 'Reduce Screen Time',
        description: 'Consider reducing overall screen time and taking longer breaks between sessions.',
        action: 'Plan screen-free activities during breaks'
      });
    }

    return suggestions;
  }

  /**
   * Generate overall assessment based on eye health data
   */
  private generateAssessment(data: EyeHealthData): string {
    if (data.eyeScore >= 80) {
      return 'Your eye health is excellent! Keep up the good habits and continue taking regular breaks.';
    } else if (data.eyeScore >= 60) {
      return 'Your eye health is good, but there\'s room for improvement. Focus on regular breaks and proper posture.';
    } else if (data.eyeScore >= 40) {
      return 'Your eye health needs attention. Consider taking more frequent breaks and adjusting your workspace setup.';
    } else {
      return 'Your eye health requires immediate attention. Take a break now and consider consulting an eye care professional.';
    }
  }

  /**
   * Recommend break type based on current data
   */
  private recommendBreakType(data: EyeHealthData): 'MICRO' | 'SHORT' | 'LONG' {
    if (data.eyeScore < 30 || data.fatigue === 'high') {
      return 'LONG';
    } else if (data.eyeScore < 60 || data.fatigue === 'medium' || (data.breaksTaken || 0) < 2) {
      return 'SHORT';
    } else {
      return 'MICRO';
    }
  }

  /**
   * Get score category description
   */
  private getScoreCategory(score: number): string {
    if (score >= 80) return '(Excellent)';
    if (score >= 60) return '(Good)';
    if (score >= 40) return '(Fair)';
    return '(Needs Attention)';
  }

  /**
   * Get time of day description
   */
  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour < 6) return 'Early Morning';
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    if (hour < 21) return 'Evening';
    return 'Night';
  }

  /**
   * Format time since last break
   */
  private formatTimeSince(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    if (this.session) {
      try {
        await this.session.destroy();
      } catch (error) {
        console.error('Error destroying AI session:', error);
      }
      this.session = null;
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const chromeAI = new ChromeAIService();

// Export utility functions
export const AIUtils = {
  /**
   * Check if Chrome AI is supported in current environment
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'LanguageModel' in window;
  },

  /**
   * Get user-friendly availability message
   */
  getAvailabilityMessage(status: string): string {
    switch (status) {
      case 'available':
        return 'AI suggestions are ready!';
      case 'downloadable':
        return 'AI model needs to be downloaded (this may take a few minutes)';
      case 'downloading':
        return 'AI model is downloading...';
      case 'unavailable':
        return 'AI suggestions are not available on this device';
      default:
        return 'Checking AI availability...';
    }
  },

  /**
   * Create sample eye health data for testing
   */
  createSampleData(overrides: Partial<EyeHealthData> = {}): EyeHealthData {
    return {
      eyeScore: 65,
      blinkRate: 12,
      eyeStrain: 6,
      posture: 7,
      screenTime: 180,
      breaksTaken: 2,
      lastBreakTime: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      fatigue: 'medium',
      ...overrides
    };
  }
};