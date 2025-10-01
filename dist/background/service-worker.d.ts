/**
 * Background Service Worker
 * Handles alarms, notifications, and background tasks for EyeZen
 */
declare class BackgroundService {
    private isInitialized;
    private activeBreakTabId;
    private chromeAI;
    initialize(): Promise<void>;
    private handleAlarm;
    private handleMessage;
    private handleInstall;
    private handleStartup;
    private handleTabRemoved;
    private setupDefaultAlarms;
    private handleBreakReminder;
    private handlePostureCheck;
    private handleDailySummary;
    private handleWeeklySummary;
    private startBreak;
    private endBreak;
    private updateSettings;
    private getStatus;
    private snoozeReminder;
    private ensureOffscreenDocument;
    private forwardToOffscreenDocument;
    private forwardToDashboardTabs;
    private setupInitialData;
    private showNotification;
}
declare const backgroundService: BackgroundService;
export default backgroundService;
