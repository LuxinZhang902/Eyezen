# 🔧 Service Worker Debug Guide for EyeZen Extension

## Where to Find Service Worker Logs

Chrome extension service worker logs **DO NOT** appear in the regular webpage console. Here's where to find them:

### Method 1: Extension Management Page (Recommended)
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Find "EyeZen - AI Eye Health Monitor" extension
4. Click **"service worker"** link (appears when service worker is active)
5. This opens DevTools specifically for the service worker
6. Check the **Console** tab for all `console.log` statements

### Method 2: Chrome DevTools Extension Panel
1. Right-click on the EyeZen extension icon in toolbar
2. Select "Inspect popup" (this opens popup DevTools)
3. In DevTools, go to **Sources** tab
4. Look for "Service Workers" in the left sidebar
5. Click on the service worker to see its console

### Method 3: Background Page Inspection
1. Go to `chrome://extensions/`
2. Enable Developer mode
3. Click "background page" or "service worker" link under EyeZen
4. This opens a dedicated DevTools window for the background script

## Current Service Worker Console Logs

The service worker (`background.js`) contains these key log statements:

```javascript
// Service worker initialization
console.log("📄 EyeZen Service Worker: Script loaded at", new Date().toLocaleString());
console.log("🚀 Initializing EyeZen Service at:", new Date().toLocaleString());

// Alarm handling
console.log("🚨 Alarm triggered:", { name: alarm.name, scheduledTime: alarm.scheduledTime });
console.log("👁️ Processing break reminder alarm");

// Notification system
console.log("🔔 Preparing notification:", { title, message, priority });
console.log("✅ Break reminder notification sent successfully");

// Chrome AI integration
console.log("Chrome AI model availability:", availability);
console.log("✅ Chrome AI service initialized successfully");
```

## Troubleshooting Steps

### If No Logs Appear:
1. **Check if service worker is running:**
   - Go to `chrome://extensions/`
   - Look for "service worker" link under EyeZen
   - If it says "inactive", click it to activate

2. **Reload the extension:**
   - Click the reload button (🔄) on the extension card
   - This restarts the service worker

3. **Check for errors:**
   - Look for red error messages in the service worker console
   - Check if the service worker crashed

### If Service Worker Keeps Going Inactive:
1. **Keep DevTools open:**
   - Open service worker DevTools and keep the window open
   - This prevents Chrome from putting the service worker to sleep

2. **Trigger activity:**
   - Open the extension popup
   - Set a break reminder
   - This should wake up the service worker

## Testing the Current Setup

To verify logs are working:

1. **Open service worker DevTools** (Method 1 above)
2. **Reload the extension** to see initialization logs
3. **Set a break reminder** for 1 minute to test alarm logs
4. **Check for these specific log messages:**
   ```
   📄 EyeZen Service Worker: Script loaded at [timestamp]
   🚀 Initializing EyeZen Service at: [timestamp]
   ✅ EyeZen Background Service initialized successfully
   ```

## Common Issues

### "Service Worker Inactive"
- **Cause:** Chrome puts inactive service workers to sleep
- **Solution:** Open service worker DevTools or trigger extension activity

### "No Console Output"
- **Cause:** Looking in wrong DevTools window
- **Solution:** Use extension-specific DevTools (Method 1)

### "Service Worker Not Found"
- **Cause:** Extension not loaded or crashed
- **Solution:** Reload extension from `chrome://extensions/`

## Quick Debug Commands

Run these in the service worker console to test functionality:

```javascript
// Test alarm creation
chrome.alarms.create('test-alarm', { delayInMinutes: 0.1 });

// Check active alarms
chrome.alarms.getAll().then(console.log);

// Test notification
chrome.notifications.create('test', {
  type: 'basic',
  iconUrl: 'assets/icons/icon-48.png',
  title: 'Test Notification',
  message: 'Service worker is working!'
});
```

---

**Remember:** Service worker logs are separate from webpage logs. Always use the extension-specific DevTools!