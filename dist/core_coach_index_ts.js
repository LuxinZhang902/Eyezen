"use strict";
(self["webpackChunkeyezen_chrome_extension"] = self["webpackChunkeyezen_chrome_extension"] || []).push([["core_coach_index_ts"],{

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


/***/ })

}]);
//# sourceMappingURL=core_coach_index_ts.js.map