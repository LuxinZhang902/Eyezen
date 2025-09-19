/**
 * Storage Module
 * Handles data persistence using chrome.storage.local and IndexedDB
 */
import { UserData, UserSettings, EyeMetrics, BreakSession, UserEvent } from '../../types/index';
/**
 * Chrome Storage Service
 * Handles chrome.storage.local operations
 */
export declare class ChromeStorageService {
    private static readonly STORAGE_KEYS;
    /**
     * Initialize storage with default values
     */
    static initialize(): Promise<void>;
    /**
     * Get complete user data
     */
    static getUserData(): Promise<UserData | null>;
    /**
     * Save complete user data
     */
    static saveUserData(userData: UserData): Promise<void>;
    /**
     * Get user settings
     */
    static getSettings(): Promise<UserSettings>;
    /**
     * Update user settings
     */
    static updateSettings(newSettings: Partial<UserSettings>): Promise<void>;
    /**
     * Add eye metrics
     */
    static addMetrics(metrics: EyeMetrics): Promise<void>;
    /**
     * Get metrics within date range
     */
    static getMetrics(startDate?: Date, endDate?: Date): Promise<EyeMetrics[]>;
    /**
     * Add break session
     */
    static addBreakSession(breakSession: BreakSession): Promise<void>;
    /**
     * Update break session
     */
    static updateBreakSession(sessionId: string, updates: Partial<BreakSession>): Promise<void>;
    /**
     * Get break sessions within date range
     */
    static getBreakSessions(startDate?: Date, endDate?: Date): Promise<BreakSession[]>;
    /**
     * Add user event
     */
    static addEvent(event: UserEvent): Promise<void>;
    /**
     * Get storage usage information
     */
    static getStorageInfo(): Promise<{
        used: number;
        quota: number;
    }>;
    /**
     * Clear all data (privacy feature)
     */
    static clearAllData(): Promise<void>;
    /**
     * Export data for backup
     */
    static exportData(): Promise<string>;
    /**
     * Import data from backup
     */
    static importData(jsonData: string): Promise<void>;
}
/**
 * IndexedDB Service
 * Handles large data storage and complex queries
 */
export declare class IndexedDBService {
    private static readonly DB_NAME;
    private static readonly DB_VERSION;
    private static readonly STORES;
    private static db;
    /**
     * Initialize IndexedDB
     */
    static initialize(): Promise<void>;
    /**
     * Store metrics in IndexedDB
     */
    static storeMetrics(metrics: EyeMetrics[]): Promise<void>;
    /**
     * Query metrics with advanced filtering
     */
    static queryMetrics(options: {
        startDate?: Date;
        endDate?: Date;
        fatigueThreshold?: number;
        limit?: number;
    }): Promise<EyeMetrics[]>;
    /**
     * Get daily aggregated metrics
     */
    static getDailyAggregates(date: Date): Promise<{
        avgFatigue: number;
        avgBlinkRate: number;
        totalReadings: number;
        peakFatigue: number;
    }>;
    /**
     * Cache data with expiration
     */
    static setCache(key: string, data: any, expirationMs?: number): Promise<void>;
    /**
     * Get cached data
     */
    static getCache(key: string): Promise<any | null>;
    /**
     * Clear expired cache entries
     */
    static clearExpiredCache(): Promise<void>;
    /**
     * Get database size
     */
    static getDatabaseSize(): Promise<number>;
    /**
     * Clear all IndexedDB data
     */
    static clearDatabase(): Promise<void>;
}
/**
 * Data Migration Service
 * Handles data migration between versions
 */
export declare class DataMigrationService {
    private static readonly MIGRATION_KEY;
    private static readonly CURRENT_VERSION;
    /**
     * Run necessary migrations
     */
    static runMigrations(): Promise<void>;
    private static getCurrentMigrationVersion;
    private static setMigrationVersion;
    private static migrate;
}
