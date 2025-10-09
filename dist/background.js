// EyeZen Service Worker - Background Script
console.log("📄 EyeZen Service Worker: Script loaded at", new Date().toLocaleString());

// Chrome AI Service Class
class ChromeAIService {
    constructor() {
        this.session = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (!('LanguageModel' in window)) {
            console.warn("Chrome AI Prompt API not available");
            throw new Error('Chrome AI is not available. Please ensure you are using Chrome 127+ with the following flags enabled:\n\n1. chrome://flags/#optimization-guide-on-device-model → "Enabled BypassPerfRequirement"\n2. chrome://flags/#prompt-api-for-gemini-nano → "Enabled"\n\nThen restart Chrome completely.');
        }

        const availability = await window.LanguageModel.availability();
        console.log("Chrome AI model availability:", availability);

        if (availability === "no") {
            console.warn("Chrome AI model not available on this device");
            throw new Error("Chrome AI is not available on this device. This may be due to:\n\n• Hardware requirements not met (need 22GB+ free space, 4GB+ VRAM)\n• Operating system not supported (requires macOS 13+ or Windows 10+)\n• Chrome flags not properly enabled\n\nPlease check the requirements and try again.");
        }

        if (availability === "after-download") {
            console.log("Chrome AI model needs to be downloaded. Starting download...");
            this.session = await window.languageModel.create({
                topK: 3,
                temperature: 0.3,
                monitor(m) {
                    m.addEventListener("downloadprogress", (e) => {
                        const progress = Math.round(e.loaded * 100);
                        console.log(`Chrome AI model download progress: ${progress}%`);
                    });
                }
            });
        } else if (availability === "available") {
            this.session = await window.LanguageModel.create({
                topK: 3,
                temperature: 0.3
            });
        } else {
            console.warn("Unknown Chrome AI availability status:", availability);
            throw new Error(`Chrome AI availability status is unknown: ${availability}`);
        }

        this.isInitialized = true;
        console.log("Chrome AI service initialized successfully");
    }

    async destroy() {
        if (this.session) {
            try {
                await this.session.destroy();
            } catch (error) {
                console.warn("Error destroying Chrome AI session:", error);
            }
            this.session = null;
        }
        this.isInitialized = false;
    }
}

// Background Service Class
class BackgroundService {
    constructor() {
        console.log("🔧 TESTING: BackgroundService constructor called!");
        this.isInitialized = false;
        this.activeBreakTabId = null;
        this.chromeAI = null;
    }

    async initialize() {
        if (this.isInitialized) {
            console.log("⚠️ Service already initialized, skipping...");
            return;
        }

        try {
            console.log("🚀 Initializing EyeZen Service at:", new Date().toLocaleString());
            console.log("🔍 Service worker context:", {
                isServiceWorker: typeof self !== 'undefined' && 'importScripts' in self,
                hasChrome: typeof chrome !== 'undefined',
                hasAlarms: chrome?.alarms !== undefined,
                hasNotifications: chrome?.notifications !== undefined
            });

            // Initialize Chrome AI
            console.log("🤖 Initializing Chrome AI service...");
            this.chromeAI = new ChromeAIService();
            console.log("✅ Chrome AI service initialized");

            // Setup alarm listener
            console.log("🔧 Setting up alarm listener...");
            chrome.alarms.onAlarm.addListener((alarm) => {
                console.log("🚨 ALARM FIRED:", {
                    name: alarm.name,
                    scheduledTime: new Date(alarm.scheduledTime).toLocaleString(),
                    actualTime: new Date().toLocaleString(),
                    delay: Date.now() - alarm.scheduledTime,
                    periodInMinutes: alarm.periodInMinutes
                });
                
                chrome.alarms.getAll().then(alarms => {
                    console.log("📋 All alarms when fired:", alarms.map(a => ({
                        name: a.name,
                        scheduledTime: new Date(a.scheduledTime).toLocaleString(),
                        periodInMinutes: a.periodInMinutes
                    })));
                });
                
                this.handleAlarm(alarm);
            });
            console.log("✅ Alarm listener registered");

            // Setup message listener
            console.log("📬 Setting up message listener...");
            chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
            console.log("✅ Message listener registered successfully");

            // Setup other event listeners
            chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
            chrome.runtime.onStartup.addListener(this.handleStartup.bind(this));
            chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));

            // Setup default alarms
            await this.setupDefaultAlarms();

            this.isInitialized = true;
            console.log("✅ EyeZen Background Service initialized successfully");

        } catch (error) {
            console.error("❌ Failed to initialize background service:", error);
            throw error;
        }
    }

    async handleAlarm(alarm) {
        console.log("🚨 Alarm triggered:", {
            name: alarm.name,
            scheduledTime: new Date(alarm.scheduledTime).toLocaleString(),
            currentTime: new Date().toLocaleString(),
            periodInMinutes: alarm.periodInMinutes
        });

        try {
            switch (alarm.name) {
                case "break-reminder":
                    console.log("👁️ Processing break reminder alarm");
                    await this.handleBreakReminder();
                    break;
                case "posture-check":
                    console.log("🏃 Processing posture check alarm");
                    await this.handlePostureCheck();
                    break;
                case "daily-summary":
                    console.log("📊 Processing daily summary alarm");
                    await this.handleDailySummary();
                    break;
                default:
                    console.log("❓ Unknown alarm triggered:", alarm.name);
            }
            console.log("✅ Alarm handling completed for:", alarm.name);
        } catch (error) {
            console.error("❌ Error handling alarm:", alarm.name, error);
        }
    }

    async handleMessage(message, sender, sendResponse) {
        const messageId = `${message.type}-${Date.now()}`;
        console.log(`📨 Service Worker received message ${messageId}:`, {
            type: message.type || message.action,
            timestamp: new Date().toLocaleString(),
            sender: sender.tab ? `Tab ${sender.tab.id}` : "Extension",
            isInitialized: this.isInitialized
        });

        try {
            if (message.type === "HEALTH_CHECK") {
                console.log("🏥 [SW] HEALTH_CHECK message received");
                sendResponse({
                    success: true,
                    initialized: this.isInitialized,
                    timestamp: Date.now(),
                    message: "Service worker is healthy"
                });
                return false;
            }

            if (message.type === "PING") {
                console.log("🏓 Service Worker: Received PING, checking readiness...");
                if (!this.isInitialized) {
                    try {
                        console.log("🔄 Service Worker: Not initialized, initializing now...");
                        await this.initialize();
                        console.log("✅ Service Worker: Initialization completed during PING");
                    } catch (error) {
                        console.error("❌ Service Worker: Failed to initialize during PING:", error);
                        sendResponse({
                            success: false,
                            error: "Failed to initialize service worker",
                            details: error instanceof Error ? error.message : "Unknown error"
                        });
                        return false;
                    }
                }
                
                sendResponse({
                    success: true,
                    initialized: this.isInitialized,
                    timestamp: Date.now(),
                    message: "Service worker is ready"
                });
                return false;
            }

            console.log("❓ Unknown message type:", message.type || message.action);
            sendResponse({ success: false, error: "Unknown message type" });
            return false;

        } catch (error) {
            console.error("❌ Error handling message:", error);
            sendResponse({
                success: false,
                error: "Message handling failed",
                details: error instanceof Error ? error.message : "Unknown error"
            });
            return false;
        }
    }

    async handleInstall(details) {
        console.log("🔧 Extension installed/updated:", details);
        await this.setupInitialData();
    }

    async handleStartup() {
        console.log("🚀 Extension startup");
        await this.setupDefaultAlarms();
    }

    async handleTabRemoved(tabId) {
        if (this.activeBreakTabId === tabId) {
            console.log("🗂️ Break tab closed:", tabId);
            this.activeBreakTabId = null;
        }
    }

    async setupDefaultAlarms() {
        try {
            console.log("⏰ Setting up default alarms...");
            
            const BREAK_INTERVAL = 0.5; // 30 seconds for testing
            const POSTURE_INTERVAL = 30; // 30 minutes
            const DAILY_INTERVAL = 1440; // 24 hours

            // Clear existing alarms
            await chrome.alarms.clear("break-reminder");
            await chrome.alarms.create("break-reminder", {
                delayInMinutes: BREAK_INTERVAL,
                periodInMinutes: BREAK_INTERVAL
            });
            console.log(`✅ Break reminder alarm set for every ${BREAK_INTERVAL} minutes`);

            await chrome.alarms.clear("posture-check");
            await chrome.alarms.create("posture-check", {
                delayInMinutes: POSTURE_INTERVAL,
                periodInMinutes: POSTURE_INTERVAL
            });
            console.log(`✅ Posture check alarm set for every ${POSTURE_INTERVAL} minutes`);

            await chrome.alarms.clear("daily-summary");
            await chrome.alarms.create("daily-summary", {
                delayInMinutes: DAILY_INTERVAL,
                periodInMinutes: DAILY_INTERVAL
            });
            console.log(`✅ Daily summary alarm set for every ${DAILY_INTERVAL} minutes`);

            const alarms = await chrome.alarms.getAll();
            console.log("📋 All active alarms after setup:", alarms.map(alarm => ({
                name: alarm.name,
                scheduledTime: new Date(alarm.scheduledTime).toLocaleString(),
                periodInMinutes: alarm.periodInMinutes
            })));

        } catch (error) {
            console.error("❌ Failed to setup default alarms:", error);
        }
    }

    async handleBreakReminder() {
        try {
            console.log('👁️ Break reminder triggered at:', new Date().toLocaleString());
            console.log('🔍 Handling break reminder - fetching user data...');
            
            // Get user data from storage
            const userData = await chrome.storage.local.get(['eyezen_user_data']);
            const userDataObj = userData.eyezen_user_data || {
                settings: { reminderEnabled: true, reminderInterval: 20 },
                breaks: [],
                metrics: []
            };
            
            console.log('📋 User data retrieved:', {
                hasUserData: !!userDataObj,
                reminderEnabled: userDataObj?.settings?.reminderEnabled,
                breaksCount: userDataObj?.breaks?.length || 0,
                metricsCount: userDataObj?.metrics?.length || 0
            });
            
            if (!userDataObj || !userDataObj.settings.reminderEnabled) {
                console.log('❌ Break reminder skipped - no user data or reminders disabled');
                return;
            }
            
            // Check if user is currently in a break
            const activeBreak = userDataObj.breaks.find(b => !b.completed);
            if (activeBreak) {
                console.log('⏸️ User is already in a break, skipping reminder:', activeBreak.id);
                return;
            }
            
            console.log('✅ Proceeding with break reminder notification...');
            
            // Check recent activity to determine reminder urgency
            const recentMetrics = userDataObj.metrics.slice(-5);
            const avgEyeStrain = recentMetrics.length > 0 
                ? recentMetrics.reduce((sum, m) => sum + (m.fatigueIndex || 0), 0) / recentMetrics.length 
                : 0.3;
            
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
                            posture: 'GOOD',
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
                contextMessage: `Next reminder in ${userDataObj.settings.reminderInterval} minutes`,
                requireInteraction: priority >= 1,
                buttons: [
                    { title: '🧘 Start Break', iconUrl: 'assets/icons/icon-16.png' },
                    { title: '⏰ Snooze 5min', iconUrl: 'assets/icons/icon-16.png' }
                ]
            });
            
            console.log('✅ Break reminder notification sent successfully at:', new Date().toLocaleString());
            
        } catch (error) {
            console.error('❌ Error in break reminder:', error);
            console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        }
    }

    async handlePostureCheck() {
        console.log("🏃 Posture check triggered");
    }

    async handleDailySummary() {
        console.log("📊 Daily summary triggered");
    }

    async setupInitialData() {
        console.log("📊 Setting up initial data");
    }

    async showNotification(options) {
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
            const notificationOptions = {
                type: 'basic',
                iconUrl: 'assets/icons/icon-48.png',
                title: 'EyeZen',
                message: '',
                priority: 0,
                ...options
            };
            
            console.log('📋 Final notification options:', notificationOptions);
            
            // Create the notification
            await chrome.notifications.create(notificationId, notificationOptions);
            console.log('✅ Notification created successfully with ID:', notificationId);
            
            return notificationId;
            
        } catch (error) {
            console.error('❌ Error creating notification:', error);
            console.error('❌ Notification error details:', error instanceof Error ? error.stack : 'No stack trace');
            throw error;
        }
    }
}

// Initialize the service
console.log("🚀 EyeZen Service Worker: Starting initialization...");
console.log("🔍 TESTING: BackgroundService instantiation about to happen");

const backgroundService = new BackgroundService();

// Initialize the service in an async IIFE
(async () => {
    try {
        await backgroundService.initialize();
        console.log("✅ EyeZen Service Worker: Initialization completed");
    } catch (error) {
        console.error("❌ EyeZen Service Worker: Initialization failed:", error);
    }
})();

// Notification event listeners
chrome.notifications.onClicked.addListener((notificationId) => {
    console.log("🔔 Notification clicked:", {
        notificationId: notificationId,
        timestamp: new Date().toLocaleString()
    });
    
    if (notificationId.startsWith("eyezen-")) {
        chrome.action.openPopup();
        console.log("✅ Popup opened from notification click");
        chrome.notifications.clear(notificationId);
        console.log("✅ Notification cleared after click");
    }
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
    console.log("🔘 Notification button clicked:", {
        notificationId: notificationId,
        buttonIndex: buttonIndex,
        timestamp: new Date().toLocaleString()
    });
    
    if (notificationId.startsWith("eyezen-")) {
        if (buttonIndex === 0) {
            console.log("▶️ Starting break session from notification");
            await backgroundService.initialize();
            chrome.runtime.sendMessage({ action: "START_BREAK", breakType: "SHORT" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log("⚠️ Error sending START_BREAK message:", chrome.runtime.lastError.message);
                }
            });
            console.log("✅ Break session started");
        } else if (buttonIndex === 1) {
            console.log("😴 Snoozing reminder from notification");
            await backgroundService.initialize();
            chrome.runtime.sendMessage({ action: "SNOOZE_REMINDER", minutes: 5 }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log("⚠️ Error sending SNOOZE_REMINDER message:", chrome.runtime.lastError.message);
                }
            });
            console.log("✅ Reminder snoozed for 5 minutes");
        } else {
            console.warn("❓ Unknown button index:", buttonIndex);
        }
        
        chrome.notifications.clear(notificationId);
        console.log("✅ Notification cleared after button click");
    }
});
