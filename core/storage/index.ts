/**
 * Storage Module
 * Handles data persistence using chrome.storage.local and IndexedDB
 */

// Chrome API types
declare const chrome: {
  storage: {
    local: {
      get: (keys?: string | string[] | null) => Promise<any>;
      set: (items: any) => Promise<void>;
      clear: () => Promise<void>;
      getBytesInUse: (keys?: string | string[] | null) => Promise<number>;
      QUOTA_BYTES: number;
    };
  };
};

import { 
  UserData, 
  UserSettings, 
  EyeMetrics, 
  BreakSession, 
  UserEvent, 
  DEFAULT_SETTINGS 
} from '../../types/index';

/**
 * Chrome Storage Service
 * Handles chrome.storage.local operations
 */
export class ChromeStorageService {
  private static readonly STORAGE_KEYS = {
    USER_DATA: 'eyezen_user_data',
    SETTINGS: 'eyezen_settings',
    METRICS: 'eyezen_metrics',
    BREAKS: 'eyezen_breaks',
    EVENTS: 'eyezen_events',
    LAST_SYNC: 'eyezen_last_sync'
  };

  /**
   * Initialize storage with default values
   */
  static async initialize(): Promise<void> {
    try {
      const existingData = await this.getUserData();
      if (!existingData) {
        const defaultUserData: UserData = {
          settings: DEFAULT_SETTINGS,
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
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw new Error('Storage initialization failed');
    }
  }

  /**
   * Get complete user data
   */
  static async getUserData(): Promise<UserData | null> {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEYS.USER_DATA]);
      return result[this.STORAGE_KEYS.USER_DATA] || null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  /**
   * Save complete user data
   */
  static async saveUserData(userData: UserData): Promise<void> {
    try {
      userData.lastUpdated = Date.now();
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.USER_DATA]: userData
      });
    } catch (error) {
      console.error('Failed to save user data:', error);
      throw new Error('Failed to save user data');
    }
  }

  /**
   * Get user settings
   */
  static async getSettings(): Promise<UserSettings> {
    try {
      const userData = await this.getUserData();
      return userData?.settings || DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Failed to get settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Update user settings
   */
  static async updateSettings(newSettings: Partial<UserSettings>): Promise<void> {
    try {
      const userData = await this.getUserData();
      if (userData) {
        userData.settings = { ...userData.settings, ...newSettings };
        await this.saveUserData(userData);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw new Error('Failed to update settings');
    }
  }

  /**
   * Add eye metrics
   */
  static async addMetrics(metrics: EyeMetrics): Promise<void> {
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
    } catch (error) {
      console.error('Failed to add metrics:', error);
      throw new Error('Failed to add metrics');
    }
  }

  /**
   * Get metrics within date range
   */
  static async getMetrics(startDate?: Date, endDate?: Date): Promise<EyeMetrics[]> {
    try {
      const userData = await this.getUserData();
      if (!userData) return [];

      let metrics = userData.metrics;
      
      if (startDate) {
        metrics = metrics.filter(m => m.timestamp >= startDate.getTime());
      }
      
      if (endDate) {
        metrics = metrics.filter(m => m.timestamp <= endDate.getTime());
      }
      
      return metrics.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return [];
    }
  }

  /**
   * Add break session
   */
  static async addBreakSession(breakSession: BreakSession): Promise<void> {
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
    } catch (error) {
      console.error('Failed to add break session:', error);
      throw new Error('Failed to add break session');
    }
  }

  /**
   * Update break session
   */
  static async updateBreakSession(sessionId: string, updates: Partial<BreakSession>): Promise<void> {
    try {
      const userData = await this.getUserData();
      if (userData) {
        const sessionIndex = userData.breaks.findIndex(b => b.id === sessionId);
        if (sessionIndex !== -1) {
          userData.breaks[sessionIndex] = { ...userData.breaks[sessionIndex], ...updates };
          await this.saveUserData(userData);
        }
      }
    } catch (error) {
      console.error('Failed to update break session:', error);
      throw new Error('Failed to update break session');
    }
  }

  /**
   * Get break sessions within date range
   */
  static async getBreakSessions(startDate?: Date, endDate?: Date): Promise<BreakSession[]> {
    try {
      const userData = await this.getUserData();
      if (!userData) return [];

      let breaks = userData.breaks;
      
      if (startDate) {
        breaks = breaks.filter(b => b.startTime >= startDate.getTime());
      }
      
      if (endDate) {
        breaks = breaks.filter(b => b.startTime <= endDate.getTime());
      }
      
      return breaks.sort((a, b) => a.startTime - b.startTime);
    } catch (error) {
      console.error('Failed to get break sessions:', error);
      return [];
    }
  }

  /**
   * Add user event
   */
  static async addEvent(event: UserEvent): Promise<void> {
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
    } catch (error) {
      console.error('Failed to add event:', error);
      throw new Error('Failed to add event');
    }
  }

  /**
   * Get storage usage information
   */
  static async getStorageInfo(): Promise<{ used: number; quota: number }> {
    try {
      const usage = await chrome.storage.local.getBytesInUse();
      return {
        used: usage,
        quota: chrome.storage.local.QUOTA_BYTES
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, quota: 0 };
    }
  }

  /**
   * Clear all data (privacy feature)
   */
  static async clearAllData(): Promise<void> {
    try {
      await chrome.storage.local.clear();
      await this.initialize(); // Reinitialize with defaults
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw new Error('Failed to clear data');
    }
  }

  /**
   * Export data for backup
   */
  static async exportData(): Promise<string> {
    try {
      const userData = await this.getUserData();
      if (!userData) {
        throw new Error('No data to export');
      }
      
      return JSON.stringify(userData, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Failed to export data');
    }
  }

  /**
   * Import data from backup
   */
  static async importData(jsonData: string): Promise<void> {
    try {
      const userData = JSON.parse(jsonData) as UserData;
      
      // Validate data structure
      if (!userData.settings || !userData.metrics || !userData.breaks) {
        throw new Error('Invalid data format');
      }
      
      await this.saveUserData(userData);
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Failed to import data');
    }
  }
}

/**
 * IndexedDB Service
 * Handles large data storage and complex queries
 */
export class IndexedDBService {
  private static readonly DB_NAME = 'EyeZenDB';
  private static readonly DB_VERSION = 1;
  private static readonly STORES = {
    METRICS: 'metrics',
    BREAKS: 'breaks',
    EVENTS: 'events',
    CACHE: 'cache'
  };

  private static db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  static async initialize(): Promise<void> {
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
        const db = (event.target as IDBOpenDBRequest).result;
        
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
  static async storeMetrics(metrics: EyeMetrics[]): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.METRICS], 'readwrite');
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
  static async queryMetrics(options: {
    startDate?: Date;
    endDate?: Date;
    fatigueThreshold?: number;
    limit?: number;
  }): Promise<EyeMetrics[]> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.METRICS], 'readonly');
      const store = transaction.objectStore(this.STORES.METRICS);
      const results: EyeMetrics[] = [];
      
      let request: IDBRequest;
      
      if (options.startDate || options.endDate) {
        const index = store.index('timestamp');
        const range = IDBKeyRange.bound(
          options.startDate?.getTime() || 0,
          options.endDate?.getTime() || Date.now()
        );
        request = index.openCursor(range);
      } else {
        request = store.openCursor();
      }
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
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
  static async getDailyAggregates(date: Date): Promise<{
    avgFatigue: number;
    avgBlinkRate: number;
    totalReadings: number;
    peakFatigue: number;
  }> {
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
  static async setCache(key: string, data: any, expirationMs: number = 3600000): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.CACHE], 'readwrite');
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
  static async getCache(key: string): Promise<any | null> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.CACHE], 'readonly');
      const store = transaction.objectStore(this.STORES.CACHE);
      
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.expires > Date.now()) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to get cache'));
    });
  }

  /**
   * Clear expired cache entries
   */
  static async clearExpiredCache(): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.CACHE], 'readwrite');
      const store = transaction.objectStore(this.STORES.CACHE);
      
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
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
  static async getDatabaseSize(): Promise<number> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve) => {
      let totalSize = 0;
      const storeNames = Array.from(this.db!.objectStoreNames);
      let completed = 0;
      
      storeNames.forEach(storeName => {
        const transaction = this.db!.transaction([storeName], 'readonly');
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
  static async clearDatabase(): Promise<void> {
    if (!this.db) await this.initialize();
    
    return new Promise((resolve, reject) => {
      const storeNames = Array.from(this.db!.objectStoreNames);
      const transaction = this.db!.transaction(storeNames, 'readwrite');
      
      storeNames.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        store.clear();
      });
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to clear database'));
    });
  }
}

/**
 * Data Migration Service
 * Handles data migration between versions
 */
export class DataMigrationService {
  private static readonly MIGRATION_KEY = 'eyezen_migration_version';
  private static readonly CURRENT_VERSION = 1;

  /**
   * Run necessary migrations
   */
  static async runMigrations(): Promise<void> {
    try {
      const currentVersion = await this.getCurrentMigrationVersion();
      
      if (currentVersion < this.CURRENT_VERSION) {
        await this.migrate(currentVersion, this.CURRENT_VERSION);
        await this.setMigrationVersion(this.CURRENT_VERSION);
      }
    } catch (error) {
      console.error('Migration failed:', error);
      throw new Error('Data migration failed');
    }
  }

  private static async getCurrentMigrationVersion(): Promise<number> {
    try {
      const result = await chrome.storage.local.get([this.MIGRATION_KEY]);
      return result[this.MIGRATION_KEY] || 0;
    } catch (error) {
      return 0;
    }
  }

  private static async setMigrationVersion(version: number): Promise<void> {
    await chrome.storage.local.set({
      [this.MIGRATION_KEY]: version
    });
  }

  private static async migrate(fromVersion: number, toVersion: number): Promise<void> {
    console.log(`Migrating data from version ${fromVersion} to ${toVersion}`);
    
    // Add migration logic here as needed
    // For now, we'll just ensure the storage is properly initialized
    await ChromeStorageService.initialize();
    await IndexedDBService.initialize();
  }
}