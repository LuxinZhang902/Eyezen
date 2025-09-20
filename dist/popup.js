/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./core/api/openai-service.ts":
/*!************************************!*\
  !*** ./core/api/openai-service.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ChromeAIService: () => (/* binding */ ChromeAIService),
/* harmony export */   OpenAIService: () => (/* binding */ OpenAIService),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Chrome AI Service
 * Handles AI-powered features using Chrome's built-in Gemini Nano model
 * Replaces OpenAI API with Chrome's Prompt API for coaching scripts, weekly summaries, and translations
 */
class ChromeAIService {
    /**
     * Initialize the Chrome AI service
     */
    static async initialize() {
        try {
            if (!window.ai?.languageModel) {
                console.warn('Chrome AI not available. AI features will use mock data.');
                return;
            }
            const capabilities = await window.ai.languageModel.capabilities();
            if (capabilities.available === 'no') {
                console.warn('Chrome AI model not available. AI features will use mock data.');
                return;
            }
            if (capabilities.available === 'after-download') {
                console.log('Chrome AI model downloading...');
            }
            // Create a session for general use
            this.session = await window.ai.languageModel.create({
                temperature: this.DEFAULT_TEMPERATURE,
                topK: this.DEFAULT_TOP_K,
                monitor: (m) => {
                    m.addEventListener('downloadprogress', (e) => {
                        console.log(`Chrome AI model download progress: ${Math.round(e.loaded * 100)}%`);
                    });
                }
            });
            this.isInitialized = true;
            console.log('Chrome AI service initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Chrome AI service:', error);
        }
    }
    /**
     * Generate a personalized coaching script
     */
    static async generateCoachingScript(type, userContext) {
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
        }
        catch (error) {
            console.error('Failed to generate coaching script:', error);
            return this.getMockCoachingScript(type, userContext.language);
        }
    }
    /**
     * Generate weekly summary with insights and recommendations
     */
    static async generateWeeklySummary(userData) {
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
        }
        catch (error) {
            console.error('Failed to generate weekly summary:', error);
            return this.getMockWeeklySummary(userData);
        }
    }
    /**
     * Translate text to specified language
     */
    static async translateText(text, targetLanguage) {
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
        }
        catch (error) {
            console.error('Failed to translate text:', error);
            return text;
        }
    }
    /**
     * Rewrite text for better clarity or tone
     */
    static async rewriteText(text, style) {
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
        }
        catch (error) {
            console.error('Failed to rewrite text:', error);
            return text;
        }
    }
    /**
     * Destroy the current session and cleanup
     */
    static destroy() {
        if (this.session) {
            try {
                this.session.destroy();
            }
            catch (error) {
                console.error('Error destroying Chrome AI session:', error);
            }
            this.session = null;
            this.isInitialized = false;
        }
    }
    /**
     * Build coaching prompt based on context
     */
    static buildCoachingPrompt(type, context) {
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
    static buildWeeklySummaryPrompt(data) {
        return `Analyze this week's eye health data and provide insights:

Metrics: ${data.metrics.length} readings, average fatigue: ${data.metrics.reduce((sum, m) => sum + m.fatigueIndex, 0) / data.metrics.length || 0}%
Breaks: ${data.breaks.length} total, ${data.breaks.filter((b) => b.completed).length} completed
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
    static parseWeeklySummary(analysis) {
        try {
            const parsed = JSON.parse(analysis);
            return {
                improvements: parsed.improvements || [],
                recommendations: parsed.recommendations || []
            };
        }
        catch {
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
    static estimateDuration(text) {
        const wordsPerMinute = 200;
        const words = text.split(' ').length;
        return Math.max(Math.ceil((words / wordsPerMinute) * 60), 10);
    }
    /**
     * Get mock coaching script for fallback
     */
    static getMockCoachingScript(type, language) {
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
        const content = scripts[type][language] || scripts[type].en;
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
    static getMockWeeklySummary(userData) {
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
ChromeAIService.session = null;
ChromeAIService.isInitialized = false;
ChromeAIService.DEFAULT_TEMPERATURE = 0.7;
ChromeAIService.DEFAULT_TOP_K = 3;
// Initialize the service
ChromeAIService.initialize();
// Export as OpenAIService for backward compatibility
const OpenAIService = ChromeAIService;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ChromeAIService);


/***/ }),

/***/ "./core/coach/index.ts":
/*!*****************************!*\
  !*** ./core/coach/index.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AICoachService: () => (/* binding */ AICoachService),
/* harmony export */   BreakActivityGenerator: () => (/* binding */ BreakActivityGenerator),
/* harmony export */   TextToSpeechService: () => (/* binding */ TextToSpeechService)
/* harmony export */ });
/* harmony import */ var _types_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../types/index */ "./types/index.ts");
/* harmony import */ var _api_openai_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../api/openai-service */ "./core/api/openai-service.ts");
/**
 * AI Coach Module
 * Handles coaching script generation, break guidance, and motivational content
 */


/**
 * AI Coach Service
 * Generates personalized coaching content using Chrome's built-in AI
 */
class AICoachService {
    constructor() {
        this.scriptCache = new Map();
        // No API key needed for Chrome AI
    }
    /**
     * Generate a coaching script based on user metrics and break type
     */
    async generateCoachingScript(breakType, userMetrics, settings) {
        const cacheKey = this.generateCacheKey(breakType, userMetrics, settings);
        // Check cache first
        if (this.scriptCache.has(cacheKey)) {
            const cached = this.scriptCache.get(cacheKey);
            // Return cached if less than 1 hour old
            if (Date.now() - cached.generated < 3600000) {
                return cached;
            }
        }
        try {
            const prompt = this.buildPrompt(breakType, userMetrics, settings);
            const response = await _api_openai_service__WEBPACK_IMPORTED_MODULE_1__.ChromeAIService.generateCoachingScript(this.getScriptType(breakType), {
                fatigueLevel: this.getAverageFatigue(userMetrics),
                breakCount: this.getDailyBreakCount(),
                timeOfDay: this.getTimeOfDay(),
                language: settings.language
            });
            const script = {
                id: this.generateId(),
                type: response.type,
                content: response.content,
                duration: response.duration,
                language: response.language,
                generated: response.generated
            };
            // Cache the script
            this.scriptCache.set(cacheKey, script);
            return script;
        }
        catch (error) {
            console.error('Failed to generate coaching script:', error);
            return this.getFallbackScript(breakType, settings.language);
        }
    }
    /**
     * Generate motivational content based on user progress
     */
    async generateMotivationalMessage(eyeHealthScore, streak, settings) {
        try {
            const fallbackText = this.getFallbackMotivation(eyeHealthScore, 'en');
            const response = await _api_openai_service__WEBPACK_IMPORTED_MODULE_1__.ChromeAIService.translateText(fallbackText, settings.language);
            return response;
        }
        catch (error) {
            console.error('Failed to generate motivational message:', error);
            return this.getFallbackMotivation(eyeHealthScore, settings.language);
        }
    }
    /**
     * Generate weekly summary insights
     */
    async generateWeeklySummary(weeklyData, settings) {
        try {
            const response = await _api_openai_service__WEBPACK_IMPORTED_MODULE_1__.ChromeAIService.generateWeeklySummary(weeklyData);
            return response.improvements.join('\n') + '\n\nRecommendations:\n' + response.recommendations.join('\n');
        }
        catch (error) {
            console.error('Failed to generate weekly summary:', error);
            return this.getFallbackSummary(weeklyData, settings.language);
        }
    }
    getAverageFatigue(userMetrics) {
        if (!userMetrics.length)
            return 0;
        // Calculate fatigue based on blink rate and fatigue index
        const totalFatigue = userMetrics.reduce((sum, metric) => {
            const blinkFatigue = metric.blinkRate < 15 ? 0.8 : 0.2; // Low blink rate indicates fatigue
            const indexFatigue = metric.fatigueIndex / 100; // Convert to 0-1 scale
            return sum + Math.max(blinkFatigue, indexFatigue);
        }, 0);
        return Math.min(totalFatigue / userMetrics.length, 1);
    }
    getDailyBreakCount() {
        // Get break count from storage or default to 0
        return parseInt(localStorage.getItem('dailyBreakCount') || '0');
    }
    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 12)
            return 'morning';
        if (hour < 17)
            return 'afternoon';
        return 'evening';
    }
    async callChromeAI(prompt, language) {
        // This method is kept for compatibility but uses Chrome AI internally
        try {
            const response = await _api_openai_service__WEBPACK_IMPORTED_MODULE_1__.ChromeAIService.translateText(prompt, language);
            return { content: response };
        }
        catch (error) {
            throw new Error(`Chrome AI error: ${error}`);
        }
    }
    buildPrompt(breakType, userMetrics, settings) {
        const latestMetrics = userMetrics[userMetrics.length - 1];
        const avgFatigue = userMetrics.slice(-5).reduce((sum, m) => sum + m.fatigueIndex, 0) / 5;
        let prompt = `Generate a ${breakType} break coaching script for a user with:
`;
        prompt += `- Current fatigue level: ${Math.round(avgFatigue * 100)}%
`;
        prompt += `- Blink rate: ${latestMetrics?.blinkRate || 'unknown'} blinks/min
`;
        prompt += `- Posture: ${latestMetrics?.posture || 'unknown'}
`;
        prompt += `- Break duration: ${this.calculateDuration(breakType)} seconds

`;
        switch (breakType) {
            case _types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.MICRO:
                prompt += 'Focus on quick eye exercises and blinking. Be concise and direct.';
                break;
            case _types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.SHORT:
                prompt += 'Include 20-20-20 rule guidance and simple stretches. Be encouraging.';
                break;
            case _types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.LONG:
                prompt += 'Provide comprehensive relaxation guidance including eye massage and posture correction.';
                break;
        }
        return prompt;
    }
    buildMotivationalPrompt(eyeHealthScore, streak, settings) {
        let prompt = `Generate a motivational message for a user with:
`;
        prompt += `- Eye health score: ${eyeHealthScore}/100
`;
        prompt += `- Current streak: ${streak} days
`;
        prompt += `- Daily break goal: ${settings.dailyBreakGoal}

`;
        if (eyeHealthScore >= 80) {
            prompt += 'Celebrate their excellent progress and encourage consistency.';
        }
        else if (eyeHealthScore >= 60) {
            prompt += 'Acknowledge improvement and provide gentle encouragement.';
        }
        else {
            prompt += 'Provide supportive motivation and simple actionable tips.';
        }
        return prompt;
    }
    buildSummaryPrompt(weeklyData, settings) {
        let prompt = `Generate a weekly eye health summary for:
`;
        prompt += `- Average eye health score: ${weeklyData.avgEyeHealthScore}/100
`;
        prompt += `- Total breaks taken: ${weeklyData.totalBreaks}
`;
        prompt += `- Screen time: ${Math.round(weeklyData.totalScreenTime / 60)} hours
`;
        prompt += `- Trend: ${weeklyData.eyeHealthTrend}

`;
        prompt += 'Provide insights, celebrate achievements, and suggest improvements for next week.';
        return prompt;
    }
    getScriptType(breakType) {
        switch (breakType) {
            case _types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.MICRO:
                return 'instruction';
            case _types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.SHORT:
                return 'motivation';
            case _types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.LONG:
                return 'relaxation';
            default:
                return 'instruction';
        }
    }
    calculateDuration(breakType) {
        switch (breakType) {
            case _types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.MICRO:
                return 20;
            case _types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.SHORT:
                return 300; // 5 minutes
            case _types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.LONG:
                return 900; // 15 minutes
            default:
                return 20;
        }
    }
    generateCacheKey(breakType, userMetrics, settings) {
        const latest = userMetrics[userMetrics.length - 1];
        const fatigueLevel = Math.round((latest?.fatigueIndex || 0) * 10) / 10;
        return `${breakType}-${fatigueLevel}-${settings.language}`;
    }
    generateId() {
        return `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getFallbackScript(breakType, language) {
        const fallbacks = {
            en: {
                [_types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.MICRO]: "Take a moment to blink slowly 10 times. Look away from your screen and focus on something 20 feet away for 20 seconds.",
                [_types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.SHORT]: "It's time for a 5-minute break! Stand up, stretch your arms above your head, and do some gentle neck rolls. Remember the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.",
                [_types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.LONG]: "Great job taking a longer break! Spend the next 15 minutes away from all screens. Try some gentle eye massage, drink water, and do some light stretching. Your eyes will thank you!"
            },
            zh: {
                [_types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.MICRO]: "花一点时间慢慢眨眼10次。将视线从屏幕上移开，专注于20英尺外的物体20秒钟。",
                [_types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.SHORT]: "是时候休息5分钟了！站起来，将手臂举过头顶，做一些轻柔的颈部转动。记住20-20-20法则：每20分钟，看20英尺外的物体20秒钟。",
                [_types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.LONG]: "很好，你选择了更长的休息时间！接下来15分钟远离所有屏幕。尝试一些轻柔的眼部按摩，喝水，做一些轻度拉伸。你的眼睛会感谢你的！"
            }
        };
        const scripts = fallbacks[language] || fallbacks.en;
        return {
            id: this.generateId(),
            type: this.getScriptType(breakType),
            content: scripts[breakType],
            duration: this.calculateDuration(breakType),
            language,
            generated: Date.now()
        };
    }
    getFallbackMotivation(eyeHealthScore, language) {
        const motivations = {
            en: {
                high: "Excellent work! Your eye health is in great shape. Keep up the fantastic habits!",
                medium: "You're making good progress! A few more breaks each day will boost your eye health even more.",
                low: "Every small step counts! Start with just one extra break today and build from there."
            },
            zh: {
                high: "做得很好！你的眼部健康状况很好。继续保持这些好习惯！",
                medium: "你正在取得良好的进展！每天多休息几次会让你的眼部健康更上一层楼。",
                low: "每一小步都很重要！从今天开始多休息一次，然后逐步改善。"
            }
        };
        const msgs = motivations[language] || motivations.en;
        if (eyeHealthScore >= 80)
            return msgs.high;
        if (eyeHealthScore >= 60)
            return msgs.medium;
        return msgs.low;
    }
    getFallbackSummary(weeklyData, language) {
        const summaries = {
            en: `This week you took ${weeklyData.totalBreaks} breaks and maintained an average eye health score of ${weeklyData.avgEyeHealthScore}/100. Keep building on this progress!`,
            zh: `本周你休息了${weeklyData.totalBreaks}次，平均眼部健康得分为${weeklyData.avgEyeHealthScore}/100。继续保持这个进步！`
        };
        return summaries[language] || summaries.en;
    }
}
/**
 * Break Activity Generator
 * Provides structured break activities and guidance
 */
class BreakActivityGenerator {
    /**
     * Generate activities for a break session
     */
    static generateActivities(breakType, language = 'en') {
        switch (breakType) {
            case _types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.MICRO:
                return this.getMicroBreakActivities(language);
            case _types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.SHORT:
                return this.getShortBreakActivities(language);
            case _types_index__WEBPACK_IMPORTED_MODULE_0__.BreakType.LONG:
                return this.getLongBreakActivities(language);
            default:
                return this.getMicroBreakActivities(language);
        }
    }
    static getMicroBreakActivities(language) {
        const activities = {
            en: [
                {
                    type: 'exercise',
                    name: 'Conscious Blinking',
                    duration: 10,
                    instructions: 'Blink slowly and deliberately 10 times'
                },
                {
                    type: 'exercise',
                    name: '20-20-20 Rule',
                    duration: 20,
                    instructions: 'Look at something 20 feet away for 20 seconds'
                }
            ],
            zh: [
                {
                    type: 'exercise',
                    name: '有意识眨眼',
                    duration: 10,
                    instructions: '缓慢而有意识地眨眼10次'
                },
                {
                    type: 'exercise',
                    name: '20-20-20法则',
                    duration: 20,
                    instructions: '看20英尺外的物体20秒钟'
                }
            ]
        };
        return activities[language] || activities.en;
    }
    static getShortBreakActivities(language) {
        const activities = {
            en: [
                {
                    type: 'exercise',
                    name: 'Eye Circles',
                    duration: 30,
                    instructions: 'Slowly roll your eyes in circles, 5 times each direction'
                },
                {
                    type: 'massage',
                    name: 'Temple Massage',
                    duration: 60,
                    instructions: 'Gently massage your temples in circular motions'
                },
                {
                    type: 'exercise',
                    name: 'Neck Stretch',
                    duration: 45,
                    instructions: 'Gently stretch your neck side to side and up and down'
                },
                {
                    type: 'hydration',
                    name: 'Hydration Break',
                    duration: 30,
                    instructions: 'Drink a glass of water to stay hydrated'
                }
            ],
            zh: [
                {
                    type: 'exercise',
                    name: '眼球转动',
                    duration: 30,
                    instructions: '缓慢转动眼球，每个方向5次'
                },
                {
                    type: 'massage',
                    name: '太阳穴按摩',
                    duration: 60,
                    instructions: '轻柔地以圆周运动按摩太阳穴'
                },
                {
                    type: 'exercise',
                    name: '颈部拉伸',
                    duration: 45,
                    instructions: '轻柔地左右、上下拉伸颈部'
                },
                {
                    type: 'hydration',
                    name: '补水休息',
                    duration: 30,
                    instructions: '喝一杯水保持水分'
                }
            ]
        };
        return activities[language] || activities.en;
    }
    static getLongBreakActivities(language) {
        const activities = {
            en: [
                {
                    type: 'massage',
                    name: 'TCM Eye Massage',
                    duration: 180,
                    instructions: 'Follow the guided TCM massage points: Zan Zhu, Si Bai, Jing Ming'
                },
                {
                    type: 'exercise',
                    name: 'Full Body Stretch',
                    duration: 120,
                    instructions: 'Stand up and do a full body stretch routine'
                },
                {
                    type: 'exercise',
                    name: 'Deep Breathing',
                    duration: 90,
                    instructions: 'Practice deep breathing exercises to relax'
                },
                {
                    type: 'hydration',
                    name: 'Mindful Hydration',
                    duration: 60,
                    instructions: 'Drink water mindfully and take a moment to rest'
                },
                {
                    type: 'exercise',
                    name: 'Eye Palming',
                    duration: 120,
                    instructions: 'Cover your eyes with palms and relax in darkness'
                }
            ],
            zh: [
                {
                    type: 'massage',
                    name: '中医眼部按摩',
                    duration: 180,
                    instructions: '按照指导进行中医按摩穴位：攒竹、四白、睛明'
                },
                {
                    type: 'exercise',
                    name: '全身拉伸',
                    duration: 120,
                    instructions: '站起来做全身拉伸运动'
                },
                {
                    type: 'exercise',
                    name: '深呼吸',
                    duration: 90,
                    instructions: '练习深呼吸放松身心'
                },
                {
                    type: 'hydration',
                    name: '正念补水',
                    duration: 60,
                    instructions: '专心喝水，花一点时间休息'
                },
                {
                    type: 'exercise',
                    name: '眼部掌敷',
                    duration: 120,
                    instructions: '用手掌覆盖眼部，在黑暗中放松'
                }
            ]
        };
        return activities[language] || activities.en;
    }
}
/**
 * Text-to-Speech Service
 * Handles audio coaching using Web Speech API
 */
class TextToSpeechService {
    constructor() {
        this.currentUtterance = null;
        this.synthesis = window.speechSynthesis;
    }
    /**
     * Speak coaching script content
     */
    speak(text, language = 'en-US', rate = 1.0) {
        return new Promise((resolve, reject) => {
            if (!this.synthesis) {
                reject(new Error('Speech synthesis not supported'));
                return;
            }
            // Stop any current speech
            this.stop();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language;
            utterance.rate = rate;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            utterance.onend = () => {
                this.currentUtterance = null;
                resolve();
            };
            utterance.onerror = (event) => {
                this.currentUtterance = null;
                reject(new Error(`Speech synthesis error: ${event.error}`));
            };
            this.currentUtterance = utterance;
            this.synthesis.speak(utterance);
        });
    }
    /**
     * Stop current speech
     */
    stop() {
        if (this.synthesis && this.synthesis.speaking) {
            this.synthesis.cancel();
        }
        this.currentUtterance = null;
    }
    /**
     * Pause current speech
     */
    pause() {
        if (this.synthesis && this.synthesis.speaking) {
            this.synthesis.pause();
        }
    }
    /**
     * Resume paused speech
     */
    resume() {
        if (this.synthesis && this.synthesis.paused) {
            this.synthesis.resume();
        }
    }
    /**
     * Check if currently speaking
     */
    isSpeaking() {
        return this.synthesis ? this.synthesis.speaking : false;
    }
    /**
     * Get available voices
     */
    getVoices() {
        return this.synthesis ? this.synthesis.getVoices() : [];
    }
}


/***/ }),

/***/ "./core/metrics/index.ts":
/*!*******************************!*\
  !*** ./core/metrics/index.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DailyKPICalculator: () => (/* binding */ DailyKPICalculator),
/* harmony export */   EyeHealthScorer: () => (/* binding */ EyeHealthScorer),
/* harmony export */   WeeklySummaryGenerator: () => (/* binding */ WeeklySummaryGenerator)
/* harmony export */ });
/**
 * Core Metrics Module
 * Handles eye health calculations, scoring, and data aggregation
 */
/**
 * Eye Health Scoring System
 * Calculates a comprehensive score (0-100) based on multiple factors
 */
class EyeHealthScorer {
    /**
     * Calculate overall eye health score
     */
    static calculateScore(metrics) {
        if (metrics.length === 0) {
            return {
                overall: 50,
                components: {
                    eyeStrain: 50,
                    blinkHealth: 50,
                    postureHealth: 50,
                    fatigueLevel: 50
                },
                trend: 'stable',
                recommendations: ['Start monitoring your eye health']
            };
        }
        const latest = metrics[metrics.length - 1];
        const avgMetrics = this.calculateAverages(metrics.slice(-10)); // Last 10 readings
        const eyeStrainScore = this.calculateEyeStrainScore(avgMetrics.earValue, avgMetrics.perclosValue);
        const blinkHealthScore = this.calculateBlinkHealthScore(avgMetrics.blinkRate);
        const postureScore = this.calculatePostureScore(latest.posture);
        const fatigueScore = 100 - (avgMetrics.fatigueIndex * 100);
        const overall = Math.round(eyeStrainScore * this.WEIGHTS.EAR +
            eyeStrainScore * this.WEIGHTS.PERCLOS +
            blinkHealthScore * this.WEIGHTS.BLINK_RATE +
            postureScore * this.WEIGHTS.POSTURE +
            fatigueScore * this.WEIGHTS.FATIGUE);
        const trend = this.calculateTrend(metrics);
        const recommendations = this.generateRecommendations({
            eyeStrain: eyeStrainScore,
            blinkHealth: blinkHealthScore,
            postureHealth: postureScore,
            fatigueLevel: fatigueScore
        });
        return {
            overall: Math.max(0, Math.min(100, overall)),
            components: {
                eyeStrain: eyeStrainScore,
                blinkHealth: blinkHealthScore,
                postureHealth: postureScore,
                fatigueLevel: fatigueScore
            },
            trend,
            recommendations
        };
    }
    static calculateAverages(metrics) {
        const sum = metrics.reduce((acc, m) => ({
            earValue: acc.earValue + m.earValue,
            perclosValue: acc.perclosValue + m.perclosValue,
            blinkRate: acc.blinkRate + m.blinkRate,
            fatigueIndex: acc.fatigueIndex + m.fatigueIndex
        }), { earValue: 0, perclosValue: 0, blinkRate: 0, fatigueIndex: 0 });
        const count = metrics.length;
        return {
            earValue: sum.earValue / count,
            perclosValue: sum.perclosValue / count,
            blinkRate: sum.blinkRate / count,
            fatigueIndex: sum.fatigueIndex / count
        };
    }
    static calculateEyeStrainScore(earValue, perclosValue) {
        const earScore = this.scoreByThreshold(earValue, this.THRESHOLDS.EAR, true);
        const perclosScore = this.scoreByThreshold(perclosValue, this.THRESHOLDS.PERCLOS, false);
        return Math.round((earScore + perclosScore) / 2);
    }
    static calculateBlinkHealthScore(blinkRate) {
        const thresholds = this.THRESHOLDS.BLINK_RATE;
        if (blinkRate >= thresholds.EXCELLENT.min && blinkRate <= thresholds.EXCELLENT.max) {
            return 90;
        }
        else if (blinkRate >= thresholds.GOOD.min && blinkRate <= thresholds.GOOD.max) {
            return 75;
        }
        else if (blinkRate >= thresholds.FAIR.min && blinkRate <= thresholds.FAIR.max) {
            return 60;
        }
        else {
            return 40;
        }
    }
    static calculatePostureScore(posture) {
        switch (posture) {
            case 'excellent': return 95;
            case 'good': return 80;
            case 'fair': return 65;
            case 'poor': return 45;
            case 'very_poor': return 25;
            default: return 50;
        }
    }
    static scoreByThreshold(value, thresholds, higherIsBetter) {
        if (higherIsBetter) {
            if (value >= thresholds.EXCELLENT)
                return 90;
            if (value >= thresholds.GOOD)
                return 75;
            if (value >= thresholds.FAIR)
                return 60;
            return 40;
        }
        else {
            if (value <= thresholds.EXCELLENT)
                return 90;
            if (value <= thresholds.GOOD)
                return 75;
            if (value <= thresholds.FAIR)
                return 60;
            return 40;
        }
    }
    static calculateTrend(metrics) {
        if (metrics.length < 5)
            return 'stable';
        const recent = metrics.slice(-5);
        const older = metrics.slice(-10, -5);
        if (older.length === 0)
            return 'stable';
        const recentAvg = recent.reduce((sum, m) => sum + (1 - m.fatigueIndex), 0) / recent.length;
        const olderAvg = older.reduce((sum, m) => sum + (1 - m.fatigueIndex), 0) / older.length;
        const difference = recentAvg - olderAvg;
        if (difference > 0.05)
            return 'improving';
        if (difference < -0.05)
            return 'declining';
        return 'stable';
    }
    static generateRecommendations(scores) {
        const recommendations = [];
        if (scores.eyeStrain < 60) {
            recommendations.push('Take more frequent breaks to reduce eye strain');
            recommendations.push('Adjust screen brightness and contrast');
        }
        if (scores.blinkHealth < 60) {
            recommendations.push('Practice conscious blinking exercises');
            recommendations.push('Use artificial tears if eyes feel dry');
        }
        if (scores.postureHealth < 60) {
            recommendations.push('Improve your sitting posture');
            recommendations.push('Adjust monitor height to eye level');
        }
        if (scores.fatigueLevel < 60) {
            recommendations.push('Get adequate sleep (7-9 hours)');
            recommendations.push('Take longer breaks between work sessions');
        }
        if (recommendations.length === 0) {
            recommendations.push('Great job! Keep maintaining healthy eye habits');
        }
        return recommendations;
    }
}
EyeHealthScorer.WEIGHTS = {
    EAR: 0.25, // Eye Aspect Ratio
    PERCLOS: 0.30, // Percentage of Eye Closure
    BLINK_RATE: 0.20, // Blink frequency
    POSTURE: 0.15, // Head posture
    FATIGUE: 0.10 // Overall fatigue index
};
EyeHealthScorer.THRESHOLDS = {
    EAR: {
        EXCELLENT: 0.25,
        GOOD: 0.22,
        FAIR: 0.18,
        POOR: 0.15
    },
    PERCLOS: {
        EXCELLENT: 0.15,
        GOOD: 0.20,
        FAIR: 0.30,
        POOR: 0.40
    },
    BLINK_RATE: {
        EXCELLENT: { min: 15, max: 20 },
        GOOD: { min: 12, max: 25 },
        FAIR: { min: 8, max: 30 },
        POOR: { min: 0, max: 50 }
    }
};
/**
 * Daily KPI Calculator
 * Aggregates daily metrics and calculates key performance indicators
 */
class DailyKPICalculator {
    /**
     * Calculate daily KPIs from metrics and break sessions
     */
    static calculateDailyKPIs(metrics, breakSessions, date = new Date()) {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        // Filter data for the specific day
        const dayMetrics = metrics.filter(m => {
            const metricDate = new Date(m.timestamp);
            return metricDate >= dayStart && metricDate <= dayEnd;
        });
        const dayBreaks = breakSessions.filter(b => {
            const breakDate = new Date(b.startTime);
            return breakDate >= dayStart && breakDate <= dayEnd;
        });
        // Calculate screen time (approximate from metrics frequency)
        const screenTimeMinutes = dayMetrics.length > 0
            ? Math.round((dayMetrics.length * 30) / 60) // Assuming 30-second intervals
            : 0;
        // Calculate break statistics
        const totalBreaks = dayBreaks.length;
        const completedBreaks = dayBreaks.filter(b => b.completed).length;
        const totalBreakTime = dayBreaks.reduce((sum, b) => sum + (b.duration || 0), 0);
        // Calculate average metrics
        const avgMetrics = dayMetrics.length > 0 ? {
            earValue: dayMetrics.reduce((sum, m) => sum + m.earValue, 0) / dayMetrics.length,
            perclosValue: dayMetrics.reduce((sum, m) => sum + m.perclosValue, 0) / dayMetrics.length,
            blinkRate: dayMetrics.reduce((sum, m) => sum + m.blinkRate, 0) / dayMetrics.length,
            fatigueIndex: dayMetrics.reduce((sum, m) => sum + m.fatigueIndex, 0) / dayMetrics.length
        } : null;
        // Calculate eye health score
        const eyeHealthScore = EyeHealthScorer.calculateScore(dayMetrics);
        return {
            date: date.toISOString().split('T')[0],
            screenTime: screenTimeMinutes,
            totalBreaks,
            completedBreaks,
            breakCompletionRate: totalBreaks > 0 ? (completedBreaks / totalBreaks) * 100 : 0,
            totalBreakTime,
            averageMetrics: avgMetrics,
            eyeHealthScore: eyeHealthScore.overall,
            recommendations: eyeHealthScore.recommendations,
            alerts: this.generateAlerts(avgMetrics, totalBreaks, screenTimeMinutes)
        };
    }
    static generateAlerts(avgMetrics, totalBreaks, screenTime) {
        const alerts = [];
        if (screenTime > 480) { // More than 8 hours
            alerts.push('Excessive screen time detected');
        }
        if (totalBreaks < 3 && screenTime > 120) { // Less than 3 breaks in 2+ hours
            alerts.push('Take more frequent breaks');
        }
        if (avgMetrics && avgMetrics.fatigueIndex > 0.7) {
            alerts.push('High fatigue levels detected');
        }
        if (avgMetrics && avgMetrics.perclosValue > 0.3) {
            alerts.push('Excessive eye closure detected');
        }
        return alerts;
    }
}
/**
 * Weekly Summary Generator
 * Creates weekly summaries and trends
 */
class WeeklySummaryGenerator {
    /**
     * Generate weekly summary data
     */
    static generateWeeklySummary(metrics, breakSessions, weekStart) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        // Generate daily KPIs for each day of the week
        const dailyKPIs = [];
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(currentDay.getDate() + i);
            const dayKPIs = DailyKPICalculator.calculateDailyKPIs(metrics, breakSessions, currentDay);
            dailyKPIs.push(dayKPIs);
        }
        // Calculate weekly aggregates
        const totalScreenTime = dailyKPIs.reduce((sum, day) => sum + day.screenTime, 0);
        const totalBreaks = dailyKPIs.reduce((sum, day) => sum + day.totalBreaks, 0);
        const avgEyeHealthScore = dailyKPIs.reduce((sum, day) => sum + day.eyeHealthScore, 0) / 7;
        // Calculate trends
        const eyeHealthTrend = this.calculateWeeklyTrend(dailyKPIs.map(day => day.eyeHealthScore));
        const screenTimeTrend = this.calculateWeeklyTrend(dailyKPIs.map(day => day.screenTime));
        return {
            weekStart: weekStart.toISOString().split('T')[0],
            weekEnd: weekEnd.toISOString().split('T')[0],
            dailyKPIs,
            summary: {
                totalScreenTime,
                avgDailyScreenTime: Math.round(totalScreenTime / 7),
                totalBreaks,
                avgEyeHealthScore: Math.round(avgEyeHealthScore),
                eyeHealthTrend,
                screenTimeTrend
            },
            insights: this.generateWeeklyInsights(dailyKPIs)
        };
    }
    static calculateWeeklyTrend(values) {
        if (values.length < 2)
            return 'stable';
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        const difference = secondAvg - firstAvg;
        const threshold = firstAvg * 0.1; // 10% threshold
        if (difference > threshold)
            return 'improving';
        if (difference < -threshold)
            return 'declining';
        return 'stable';
    }
    static generateWeeklyInsights(dailyKPIs) {
        const insights = [];
        // Find best and worst days
        const bestDay = dailyKPIs.reduce((best, day) => day.eyeHealthScore > best.eyeHealthScore ? day : best);
        const worstDay = dailyKPIs.reduce((worst, day) => day.eyeHealthScore < worst.eyeHealthScore ? day : worst);
        insights.push(`Best eye health day: ${new Date(bestDay.date).toLocaleDateString('en-US', { weekday: 'long' })}`);
        insights.push(`Most challenging day: ${new Date(worstDay.date).toLocaleDateString('en-US', { weekday: 'long' })}`);
        // Screen time insights
        const avgScreenTime = dailyKPIs.reduce((sum, day) => sum + day.screenTime, 0) / 7;
        if (avgScreenTime > 360) { // More than 6 hours average
            insights.push('Consider reducing daily screen time');
        }
        // Break consistency
        const daysWithGoodBreaks = dailyKPIs.filter(day => day.breakCompletionRate > 70).length;
        if (daysWithGoodBreaks < 5) {
            insights.push('Try to maintain consistent break habits throughout the week');
        }
        return insights;
    }
}


/***/ }),

/***/ "./ui/components/CameraPermissionPopup.tsx":
/*!*************************************************!*\
  !*** ./ui/components/CameraPermissionPopup.tsx ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _core_storage_index__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../core/storage/index */ "./core/storage/index.ts");

/**
 * Camera Permission Popup Component
 * Shows when camera access is detected, allows user to approve or reject
 */


const CameraPermissionPopup = ({ isVisible, onApprove, onReject, onClose }) => {
    const [isAnimating, setIsAnimating] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
        if (isVisible) {
            setIsAnimating(true);
        }
    }, [isVisible]);
    const handleApprove = async () => {
        try {
            // Update settings to allow camera access
            await _core_storage_index__WEBPACK_IMPORTED_MODULE_2__.ChromeStorageService.updateSettings({
                cameraEnabled: true,
                metricsOnly: false // Allow full functionality
            });
            onApprove();
            handleClose();
        }
        catch (error) {
            console.error('Failed to approve camera access:', error);
        }
    };
    const handleReject = async () => {
        try {
            // Update settings to restrict features to alarm-only
            await _core_storage_index__WEBPACK_IMPORTED_MODULE_2__.ChromeStorageService.updateSettings({
                cameraEnabled: false,
                metricsOnly: true // Restrict to basic functionality
            });
            onReject();
            handleClose();
        }
        catch (error) {
            console.error('Failed to reject camera access:', error);
        }
    };
    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(() => {
            onClose();
        }, 200);
    };
    if (!isVisible)
        return null;
    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: `absolute inset-0 bg-black transition-opacity duration-200 ${isAnimating ? 'opacity-50' : 'opacity-0'}`, onClick: handleClose }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: `relative bg-white rounded-lg shadow-xl max-w-sm mx-4 transform transition-all duration-200 ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center space-x-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-8 h-8 bg-white/20 rounded-full flex items-center justify-center", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" }) }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold", children: "Camera Access Detected" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm opacity-90", children: "EyeZen wants to monitor your eye health" })] })] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "p-6", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "mb-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center space-x-2 mb-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-3 h-3 bg-green-500 rounded-full animate-pulse" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-sm font-medium text-gray-700", children: "Camera is currently active" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-gray-600 text-sm leading-relaxed", children: "EyeZen uses your camera to detect eye fatigue and provide personalized break recommendations. Your privacy is protected - no video is recorded or transmitted." })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-start space-x-2", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm font-medium text-yellow-800", children: "Important Choice" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs text-yellow-700 mt-1", children: "If you reject camera access, you'll only be able to use the set alarm feature." })] })] }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "px-6 pb-6", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex space-x-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: handleReject, className: "flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300", children: "Reject" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: handleApprove, className: "flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300", children: "OK" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs text-gray-500 text-center mt-3", children: "You can change this setting anytime in the extension options." })] })] })] }));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (CameraPermissionPopup);


/***/ }),

/***/ "./ui/components/LoginModal.tsx":
/*!**************************************!*\
  !*** ./ui/components/LoginModal.tsx ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);


const LoginModal = ({ isVisible, onClose, onLogin, onSignup }) => {
    const [isLoginMode, setIsLoginMode] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(true);
    const [email, setEmail] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');
    const [password, setPassword] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');
    const [name, setName] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');
    const [isLoading, setIsLoading] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
    const [error, setError] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)('');
    const [emailSent, setEmailSent] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
    if (!isVisible)
        return null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            if (isLoginMode) {
                // Regular login with password
                await onLogin(email, password);
                onClose();
            }
            else {
                // Signup with email verification
                await new Promise(resolve => setTimeout(resolve, 1500));
                setEmailSent(true);
                // Still call the original signup for demo purposes
                setTimeout(() => {
                    onSignup(email, password, name);
                    setEmailSent(false);
                    onClose();
                }, 2000);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
        finally {
            setIsLoading(false);
        }
    };
    const resetForm = () => {
        setEmail('');
        setPassword('');
        setName('');
        setError('');
        setEmailSent(false);
    };
    const switchMode = () => {
        setIsLoginMode(!isLoginMode);
        resetForm();
    };
    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-white rounded-lg p-6 w-80 max-w-sm mx-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex justify-between items-center mb-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h2", { className: "text-xl font-bold text-gray-800", children: isLoginMode ? 'Login' : 'Sign Up' }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: onClose, className: "text-gray-500 hover:text-gray-700 text-xl", children: "\u00D7" })] }), emailSent ? ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "text-center py-8", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "mb-4", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-16 h-16 text-green-500 mx-auto", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }) }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Email Sent!" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", { className: "text-gray-600 mb-4", children: ["We've sent a verification link to ", (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("strong", { children: email }), ". Please check your inbox and click the link to activate your account."] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm text-gray-500", children: "Don't see the email? Check your spam folder or try again." })] })) : ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-4", children: [!isLoginMode && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Name" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent", required: !isLoginMode, placeholder: "Enter your name", disabled: isLoading })] })), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent", required: true, placeholder: "Enter your email", disabled: isLoading })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Password" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent", required: true, placeholder: "Enter your password", minLength: 6, disabled: isLoading })] }), error && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-red-600 text-sm bg-red-50 p-2 rounded", children: error })), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { type: "submit", disabled: isLoading, className: "w-full bg-gradient-to-r from-green-400 to-emerald-400 text-white py-2 px-4 rounded-md hover:from-green-500 hover:to-emerald-500 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center", children: isLoading ? ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("svg", { className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), isLoginMode ? 'Logging in...' : 'Creating Account...'] })) : (isLoginMode ? 'Login' : 'Sign Up') })] })), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "mt-4 text-center", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: switchMode, className: "text-green-600 hover:text-green-700 text-sm font-medium", children: isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Login" }) })] }) }));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (LoginModal);


/***/ }),

/***/ "./ui/components/Popup.tsx":
/*!*********************************!*\
  !*** ./ui/components/Popup.tsx ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _types_index__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../types/index */ "./types/index.ts");
/* harmony import */ var _core_storage_index__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../core/storage/index */ "./core/storage/index.ts");
/* harmony import */ var _core_coach_index__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../core/coach/index */ "./core/coach/index.ts");
/* harmony import */ var _core_metrics_index__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../core/metrics/index */ "./core/metrics/index.ts");
/* harmony import */ var _CameraPermissionPopup__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./CameraPermissionPopup */ "./ui/components/CameraPermissionPopup.tsx");
/* harmony import */ var _LoginModal__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./LoginModal */ "./ui/components/LoginModal.tsx");

/**
 * Popup Component
 * Main popup interface for the EyeZen Chrome Extension
 */







const Popup = ({ onStartBreak, onOpenSettings }) => {
    const [state, setState] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({
        status: _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.GOOD,
        eyeScore: {
            current: 50,
            daily: 50,
            weekly: 50,
            trend: 'stable'
        },
        isLoading: true,
        cameraEnabled: true,
        lastBreakTime: null,
        streakDays: 0,
        showCameraPermissionPopup: false,
        isFeatureRestricted: false,
        aiRecommendation: 'Analyzing your eye health patterns...',
        recommendedBreakType: _types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.MICRO,
        aiLoading: true,
        showLoginModal: false,
        isLoggedIn: false,
        userEmail: ''
    });
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
        loadUserData();
        loadLoginState();
        // Set up periodic updates
        const interval = setInterval(loadUserData, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
    }, []);
    const loadLoginState = async () => {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get(['eyezen_login_state']);
                const loginState = result.eyezen_login_state;
                if (loginState && loginState.isLoggedIn) {
                    setState(prev => ({
                        ...prev,
                        isLoggedIn: true,
                        userEmail: loginState.userEmail
                    }));
                }
            }
        }
        catch (error) {
            console.error('Failed to load login state:', error);
        }
    };
    const loadUserData = async () => {
        try {
            let userData = await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.getUserData();
            // Initialize storage if no user data exists
            if (!userData) {
                await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.initialize();
                userData = await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.getUserData();
            }
            if (userData) {
                // Calculate current eye health score
                const recentMetrics = userData.metrics.slice(-10);
                const healthScore = _core_metrics_index__WEBPACK_IMPORTED_MODULE_5__.EyeHealthScorer.calculateScore(recentMetrics);
                // Determine user status based on score and recent metrics
                const currentStatus = determineUserStatus(healthScore.overall, recentMetrics);
                // Calculate streak days
                const streakDays = calculateStreakDays(userData.breaks);
                // Get last break time
                const lastBreak = userData.breaks
                    .filter(b => b.completed)
                    .sort((a, b) => b.endTime - a.endTime)[0];
                // Generate AI recommendation
                const aiCoach = new _core_coach_index__WEBPACK_IMPORTED_MODULE_4__.AICoachService();
                const avgFatigue = recentMetrics.reduce((sum, m) => sum + (m.fatigueIndex || 0), 0) / recentMetrics.length;
                let recommendedType = _types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.MICRO;
                let recommendation = 'Take a quick 20-second eye break using the 20-20-20 rule.';
                if (avgFatigue > 0.7) {
                    recommendedType = _types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.LONG;
                    recommendation = 'High eye strain detected! Take a 15-minute wellness break with TCM massage.';
                }
                else if (avgFatigue > 0.4) {
                    recommendedType = _types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.SHORT;
                    recommendation = 'Moderate eye fatigue. A 5-minute guided relaxation break is recommended.';
                }
                setState(prev => ({
                    ...prev,
                    status: currentStatus,
                    eyeScore: {
                        current: healthScore.overall,
                        daily: healthScore.overall,
                        weekly: healthScore.overall,
                        trend: healthScore.trend
                    },
                    isLoading: false,
                    cameraEnabled: userData.settings.cameraEnabled,
                    lastBreakTime: lastBreak?.endTime || null,
                    streakDays,
                    showCameraPermissionPopup: false, // Only show when explicitly triggered
                    isFeatureRestricted: userData.settings.metricsOnly,
                    aiRecommendation: recommendation,
                    recommendedBreakType: recommendedType,
                    aiLoading: false,
                    showLoginModal: false
                    // Preserve existing login state (isLoggedIn, userEmail)
                }));
            }
        }
        catch (error) {
            console.error('Failed to load user data:', error);
            setState((prev) => ({ ...prev, isLoading: false }));
        }
    };
    const determineUserStatus = (score, metrics) => {
        if (score >= 80)
            return _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.GOOD;
        if (score >= 60)
            return _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.TIRED;
        return _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.CRITICAL;
    };
    const calculateStreakDays = (breaks) => {
        const today = new Date();
        let streak = 0;
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            checkDate.setHours(0, 0, 0, 0);
            const dayEnd = new Date(checkDate);
            dayEnd.setHours(23, 59, 59, 999);
            const dayBreaks = breaks.filter(b => {
                const breakDate = new Date(b.startTime);
                return breakDate >= checkDate && breakDate <= dayEnd && b.completed;
            });
            if (dayBreaks.length >= 3) { // At least 3 breaks per day
                streak++;
            }
            else if (i === 0) {
                // If today doesn't have enough breaks, no streak
                break;
            }
            else {
                // Streak broken
                break;
            }
        }
        return streak;
    };
    const getStatusColor = (status) => {
        switch (status) {
            case _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.GOOD:
                return 'text-green-600';
            case _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.TIRED:
                return 'text-yellow-600';
            case _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.CRITICAL:
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.GOOD:
                return '😊';
            case _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.TIRED:
                return '😴';
            case _types_index__WEBPACK_IMPORTED_MODULE_2__.UserStatus.CRITICAL:
                return '😵';
            default:
                return '😐';
        }
    };
    const getScoreColor = (score) => {
        if (score >= 80)
            return 'text-green-600';
        if (score >= 60)
            return 'text-yellow-600';
        return 'text-red-600';
    };
    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'improving':
                return '📈';
            case 'declining':
                return '📉';
            default:
                return '➡️';
        }
    };
    const formatLastBreakTime = (timestamp) => {
        if (!timestamp)
            return 'No recent breaks';
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ago`;
        }
        return `${minutes}m ago`;
    };
    const handleBreakClick = (breakType) => {
        onStartBreak(breakType);
    };
    const toggleCamera = async () => {
        try {
            const settings = await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.getSettings();
            const newCameraEnabled = !settings.cameraEnabled;
            // If enabling camera, show permission popup
            if (newCameraEnabled) {
                setState(prev => ({
                    ...prev,
                    showCameraPermissionPopup: true
                }));
            }
            else {
                // If disabling camera, update settings directly
                await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.updateSettings({
                    cameraEnabled: false
                });
                setState(prev => ({
                    ...prev,
                    cameraEnabled: false,
                    showCameraPermissionPopup: false
                }));
            }
        }
        catch (error) {
            console.error('Failed to toggle camera:', error);
        }
    };
    const handleCameraPermissionApprove = async () => {
        try {
            await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.updateSettings({
                cameraEnabled: true,
                metricsOnly: false
            });
            setState(prev => ({
                ...prev,
                cameraEnabled: true,
                showCameraPermissionPopup: false,
                isFeatureRestricted: false
            }));
        }
        catch (error) {
            console.error('Failed to approve camera access:', error);
        }
    };
    const handleCameraPermissionReject = async () => {
        try {
            await _core_storage_index__WEBPACK_IMPORTED_MODULE_3__.ChromeStorageService.updateSettings({
                cameraEnabled: false,
                metricsOnly: true
            });
            setState(prev => ({
                ...prev,
                cameraEnabled: false,
                showCameraPermissionPopup: false,
                isFeatureRestricted: true
            }));
        }
        catch (error) {
            console.error('Failed to reject camera access:', error);
        }
    };
    const handleLogin = async (email, password) => {
        // For now, simulate a successful login
        // In a real app, this would make an API call to authenticate
        console.log('Login attempt:', { email, password });
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        // For demo purposes, accept any email/password combination
        setState(prev => ({
            ...prev,
            isLoggedIn: true,
            userEmail: email,
            showLoginModal: false
        }));
        // Store login state in Chrome storage separately
        await chrome.storage.local.set({
            'eyezen_login_state': {
                isLoggedIn: true,
                userEmail: email,
                loginTime: Date.now()
            }
        });
    };
    const handleSignup = async (email, password, name) => {
        // For now, simulate a successful signup
        // In a real app, this would make an API call to create an account
        console.log('Signup attempt:', { email, password, name });
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        // For demo purposes, accept any signup
        setState(prev => ({
            ...prev,
            isLoggedIn: true,
            userEmail: email,
            showLoginModal: false
        }));
        // Store login state in Chrome storage separately
        await chrome.storage.local.set({
            'eyezen_login_state': {
                isLoggedIn: true,
                userEmail: email,
                loginTime: Date.now()
            }
        });
    };
    if (state.isLoading) {
        return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-[380px] h-[550px] bg-white flex items-center justify-center", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "text-center", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-gray-600", children: "Loading EyeZen..." })] }) }));
    }
    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, { children: [state.showCameraPermissionPopup && ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_CameraPermissionPopup__WEBPACK_IMPORTED_MODULE_6__["default"], { isVisible: state.showCameraPermissionPopup, onApprove: handleCameraPermissionApprove, onReject: handleCameraPermissionReject, onClose: () => setState(prev => ({ ...prev, showCameraPermissionPopup: false })) })), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_LoginModal__WEBPACK_IMPORTED_MODULE_7__["default"], { isVisible: state.showLoginModal, onClose: () => setState(prev => ({ ...prev, showLoginModal: false })), onLogin: handleLogin, onSignup: handleSignup }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "w-[380px] h-[550px] bg-white overflow-hidden flex flex-col", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between mb-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center space-x-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-2xl", children: "\uD83D\uDC41\uFE0F" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h1", { className: "text-lg font-bold", children: "EyeZen" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-blue-100 text-xs opacity-90", children: "Eye Health Monitor" })] })] }), state.isLoggedIn ? ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center space-x-2", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-xs text-blue-100 opacity-90 truncate max-w-20", children: state.userEmail.split('@')[0] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: async () => {
                                                    await chrome.storage.local.remove(['eyezen_login_state']);
                                                    setState(prev => ({ ...prev, isLoggedIn: false, userEmail: '' }));
                                                }, className: "p-1 hover:bg-white/20 rounded transition-colors", title: "Logout", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }) }) })] })) : ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => setState(prev => ({ ...prev, showLoginModal: true })), className: "p-2 hover:bg-white/20 rounded-lg transition-colors", title: "Login", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }) }) }))] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center justify-between", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center space-x-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-lg", children: "\uD83D\uDCF9" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "font-semibold text-sm", children: "Camera Monitoring" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-xs text-blue-100 opacity-90", children: state.cameraEnabled && !state.isFeatureRestricted ? 'Active - Tracking eye health' : 'Inactive - Limited features' })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: toggleCamera, className: `relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 ${state.cameraEnabled && !state.isFeatureRestricted ? 'bg-green-500 shadow-lg' : 'bg-white/30'}`, children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-md ${state.cameraEnabled && !state.isFeatureRestricted ? 'translate-x-6' : 'translate-x-1'}` }) })] }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "p-3", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "text-center mb-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-3xl mb-1", children: getStatusIcon(state.status) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("h2", { className: `text-base font-bold ${getScoreColor(state.eyeScore.current)}`, children: ["Eye Health: ", state.eyeScore.current, "/100"] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", { className: "text-xs text-gray-600", children: [state.streakDays, " day streak \u2022 ", formatLastBreakTime(state.lastBreakTime)] })] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "px-4 pb-4 flex-1", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "mb-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("button", { onClick: () => handleBreakClick(_types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.MICRO), className: "w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-400 hover:to-emerald-400 transition-all duration-200 font-medium flex items-center justify-center space-x-2", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { children: "\u26A1" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { children: "Start Recommended Break with AI" })] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "font-semibold text-gray-700 mb-2", children: "Choose Your Break" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "grid grid-cols-3 gap-2", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("button", { onClick: () => handleBreakClick(_types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.MICRO), className: "p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-200 text-center border border-blue-200", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-xl mb-1", children: "\u26A1" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-xs font-medium", children: "Quick" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-xs opacity-70", children: "20 sec" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("button", { onClick: () => handleBreakClick(_types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.SHORT), className: "p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors duration-200 text-center border border-green-200", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-xl mb-1", children: "\uD83E\uDDD8" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-xs font-medium", children: "Eye Break" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-xs opacity-70", children: "5 min" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("button", { onClick: () => handleBreakClick(_types_index__WEBPACK_IMPORTED_MODULE_2__.BreakType.LONG), className: "p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors duration-200 text-center border border-purple-200", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-xl mb-1", children: "\uD83D\uDC86" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-xs font-medium", children: "Wellness" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "text-xs opacity-70", children: "15 min" })] })] })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: onOpenSettings, className: "w-full mt-7 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors", children: "View detailed dashboard \u2192" })] })] })] }));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Popup);


/***/ }),

/***/ "./ui/popup.tsx":
/*!**********************!*\
  !*** ./ui/popup.tsx ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
/* harmony import */ var react_dom_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-dom/client */ "./node_modules/react-dom/client.js");
/* harmony import */ var _components_Popup__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./components/Popup */ "./ui/components/Popup.tsx");
/* harmony import */ var _styles_popup_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./styles/popup.css */ "./ui/styles/popup.css");




// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('popup-root');
    if (!container) {
        console.error('Popup root element not found');
        return;
    }
    const root = (0,react_dom_client__WEBPACK_IMPORTED_MODULE_1__.createRoot)(container);
    const handleStartBreak = (breakType) => {
        // Send message to background script to start break
        chrome.runtime.sendMessage({
            action: 'START_BREAK',
            breakType: breakType
        }, (response) => {
            if (response?.success) {
                // Close popup after starting break
                window.close();
            }
            else {
                console.error('Failed to start break:', response?.error);
            }
        });
    };
    const handleOpenSettings = () => {
        // Open options page (dashboard)
        chrome.runtime.openOptionsPage();
        window.close();
    };
    root.render((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)(_components_Popup__WEBPACK_IMPORTED_MODULE_2__["default"], { onStartBreak: handleStartBreak, onOpenSettings: handleOpenSettings }));
});
// Handle any runtime errors
window.addEventListener('error', (event) => {
    console.error('Popup error:', event.error);
});
window.addEventListener('unhandledrejection', (event) => {
    console.error('Popup unhandled promise rejection:', event.reason);
});


/***/ }),

/***/ "./ui/styles/popup.css":
/*!*****************************!*\
  !*** ./ui/styles/popup.css ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"popup": 0,
/******/ 			"ui_styles_popup_css": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkeyezen_chrome_extension"] = self["webpackChunkeyezen_chrome_extension"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["vendors","core_storage_index_ts","ui_styles_popup_css"], () => (__webpack_require__("./ui/popup.tsx")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=popup.js.map