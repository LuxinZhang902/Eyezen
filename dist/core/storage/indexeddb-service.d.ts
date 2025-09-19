/**
 * IndexedDB Service
 * Handles large data storage, analytics, and offline capabilities
 */
import { BreakSession, EyeMetrics, UserEvent, WeeklySummary, EyeScore } from '../../types/index';
export declare class IndexedDBService {
    private static readonly DB_NAME;
    private static readonly DB_VERSION;
    private static db;
    /**
     * Initialize IndexedDB
     */
    static initialize(): Promise<void>;
    /**
     * Create object stores for different data types
     */
    private static createObjectStores;
    /**
     * Store break session
     */
    static storeBreakSession(session: BreakSession): Promise<void>;
    /**
     * Get break sessions within date range
     */
    static getBreakSessions(startDate: number, endDate: number): Promise<BreakSession[]>;
    /**
     * Store eye metrics
     */
    static storeEyeMetrics(metrics: EyeMetrics): Promise<void>;
    /**
     * Get eye metrics within date range
     */
    static getEyeMetrics(startDate: number, endDate: number): Promise<EyeMetrics[]>;
    /**
     * Store user event
     */
    static storeUserEvent(event: UserEvent): Promise<void>;
    /**
     * Get user events within date range
     */
    static getUserEvents(startDate: number, endDate: number): Promise<UserEvent[]>;
    /**
     * Store weekly summary
     */
    static storeWeeklySummary(summary: WeeklySummary): Promise<void>;
    /**
     * Get weekly summaries
     */
    static getWeeklySummaries(limit?: number): Promise<WeeklySummary[]>;
    /**
     * Cache analytics data
     */
    static cacheAnalytics(key: string, data: any, ttl?: number): Promise<void>;
    /**
     * Get cached analytics data
     */
    static getCachedAnalytics(key: string): Promise<any | null>;
    /**
     * Calculate eye score based on recent data
     */
    static calculateEyeScore(userId: string): Promise<EyeScore>;
    /**
     * Calculate score for a specific period
     */
    private static calculatePeriodScore;
    /**
     * Calculate trend (positive = improving, negative = declining)
     */
    private static calculateTrend;
    /**
     * Convert numeric trend to category
     */
    private static getTrendCategory;
    /**
     * Calculate variation in a dataset
     */
    private static calculateVariation;
    /**
     * Clean up old data (privacy feature)
     */
    static cleanupOldData(retentionDays?: number): Promise<void>;
    /**
     * Clean up specific store
     */
    private static cleanupStore;
    /**
     * Export all user data (privacy feature)
     */
    static exportUserData(): Promise<any>;
    /**
     * Erase all user data (privacy feature)
     */
    static eraseAllData(): Promise<void>;
}
