// Chrome Extension API type extensions and utilities

// Extended Chrome storage types
export interface ChromeStorageData {
  userSettings: import('./index').UserSettings;
  eyeMetrics: import('./index').EyeMetrics[];
  breakSessions: import('./index').BreakSession[];
  userEvents: import('./index').UserEvent[];
  eyeScore: import('./index').EyeScore;
  lastSync: number;
}

// Chrome message types for extension communication
export interface ChromeExtensionMessage {
  type: ChromeMessageType;
  data?: any;
  timestamp: number;
  sender?: 'popup' | 'options' | 'background' | 'content' | 'worker';
}

export enum ChromeMessageType {
  // Detection related
  START_DETECTION = 'start_detection',
  STOP_DETECTION = 'stop_detection',
  DETECTION_STATUS = 'detection_status',
  METRICS_UPDATE = 'metrics_update',
  
  // Break related
  START_BREAK = 'start_break',
  COMPLETE_BREAK = 'complete_break',
  SKIP_BREAK = 'skip_break',
  BREAK_REMINDER = 'break_reminder',
  
  // Settings
  UPDATE_SETTINGS = 'update_settings',
  GET_SETTINGS = 'get_settings',
  
  // Data management
  GET_USER_DATA = 'get_user_data',
  EXPORT_DATA = 'export_data',
  ERASE_DATA = 'erase_data',
  
  // Notifications
  SHOW_NOTIFICATION = 'show_notification',
  CLEAR_NOTIFICATION = 'clear_notification',
  
  // Camera and permissions
  REQUEST_CAMERA = 'request_camera',
  CAMERA_STATUS = 'camera_status',
  
  // API calls
  GENERATE_SCRIPT = 'generate_script',
  GENERATE_SUMMARY = 'generate_summary',
  TRANSLATE_TEXT = 'translate_text'
}

// Chrome alarm configurations
export interface EyeZenAlarm {
  name: string;
  type: 'reminder' | 'break' | 'cleanup';
  delayInMinutes?: number;
  periodInMinutes?: number;
  when?: number;
}

// Chrome notification options
export interface EyeZenNotification {
  type: chrome.notifications.TemplateType;
  iconUrl: string;
  title: string;
  message: string;
  priority?: number;
  buttons?: chrome.notifications.ButtonOptions[];
  requireInteraction?: boolean;
}

// Chrome context menu items
export interface EyeZenContextMenu {
  id: string;
  title: string;
  contexts: chrome.contextMenus.ContextType[];
  onclick?: (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => void;
}

// Chrome badge configurations
export interface BadgeConfig {
  text: string;
  color: string;
  title?: string;
}

// Permission types
export type EyeZenPermission = 
  | 'storage'
  | 'alarms'
  | 'notifications'
  | 'activeTab'
  | 'camera'
  | 'microphone';

// Chrome storage utilities
export class ChromeStorageUtil {
  static async get<K extends keyof ChromeStorageData>(
    key: K
  ): Promise<ChromeStorageData[K] | undefined> {
    const result = await chrome.storage.local.get(key);
    return result[key];
  }

  static async set<K extends keyof ChromeStorageData>(
    key: K,
    value: ChromeStorageData[K]
  ): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }

  static async remove(key: keyof ChromeStorageData): Promise<void> {
    await chrome.storage.local.remove(key);
  }

  static async clear(): Promise<void> {
    await chrome.storage.local.clear();
  }

  static async getAll(): Promise<Partial<ChromeStorageData>> {
    return await chrome.storage.local.get();
  }
}

// Chrome message utilities
export class ChromeMessageUtil {
  static async sendMessage(
    message: ChromeExtensionMessage
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  static addMessageListener(
    callback: (message: ChromeExtensionMessage, sender: chrome.runtime.MessageSender) => void
  ): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      callback(message, sender);
      return true; // Keep message channel open for async responses
    });
  }
}

// Chrome alarm utilities
export class ChromeAlarmUtil {
  static async create(alarm: EyeZenAlarm): Promise<void> {
    const alarmInfo: chrome.alarms.AlarmCreateInfo = {
      delayInMinutes: alarm.delayInMinutes,
      periodInMinutes: alarm.periodInMinutes,
      when: alarm.when
    };
    
    await chrome.alarms.create(alarm.name, alarmInfo);
  }

  static async clear(name: string): Promise<boolean> {
    return await chrome.alarms.clear(name);
  }

  static async clearAll(): Promise<boolean> {
    return await chrome.alarms.clearAll();
  }

  static async get(name: string): Promise<chrome.alarms.Alarm | undefined> {
    return await chrome.alarms.get(name);
  }

  static async getAll(): Promise<chrome.alarms.Alarm[]> {
    return await chrome.alarms.getAll();
  }

  static addAlarmListener(
    callback: (alarm: chrome.alarms.Alarm) => void
  ): void {
    chrome.alarms.onAlarm.addListener(callback);
  }
}

// Chrome notification utilities
export class ChromeNotificationUtil {
  static async create(
    id: string,
    options: EyeZenNotification
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.notifications.create(id, options, (notificationId) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(notificationId);
        }
      });
    });
  }

  static async clear(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.notifications.clear(id, (wasCleared) => {
        resolve(wasCleared);
      });
    });
  }

  static addClickListener(
    callback: (notificationId: string) => void
  ): void {
    chrome.notifications.onClicked.addListener(callback);
  }

  static addButtonClickListener(
    callback: (notificationId: string, buttonIndex: number) => void
  ): void {
    chrome.notifications.onButtonClicked.addListener(callback);
  }
}

// Chrome badge utilities
export class ChromeBadgeUtil {
  static async setText(text: string): Promise<void> {
    await chrome.action.setBadgeText({ text });
  }

  static async setColor(color: string): Promise<void> {
    await chrome.action.setBadgeBackgroundColor({ color });
  }

  static async setTitle(title: string): Promise<void> {
    await chrome.action.setTitle({ title });
  }

  static async setBadge(config: BadgeConfig): Promise<void> {
    await Promise.all([
      this.setText(config.text),
      this.setColor(config.color),
      config.title ? this.setTitle(config.title) : Promise.resolve()
    ]);
  }
}

// Chrome permission utilities
export class ChromePermissionUtil {
  static async request(permissions: EyeZenPermission[]): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.permissions.request(
        { permissions },
        (granted) => resolve(granted)
      );
    });
  }

  static async check(permissions: EyeZenPermission[]): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.permissions.contains(
        { permissions },
        (hasPermissions) => resolve(hasPermissions)
      );
    });
  }

  static async remove(permissions: EyeZenPermission[]): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.permissions.remove(
        { permissions },
        (removed) => resolve(removed)
      );
    });
  }
}