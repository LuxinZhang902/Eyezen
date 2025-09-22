export interface ChromeStorageData {
    userSettings: import('./index').UserSettings;
    eyeMetrics: import('./index').EyeMetrics[];
    breakSessions: import('./index').BreakSession[];
    userEvents: import('./index').UserEvent[];
    eyeScore: import('./index').EyeScore;
    lastSync: number;
}
export interface ChromeExtensionMessage {
    type: ChromeMessageType;
    data?: any;
    timestamp: number;
    sender?: 'popup' | 'options' | 'background' | 'content' | 'worker';
}
export declare enum ChromeMessageType {
    START_DETECTION = "start_detection",
    STOP_DETECTION = "stop_detection",
    DETECTION_STATUS = "detection_status",
    METRICS_UPDATE = "metrics_update",
    START_BREAK = "start_break",
    COMPLETE_BREAK = "complete_break",
    SKIP_BREAK = "skip_break",
    BREAK_REMINDER = "break_reminder",
    UPDATE_SETTINGS = "update_settings",
    GET_SETTINGS = "get_settings",
    GET_USER_DATA = "get_user_data",
    EXPORT_DATA = "export_data",
    ERASE_DATA = "erase_data",
    SHOW_NOTIFICATION = "show_notification",
    CLEAR_NOTIFICATION = "clear_notification",
    REQUEST_CAMERA = "request_camera",
    CAMERA_STATUS = "camera_status",
    DOWNLOAD_FRAME = "download_frame",
    GENERATE_SCRIPT = "generate_script",
    GENERATE_SUMMARY = "generate_summary",
    TRANSLATE_TEXT = "translate_text"
}
export interface EyeZenAlarm {
    name: string;
    type: 'reminder' | 'break' | 'cleanup';
    delayInMinutes?: number;
    periodInMinutes?: number;
    when?: number;
}
export interface EyeZenNotification {
    type: chrome.notifications.TemplateType;
    iconUrl: string;
    title: string;
    message: string;
    priority?: number;
    buttons?: chrome.notifications.ButtonOptions[];
    requireInteraction?: boolean;
}
export interface EyeZenContextMenu {
    id: string;
    title: string;
    contexts: chrome.contextMenus.ContextType[];
    onclick?: (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => void;
}
export interface BadgeConfig {
    text: string;
    color: string;
    title?: string;
}
export type EyeZenPermission = 'storage' | 'alarms' | 'notifications' | 'activeTab' | 'camera' | 'microphone';
export declare class ChromeStorageUtil {
    static get<K extends keyof ChromeStorageData>(key: K): Promise<ChromeStorageData[K] | undefined>;
    static set<K extends keyof ChromeStorageData>(key: K, value: ChromeStorageData[K]): Promise<void>;
    static remove(key: keyof ChromeStorageData): Promise<void>;
    static clear(): Promise<void>;
    static getAll(): Promise<Partial<ChromeStorageData>>;
}
export declare class ChromeMessageUtil {
    static sendMessage(message: ChromeExtensionMessage): Promise<any>;
    static addMessageListener(callback: (message: ChromeExtensionMessage, sender: chrome.runtime.MessageSender) => void): void;
}
export declare class ChromeAlarmUtil {
    static create(alarm: EyeZenAlarm): Promise<void>;
    static clear(name: string): Promise<boolean>;
    static clearAll(): Promise<boolean>;
    static get(name: string): Promise<chrome.alarms.Alarm | undefined>;
    static getAll(): Promise<chrome.alarms.Alarm[]>;
    static addAlarmListener(callback: (alarm: chrome.alarms.Alarm) => void): void;
}
export declare class ChromeNotificationUtil {
    static create(id: string, options: EyeZenNotification): Promise<string>;
    static clear(id: string): Promise<boolean>;
    static addClickListener(callback: (notificationId: string) => void): void;
    static addButtonClickListener(callback: (notificationId: string, buttonIndex: number) => void): void;
}
export declare class ChromeBadgeUtil {
    static setText(text: string): Promise<void>;
    static setColor(color: string): Promise<void>;
    static setTitle(title: string): Promise<void>;
    static setBadge(config: BadgeConfig): Promise<void>;
}
export declare class ChromePermissionUtil {
    static request(permissions: EyeZenPermission[]): Promise<boolean>;
    static check(permissions: EyeZenPermission[]): Promise<boolean>;
    static remove(permissions: EyeZenPermission[]): Promise<boolean>;
}
