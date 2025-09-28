"use strict";
(self["webpackChunkeyezen_chrome_extension"] = self["webpackChunkeyezen_chrome_extension"] || []).push([["core_ai_chrome-ai-vision_ts"],{

/***/ "./core/ai/chrome-ai-vision.ts":
/*!*************************************!*\
  !*** ./core/ai/chrome-ai-vision.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ChromeAIVisionService: () => (/* binding */ ChromeAIVisionService),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _api_openai_service__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../api/openai-service */ "./core/api/openai-service.ts");
/**
 * Chrome AI Vision Service
 * Integrates Chrome's built-in AI with multimodal support for eye strain analysis
 * Uses Prompt API with image input to analyze camera feed and provide AI-powered insights
 */

class ChromeAIVisionService {
    /**
     * Initialize the Chrome AI Vision service
     */
    static async initialize() {
        try {
            // Use the centralized ChromeAIService initialization
            await _api_openai_service__WEBPACK_IMPORTED_MODULE_0__.ChromeAIService.initialize();
            this.isInitialized = true;
            console.log('Chrome AI Vision service initialized successfully');
            return true;
        }
        catch (error) {
            console.error('Failed to initialize Chrome AI Vision service:', error);
            return false;
        }
    }
    /**
     * Analyze eye strain from camera image using Chrome AI multimodal capabilities
     */
    static async analyzeEyeStrain(imageData, // Base64 encoded image
    currentMetrics, contextInfo) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            const contextPrompt = this.buildContextPrompt(currentMetrics, contextInfo);
            // Use ChromeAIService for multimodal analysis
            const response = await _api_openai_service__WEBPACK_IMPORTED_MODULE_0__.ChromeAIService.promptWithImage(`${contextPrompt}\n\nPlease analyze this image for eye strain and fatigue indicators. Provide your assessment in the specified JSON format.`, imageData, {
                temperature: this.VISION_TEMPERATURE,
                topK: this.VISION_TOP_K
            });
            return this.parseAIResponse(response);
        }
        catch (error) {
            console.error('Chrome AI vision analysis failed:', error);
            return this.getFallbackAnalysis(currentMetrics);
        }
    }
    /**
     * Generate personalized recommendations based on AI analysis and user history
     */
    static async generatePersonalizedRecommendations(analysis, userHistory) {
        try {
            if (!this.isInitialized) {
                return this.getDefaultRecommendations(analysis.strainLevel);
            }
            const prompt = `Based on the current eye strain analysis and user history, provide 3-5 personalized recommendations:

Current Analysis:
- Strain Level: ${analysis.strainLevel}/100
- Fatigue Indicators: ${analysis.fatigueIndicators.join(', ')}
- Blink Quality: ${analysis.blinkQuality}
- Posture: ${analysis.postureAssessment}

User History:
- Average Strain: ${userHistory.averageStrainLevel}/100
- Common Issues: ${userHistory.commonIssues.join(', ')}
- Preferred Breaks: ${userHistory.preferredBreakTypes.join(', ')}
- Working Hours: ${userHistory.workingHours.start} - ${userHistory.workingHours.end}

Provide actionable, personalized recommendations as a JSON array of strings.`;
            const response = await _api_openai_service__WEBPACK_IMPORTED_MODULE_0__.ChromeAIService.prompt(prompt);
            const recommendations = this.parseRecommendations(response);
            return recommendations.length > 0 ? recommendations : this.getDefaultRecommendations(analysis.strainLevel);
        }
        catch (error) {
            console.error('Failed to generate personalized recommendations:', error);
            return this.getDefaultRecommendations(analysis.strainLevel);
        }
    }
    /**
     * Analyze a static image for eye strain and provide a score
     * This method is designed for user-uploaded images
     */
    static async analyzeStaticImage(imageData, // Base64 encoded image or File object
    options) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            const analysisPrompt = `You need to detect the eye strain score for this picture if it contains face and both eyes. The range is 0-100:
   - 😊 for scores 80+ (excellent) 
   - 😐 for scores 60-79 (good) 
   - 😟 for scores 40-59 (moderate) 
   - 😵 for scores below 40 (poor)

Provide your analysis in this JSON format:
{
  "strainLevel": 0-100,
  "fatigueIndicators": ["indicator1", "indicator2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "blinkQuality": "poor|fair|good|excellent",
  "postureAssessment": "description",
  "confidenceScore": 0-1,
  "detailedFindings": {
    "eyeRedness": 0-10,
    "eyelidDrooping": 0-10,
    "overallFatigue": 0-10,
    "postureScore": 0-10
  },
  "summary": "Brief summary of findings"
}`;
            // Use ChromeAIService for multimodal analysis
            const response = await _api_openai_service__WEBPACK_IMPORTED_MODULE_0__.ChromeAIService.promptWithImage(analysisPrompt, imageData, {
                temperature: this.VISION_TEMPERATURE,
                topK: this.VISION_TOP_K
            });
            const analysis = this.parseAIResponse(response);
            // Calculate overall eye strain score based on analysis
            const eyeStrainScore = this.calculateOverallStrainScore(analysis);
            return {
                eyeStrainScore,
                confidence: analysis.confidenceScore,
                analysis,
                summary: this.generateAnalysisSummary(analysis, eyeStrainScore)
            };
        }
        catch (error) {
            console.error('Static image analysis failed:', error);
            const fallbackAnalysis = this.getFallbackAnalysis();
            return {
                eyeStrainScore: 50, // Neutral score when analysis fails
                confidence: 0.1,
                analysis: fallbackAnalysis,
                summary: 'Unable to analyze image. Please ensure the image shows a clear view of the face and eyes.'
            };
        }
    }
    /**
     * Analyze trends and provide weekly insights
     */
    static async analyzeWeeklyTrends(weeklyData) {
        try {
            if (!this.isInitialized) {
                return this.getDefaultWeeklyInsights();
            }
            const dataPrompt = `Analyze this week's eye health data and provide insights:

${weeklyData.map(day => `${day.date}: Strain ${day.averageStrain}/100, ${day.breakCount} breaks, ${day.workingHours}h work`).join('\n')}

Provide analysis in JSON format:
{
  "trends": ["trend1", "trend2"],
  "insights": ["insight1", "insight2"],
  "goalRecommendations": ["goal1", "goal2"]
}`;
            const response = await _api_openai_service__WEBPACK_IMPORTED_MODULE_0__.ChromeAIService.prompt(dataPrompt);
            return this.parseWeeklyAnalysis(response);
        }
        catch (error) {
            console.error('Failed to analyze weekly trends:', error);
            return this.getDefaultWeeklyInsights();
        }
    }
    /**
     * Clean up resources
     */
    static destroy() {
        this.isInitialized = false;
    }
    // Private helper methods
    static buildContextPrompt(metrics, context) {
        let prompt = 'Context for analysis:';
        if (metrics) {
            prompt += `\n- Current blink rate: ${metrics.blinkRate} blinks/min`;
            prompt += `\n- Fatigue index: ${metrics.fatigueIndex}/100`;
            prompt += `\n- Posture status: ${metrics.posture}`;
            prompt += `\n- EAR value: ${metrics.earValue}`;
            prompt += `\n- PERCLOS value: ${metrics.perclosValue}`;
        }
        if (context) {
            prompt += `\n- Session duration: ${Math.round(context.sessionDuration / 60)} minutes`;
            prompt += `\n- Breaks taken: ${context.breakCount}`;
            prompt += `\n- Time of day: ${context.timeOfDay}`;
            if (context.screenBrightness) {
                prompt += `\n- Screen brightness: ${context.screenBrightness}%`;
            }
        }
        return prompt;
    }
    static parseAIResponse(response) {
        try {
            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    strainLevel: Math.max(0, Math.min(100, parsed.strainLevel || 50)),
                    fatigueIndicators: Array.isArray(parsed.fatigueIndicators) ? parsed.fatigueIndicators : [],
                    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
                    blinkQuality: ['poor', 'fair', 'good', 'excellent'].includes(parsed.blinkQuality)
                        ? parsed.blinkQuality : 'fair',
                    postureAssessment: parsed.postureAssessment || 'Unable to assess posture',
                    confidenceScore: Math.max(0, Math.min(100, parsed.confidenceScore || 70))
                };
            }
        }
        catch (error) {
            console.error('Failed to parse AI response:', error);
        }
        return this.getFallbackAnalysis();
    }
    static parseRecommendations(response) {
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return Array.isArray(parsed) ? parsed : [];
            }
        }
        catch (error) {
            console.error('Failed to parse recommendations:', error);
        }
        return [];
    }
    static parseWeeklyAnalysis(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    trends: Array.isArray(parsed.trends) ? parsed.trends : [],
                    insights: Array.isArray(parsed.insights) ? parsed.insights : [],
                    goalRecommendations: Array.isArray(parsed.goalRecommendations) ? parsed.goalRecommendations : []
                };
            }
        }
        catch (error) {
            console.error('Failed to parse weekly analysis:', error);
        }
        return this.getDefaultWeeklyInsights();
    }
    static getFallbackAnalysis(metrics) {
        const strainLevel = metrics ? this.calculateBasicStrainLevel(metrics) : 50;
        return {
            strainLevel,
            fatigueIndicators: strainLevel > 70 ? ['High strain detected', 'Reduced blink rate'] : ['Moderate activity'],
            recommendations: this.getDefaultRecommendations(strainLevel),
            blinkQuality: strainLevel > 70 ? 'poor' : strainLevel > 40 ? 'fair' : 'good',
            postureAssessment: 'Unable to assess - using sensor data only',
            confidenceScore: 60
        };
    }
    static calculateBasicStrainLevel(metrics) {
        let strain = 0;
        // Blink rate analysis (normal: 15-20 blinks/min)
        if (metrics.blinkRate < 10)
            strain += 30;
        else if (metrics.blinkRate < 15)
            strain += 15;
        // Fatigue index analysis
        strain += metrics.fatigueIndex * 0.8; // Scale fatigue index to strain
        // EAR (Eye Aspect Ratio) analysis - lower values indicate more closed eyes
        if (metrics.earValue < 0.2)
            strain += 25;
        else if (metrics.earValue < 0.25)
            strain += 10;
        // PERCLOS analysis - higher values indicate more eye closure
        strain += metrics.perclosValue * 0.3;
        return Math.min(100, strain);
    }
    static getDefaultRecommendations(strainLevel) {
        if (strainLevel > 80) {
            return [
                'Take an immediate 5-minute break',
                'Practice the 20-20-20 rule',
                'Adjust screen brightness and contrast',
                'Check your posture and screen distance'
            ];
        }
        else if (strainLevel > 60) {
            return [
                'Take a 2-minute break soon',
                'Blink more frequently',
                'Adjust your screen position'
            ];
        }
        else {
            return [
                'Continue with regular break intervals',
                'Maintain good posture'
            ];
        }
    }
    static getDefaultWeeklyInsights() {
        return {
            trends: ['Data analysis unavailable'],
            insights: ['Chrome AI analysis not available'],
            goalRecommendations: ['Enable Chrome AI for personalized insights']
        };
    }
    /**
     * Calculate overall strain score from AI analysis
     */
    static calculateOverallStrainScore(analysis) {
        // Combine multiple factors to create an overall strain score
        const strainLevel = analysis.strainLevel || 0;
        const fatigueCount = analysis.fatigueIndicators?.length || 0;
        const blinkQualityScore = this.getBlinkQualityScore(analysis.blinkQuality);
        // Weight the different factors
        const weightedScore = (strainLevel * 0.6 + // Primary strain level (60%)
            (fatigueCount * 10) * 0.2 + // Fatigue indicators (20%)
            blinkQualityScore * 0.2 // Blink quality (20%)
        );
        return Math.min(100, Math.max(0, Math.round(weightedScore)));
    }
    /**
     * Convert blink quality to numeric score
     */
    static getBlinkQualityScore(quality) {
        switch (quality) {
            case 'excellent': return 0;
            case 'good': return 25;
            case 'fair': return 50;
            case 'poor': return 75;
            default: return 50;
        }
    }
    /**
     * Generate a human-readable summary of the analysis
     */
    static generateAnalysisSummary(analysis, strainScore) {
        let summary = '';
        if (strainScore <= 20) {
            summary = '✅ Your eyes appear healthy with minimal signs of strain.';
        }
        else if (strainScore <= 40) {
            summary = '⚠️ Mild eye strain detected. Consider taking short breaks.';
        }
        else if (strainScore <= 60) {
            summary = '🟡 Moderate eye strain observed. Regular breaks recommended.';
        }
        else if (strainScore <= 80) {
            summary = '🔶 Significant eye strain detected. Take a longer break soon.';
        }
        else {
            summary = '🔴 High eye strain levels. Immediate rest recommended.';
        }
        if (analysis.fatigueIndicators && analysis.fatigueIndicators.length > 0) {
            summary += ` Key concerns: ${analysis.fatigueIndicators.slice(0, 2).join(', ')}.`;
        }
        return summary;
    }
}
ChromeAIVisionService.isInitialized = false;
ChromeAIVisionService.VISION_TEMPERATURE = 0.3; // Lower for more consistent analysis
ChromeAIVisionService.VISION_TOP_K = 5;
// Initialize the service
ChromeAIVisionService.initialize();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ChromeAIVisionService);


/***/ })

}]);
//# sourceMappingURL=core_ai_chrome-ai-vision_ts.js.map