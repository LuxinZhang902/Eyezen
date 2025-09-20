"use strict";
(self["webpackChunkeyezen_chrome_extension"] = self["webpackChunkeyezen_chrome_extension"] || []).push([["core_storage_index_ts"],{

/***/ "./core/storage/index.ts":
/*!*******************************!*\
  !*** ./core/storage/index.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ChromeStorageService: () => (/* binding */ ChromeStorageService),
/* harmony export */   DataMigrationService: () => (/* binding */ DataMigrationService),
/* harmony export */   IndexedDBService: () => (/* binding */ IndexedDBService)
/* harmony export */ });
/* harmony import */ var _types_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../types/index */ "./types/index.ts");
/**
 * Storage Module
 * Handles data persistence using chrome.storage.local and IndexedDB
 */

/**
 * Chrome Storage Service
 * Handles chrome.storage.local operations
 */
class ChromeStorageService {
    /**
     * Initialize storage with default values
     */
    static async initialize() {
        try {
            if (!this.isChromeApiAvailable()) {
                console.warn('Chrome API not available, skipping initialization');
                return;
            }
            const existingData = await this.getUserData();
            if (!existingData) {
                const defaultUserData = {
                    settings: _types_index__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_SETTINGS,
                    metrics: [],
                    breaks: [],
                    events: [],
                    score: {
                        current: 50,
                        daily: 50,
                        weekly: 50,
                        trend: 'stable'
                    },
                    lastUpdated: Date.now()
                };
                await this.saveUserData(defaultUserData);
            }
        }
        catch (error) {
            console.error('Failed to initialize storage:', error);
            throw new Error('Storage initialization failed');
        }
    }
    /**
     * Check if Chrome API is available
     */
    static isChromeApiAvailable() {
        return typeof chrome !== 'undefined' &&
            chrome.storage !== undefined &&
            chrome.storage.local !== undefined;
    }
    /**
     * Get complete user data
     */
    static async getUserData() {
        try {
            if (!this.isChromeApiAvailable()) {
                console.warn('Chrome API not available, returning mock data');
                return null;
            }
            const result = await chrome.storage.local.get([this.STORAGE_KEYS.USER_DATA]);
            return result[this.STORAGE_KEYS.USER_DATA] || null;
        }
        catch (error) {
            console.error('Failed to get user data:', error);
            return null;
        }
    }
    /**
     * Save complete user data
     */
    static async saveUserData(userData) {
        try {
            if (!this.isChromeApiAvailable()) {
                console.warn('Chrome API not available, skipping save');
                return;
            }
            userData.lastUpdated = Date.now();
            await chrome.storage.local.set({
                [this.STORAGE_KEYS.USER_DATA]: userData
            });
        }
        catch (error) {
            console.error('Failed to save user data:', error);
            throw new Error('Failed to save user data');
        }
    }
    /**
     * Get user settings
     */
    static async getSettings() {
        try {
            const userData = await this.getUserData();
            return userData?.settings || _types_index__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_SETTINGS;
        }
        catch (error) {
            console.error('Failed to get settings:', error);
            return _types_index__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_SETTINGS;
        }
    }
    /**
     * Update user settings
     */
    static async updateSettings(newSettings) {
        try {
            const userData = await this.getUserData();
            if (userData) {
                userData.settings = { ...userData.settings, ...newSettings };
                await this.saveUserData(userData);
            }
        }
        catch (error) {
            console.error('Failed to update settings:', error);
            throw new Error('Failed to update settings');
        }
    }
    /**
     * Add eye metrics
     */
    static async addMetrics(metrics) {
        try {
            const userData = await this.getUserData();
            if (userData) {
                userData.metrics.push(metrics);
                // Keep only recent metrics based on retention settings
                const retentionDays = userData.settings.dataRetention;
                const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
                userData.metrics = userData.metrics.filter(m => m.timestamp > cutoffTime);
                await this.saveUserData(userData);
            }
        }
        catch (error) {
            console.error('Failed to add metrics:', error);
            throw new Error('Failed to add metrics');
        }
    }
    /**
     * Get metrics within date range
     */
    static async getMetrics(startDate, endDate) {
        try {
            const userData = await this.getUserData();
            if (!userData)
                return [];
            let metrics = userData.metrics;
            if (startDate) {
                metrics = metrics.filter(m => m.timestamp >= startDate.getTime());
            }
            if (endDate) {
                metrics = metrics.filter(m => m.timestamp <= endDate.getTime());
            }
            return metrics.sort((a, b) => a.timestamp - b.timestamp);
        }
        catch (error) {
            console.error('Failed to get metrics:', error);
            return [];
        }
    }
    /**
     * Add break session
     */
    static async addBreakSession(breakSession) {
        try {
            const userData = await this.getUserData();
            if (userData) {
                userData.breaks.push(breakSession);
                // Keep only recent breaks
                const retentionDays = userData.settings.dataRetention;
                const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
                userData.breaks = userData.breaks.filter(b => b.startTime > cutoffTime);
                await this.saveUserData(userData);
            }
        }
        catch (error) {
            console.error('Failed to add break session:', error);
            throw new Error('Failed to add break session');
        }
    }
    /**
     * Update break session
     */
    static async updateBreakSession(sessionId, updates) {
        try {
            const userData = await this.getUserData();
            if (userData) {
                const sessionIndex = userData.breaks.findIndex(b => b.id === sessionId);
                if (sessionIndex !== -1) {
                    userData.breaks[sessionIndex] = { ...userData.breaks[sessionIndex], ...updates };
                    await this.saveUserData(userData);
                }
            }
        }
        catch (error) {
            console.error('Failed to update break session:', error);
            throw new Error('Failed to update break session');
        }
    }
    /**
     * Get break sessions within date range
     */
    static async getBreakSessions(startDate, endDate) {
        try {
            const userData = await this.getUserData();
            if (!userData)
                return [];
            let breaks = userData.breaks;
            if (startDate) {
                breaks = breaks.filter(b => b.startTime >= startDate.getTime());
            }
            if (endDate) {
                breaks = breaks.filter(b => b.startTime <= endDate.getTime());
            }
            return breaks.sort((a, b) => a.startTime - b.startTime);
        }
        catch (error) {
            console.error('Failed to get break sessions:', error);
            return [];
        }
    }
    /**
     * Add user event
     */
    static async addEvent(event) {
        try {
            const userData = await this.getUserData();
            if (userData) {
                userData.events.push(event);
                // Keep only recent events
                const retentionDays = userData.settings.dataRetention;
                const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
                userData.events = userData.events.filter(e => e.timestamp > cutoffTime);
                await this.saveUserData(userData);
            }
        }
        catch (error) {
            console.error('Failed to add event:', error);
            throw new Error('Failed to add event');
        }
    }
    /**
     * Get storage usage information
     */
    static async getStorageInfo() {
        try {
            const usage = await chrome.storage.local.getBytesInUse();
            return {
                used: usage,
                quota: chrome.storage.local.QUOTA_BYTES
            };
        }
        catch (error) {
            console.error('Failed to get storage info:', error);
            return { used: 0, quota: 0 };
        }
    }
    /**
     * Clear all data (privacy feature)
     */
    static async clearAllData() {
        try {
            await chrome.storage.local.clear();
            await this.initialize(); // Reinitialize with defaults
        }
        catch (error) {
            console.error('Failed to clear data:', error);
            throw new Error('Failed to clear data');
        }
    }
    /**
     * Export data for backup
     */
    static async exportData() {
        try {
            const userData = await this.getUserData();
            if (!userData) {
                throw new Error('No data to export');
            }
            return JSON.stringify(userData, null, 2);
        }
        catch (error) {
            console.error('Failed to export data:', error);
            throw new Error('Failed to export data');
        }
    }
    /**
     * Import data from backup
     */
    static async importData(jsonData) {
        try {
            const userData = JSON.parse(jsonData);
            // Validate data structure
            if (!userData.settings || !userData.metrics || !userData.breaks) {
                throw new Error('Invalid data format');
            }
            await this.saveUserData(userData);
        }
        catch (error) {
            console.error('Failed to import data:', error);
            throw new Error('Failed to import data');
        }
    }
}
ChromeStorageService.STORAGE_KEYS = {
    USER_DATA: 'eyezen_user_data',
    SETTINGS: 'eyezen_settings',
    METRICS: 'eyezen_metrics',
    BREAKS: 'eyezen_breaks',
    EVENTS: 'eyezen_events',
    LAST_SYNC: 'eyezen_last_sync'
};
/**
 * IndexedDB Service
 * Handles large data storage and complex queries
 */
class IndexedDBService {
    /**
     * Initialize IndexedDB
     */
    static async initialize() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            request.onerror = () => {
                reject(new Error('Failed to open IndexedDB'));
            };
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Create metrics store
                if (!db.objectStoreNames.contains(this.STORES.METRICS)) {
                    const metricsStore = db.createObjectStore(this.STORES.METRICS, {
                        keyPath: 'timestamp'
                    });
                    metricsStore.createIndex('date', 'date', { unique: false });
                    metricsStore.createIndex('fatigueIndex', 'fatigueIndex', { unique: false });
                }
                // Create breaks store
                if (!db.objectStoreNames.contains(this.STORES.BREAKS)) {
                    const breaksStore = db.createObjectStore(this.STORES.BREAKS, {
                        keyPath: 'id'
                    });
                    breaksStore.createIndex('startTime', 'startTime', { unique: false });
                    breaksStore.createIndex('type', 'type', { unique: false });
                }
                // Create events store
                if (!db.objectStoreNames.contains(this.STORES.EVENTS)) {
                    const eventsStore = db.createObjectStore(this.STORES.EVENTS, {
                        keyPath: 'id'
                    });
                    eventsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    eventsStore.createIndex('type', 'type', { unique: false });
                }
                // Create cache store
                if (!db.objectStoreNames.contains(this.STORES.CACHE)) {
                    db.createObjectStore(this.STORES.CACHE, {
                        keyPath: 'key'
                    });
                }
            };
        });
    }
    /**
     * Store metrics in IndexedDB
     */
    static async storeMetrics(metrics) {
        if (!this.db)
            await this.initialize();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORES.METRICS], 'readwrite');
            const store = transaction.objectStore(this.STORES.METRICS);
            metrics.forEach(metric => {
                const enrichedMetric = {
                    ...metric,
                    date: new Date(metric.timestamp).toISOString().split('T')[0]
                };
                store.put(enrichedMetric);
            });
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(new Error('Failed to store metrics'));
        });
    }
    /**
     * Query metrics with advanced filtering
     */
    static async queryMetrics(options) {
        if (!this.db)
            await this.initialize();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORES.METRICS], 'readonly');
            const store = transaction.objectStore(this.STORES.METRICS);
            const results = [];
            let request;
            if (options.startDate || options.endDate) {
                const index = store.index('timestamp');
                const range = IDBKeyRange.bound(options.startDate?.getTime() || 0, options.endDate?.getTime() || Date.now());
                request = index.openCursor(range);
            }
            else {
                request = store.openCursor();
            }
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const metric = cursor.value;
                    // Apply fatigue threshold filter
                    if (!options.fatigueThreshold || metric.fatigueIndex >= options.fatigueThreshold) {
                        results.push(metric);
                    }
                    // Apply limit
                    if (!options.limit || results.length < options.limit) {
                        cursor.continue();
                    }
                }
            };
            transaction.oncomplete = () => resolve(results);
            transaction.onerror = () => reject(new Error('Failed to query metrics'));
        });
    }
    /**
     * Get daily aggregated metrics
     */
    static async getDailyAggregates(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const metrics = await this.queryMetrics({
            startDate: startOfDay,
            endDate: endOfDay
        });
        if (metrics.length === 0) {
            return {
                avgFatigue: 0,
                avgBlinkRate: 0,
                totalReadings: 0,
                peakFatigue: 0
            };
        }
        const totalFatigue = metrics.reduce((sum, m) => sum + m.fatigueIndex, 0);
        const totalBlinkRate = metrics.reduce((sum, m) => sum + m.blinkRate, 0);
        const peakFatigue = Math.max(...metrics.map(m => m.fatigueIndex));
        return {
            avgFatigue: totalFatigue / metrics.length,
            avgBlinkRate: totalBlinkRate / metrics.length,
            totalReadings: metrics.length,
            peakFatigue
        };
    }
    /**
     * Cache data with expiration
     */
    static async setCache(key, data, expirationMs = 3600000) {
        if (!this.db)
            await this.initialize();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORES.CACHE], 'readwrite');
            const store = transaction.objectStore(this.STORES.CACHE);
            const cacheItem = {
                key,
                data,
                expires: Date.now() + expirationMs
            };
            const request = store.put(cacheItem);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to set cache'));
        });
    }
    /**
     * Get cached data
     */
    static async getCache(key) {
        if (!this.db)
            await this.initialize();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORES.CACHE], 'readonly');
            const store = transaction.objectStore(this.STORES.CACHE);
            const request = store.get(key);
            request.onsuccess = () => {
                const result = request.result;
                if (result && result.expires > Date.now()) {
                    resolve(result.data);
                }
                else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(new Error('Failed to get cache'));
        });
    }
    /**
     * Clear expired cache entries
     */
    static async clearExpiredCache() {
        if (!this.db)
            await this.initialize();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORES.CACHE], 'readwrite');
            const store = transaction.objectStore(this.STORES.CACHE);
            const request = store.openCursor();
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const item = cursor.value;
                    if (item.expires <= Date.now()) {
                        cursor.delete();
                    }
                    cursor.continue();
                }
            };
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(new Error('Failed to clear expired cache'));
        });
    }
    /**
     * Get database size
     */
    static async getDatabaseSize() {
        if (!this.db)
            await this.initialize();
        return new Promise((resolve) => {
            let totalSize = 0;
            const storeNames = Array.from(this.db.objectStoreNames);
            let completed = 0;
            storeNames.forEach(storeName => {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.count();
                request.onsuccess = () => {
                    totalSize += request.result;
                    completed++;
                    if (completed === storeNames.length) {
                        resolve(totalSize);
                    }
                };
            });
        });
    }
    /**
     * Clear all IndexedDB data
     */
    static async clearDatabase() {
        if (!this.db)
            await this.initialize();
        return new Promise((resolve, reject) => {
            const storeNames = Array.from(this.db.objectStoreNames);
            const transaction = this.db.transaction(storeNames, 'readwrite');
            storeNames.forEach(storeName => {
                const store = transaction.objectStore(storeName);
                store.clear();
            });
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(new Error('Failed to clear database'));
        });
    }
}
IndexedDBService.DB_NAME = 'EyeZenDB';
IndexedDBService.DB_VERSION = 1;
IndexedDBService.STORES = {
    METRICS: 'metrics',
    BREAKS: 'breaks',
    EVENTS: 'events',
    CACHE: 'cache'
};
IndexedDBService.db = null;
/**
 * Data Migration Service
 * Handles data migration between versions
 */
class DataMigrationService {
    /**
     * Run necessary migrations
     */
    static async runMigrations() {
        try {
            const currentVersion = await this.getCurrentMigrationVersion();
            if (currentVersion < this.CURRENT_VERSION) {
                await this.migrate(currentVersion, this.CURRENT_VERSION);
                await this.setMigrationVersion(this.CURRENT_VERSION);
            }
        }
        catch (error) {
            console.error('Migration failed:', error);
            throw new Error('Data migration failed');
        }
    }
    static async getCurrentMigrationVersion() {
        try {
            const result = await chrome.storage.local.get([this.MIGRATION_KEY]);
            return result[this.MIGRATION_KEY] || 0;
        }
        catch (error) {
            return 0;
        }
    }
    static async setMigrationVersion(version) {
        await chrome.storage.local.set({
            [this.MIGRATION_KEY]: version
        });
    }
    static async migrate(fromVersion, toVersion) {
        console.log(`Migrating data from version ${fromVersion} to ${toVersion}`);
        // Add migration logic here as needed
        // For now, we'll just ensure the storage is properly initialized
        await ChromeStorageService.initialize();
        await IndexedDBService.initialize();
    }
}
DataMigrationService.MIGRATION_KEY = 'eyezen_migration_version';
DataMigrationService.CURRENT_VERSION = 1;


/***/ }),

/***/ "./types/index.ts":
/*!************************!*\
  !*** ./types/index.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BreakType: () => (/* binding */ BreakType),
/* harmony export */   DEFAULT_SETTINGS: () => (/* binding */ DEFAULT_SETTINGS),
/* harmony export */   EyeZenError: () => (/* binding */ EyeZenError),
/* harmony export */   MASSAGE_POINTS: () => (/* binding */ MASSAGE_POINTS),
/* harmony export */   MassagePointType: () => (/* binding */ MassagePointType),
/* harmony export */   PostureStatus: () => (/* binding */ PostureStatus),
/* harmony export */   UserStatus: () => (/* binding */ UserStatus)
/* harmony export */ });
// Core types for EyeZen Chrome Extension
var PostureStatus;
(function (PostureStatus) {
    PostureStatus["GOOD"] = "good";
    PostureStatus["FORWARD"] = "forward";
    PostureStatus["TILTED"] = "tilted";
    PostureStatus["TOO_CLOSE"] = "too_close";
    PostureStatus["TOO_FAR"] = "too_far";
})(PostureStatus || (PostureStatus = {}));
// User status and scoring
var UserStatus;
(function (UserStatus) {
    UserStatus["GOOD"] = "good";
    UserStatus["TIRED"] = "tired";
    UserStatus["CRITICAL"] = "critical";
})(UserStatus || (UserStatus = {}));
var BreakType;
(function (BreakType) {
    BreakType["MICRO"] = "micro";
    BreakType["SHORT"] = "short";
    BreakType["LONG"] = "long"; // 15 minutes
})(BreakType || (BreakType = {}));
var MassagePointType;
(function (MassagePointType) {
    MassagePointType["ZAN_ZHU"] = "zan_zhu";
    MassagePointType["SI_BAI"] = "si_bai";
    MassagePointType["JING_MING"] = "jing_ming"; // 睛明
})(MassagePointType || (MassagePointType = {}));
// Error types
class EyeZenError extends Error {
    constructor(message, code, severity = 'medium') {
        super(message);
        this.code = code;
        this.severity = severity;
        this.name = 'EyeZenError';
    }
}
// Constants
const DEFAULT_SETTINGS = {
    cameraEnabled: true,
    detectionSensitivity: 'medium',
    fatigueThreshold: 70,
    reminderEnabled: true,
    reminderInterval: 20,
    breakDuration: 20,
    dataRetention: 30,
    metricsOnly: false,
    language: 'en',
    theme: 'auto',
    notifications: true,
    sounds: true,
    dailyBreakGoal: 8,
    eyeScoreGoal: 80
};
const MASSAGE_POINTS = {
    [MassagePointType.ZAN_ZHU]: {
        name: 'Zan Zhu',
        chineseName: '攒竹',
        position: { x: 0.3, y: 0.25 },
        description: 'Inner end of eyebrow',
        benefits: ['Relieves eye strain', 'Reduces headaches', 'Improves focus'],
        duration: 30
    },
    [MassagePointType.SI_BAI]: {
        name: 'Si Bai',
        chineseName: '四白',
        position: { x: 0.35, y: 0.45 },
        description: 'Below the center of the eye',
        benefits: ['Brightens eyes', 'Reduces dark circles', 'Improves circulation'],
        duration: 30
    },
    [MassagePointType.JING_MING]: {
        name: 'Jing Ming',
        chineseName: '睛明',
        position: { x: 0.25, y: 0.35 },
        description: 'Inner corner of the eye',
        benefits: ['Clears vision', 'Reduces eye fatigue', 'Calms the mind'],
        duration: 30
    }
};
// Export all types
// Note: Chrome types will be available via @types/chrome package
// Additional type exports can be added here as needed


/***/ })

}]);
//# sourceMappingURL=core_storage_index_ts.js.map