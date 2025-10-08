// Service Worker Log-Based Testing Script
// Copy and paste this code into your service worker console to test functionality

// Test 1: Basic Service Worker Status
console.log('🚀 Starting Service Worker Log Tests...');
console.log('Extension ID:', chrome.runtime.id);
console.log('Manifest:', chrome.runtime.getManifest().name);

// Test 2: Check Active Alarms
chrome.alarms.getAll().then(alarms => {
    console.log('📅 Active Alarms:', alarms.length);
    alarms.forEach(alarm => {
        console.log(`  - ${alarm.name}: ${new Date(alarm.scheduledTime).toLocaleString()}`);
    });
    if (alarms.length === 0) {
        console.warn('⚠️ No active alarms found - reminder system may not be working');
    }
});

// Test 3: Check Storage Contents
chrome.storage.local.get(null).then(data => {
    console.log('💾 Storage Contents:', Object.keys(data));
    if (data.settings) {
        console.log('  - Settings:', data.settings);
    }
    if (Object.keys(data).length === 0) {
        console.warn('⚠️ Storage is empty - settings may not be saved');
    }
});

// Test 4: Test Message Handling
console.log('📨 Testing message handlers...');

// Simulate a POPUP_TEST message
const testMessage = {
    type: 'POPUP_TEST',
    data: { test: true, timestamp: Date.now() }
};

// Check if message listeners are registered
if (chrome.runtime.onMessage.hasListeners()) {
    console.log('✅ Message listeners are registered');
    
    // Send a test message to ourselves
    chrome.runtime.sendMessage(testMessage, (response) => {
        if (chrome.runtime.lastError) {
            console.error('❌ Message test failed:', chrome.runtime.lastError.message);
        } else {
            console.log('✅ Message test successful:', response);
        }
    });
} else {
    console.warn('⚠️ No message listeners registered');
}

// Test 5: Test Settings Update
const testSettings = {
    reminderEnabled: true,
    reminderInterval: 0.5, // 30 seconds for testing
    notifications: true
};

console.log('⚙️ Testing settings update...');
chrome.runtime.sendMessage({
    type: 'SETTINGS_UPDATED',
    data: { settings: testSettings }
}, (response) => {
    if (chrome.runtime.lastError) {
        console.error('❌ Settings update failed:', chrome.runtime.lastError.message);
    } else {
        console.log('✅ Settings update successful:', response);
        
        // Check if alarm was created/updated
        setTimeout(() => {
            chrome.alarms.getAll().then(alarms => {
                const reminderAlarm = alarms.find(a => a.name === 'eyeHealthReminder');
                if (reminderAlarm) {
                    console.log('✅ Reminder alarm updated:', {
                        name: reminderAlarm.name,
                        nextTrigger: new Date(reminderAlarm.scheduledTime).toLocaleString(),
                        interval: reminderAlarm.periodInMinutes
                    });
                } else {
                    console.warn('⚠️ Reminder alarm not found after settings update');
                }
            });
        }, 1000);
    }
});

// Test 6: Force Alarm Creation (if needed)
setTimeout(() => {
    console.log('🔔 Creating test alarm...');
    chrome.alarms.create('testAlarm', {
        delayInMinutes: 0.1, // 6 seconds
        periodInMinutes: 0.2  // 12 seconds
    });
    
    console.log('✅ Test alarm created - should trigger in 6 seconds');
}, 2000);

// Test 7: Monitor Alarm Events
let alarmEventCount = 0;
const originalAlarmHandler = chrome.alarms.onAlarm.hasListeners();

if (originalAlarmHandler) {
    console.log('✅ Alarm event listeners are registered');
} else {
    console.warn('⚠️ No alarm event listeners registered');
}

// Add a temporary alarm listener for testing
const testAlarmListener = (alarm) => {
    alarmEventCount++;
    console.log(`🔔 Alarm triggered #${alarmEventCount}:`, {
        name: alarm.name,
        scheduledTime: new Date(alarm.scheduledTime).toLocaleString()
    });
    
    if (alarm.name === 'testAlarm' && alarmEventCount >= 2) {
        // Remove test alarm after 2 triggers
        chrome.alarms.clear('testAlarm');
        chrome.alarms.onAlarm.removeListener(testAlarmListener);
        console.log('🧹 Test alarm cleaned up');
    }
};

chrome.alarms.onAlarm.addListener(testAlarmListener);

console.log('🎯 Log test setup complete! Watch for results above.');
console.log('📋 Expected results:');
console.log('  - Extension info should be displayed');
console.log('  - Active alarms should be listed');
console.log('  - Storage contents should be shown');
console.log('  - Message handlers should respond');
console.log('  - Settings update should work');
console.log('  - Test alarm should trigger in 6 seconds');
console.log('');
console.log('🔍 If any tests fail, the service worker has issues that need fixing.');