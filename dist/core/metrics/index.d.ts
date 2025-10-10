/**
 * Core Metrics Module
 * Handles eye health calculations, scoring, and data aggregation
 */
import { EyeMetrics, BreakSession, EyeHealthScore } from '../../types/index';
/**
 * Eye Health Scoring System
 * Calculates a comprehensive score (0-100) based on multiple factors
 */
export declare class EyeHealthScorer {
    private static readonly WEIGHTS;
    private static readonly THRESHOLDS;
    /**
     * Calculate overall eye health score with base score approach
     */
    static calculateScore(metrics: EyeMetrics[]): EyeHealthScore;
    private static calculateAverages;
    private static calculateEyeStrainScore;
    private static calculateBlinkHealthScore;
    private static calculatePostureScore;
    private static scoreByThreshold;
    private static calculateTrend;
    private static generateRecommendations;
}
/**
 * Daily KPI Calculator
 * Aggregates daily metrics and calculates key performance indicators
 */
export declare class DailyKPICalculator {
    /**
     * Calculate daily KPIs from metrics and break sessions
     */
    static calculateDailyKPIs(metrics: EyeMetrics[], breakSessions: BreakSession[], date?: Date): {
        date: string;
        screenTime: number;
        totalBreaks: number;
        completedBreaks: number;
        breakCompletionRate: number;
        totalBreakTime: number;
        averageMetrics: {
            earValue: number;
            perclosValue: number;
            blinkRate: number;
            fatigueIndex: number;
        } | null;
        eyeHealthScore: number;
        recommendations: string[];
        alerts: string[];
    };
    private static generateAlerts;
}
/**
 * Weekly Summary Generator
 * Creates weekly summaries and trends
 */
export declare class WeeklySummaryGenerator {
    /**
     * Generate weekly summary data
     */
    static generateWeeklySummary(metrics: EyeMetrics[], breakSessions: BreakSession[], weekStart: Date): {
        weekStart: string;
        weekEnd: string;
        dailyKPIs: {
            date: string;
            screenTime: number;
            totalBreaks: number;
            completedBreaks: number;
            breakCompletionRate: number;
            totalBreakTime: number;
            averageMetrics: {
                earValue: number;
                perclosValue: number;
                blinkRate: number;
                fatigueIndex: number;
            } | null;
            eyeHealthScore: number;
            recommendations: string[];
            alerts: string[];
        }[];
        summary: {
            totalScreenTime: number;
            avgDailyScreenTime: number;
            totalBreaks: number;
            avgEyeHealthScore: number;
            eyeHealthTrend: "stable" | "improving" | "declining";
            screenTimeTrend: "stable" | "improving" | "declining";
        };
        insights: string[];
    };
    private static calculateWeeklyTrend;
    private static generateWeeklyInsights;
}
