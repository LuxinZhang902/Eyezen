/**
 * IndexedDB Service
 * Handles large data storage, analytics, and offline capabilities
 */

import { 
  UserData, 
  BreakSession, 
  EyeMetrics, 
  UserEvent, 
  WeeklySummary,
  EyeScore 
} from '../../types/index';

export class IndexedDBService {
  private static readonly DB_NAME = 'EyeZenDB';
  private static readonly DB_VERSION = 1;
  private static db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  static async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(db);
      };
    });
  }

  /**
   * Create object stores for different data types
   */
  private static createObjectStores(db: IDBDatabase): void {
    // Break sessions store
    if (!db.objectStoreNames.contains('breakSessions')) {
      const breakStore = db.createObjectStore('breakSessions', { keyPath: 'id' });
      breakStore.createIndex('startTime', 'startTime', { unique: false });
      breakStore.createIndex('type', 'type', { unique: false });
      breakStore.createIndex('completed', 'completed', { unique: false });
    }

    // Eye metrics store
    if (!db.objectStoreNames.contains('eyeMetrics')) {
      const metricsStore = db.createObjectStore('eyeMetrics', { keyPath: 'id' });
      metricsStore.createIndex('timestamp', 'timestamp', { unique: false });
      metricsStore.createIndex('fatigueIndex', 'fatigueIndex', { unique: false });
    }

    // User events store
    if (!db.objectStoreNames.contains('userEvents')) {
      const eventsStore = db.createObjectStore('userEvents', { keyPath: 'id' });
      eventsStore.createIndex('timestamp', 'timestamp', { unique: false });
      eventsStore.createIndex('type', 'type', { unique: false });
    }

    // Weekly summaries store
    if (!db.objectStoreNames.contains('weeklySummaries')) {
      const summariesStore = db.createObjectStore('weeklySummaries', { keyPath: 'weekStart' });
      summariesStore.createIndex('generated', 'generated', { unique: false });
    }

    // Analytics cache store
    if (!db.objectStoreNames.contains('analyticsCache')) {
      const analyticsStore = db.createObjectStore('analyticsCache', { keyPath: 'key' });
      analyticsStore.createIndex('timestamp', 'timestamp', { unique: false });
    }
  }

  /**
   * Store break session
   */
  static async storeBreakSession(session: BreakSession): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['breakSessions'], 'readwrite');
      const store = transaction.objectStore('breakSessions');
      const request = store.put(session);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get break sessions within date range
   */
  static async getBreakSessions(
    startDate: number, 
    endDate: number
  ): Promise<BreakSession[]> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['breakSessions'], 'readonly');
      const store = transaction.objectStore('breakSessions');
      const index = store.index('startTime');
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store eye metrics
   */
  static async storeEyeMetrics(metrics: EyeMetrics): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['eyeMetrics'], 'readwrite');
      const store = transaction.objectStore('eyeMetrics');
      const request = store.put(metrics);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get eye metrics within date range
   */
  static async getEyeMetrics(
    startDate: number, 
    endDate: number
  ): Promise<EyeMetrics[]> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['eyeMetrics'], 'readonly');
      const store = transaction.objectStore('eyeMetrics');
      const index = store.index('timestamp');
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store user event
   */
  static async storeUserEvent(event: UserEvent): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userEvents'], 'readwrite');
      const store = transaction.objectStore('userEvents');
      const request = store.put(event);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get user events within date range
   */
  static async getUserEvents(
    startDate: number, 
    endDate: number
  ): Promise<UserEvent[]> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userEvents'], 'readonly');
      const store = transaction.objectStore('userEvents');
      const index = store.index('timestamp');
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store weekly summary
   */
  static async storeWeeklySummary(summary: WeeklySummary): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['weeklySummaries'], 'readwrite');
      const store = transaction.objectStore('weeklySummaries');
      const request = store.put(summary);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get weekly summaries
   */
  static async getWeeklySummaries(limit: number = 10): Promise<WeeklySummary[]> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['weeklySummaries'], 'readonly');
      const store = transaction.objectStore('weeklySummaries');
      const index = store.index('generated');
      const request = index.openCursor(null, 'prev');
      const results: WeeklySummary[] = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && count < limit) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cache analytics data
   */
  static async cacheAnalytics(key: string, data: any, ttl: number = 3600000): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const cacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['analyticsCache'], 'readwrite');
      const store = transaction.objectStore('analyticsCache');
      const request = store.put(cacheEntry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached analytics data
   */
  static async getCachedAnalytics(key: string): Promise<any | null> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['analyticsCache'], 'readonly');
      const store = transaction.objectStore('analyticsCache');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.expires > Date.now()) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Calculate eye score based on recent data
   */
  static async calculateEyeScore(userId: string): Promise<EyeScore> {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    try {
      // Get recent data
      const [dailyMetrics, weeklyMetrics, monthlyMetrics, dailyBreaks, weeklyBreaks] = await Promise.all([
        this.getEyeMetrics(now - dayMs, now),
        this.getEyeMetrics(now - weekMs, now),
        this.getEyeMetrics(now - monthMs, now),
        this.getBreakSessions(now - dayMs, now),
        this.getBreakSessions(now - weekMs, now)
      ]);

      // Calculate scores
      const dailyScore = this.calculatePeriodScore(dailyMetrics, dailyBreaks);
      const weeklyScore = this.calculatePeriodScore(weeklyMetrics, weeklyBreaks);
      const monthlyScore = this.calculatePeriodScore(monthlyMetrics, []);

      // Calculate trend (improvement over time)
      const trend = this.calculateTrend(weeklyMetrics);

      return {
        current: dailyScore,
        daily: dailyScore,
        weekly: weeklyScore,
        trend: this.getTrendCategory(trend)
      };
    } catch (error) {
      console.error('Failed to calculate eye score:', error);
      return {
        current: 75,
        daily: 75,
        weekly: 75,
        trend: 'stable' as const
      };
    }
  }

  /**
   * Calculate score for a specific period
   */
  private static calculatePeriodScore(metrics: EyeMetrics[], breaks: BreakSession[]): number {
    if (metrics.length === 0) return 75; // Default score

    // Base score from fatigue levels (lower fatigue = higher score)
    const avgFatigue = metrics.reduce((sum, m) => sum + m.fatigueIndex, 0) / metrics.length;
    const fatigueScore = Math.max(0, 100 - avgFatigue);

    // Break compliance score
    const completedBreaks = breaks.filter(b => b.completed).length;
    const expectedBreaks = Math.max(1, Math.floor(metrics.length / 10)); // Rough estimate
    const breakScore = Math.min(100, (completedBreaks / expectedBreaks) * 100);

    // Consistency score (less variation in fatigue = better)
    const fatigueVariation = this.calculateVariation(metrics.map(m => m.fatigueIndex));
    const consistencyScore = Math.max(0, 100 - fatigueVariation);

    // Weighted average
    const score = (fatigueScore * 0.5) + (breakScore * 0.3) + (consistencyScore * 0.2);
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Calculate trend (positive = improving, negative = declining)
   */
  private static calculateTrend(metrics: EyeMetrics[]): number {
    if (metrics.length < 2) return 0;

    const sortedMetrics = metrics.sort((a, b) => a.timestamp - b.timestamp);
    const firstHalf = sortedMetrics.slice(0, Math.floor(sortedMetrics.length / 2));
    const secondHalf = sortedMetrics.slice(Math.floor(sortedMetrics.length / 2));

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.fatigueIndex, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.fatigueIndex, 0) / secondHalf.length;

    // Lower fatigue in second half = positive trend
    return Math.round(firstAvg - secondAvg);
  }

  /**
   * Convert numeric trend to category
   */
  private static getTrendCategory(trend: number): 'improving' | 'stable' | 'declining' {
    if (trend > 5) return 'improving';
    if (trend < -5) return 'declining';
    return 'stable';
  }

  /**
   * Calculate variation in a dataset
   */
  private static calculateVariation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Clean up old data (privacy feature)
   */
  static async cleanupOldData(retentionDays: number = 90): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    const stores = ['breakSessions', 'eyeMetrics', 'userEvents'];

    for (const storeName of stores) {
      await this.cleanupStore(storeName, cutoffDate);
    }
  }

  /**
   * Clean up specific store
   */
  private static async cleanupStore(storeName: string, cutoffDate: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore('breakSessions');
      const index = store.index('startTime');
      const range = IDBKeyRange.upperBound(cutoffDate);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Export all user data (privacy feature)
   */
  static async exportUserData(): Promise<any> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const now = Date.now();
    const [breaks, metrics, events, summaries] = await Promise.all([
      this.getBreakSessions(0, now),
      this.getEyeMetrics(0, now),
      this.getUserEvents(0, now),
      this.getWeeklySummaries(100)
    ]);

    return {
      exportDate: now,
      breakSessions: breaks,
      eyeMetrics: metrics,
      userEvents: events,
      weeklySummaries: summaries
    };
  }

  /**
   * Erase all user data (privacy feature)
   */
  static async eraseAllData(): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    const stores = ['breakSessions', 'eyeMetrics', 'userEvents', 'weeklySummaries', 'analyticsCache'];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(stores, 'readwrite');
      let completed = 0;

      const checkComplete = () => {
        completed++;
        if (completed === stores.length) {
          resolve();
        }
      };

      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = checkComplete;
        request.onerror = () => reject(request.error);
      });
    });
  }
}

// Initialize IndexedDB when the module loads
IndexedDBService.initialize().catch(console.error);