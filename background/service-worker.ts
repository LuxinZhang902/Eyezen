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
    if (this.isInitialized) {
      console.log('⚠️ Service already initialized, skipping...');
      return;
    }

    try {
      console.log('🚀 Initializing EyeZen Service at:', new Date().toLocaleString());
      
      // Check if service worker is active
       console.log('🔍 Service worker context:', {
         isServiceWorker: typeof self !== 'undefined' && 'importScripts' in self,
         hasChrome: typeof chrome !== 'undefined',
         hasAlarms: typeof chrome?.alarms !== 'undefined',
         hasNotifications: typeof chrome?.notifications !== 'undefined'
       });
      
      // Initialize services
      console.log('🤖 Initializing Chrome AI service...');
      this.chromeAI = new ChromeAIService();
      console.log('✅ Chrome AI service initialized');
      // Set up alarm listeners
      console.log('🔧 Setting up alarm listener...');
      chrome.alarms.onAlarm.addListener((alarm) => {
        console.log('🚨 ALARM FIRED:', {
          name: alarm.name,
          scheduledTime: new Date(alarm.scheduledTime).toLocaleString(),
          actualTime: new Date().toLocaleString(),
          delay: Date.now() - alarm.scheduledTime,
          periodInMinutes: alarm.periodInMinutes
        });
        
        // Log all active alarms when one fires
        chrome.alarms.getAll().then(allAlarms => {
          console.log('📋 All alarms when fired:', allAlarms.map(a => ({
            name: a.name,
            scheduledTime: new Date(a.scheduledTime).toLocaleString(),
            periodInMinutes: a.periodInMinutes
          })));
        });
        
        this.handleAlarm(alarm);
      });
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
      console.log('📬 Setting up message listener...');
      chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
      console.log('✅ Message listener registered successfully');
      
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
      currentTime: new Date().toLocaleString(),
      periodInMinutes: alarm.periodInMinutes
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
        case 'eyezen_break_reminder':
          console.log('⏰ Processing EyeZen break reminder alarm');
          await this.handleEyeZenBreakReminder();
          break;
        default:
          console.log('❓ Unknown alarm triggered:', alarm.name);
      }
      console.log('✅ Alarm handling completed for:', alarm.name);
    } catch (error) {
      console.error('❌ Error handling alarm:', alarm.name, error);
      console.error('❌ Alarm error details:', error instanceof Error ? error.stack : 'No stack trace');
    }
  }

  private async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<boolean> {
    // Ensure service worker stays active during message processing
    const messageId = `${message.type}-${Date.now()}`;
    console.log(`🔄 Service Worker: Processing message ${messageId}, staying active...`);
    
    // Only log non-camera messages to reduce console noise
    if (message.type !== 'REQUEST_CAMERA' && message.type !== 'STOP_CAMERA' && message.type !== 'GET_CAMERA_STATE') {
      console.log(`📨 Service Worker received message ${messageId}:`, {
        type: message.type || message.action,
        timestamp: new Date().toLocaleString(),
        sender: sender.tab ? `Tab ${sender.tab.id}` : 'Extension',
        data: message.data ? 'Present' : 'None',
        attempt: message.attempt || 'N/A',
        isInitialized: this.isInitialized,
        fullMessage: message
      });
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
      
      // Handle WAKE_UP message to keep service worker active
      if (message.type === 'WAKE_UP') {
        console.log('⏰ Service Worker: Received WAKE_UP message, staying active');
        sendResponse({ success: true, message: 'Service worker is awake' });
        return false;
      }
      
      // Handle HEALTH_CHECK message for availability testing
      if (message.type === 'HEALTH_CHECK') {
        console.log(`🏥 [SW] HEALTH_CHECK message received`);
        sendResponse({ 
          success: true, 
          initialized: this.isInitialized,
          timestamp: Date.now(),
          message: 'Service worker is healthy' 
        });
        return false;
      }
      
      // Handle PING message for service worker readiness check
      if (message.type === 'PING') {
        console.log('🏓 Service Worker: Received PING, checking readiness...');
        
        // Ensure we're fully initialized before responding
        if (!this.isInitialized) {
          console.log('⚠️ Service Worker: Not initialized, initializing now...');
          try {
            await this.initialize();
            console.log('✅ Service Worker: Initialization completed for PING');
          } catch (error) {
            console.error('❌ Service Worker: Initialization failed for PING:', error);
            sendResponse({ success: false, error: 'Initialization failed', initialized: false });
            return false;
          }
        }
        
        // Only respond with success if truly initialized
        if (this.isInitialized) {
          console.log('🏓 Service Worker: Responding with PONG - fully ready');
          sendResponse({ success: true, message: 'PONG', initialized: true });
        } else {
          console.warn('⚠️ Service Worker: Still not initialized after attempt');
          sendResponse({ success: false, error: 'Not ready', initialized: false });
        }
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
      
      // Handle SETTINGS_UPDATED message type from options page
      if (message.type === 'SETTINGS_UPDATED') {
        console.log('⚙️ Service Worker: Processing SETTINGS_UPDATED message:', message.data?.settings);
        
        // Ensure we're initialized before processing settings
        if (!this.isInitialized) {
          console.log('⚠️ Service Worker: Not initialized, initializing now...');
          await this.initialize();
        }
        
        try {
          if (message.data?.settings) {
            await this.updateSettings(message.data.settings);
            console.log('✅ Service Worker: Settings updated successfully from SETTINGS_UPDATED message');
            sendResponse({ success: true });
          } else {
            console.warn('⚠️ Service Worker: SETTINGS_UPDATED message missing settings data');
            sendResponse({ success: false, error: 'Missing settings data' });
          }
        } catch (error) {
          console.error('❌ Service Worker: Error processing SETTINGS_UPDATED:', error);
          sendResponse({ success: false, error: String(error) });
        }
        return false; // Synchronous response
      }
      
      // Handle regular service worker actions
      switch (message.action) {
        case 'START_BREAK':
          console.log('🛑 Service Worker: Processing START_BREAK request:', message.breakType);
          await this.startBreak(message.breakType);
          console.log('✅ Service Worker: Break started successfully');
          sendResponse({ success: true });
          break;
          
        case 'END_BREAK':
          console.log('✅ Service Worker: Processing END_BREAK request:', message.breakId);
          await this.endBreak(message.breakId);
          console.log('✅ Service Worker: Break ended successfully');
          sendResponse({ success: true });
          break;
          
        case 'UPDATE_SETTINGS':
          console.log('⚙️ Service Worker: Processing UPDATE_SETTINGS request:', message.settings);
          await this.updateSettings(message.settings);
          console.log('✅ Service Worker: Settings updated successfully, alarms may have been recreated');
          sendResponse({ success: true });
          break;
          
        case 'GET_STATUS':
          console.log('📊 Service Worker: Processing GET_STATUS request');
          const status = await this.getStatus();
          console.log('✅ Service Worker: Status retrieved successfully');
          sendResponse({ success: true, data: status });
          break;
          
        case 'SNOOZE_REMINDER':
          console.log('😴 Service Worker: Processing SNOOZE_REMINDER request for', message.minutes || 5, 'minutes');
          await this.snoozeReminder(message.minutes || 5);
          console.log('✅ Service Worker: Reminder snoozed successfully');
          sendResponse({ success: true });
          break;
          
        case 'SETUP_ALARMS':
          console.log('🔧 Service Worker: Processing SETUP_ALARMS request (debug)');
          await this.setupDefaultAlarms();
          console.log('✅ Service Worker: Alarms setup completed');
          sendResponse({ success: true });
          break;
          
        case 'TEST_NOTIFICATION':
          console.log('🔔 Service Worker: Processing TEST_NOTIFICATION request');
          await this.showNotification({
            type: 'basic',
            iconUrl: 'assets/icons/icon-48.png',
            title: '🧪 Test Notification',
            message: 'This is a test notification from EyeZen debug system.',
            priority: 1,
            buttons: [
              { title: 'Test Button 1' },
              { title: 'Test Button 2' }
            ]
          });
          console.log('✅ Service Worker: Test notification sent successfully');
          sendResponse({ success: true });
          break;
          
        case 'GET_USER_DATA':
          console.log('💾 Service Worker: Processing GET_USER_DATA request (debug)');
          const userData = await ChromeStorageService.getUserData();
          console.log('✅ Service Worker: User data retrieved successfully');
          sendResponse({ success: true, data: userData });
          break;
          
        case 'INITIALIZE_USER_DATA':
          console.log('🔧 Service Worker: Processing INITIALIZE_USER_DATA request (debug)');
          await this.setupInitialData();
          console.log('✅ Service Worker: User data initialized successfully');
          sendResponse({ success: true });
          break;
          
        default:
          console.warn('❓ Service Worker: Unknown action received:', message.action || message.type);
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('❌ Service Worker: Error handling message:', {
        messageType: message.action || message.type,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        timestamp: new Date().toLocaleString()
      });
      sendResponse({ success: false, error: String(error) });
    }
    
    return false; // Close message channel after synchronous response
  }

  private async handleInstall(details: chrome.runtime.InstalledDetails) {
    console.log('📦 Extension installed/updated:', {
      reason: details.reason,
      timestamp: new Date().toLocaleString(),
      previousVersion: details.previousVersion
    });
    
    if (details.reason === 'install') {
      console.log('🎉 EyeZen installed for the first time');
      console.log('🔧 Setting up initial data...');
      await this.setupInitialData();
      console.log('✅ Initial data setup completed');
      
      // Show welcome notification
      console.log('🔔 Showing welcome notification...');
      await this.showNotification({
        type: 'basic',
        iconUrl: 'assets/icons/icon-48.png',
        title: 'Welcome to EyeZen! 👁️',
        message: 'Your AI eye health companion is ready. Click to get started!'
      });
      console.log('✅ Welcome notification sent');
    } else if (details.reason === 'update') {
      console.log('🔄 EyeZen updated to version:', chrome.runtime.getManifest().version);
    }
  }

  private async handleStartup() {
    console.log('🚀 EyeZen service worker started at:', new Date().toLocaleString());
    console.log('🔧 Setting up alarms on startup...');
    await this.setupDefaultAlarms();
    console.log('✅ Startup alarm setup completed');
  }

  private async handleTabRemoved(tabId: number) {
    if (this.activeBreakTabId === tabId) {
      this.activeBreakTabId = null;
      console.log('Break tab closed');
    }
  }

  private async setupDefaultAlarms() {
    try {
      console.log('⏰ Setting up default alarms at:', new Date().toLocaleString());
      
      const userData = await ChromeStorageService.getUserData();
      console.log('📊 User data retrieved for alarm setup:', userData ? 'Found' : 'Not found');
      
      const settings: UserSettings = userData?.settings || DEFAULT_SETTINGS;
      console.log('⚙️ Alarm settings:', {
        reminderEnabled: settings.reminderEnabled,
        reminderInterval: settings.reminderInterval,
        notifications: settings.notifications,
        defaultInterval: DEFAULT_INTERVALS.BREAK_REMINDER
      });
      
      // Clear existing alarms
      const clearedCount = await chrome.alarms.clearAll();
      console.log('🧹 Cleared existing alarms, count:', clearedCount);
      
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
          minAllowed: 0.5,
          nextTrigger: new Date(Date.now() + interval * 60000).toLocaleString()
        });
        
        try {
          await chrome.alarms.create(ALARM_NAMES.BREAK_REMINDER, {
            delayInMinutes: interval,
            periodInMinutes: interval
          });
          console.log(`✅ Created break reminder alarm with ${interval} minute interval (user setting: ${settings.reminderInterval}, testing default: ${DEFAULT_INTERVALS.BREAK_REMINDER})`);
          
          // Verify alarm was created
          const createdAlarm = await chrome.alarms.get(ALARM_NAMES.BREAK_REMINDER);
          if (createdAlarm) {
            console.log('✅ Break reminder alarm confirmed:', {
              name: createdAlarm.name,
              scheduledTime: new Date(createdAlarm.scheduledTime).toLocaleString(),
              periodInMinutes: createdAlarm.periodInMinutes
            });
          } else {
            console.error('❌ Break reminder alarm not found after creation');
          }
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
      console.log('📋 All active alarms after setup:', allAlarms.map(a => ({
        name: a.name,
        scheduledTime: new Date(a.scheduledTime).toLocaleString(),
        periodInMinutes: a.periodInMinutes
      })));
      
      console.log('🎯 Default alarms set up successfully');
    } catch (error) {
      console.error('❌ Failed to setup default alarms:', error);
      console.error('❌ Alarm setup error details:', error instanceof Error ? error.stack : 'No stack trace');
    }
  }

  private async handleBreakReminder() {
    try {
      console.log('👁️ Break reminder triggered at:', new Date().toLocaleString());
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
      
      console.log('🔔 Preparing notification:', {
        title,
        message,
        priority,
        timestamp: new Date().toLocaleString()
      });
      
      await this.showNotification({
        type: 'basic',
        iconUrl: 'assets/icons/icon-48.png',
        title,
        message,
        priority,
        contextMessage: `Next reminder in ${userData.settings.reminderInterval} minutes`,
        requireInteraction: priority >= 1,
        buttons: [
          { title: '🧘 Start Break', iconUrl: 'assets/icons/icon-16.png' },
          { title: '⏰ Snooze 5min', iconUrl: 'assets/icons/icon-16.png' }
        ]
      });
      
      console.log('✅ Break reminder notification sent successfully at:', new Date().toLocaleString());
      
      // Note: Cat animation removed - now using AI suggestions only
      
    } catch (error) {
      console.error('❌ Error in break reminder:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
        iconUrl: 'assets/icons/icon-48.png',
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
        iconUrl: 'assets/icons/icon-48.png',
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
        iconUrl: 'assets/icons/icon-48.png',
        title: '📈 Weekly Eye Health Report',
        message: 'Your weekly eye health report is ready! Click to view insights.',
        priority: 1
      });
    } catch (error) {
      console.error('Error in weekly summary:', error);
    }
  }

  private async handleEyeZenBreakReminder() {
    try {
      console.log('⏰ EyeZen break reminder triggered');
      
      // Check if reminder is still active
      const result = await chrome.storage.local.get(['eyezen_reminder']);
      if (!result.eyezen_reminder || !result.eyezen_reminder.isActive) {
        console.log('⏰ Reminder is no longer active, skipping notification');
        return;
      }

      // Show break reminder notification with action buttons
      await this.showNotification({
        type: 'basic',
        iconUrl: 'assets/icons/icon-48.png',
        title: '👁️ Time for an Eye Break!',
        message: `It's been ${result.eyezen_reminder.interval} minutes. Take a moment to rest your eyes.`,
        buttons: [
          { title: 'Take Break Now' },
          { title: 'Snooze 5 min' }
        ],
        priority: 2
      });

      console.log('✅ Break reminder notification shown');
    } catch (error) {
      console.error('❌ Error in EyeZen break reminder:', error);
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
      console.log(`😴 Snoozing reminder for ${minutes} minutes at:`, new Date().toLocaleString());
      
      // Clear current break reminder
      const cleared = await chrome.alarms.clear(ALARM_NAMES.BREAK_REMINDER);
      console.log('🧹 Existing alarm cleared:', cleared);
      
      // Set new alarm for snooze duration
      await chrome.alarms.create(ALARM_NAMES.BREAK_REMINDER, {
        delayInMinutes: minutes
      });
      
      console.log(`✅ Reminder snoozed for ${minutes} minutes, will trigger at:`, new Date(Date.now() + minutes * 60000).toLocaleString());
      
      // Verify alarm was created
      const alarm = await chrome.alarms.get(ALARM_NAMES.BREAK_REMINDER);
      if (alarm) {
        console.log('✅ Snooze alarm confirmed:', {
          name: alarm.name,
          scheduledTime: new Date(alarm.scheduledTime).toLocaleString()
        });
      } else {
        console.warn('⚠️ Snooze alarm not found after creation');
      }
    } catch (error) {
      console.error('❌ Error snoozing reminder:', error);
      console.error('❌ Snooze error details:', error instanceof Error ? error.stack : 'No stack trace');
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
      console.log('🔔 showNotification called with options:', {
        type: options.type,
        iconUrl: options.iconUrl,
        title: options.title,
        message: options.message,
        priority: options.priority,
        buttonsCount: options.buttons?.length || 0,
        timestamp: new Date().toLocaleString()
      });
      
      // Check if notifications API is available
      if (!chrome.notifications) {
        console.error('❌ chrome.notifications API not available');
        throw new Error('Notifications API not available');
      }
      
      // Check notification permissions using chrome.permissions API
       try {
         const hasPermission = await chrome.permissions.contains({
           permissions: ['notifications']
         });
         console.log('🔐 Notification permission granted:', hasPermission);
         
         if (!hasPermission) {
           console.error('❌ Notification permission not granted');
           throw new Error('Notification permission not granted');
         }
       } catch (permError) {
         console.warn('⚠️ Could not check notification permissions:', permError);
         // Continue anyway as permissions might be granted by default
       }
      
      const notificationId = `eyezen-${Date.now()}`;
      console.log('📢 Creating notification with ID:', notificationId);
      
      // Enhanced notification options with richer content
      const notificationOptions: chrome.notifications.NotificationOptions = {
        type: 'basic',
        iconUrl: 'assets/icons/icon-48.png',
        title: 'EyeZen',
        message: '',
        priority: 0,
        ...options
      };
      
      // Create notification with required properties only
      const createOptions = {
        type: 'basic' as const,
        iconUrl: notificationOptions.iconUrl || 'assets/icons/icon-48.png',
        title: notificationOptions.title || 'EyeZen',
        message: notificationOptions.message || ''
      };
      
      // Add optional properties if they exist
      if (notificationOptions.buttons) {
        (createOptions as any).buttons = notificationOptions.buttons;
      }
      
      if (notificationOptions.priority !== undefined) {
        (createOptions as any).priority = notificationOptions.priority;
      }
      
      if (notificationOptions.requireInteraction) {
        (createOptions as any).requireInteraction = notificationOptions.requireInteraction;
      }
      
      if (notificationOptions.contextMessage) {
        (createOptions as any).contextMessage = notificationOptions.contextMessage;
      }
      
      console.log('🔧 Final notification options:', createOptions);
      
      await chrome.notifications.create(notificationId, createOptions);
      console.log('✅ Notification created successfully:', notificationId);
      
      // Verify notification was created by setting up a listener
       const verificationTimeout = setTimeout(() => {
         console.log('✅ Notification creation timeout completed for:', notificationId);
       }, 1000);
       
       // Clear timeout if notification events are received
       const clearVerification = () => {
         clearTimeout(verificationTimeout);
       };
       
       // Listen for notification events to confirm creation
       chrome.notifications.onClicked.addListener(clearVerification);
       chrome.notifications.onClosed.addListener(clearVerification);
      
      // Auto-clear notification based on priority and interaction requirement
      if ((options.priority || 0) === 0 && !notificationOptions.requireInteraction) {
        console.log('⏰ Setting auto-clear timer for low priority notification');
        setTimeout(() => {
          chrome.notifications.clear(notificationId);
          console.log('🧹 Auto-cleared notification:', notificationId);
        }, 8000); // Reduced to 8 seconds for better UX
      }
      
      return notificationId;
      
    } catch (error) {
      console.error('❌ Error showing notification:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw error;
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
  console.log('🔔 Notification clicked:', {
    notificationId,
    timestamp: new Date().toLocaleString()
  });
  
  if (notificationId.startsWith('eyezen-')) {
    try {
      // Open popup or options page
      chrome.action.openPopup();
      console.log('✅ Popup opened from notification click');
      
      chrome.notifications.clear(notificationId);
      console.log('✅ Notification cleared after click');
    } catch (error) {
      console.error('❌ Error handling notification click:', error);
    }
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  console.log('🔘 Notification button clicked:', {
    notificationId,
    buttonIndex,
    timestamp: new Date().toLocaleString()
  });
  
  if (notificationId.startsWith('eyezen-')) {
    try {
      if (buttonIndex === 0) {
        // Start Break button
        console.log('▶️ Starting break session from notification');
        await backgroundService.initialize();
        chrome.runtime.sendMessage({ action: 'START_BREAK', breakType: BreakType.SHORT });
        console.log('✅ Break session started');
      } else if (buttonIndex === 1) {
        // Snooze button
        console.log('😴 Snoozing reminder from notification');
        await backgroundService.initialize();
        chrome.runtime.sendMessage({ action: 'SNOOZE_REMINDER', minutes: 5 });
        console.log('✅ Reminder snoozed for 5 minutes');
      } else {
        console.warn('❓ Unknown button index:', buttonIndex);
      }
      
      chrome.notifications.clear(notificationId);
      console.log('✅ Notification cleared after button click');
    } catch (error) {
      console.error('❌ Error handling notification button click:', error);
      console.error('❌ Button click error details:', error instanceof Error ? error.stack : 'No stack trace');
    }
  }
});

export default backgroundService;