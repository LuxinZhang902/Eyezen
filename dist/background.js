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
        console.log("👁️ Break reminder triggered");
        await this.showNotification({
            type: "basic",
            title: "EyeZen Break Reminder",
            message: "Time for a break! Your eyes need rest to stay healthy.",
            iconUrl: "assets/icons/icon-128.png",
            buttons: [
                { title: "Take Break" },
                { title: "Snooze 5min" }
            ],
            priority: 2
        });
    }

    async handlePostureCheck() {
        console.log("🏃 Posture check triggered");
        await this.showNotification({
            type: "basic",
            title: "EyeZen Posture Check",
            message: "Check your posture! Sit up straight and adjust your screen position.",
            iconUrl: "assets/icons/icon-128.png",
            priority: 1
        });
    }

    async handleDailySummary() {
        console.log("📊 Daily summary triggered");
        await this.showNotification({
            type: "basic",
            title: "EyeZen Daily Summary",
            message: "Your daily eye health report is ready. Click to view your progress.",
            iconUrl: "assets/icons/icon-128.png",
            priority: 0
        });
    }

    /**
     * Show notification using Chrome Extensions Notifications API
     * @param {Object} options - Notification options
     * @param {string} options.type - Notification type ('basic', 'image', 'list', 'progress')
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification message
     * @param {string} [options.iconUrl] - Icon URL
     * @param {Array} [options.buttons] - Array of button objects with title property
     * @param {number} [options.priority] - Priority level (0-2, where 2 is highest)
     * @param {boolean} [options.requireInteraction] - Whether notification requires user interaction
     * @returns {Promise<string>} - Promise that resolves to notification ID
     */
    async showNotification(options) {
        return new Promise(async (resolve, reject) => {
            // Validate required parameters
            if (!options || !options.title || !options.message) {
                const error = new Error("Missing required notification parameters: title and message are required");
                console.error("❌ Notification error:", error.message);
                reject(error);
                return;
            }

            // Check if notifications API is available
            if (!chrome.notifications) {
                const error = new Error("Chrome notifications API is not available");
                console.error("❌ Notification error:", error.message);
                reject(error);
                return;
            }

            // Check notification permission level
            try {
                const permissionLevel = await chrome.notifications.getPermissionLevel();
                console.log("🔐 Notification permission level:", permissionLevel);
                
                if (permissionLevel === "denied") {
                    const error = new Error("Notification permissions are denied. Please enable notifications for this extension in Chrome settings.");
                    console.error("❌ Notification permission denied:", error.message);
                    reject(error);
                    return;
                }
            } catch (permError) {
                console.warn("⚠️ Could not check notification permissions:", permError);
            }

            // Generate unique notification ID
            const notificationId = `eyezen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Prepare notification options according to Chrome Extensions API
            const notificationOptions = {
                type: options.type || "basic",
                iconUrl: options.iconUrl || "assets/icons/icon-128.png",
                title: options.title,
                message: options.message,
                priority: Math.min(Math.max(options.priority || 1, 0), 2), // Clamp between 0-2
                requireInteraction: options.requireInteraction || true // Force interaction to ensure visibility
            };

            // Add buttons if provided (max 2 buttons for basic notifications)
            if (options.buttons && Array.isArray(options.buttons)) {
                notificationOptions.buttons = options.buttons.slice(0, 2).map(button => ({
                    title: button.title || "Action"
                }));
            }

            console.log("🔔 Creating notification:", {
                id: notificationId,
                options: notificationOptions,
                timestamp: new Date().toLocaleString(),
                systemInfo: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform
                }
            });

            // Create notification using Chrome Extensions API
            chrome.notifications.create(notificationId, notificationOptions, (createdId) => {
                if (chrome.runtime.lastError) {
                    const error = new Error(`Failed to create notification: ${chrome.runtime.lastError.message}`);
                    console.error("❌ Notification creation failed:", error.message);
                    console.error("❌ Chrome runtime last error details:", chrome.runtime.lastError);
                    reject(error);
                    return;
                }

                console.log("✅ Notification created successfully:", {
                    id: createdId,
                    timestamp: new Date().toLocaleString()
                });

                // Verify notification was actually created by getting all notifications
                chrome.notifications.getAll((notifications) => {
                    console.log("📋 All active notifications after creation:", notifications);
                    if (notifications[createdId]) {
                        console.log("✅ Notification confirmed in system:", notifications[createdId]);
                    } else {
                        console.warn("⚠️ Notification not found in system after creation");
                    }
                });

                // Auto-clear notification after 15 seconds (increased time)
                if (!notificationOptions.requireInteraction) {
                    setTimeout(() => {
                        chrome.notifications.clear(createdId, (wasCleared) => {
                            if (wasCleared) {
                                console.log("🗑️ Notification auto-cleared:", createdId);
                            } else {
                                console.log("⚠️ Notification could not be cleared:", createdId);
                            }
                        });
                    }, 15000);
                }

                resolve(createdId);
            });
        });
    }

    async setupInitialData() {
        console.log("📊 Setting up initial data");
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
