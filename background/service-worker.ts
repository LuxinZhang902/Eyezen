/**
 * Background Service Worker
 * Handles alarms, notifications, and background tasks for EyeZen
 */

console.log('📄 EyeZen Service Worker: Script loaded at', new Date().toLocaleString());

import { ChromeStorageService } from '../core/storage/index';
import { ChromeAIService } from '../core/ai/chromeAI';
import { BreakType, UserStatus, BreakSession, UserData, EyeScore, UserSettings, DEFAULT_SETTINGS, PostureStatus } from '../types/index';

// Constants
const ALARM_NAMES = {
  BREAK_REMINDER: 'break-reminder',
  DAILY_SUMMARY: 'daily-summary',
  WEEKLY_SUMMARY: 'weekly-summary',
  POSTURE_CHECK: 'posture-check'
} as const;

const DEFAULT_INTERVALS = {
  BREAK_REMINDER: 0.5, // 30 seconds (minimum allowed in Chrome 120+) <mcreference link="https://developer.chrome.com/docs/extensions/reference/api/alarms" index="1">1</mcreference>
  POSTURE_CHECK: 30,  // 30 minutes for posture reminders
  DAILY_SUMMARY: 24 * 60, // Daily at end of day
  WEEKLY_SUMMARY: 7 * 24 * 60 // Weekly summary
} as const;

class BackgroundService {
  private isInitialized = false;
  private activeBreakTabId: number | null = null;
  private chromeAI!: ChromeAIService; // Initialized in initialize()

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize services
      this.chromeAI = new ChromeAIService();
      // Set up alarm listeners
      console.log('🔧 Setting up alarm listener...');
      chrome.alarms.onAlarm.addListener(this.handleAlarm.bind(this));
      console.log('✅ Alarm listener registered');
      
      // Test if alarm listener is working by creating a test alarm
      console.log('🧪 Creating test alarm to verify listener...');
      try {
        await chrome.alarms.create('test-listener', { delayInMinutes: 0.5 }); // 30 seconds (minimum allowed)
        console.log('✅ Test alarm created successfully');
      } catch (error) {
        console.error('❌ Failed to create test alarm:', error);
      }
      
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
    console.log('🚨 Alarm triggered:', {
      name: alarm.name,
      scheduledTime: new Date(alarm.scheduledTime).toLocaleString(),
      currentTime: new Date().toLocaleString()
    });
    
    try {
      switch (alarm.name) {
        case 'test-listener':
          console.log('🧪 TEST ALARM TRIGGERED! Alarm listener is working correctly!');
          break;
        case ALARM_NAMES.BREAK_REMINDER:
          console.log('👁️ Processing break reminder alarm');
          await this.handleBreakReminder();
          break;
        case ALARM_NAMES.POSTURE_CHECK:
          console.log('🏃 Processing posture check alarm');
          await this.handlePostureCheck();
          break;
        case ALARM_NAMES.DAILY_SUMMARY:
          console.log('📊 Processing daily summary alarm');
          await this.handleDailySummary();
          break;
        case ALARM_NAMES.WEEKLY_SUMMARY:
          console.log('📈 Processing weekly summary alarm');
          await this.handleWeeklySummary();
          break;
        default:
          console.log('❓ Unknown alarm:', alarm.name);
      }
      console.log('✅ Alarm handled successfully:', alarm.name);
    } catch (error) {
      console.error('❌ Error handling alarm:', alarm.name, error);
    }
  }

  private async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<boolean> {
    // Only log non-camera messages to reduce console noise
    if (message.type !== 'REQUEST_CAMERA' && message.type !== 'STOP_CAMERA' && message.type !== 'GET_CAMERA_STATE') {
      console.log('🔄 Service Worker received message:', message.type || message.action, 'from:', sender.tab?.url || 'extension');
    }
    
    try {
      // Handle camera-related messages by forwarding to offscreen document
      if (message.type === 'REQUEST_CAMERA' || message.type === 'STOP_CAMERA' || message.type === 'GET_CAMERA_STATE') {
        // Reduced logging for frequent camera messages
        this.forwardToOffscreenDocument(message, sendResponse);
        return true; // Keep message port open for async response
      }
      
      // Handle test message from popup
      if (message.type === 'POPUP_TEST') {
        console.log('🧪 Service Worker: Received test message from popup:', message.data);
        sendResponse({ success: true, message: 'Test message received by service worker' });
        return false;
      }
      
      // Handle EYE_METRICS messages from offscreen document - forward to popup and dashboard
      if (message.type === 'EYE_METRICS') {
        const timestamp = new Date().toISOString();
        console.log(`👁️ [${timestamp}] Service Worker: Received EYE_METRICS from offscreen:`, message.data);
        console.log(`📤 [${timestamp}] Service Worker: Forwarding eye metrics to popup and dashboard`);
        
        // Store the metrics in chrome.storage for popup to access
        try {
          await chrome.storage.local.set({
            'latest_eye_metrics': {
              data: message.data,
              timestamp: Date.now()
            }
          });
          console.log(`💾 [${timestamp}] Service Worker: Stored eye metrics in storage`);
        } catch (error) {
          console.log(`❌ [${timestamp}] Service Worker: Error storing metrics:`, error);
        }
        
        // Try to forward to extension contexts
        chrome.runtime.sendMessage(message).catch((error) => {
          console.log(`⚠️ [${timestamp}] Service Worker: Error forwarding to popup (expected if popup closed):`, error);
        });
        
        // Also forward to any open dashboard tabs
        this.forwardToDashboardTabs(message);
        
        sendResponse({ success: true });
        return false;
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
          
        case 'SETUP_ALARMS':
          console.log('🔧 Service Worker: Setting up alarms (debug)');
          await this.setupDefaultAlarms();
          sendResponse({ success: true });
          break;
          
        case 'TEST_NOTIFICATION':
          console.log('🔔 Service Worker: Sending test notification');
          await this.showNotification({
            type: 'basic',
            iconUrl: 'assets/icons/icon-48.svg',
            title: '🧪 Test Notification',
            message: 'This is a test notification from EyeZen debug system.',
            priority: 1,
            buttons: [
              { title: 'Test Button 1' },
              { title: 'Test Button 2' }
            ]
          });
          sendResponse({ success: true });
          break;
          
        case 'GET_USER_DATA':
          console.log('💾 Service Worker: Getting user data (debug)');
          const userData = await ChromeStorageService.getUserData();
          sendResponse({ success: true, data: userData });
          break;
          
        case 'INITIALIZE_USER_DATA':
          console.log('🔧 Service Worker: Initializing user data (debug)');
          await this.setupInitialData();
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
      
      console.log('🔧 Setting up alarms with user data:', {
        hasUserData: !!userData,
        reminderEnabled: settings.reminderEnabled,
        reminderInterval: settings.reminderInterval,
        defaultInterval: DEFAULT_INTERVALS.BREAK_REMINDER
      });
      
      // Clear existing alarms
      await chrome.alarms.clearAll();
      console.log('🧹 Cleared all existing alarms');
      
      // Set up break reminder alarm
      if (settings.reminderEnabled ?? true) {
        // Use user's reminderInterval setting directly, fallback to testing interval
        let interval = settings.reminderInterval || DEFAULT_INTERVALS.BREAK_REMINDER;
        
        // Ensure minimum interval of 0.5 minutes (30 seconds) for Chrome compatibility
        if (interval < 0.5) {
          console.warn('⚠️ Alarm interval too small, adjusting to minimum 0.5 minutes');
          interval = 0.5;
        }
        
        console.log('⏰ Setting up break reminder alarm:', {
          userInterval: settings.reminderInterval,
          defaultInterval: DEFAULT_INTERVALS.BREAK_REMINDER,
          finalInterval: interval,
          minAllowed: 0.5
        });
        
        try {
          await chrome.alarms.create(ALARM_NAMES.BREAK_REMINDER, {
            delayInMinutes: interval,
            periodInMinutes: interval
          });
          console.log(`✅ Created break reminder alarm with ${interval} minute interval (user setting: ${settings.reminderInterval}, testing default: ${DEFAULT_INTERVALS.BREAK_REMINDER})`);
        } catch (error) {
          console.error('❌ Failed to create break reminder alarm:', error);
        }
      } else {
        console.log('❌ Break reminder disabled in settings');
      }
      
      // Set up posture check alarm
      if (settings.reminderEnabled ?? true) {
        await chrome.alarms.create(ALARM_NAMES.POSTURE_CHECK, {
          delayInMinutes: DEFAULT_INTERVALS.POSTURE_CHECK,
          periodInMinutes: DEFAULT_INTERVALS.POSTURE_CHECK
        });
        console.log(`🏃 Created posture check alarm with ${DEFAULT_INTERVALS.POSTURE_CHECK} minute interval`);
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
      console.log(`📊 Created daily summary alarm for ${dailySummaryTime.toLocaleString()}`);
      
      // Verify alarms were created
      const allAlarms = await chrome.alarms.getAll();
      console.log('✅ All active alarms:', allAlarms.map(a => ({ name: a.name, scheduledTime: new Date(a.scheduledTime).toLocaleString() })));
      
      console.log('🎯 Default alarms set up successfully');
    } catch (error) {
      console.error('❌ Failed to setup default alarms:', error);
    }
  }

  private async handleBreakReminder() {
    try {
      console.log('🔍 Handling break reminder - fetching user data...');
      const userData = await ChromeStorageService.getUserData();
      
      console.log('📋 User data retrieved:', {
        hasUserData: !!userData,
        reminderEnabled: userData?.settings?.reminderEnabled,
        breaksCount: userData?.breaks?.length || 0,
        metricsCount: userData?.metrics?.length || 0
      });
      
      if (!userData || !userData.settings.reminderEnabled) {
        console.log('❌ Break reminder skipped - no user data or reminders disabled');
        return;
      }
      
      // Check if user is currently in a break
      const activeBreak = userData.breaks.find(b => !b.completed);
      if (activeBreak) {
        console.log('⏸️ User is already in a break, skipping reminder:', activeBreak.id);
        return;
      }
      
      console.log('✅ Proceeding with break reminder notification...');
      
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
      } else {
        // Generate AI-powered rest suggestion
        try {
          const aiSuggestion = await this.chromeAI.generateHealthSuggestion(
            avgEyeStrain * 100, // Convert to percentage
            avgEyeStrain * 100, // Use same value for fatigue score
            {
               blinkRate: 15,
               fatigueIndex: avgEyeStrain,
               posture: PostureStatus.GOOD,
               earValue: 0.25,
               perclosValue: 0.2,
               timestamp: Date.now()
             }
          );
          
          title = `🤖 AI Rest Suggestion (${aiSuggestion.category})`;
          message = aiSuggestion.message;
          priority = 1;
        } catch (error) {
          console.error('Failed to generate AI suggestion:', error);
          // Fallback to default message
          title = '⏰ Break Time Reminder';
          message = 'Time for your scheduled eye break! Follow the 20-20-20 rule: Look at something 20 feet away for 20 seconds.';
          priority = 1;
        }
      }
      
      console.log('🔔 Creating notification:', { title, message, priority });
      
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
      
      console.log('✅ Break reminder notification sent successfully');
      
      // Note: Cat animation removed - now using AI suggestions only
      
    } catch (error) {
      console.error('❌ Error in break reminder:', error);
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
    console.log('🔍 Checking for existing offscreen document...');
    const existingContexts = await chrome.runtime.getContexts({});
    console.log('📋 All existing contexts:', existingContexts);
    
    const offscreenDocument = existingContexts.find(
      (context) => context.contextType === 'OFFSCREEN_DOCUMENT'
    );
    
    if (!offscreenDocument) {
      console.log('📄 No offscreen document found, creating new one...');
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: [chrome.offscreen.Reason.USER_MEDIA],
        justification: 'Camera access for eye health monitoring'
      });
      console.log('✅ Offscreen document created successfully');
    } else {
      console.log('✅ Offscreen document already exists:', offscreenDocument);
    }
  }

  private async forwardToOffscreenDocument(message: any, sendResponse: (response?: any) => void): Promise<void> {
    console.log('🚀 forwardToOffscreenDocument called with message:', message);
    
    try {
      console.log('📄 Ensuring offscreen document exists...');
      await this.ensureOffscreenDocument();
      console.log('✅ Offscreen document ensured');
      
      // Wait a bit for offscreen document to be ready
      console.log('⏳ Waiting 500ms for offscreen document to be ready...');
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ Wait completed, sending message to offscreen document');
      
      // Send message directly to offscreen document
      console.log('📤 Sending message to offscreen document:', message);
      chrome.runtime.sendMessage(message, (response) => {
        console.log('📥 Received response from offscreen document:', response);
        console.log('🔍 Chrome runtime last error:', chrome.runtime.lastError);
        
        if (chrome.runtime.lastError) {
          console.error('❌ Error communicating with offscreen document:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('✅ Forwarding response back to popup:', response);
          sendResponse(response);
        }
      });
      
    } catch (error) {
      console.error('❌ Error in forwardToOffscreenDocument:', error);
      sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async forwardToDashboardTabs(message: any): Promise<void> {
    try {
      // Query for tabs that contain the dashboard page
      const tabs = await chrome.tabs.query({ url: '*://*/eye-posture-dashboard.html' });
      
      // Also check for file:// URLs (local development)
      const localTabs = await chrome.tabs.query({ url: 'file://*/eye-posture-dashboard.html' });
      
      const allDashboardTabs = [...tabs, ...localTabs];
      
      // Send message to each dashboard tab
      for (const tab of allDashboardTabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {
            // Ignore errors if tab is not ready or doesn't have content script
          });
        }
      }
      
      if (allDashboardTabs.length > 0) {
        console.log(`📊 Forwarded metrics to ${allDashboardTabs.length} dashboard tab(s)`);
      }
    } catch (error) {
      console.error('❌ Failed to forward message to dashboard tabs:', error);
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
      console.log('📢 Creating notification with ID:', notificationId);
      
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
      
      console.log('🔧 Notification options:', createOptions);
      
      await chrome.notifications.create(notificationId, createOptions);
      console.log('✅ Notification created successfully:', notificationId);
      
      // Auto-clear notification after 10 seconds for low priority
      if ((options.priority || 0) === 0) {
        console.log('⏰ Setting auto-clear timer for low priority notification');
        setTimeout(() => {
          chrome.notifications.clear(notificationId);
          console.log('🧹 Auto-cleared notification:', notificationId);
        }, 10000);
      }
      
    } catch (error) {
      console.error('❌ Error showing notification:', error);
    }
  }
}

// Initialize the background service
console.log('🚀 EyeZen Service Worker: Starting initialization...');
const backgroundService = new BackgroundService();
backgroundService.initialize().then(() => {
  console.log('✅ EyeZen Service Worker: Initialization completed');
}).catch((error) => {
  console.error('❌ EyeZen Service Worker: Initialization failed:', error);
});

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