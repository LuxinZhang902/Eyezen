/**
 * Background Service Worker
 * Handles alarms, notifications, and background tasks for EyeZen
 */

import { ChromeStorageService } from '../core/storage/index';
import { BreakType, UserStatus, BreakSession, UserData, EyeScore, UserSettings, DEFAULT_SETTINGS } from '../types/index';

// Constants
const ALARM_NAMES = {
  BREAK_REMINDER: 'break-reminder',
  DAILY_SUMMARY: 'daily-summary',
  WEEKLY_SUMMARY: 'weekly-summary',
  POSTURE_CHECK: 'posture-check'
} as const;

const DEFAULT_INTERVALS = {
  BREAK_REMINDER: 20, // 20 minutes for 20-20-20 rule
  POSTURE_CHECK: 30,  // 30 minutes for posture reminders
  DAILY_SUMMARY: 24 * 60, // Daily at end of day
  WEEKLY_SUMMARY: 7 * 24 * 60 // Weekly summary
} as const;

class BackgroundService {
  private isInitialized = false;
  private activeBreakTabId: number | null = null;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Set up alarm listeners
      chrome.alarms.onAlarm.addListener(this.handleAlarm.bind(this));
      
      // Set up message listeners
      chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
      
      // Set up installation/startup listeners
      chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
      chrome.runtime.onStartup.addListener(this.handleStartup.bind(this));
      
      // Set up tab listeners for break management
      chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));
      
      // Initialize default alarms
      await this.setupDefaultAlarms();
      
      this.isInitialized = true;
      console.log('EyeZen Background Service initialized');
    } catch (error) {
      console.error('Failed to initialize background service:', error);
    }
  }

  private async handleAlarm(alarm: chrome.alarms.Alarm) {
    console.log('Alarm triggered:', alarm.name);
    
    try {
      switch (alarm.name) {
        case ALARM_NAMES.BREAK_REMINDER:
          await this.handleBreakReminder();
          break;
        case ALARM_NAMES.POSTURE_CHECK:
          await this.handlePostureCheck();
          break;
        case ALARM_NAMES.DAILY_SUMMARY:
          await this.handleDailySummary();
          break;
        case ALARM_NAMES.WEEKLY_SUMMARY:
          await this.handleWeeklySummary();
          break;
        default:
          console.log('Unknown alarm:', alarm.name);
      }
    } catch (error) {
      console.error('Error handling alarm:', alarm.name, error);
    }
  }

  private async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<boolean> {
    console.log('🔄 Service Worker received message:', message.type || message.action, 'from:', sender.tab?.url || 'extension');
    
    try {
      // Handle camera-related messages by forwarding to offscreen document
      if (message.type === 'REQUEST_CAMERA' || message.type === 'STOP_CAMERA' || message.type === 'GET_CAMERA_STATE') {
        console.log('📹 Service Worker: Forwarding camera message to offscreen document:', message.type);
        this.forwardToOffscreenDocument(message, sendResponse);
        return true; // Keep message port open for async response
      }
      
      // Handle regular service worker actions
      switch (message.action) {
        case 'START_BREAK':
          console.log('🛑 Service Worker: Starting break:', message.breakType);
          await this.startBreak(message.breakType);
          sendResponse({ success: true });
          break;
          
        case 'END_BREAK':
          console.log('✅ Service Worker: Ending break:', message.breakId);
          await this.endBreak(message.breakId);
          sendResponse({ success: true });
          break;
          
        case 'UPDATE_SETTINGS':
          console.log('⚙️ Service Worker: Updating settings');
          await this.updateSettings(message.settings);
          sendResponse({ success: true });
          break;
          
        case 'GET_STATUS':
          const status = await this.getStatus();
          console.log('📊 Service Worker: Returning status');
          sendResponse({ success: true, data: status });
          break;
          
        case 'SNOOZE_REMINDER':
          console.log('😴 Service Worker: Snoozing reminder for', message.minutes || 5, 'minutes');
          await this.snoozeReminder(message.minutes || 5);
          sendResponse({ success: true });
          break;
          
        default:
          console.warn('❓ Service Worker: Unknown action:', message.action || message.type);
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('❌ Service Worker: Error handling message:', error);
      sendResponse({ success: false, error: String(error) });
    }
    
    return false; // Close message channel after synchronous response
  }

  private async handleInstall(details: chrome.runtime.InstalledDetails) {
    if (details.reason === 'install') {
      console.log('EyeZen installed for the first time');
      await this.setupInitialData();
      
      // Show welcome notification
      await this.showNotification({
        type: 'basic',
        iconUrl: 'assets/icons/icon-48.svg',
        title: 'Welcome to EyeZen! 👁️',
        message: 'Your AI eye health companion is ready. Click to get started!'
      });
    } else if (details.reason === 'update') {
      console.log('EyeZen updated to version:', chrome.runtime.getManifest().version);
    }
  }

  private async handleStartup() {
    console.log('EyeZen service worker started');
    await this.setupDefaultAlarms();
  }

  private async handleTabRemoved(tabId: number) {
    if (this.activeBreakTabId === tabId) {
      this.activeBreakTabId = null;
      console.log('Break tab closed');
    }
  }

  private async setupDefaultAlarms() {
    try {
      const userData = await ChromeStorageService.getUserData();
      const settings: UserSettings = userData?.settings || DEFAULT_SETTINGS;
      
      // Clear existing alarms
      await chrome.alarms.clearAll();
      
      // Set up break reminder alarm
      if (settings.reminderEnabled ?? true) {
        const interval = settings.reminderInterval ?? DEFAULT_INTERVALS.BREAK_REMINDER;
        await chrome.alarms.create(ALARM_NAMES.BREAK_REMINDER, {
          delayInMinutes: interval,
          periodInMinutes: interval
        });
      }
      
      // Set up posture check alarm
      if (settings.reminderEnabled ?? true) {
        await chrome.alarms.create(ALARM_NAMES.POSTURE_CHECK, {
          delayInMinutes: DEFAULT_INTERVALS.POSTURE_CHECK,
          periodInMinutes: DEFAULT_INTERVALS.POSTURE_CHECK
        });
      }
      
      // Set up daily summary alarm (8 PM)
      const now = new Date();
      const dailySummaryTime = new Date();
      dailySummaryTime.setHours(20, 0, 0, 0); // 8 PM
      
      if (dailySummaryTime <= now) {
        dailySummaryTime.setDate(dailySummaryTime.getDate() + 1);
      }
      
      await chrome.alarms.create(ALARM_NAMES.DAILY_SUMMARY, {
        when: dailySummaryTime.getTime(),
        periodInMinutes: DEFAULT_INTERVALS.DAILY_SUMMARY
      });
      
      console.log('Default alarms set up successfully');
    } catch (error) {
      console.error('Failed to setup default alarms:', error);
    }
  }

  private async handleBreakReminder() {
    try {
      const userData = await ChromeStorageService.getUserData();
      if (!userData || !userData.settings.reminderEnabled) {
        return;
      }
      
      // Check if user is currently in a break
      const activeBreak = userData.breaks.find(b => !b.completed);
      if (activeBreak) {
        console.log('User is already in a break, skipping reminder');
        return;
      }
      
      // Check recent activity to determine reminder urgency
      const recentMetrics = userData.metrics.slice(-5);
      const avgEyeStrain = recentMetrics.reduce((sum, m) => sum + (m.fatigueIndex || 0), 0) / recentMetrics.length;
      
      let title = '👁️ Time for an Eye Break!';
      let message = 'Follow the 20-20-20 rule: Look at something 20 feet away for 20 seconds.';
      let priority = 0;
      
      if (avgEyeStrain > 0.7) {
        title = '⚠️ High Eye Strain Detected!';
        message = 'Your eyes need immediate rest. Take a break now to prevent fatigue.';
        priority = 2;
      } else if (avgEyeStrain > 0.5) {
        title = '😴 Eyes Getting Tired';
        message = 'Time for a refreshing eye break. Your future self will thank you!';
        priority = 1;
      }
      
      await this.showNotification({
        type: 'basic',
        iconUrl: 'assets/icons/icon-48.svg',
        title,
        message,
        priority,
        buttons: [
          { title: 'Start Break' },
          { title: 'Snooze 5min' }
        ]
      });
      
    } catch (error) {
      console.error('Error in break reminder:', error);
    }
  }

  private async handlePostureCheck() {
    try {
      const userData = await ChromeStorageService.getUserData();
      if (!userData || !userData.settings.reminderEnabled) {
        return;
      }
      
      await this.showNotification({
        type: 'basic',
        iconUrl: 'assets/icons/icon-48.svg',
        title: '🧘 Posture Check',
        message: 'Sit up straight, relax your shoulders, and adjust your screen height.',
        priority: 0
      });
      
    } catch (error) {
      console.error('Error in posture check:', error);
    }
  }

  private async handleDailySummary() {
    try {
      // Generate and show daily summary
      const userData = await ChromeStorageService.getUserData();
      if (!userData) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayMetrics = userData.metrics.filter(m => {
        const metricDate = new Date(m.timestamp);
        metricDate.setHours(0, 0, 0, 0);
        return metricDate.getTime() === today.getTime();
      });
      
      const todayBreaks = userData.breaks.filter(b => {
        const breakDate = new Date(b.startTime);
        breakDate.setHours(0, 0, 0, 0);
        return breakDate.getTime() === today.getTime() && b.completed;
      });
      
      const avgEyeHealth = todayMetrics.length > 0 
        ? todayMetrics.reduce((sum, m) => sum + (100 - (m.fatigueIndex || 0) * 100), 0) / todayMetrics.length
        : 50;
      
      await this.showNotification({
        type: 'basic',
        iconUrl: 'assets/icons/icon-48.svg',
        title: '📊 Daily Eye Health Summary',
        message: `Eye Health Score: ${Math.round(avgEyeHealth)}/100 | Breaks Taken: ${todayBreaks.length}`,
        priority: 0
      });
      
    } catch (error) {
      console.error('Error in daily summary:', error);
    }
  }

  private async handleWeeklySummary() {
    try {
      // Generate weekly summary - placeholder for now
      await this.showNotification({
        type: 'basic',
        iconUrl: 'assets/icons/icon-48.svg',
        title: '📈 Weekly Eye Health Report',
        message: 'Your weekly eye health report is ready! Click to view insights.',
        priority: 1
      });
    } catch (error) {
      console.error('Error in weekly summary:', error);
    }
  }

  private async startBreak(breakType: BreakType) {
    try {
      // Create break record
      const breakId = Date.now().toString();
      const breakData: BreakSession = {
        id: breakId,
        type: breakType,
        duration: breakType === BreakType.MICRO ? 20 : breakType === BreakType.SHORT ? 300 : 900,
        startTime: Date.now(),
        completed: false,
        activities: []
      };
      
      // Save break to storage
      const userData = await ChromeStorageService.getUserData();
      if (userData) {
        userData.breaks.push(breakData);
        await ChromeStorageService.saveUserData(userData);
      }
      
      // Open break ritual page
      const breakUrl = chrome.runtime.getURL(`break-ritual.html?type=${breakType}&id=${breakId}`);
      const tab = await chrome.tabs.create({ url: breakUrl });
      this.activeBreakTabId = tab.id || null;
      
      console.log('Break started:', breakType, breakId);
    } catch (error) {
      console.error('Error starting break:', error);
      throw error;
    }
  }

  private async endBreak(breakId: string) {
    try {
      const userData = await ChromeStorageService.getUserData();
      if (userData) {
        const breakIndex = userData.breaks.findIndex(b => b.id === breakId);
        if (breakIndex !== -1) {
          userData.breaks[breakIndex].completed = true;
          userData.breaks[breakIndex].endTime = Date.now();
          await ChromeStorageService.saveUserData(userData);
        }
      }
      console.log('Break completed:', breakId);
    } catch (error) {
      console.error('Error ending break:', error);
      throw error;
    }
  }

  private async updateSettings(settings: any) {
    try {
      await ChromeStorageService.updateSettings(settings);
      
      // Recreate alarms with new settings
      await this.setupDefaultAlarms();
      
      console.log('Settings updated:', settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  private async getStatus() {
    try {
      const userData = await ChromeStorageService.getUserData();
      return {
        isActive: true,
        settings: userData?.settings || {},
        lastBreak: userData?.breaks.slice(-1)[0] || null,
        todayMetrics: userData?.metrics.filter(m => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const metricDate = new Date(m.timestamp);
          metricDate.setHours(0, 0, 0, 0);
          return metricDate.getTime() === today.getTime();
        }) || []
      };
    } catch (error) {
      console.error('Error getting status:', error);
      throw error;
    }
  }

  private async snoozeReminder(minutes: number) {
    try {
      // Clear current break reminder
      await chrome.alarms.clear(ALARM_NAMES.BREAK_REMINDER);
      
      // Set new alarm for snooze duration
      await chrome.alarms.create(ALARM_NAMES.BREAK_REMINDER, {
        delayInMinutes: minutes
      });
      
      console.log(`Break reminder snoozed for ${minutes} minutes`);
    } catch (error) {
      console.error('Error snoozing reminder:', error);
      throw error;
    }
  }

  private async ensureOffscreenDocument(): Promise<void> {
    const existingContexts = await chrome.runtime.getContexts({});
    const offscreenDocument = existingContexts.find(
      (context) => context.contextType === 'OFFSCREEN_DOCUMENT'
    );
    
    if (!offscreenDocument) {
      console.log('📄 Creating offscreen document for camera access');
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: [chrome.offscreen.Reason.USER_MEDIA],
        justification: 'Camera access for eye health monitoring'
      });
    }
  }

  private async forwardToOffscreenDocument(message: any, sendResponse: (response?: any) => void): Promise<void> {
    try {
      // Ensure offscreen document exists
      await this.ensureOffscreenDocument();
      
      // Wait a bit for offscreen document to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Send message directly to offscreen document
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error communicating with offscreen document:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse(response);
        }
      });
      
    } catch (error) {
      console.error('Error in forwardToOffscreenDocument:', error);
      sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async setupInitialData() {
    try {
      const initialData: UserData = {
        settings: {
          cameraEnabled: true,
          detectionSensitivity: 'medium',
          fatigueThreshold: 70,
          reminderEnabled: true,
          reminderInterval: 20,
          breakDuration: 20,
          dataRetention: 30,
          metricsOnly: false,
          language: 'en',
          theme: 'light',
          notifications: true,
          sounds: true,
          dailyBreakGoal: 8,
          eyeScoreGoal: 80
        },
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
      
      await ChromeStorageService.saveUserData(initialData);
      console.log('Initial data setup completed');
    } catch (error) {
      console.error('Error setting up initial data:', error);
    }
  }

  private async showNotification(options: chrome.notifications.NotificationOptions & { priority?: number }) {
    try {
      const notificationId = `eyezen-${Date.now()}`;
      
      // Set default options
      const notificationOptions: chrome.notifications.NotificationOptions = {
        type: 'basic',
        iconUrl: 'assets/icons/icon-48.svg',
        title: 'EyeZen',
        message: '',
        priority: 0,
        ...options
      };
      
      // Create notification with required properties only
      const createOptions = {
        type: 'basic' as const,
        iconUrl: notificationOptions.iconUrl || 'assets/icons/icon-48.svg',
        title: notificationOptions.title || 'EyeZen',
        message: notificationOptions.message || ''
      };
      
      // Add optional properties if they exist
      if (notificationOptions.buttons) {
        (createOptions as any).buttons = notificationOptions.buttons;
      }
      
      await chrome.notifications.create(notificationId, createOptions);
      
      // Auto-clear notification after 10 seconds for low priority
      if ((options.priority || 0) === 0) {
        setTimeout(() => {
          chrome.notifications.clear(notificationId);
        }, 10000);
      }
      
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
}

// Initialize the background service
const backgroundService = new BackgroundService();
backgroundService.initialize();

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('eyezen-')) {
    // Open popup or options page
    chrome.action.openPopup();
    chrome.notifications.clear(notificationId);
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId.startsWith('eyezen-')) {
    if (buttonIndex === 0) {
      // Start Break button
      backgroundService.initialize().then(() => {
        chrome.runtime.sendMessage({ action: 'START_BREAK', breakType: BreakType.SHORT });
      });
    } else if (buttonIndex === 1) {
      // Snooze button
      backgroundService.initialize().then(() => {
        chrome.runtime.sendMessage({ action: 'SNOOZE_REMINDER', minutes: 5 });
      });
    }
    chrome.notifications.clear(notificationId);
  }
});

export default backgroundService;