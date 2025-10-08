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
 * Wait for service worker registration and activation
 */
async function waitForServiceWorkerActivation(maxAttempts: number = 10, timeoutMs: number = 30000): Promise<boolean> {
  const startTime = Date.now();
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Check if chrome.runtime is available
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        console.warn(`🔄 Chrome runtime not available (attempt ${attempt})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      // Check for service worker registration
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Wait for service worker to be active
          if (registration.active) {
            console.log(`✅ Service worker is active (attempt ${attempt})`);
            return true;
          } else if (registration.installing || registration.waiting) {
            console.log(`🔄 Service worker is installing/waiting (attempt ${attempt})`);
            // Wait for state change
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
      }

      // Fallback: just check if chrome.runtime is available
      console.log(`🔄 Service worker registration check (attempt ${attempt})`);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        console.warn(`⏰ Service worker activation timeout after ${timeoutMs}ms`);
        return false;
      }
      
    } catch (error) {
      console.warn(`🔄 Service worker activation check failed (attempt ${attempt}):`, error);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return false;
}

/**
 * Check if service worker is ready by sending a ping
 */
async function ensureServiceWorkerReady(maxAttempts: number = 5): Promise<boolean> {
  // First wait for activation
  const isActivated = await waitForServiceWorkerActivation(3, 10000);
  if (!isActivated) {
    console.warn('⚠️ Service worker activation failed, proceeding with ping check');
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Check if chrome.runtime is available
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        console.warn(`🔄 Chrome runtime not available (attempt ${attempt})`);
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }

      // Send ping to service worker with shorter timeout
      const response = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Ping timeout'));
        }, 2000); // Reduced timeout

        chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      if (response && response.success && response.initialized) {
        console.log(`✅ Service worker is ready (attempt ${attempt})`);
        return true;
      } else {
        console.warn(`🔄 Service worker responded but not ready (attempt ${attempt}):`, response);
        throw new Error(`Service worker not ready: ${response?.error || 'Not initialized'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`🔄 Service worker not ready (attempt ${attempt}): ${errorMessage}`);
      
      // Shorter delays for faster retry
      const delay = Math.min(500 * attempt, 2000);
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('❌ Service worker failed to become ready after maximum attempts');
  return false;
}

/**
 * Send message to service worker with robust retry logic and fallback mechanisms
 */
export async function sendMessageSafely(message: ServiceWorkerMessage, maxRetries: number = 3): Promise<ServiceWorkerResponse> {
  // First, try to ensure service worker is available
  const isServiceWorkerAvailable = await checkServiceWorkerAvailability();
  if (!isServiceWorkerAvailable) {
    console.warn('⚠️ Service worker not available, attempting restart...');
    await attemptServiceWorkerRestart();
    // Wait a moment for restart
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🚀 Attempting to send ${message.type} message (attempt ${attempt}/${maxRetries})`);
      
      // Add timestamp to message for tracking
      const messageWithTimestamp = {
        ...message,
        timestamp: Date.now(),
        attempt: attempt
      };

      // Send message with extended timeout and immediate processing
      const response = await new Promise<ServiceWorkerResponse>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Message timeout - service worker may have terminated'));
        }, 8000); // Extended timeout for better reliability

        // Send message immediately without separate readiness check
        chrome.runtime.sendMessage(messageWithTimestamp, (response) => {
          clearTimeout(timeout);
          
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError.message || 'Unknown runtime error';
            console.warn(`💥 Chrome runtime error (attempt ${attempt}): ${error}`);
            
            // Handle specific Chrome errors
            if (error.includes('Receiving end does not exist')) {
              reject(new Error('Service worker not available - extension may need reload'));
            } else if (error.includes('message port closed')) {
              reject(new Error('Service worker terminated during message processing'));
            } else if (error.includes('Extension context invalidated')) {
              reject(new Error('Extension context invalidated - reload required'));
            } else {
              reject(new Error(error));
            }
          } else if (!response) {
            reject(new Error('No response from service worker'));
          } else {
            resolve(response);
          }
        });
      });

      console.log(`✅ Message sent successfully (attempt ${attempt}):`, response);
      return response;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Failed to send ${message.type} message (attempt ${attempt}): ${errorMessage}`);
      
      if (attempt < maxRetries) {
        // Progressive delay with service worker restart attempt
        const delay = Math.min(2000 * attempt, 5000);
        console.log(`🔄 Retrying in ${delay}ms after attempting service worker restart...`);
        
        // Try to restart service worker if connection failed
        if (errorMessage.includes('not available') || errorMessage.includes('does not exist')) {
          await attemptServiceWorkerRestart();
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  const error = `Failed to send ${message.type} message after ${maxRetries} attempts`;
  console.error(`❌ ${error}`);
  
  // Return fallback response for settings updates
  if (message.type === 'SETTINGS_UPDATED') {
    console.log('🔄 Attempting fallback settings storage...');
    try {
      // Store settings directly in chrome.storage as fallback
      await chrome.storage.local.set({ 
        'user_settings': message.data?.settings,
        'settings_updated_at': Date.now(),
        'fallback_update': true
      });
      console.log('✅ Settings stored via fallback method');
      return { success: true, data: { fallback: true } };
    } catch (fallbackError) {
      console.error('❌ Fallback storage failed:', fallbackError);
    }
  }
  
  return { success: false, error: 'Service worker communication failed after multiple attempts' };
}

/**
 * Check if service worker is available
 */
async function checkServiceWorkerAvailability(): Promise<boolean> {
  try {
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      return false;
    }
    
    // Quick ping to check availability
    const response = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 2000);
      
      chrome.runtime.sendMessage({ type: 'HEALTH_CHECK' }, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || 'Runtime error'));
        } else {
          resolve(response);
        }
      });
    });
    
    return response && response.success;
  } catch (error) {
    console.log('🔍 Service worker availability check failed:', error);
    return false;
  }
}

/**
 * Attempt to restart service worker
 */
async function attemptServiceWorkerRestart(): Promise<void> {
  try {
    console.log('🔄 Attempting to restart service worker...');
    
    // Try to reload the extension if we have the management permission
    if (chrome.management) {
      const extensionInfo = await chrome.management.getSelf();
      if (extensionInfo.id) {
        console.log('🔄 Reloading extension to restart service worker...');
        await chrome.management.setEnabled(extensionInfo.id, false);
        await new Promise(resolve => setTimeout(resolve, 500));
        await chrome.management.setEnabled(extensionInfo.id, true);
        return;
      }
    }
    
    // Fallback: try to wake up service worker with multiple messages
    console.log('🔄 Attempting to wake service worker with multiple signals...');
    const wakeUpPromises = [];
    
    for (let i = 0; i < 3; i++) {
      wakeUpPromises.push(
        new Promise<void>((resolve) => {
          chrome.runtime.sendMessage({ type: 'WAKE_UP', signal: i }, () => {
            // Ignore errors, just trying to wake up
            resolve();
          });
        })
      );
    }
    
    await Promise.all(wakeUpPromises);
    console.log('🔄 Wake-up signals sent');
    
  } catch (error) {
    console.warn('⚠️ Service worker restart attempt failed:', error);
  }
}

/**
 * Send settings update message safely
 */
export async function sendSettingsUpdate(settings: any): Promise<ServiceWorkerResponse> {
  return sendMessageSafely({
    type: 'SETTINGS_UPDATED',
    data: settings
  });
}

/**
 * Send test notification safely
 */
export async function sendTestNotification(title: string, message: string, priority: string = 'normal'): Promise<ServiceWorkerResponse> {
  return sendMessageSafely({
    type: 'TEST_NOTIFICATION',
    data: {
      title,
      message,
      priority
    }
  });
}