/**
 * Service Worker Communication Utility
 * Provides safe and reliable communication with the Chrome extension service worker
 */
interface ServiceWorkerMessage {
    type: string;
    data?: any;
    timestamp?: number;
}
interface ServiceWorkerResponse {
    success: boolean;
    data?: any;
    error?: string;
}
/**
 * Send message to service worker with robust retry logic and fallback mechanisms
 */
export declare function sendMessageSafely(message: ServiceWorkerMessage, maxRetries?: number): Promise<ServiceWorkerResponse>;
/**
 * Send settings update message safely
 */
export declare function sendSettingsUpdate(settings: any): Promise<ServiceWorkerResponse>;
/**
 * Send test notification safely
 */
export declare function sendTestNotification(title: string, message: string, priority?: string): Promise<ServiceWorkerResponse>;
export {};
