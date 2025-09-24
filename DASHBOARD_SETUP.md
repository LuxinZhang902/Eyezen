# 👁️ Eye & Posture Dashboard Setup Guide

## 🚀 Quick Setup

### Step 1: Load the Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked" and select this project folder
4. The EyeZen extension should now appear in your extensions list

### Step 2: Open the Dashboard
1. Open the `eye-posture-dashboard.html` file in Chrome
   - You can drag and drop the file into a Chrome tab
   - Or use File → Open File in Chrome
2. The dashboard will load with a modern interface

### Step 3: Start Monitoring
1. In the dashboard, click the **"Start Monitoring"** button
2. Click on the EyeZen extension icon in Chrome's toolbar
3. Start the eye tracking feature in the extension popup
4. Grant camera permissions when prompted

### Step 4: View Real-time Data
Once both the extension and dashboard are active, you should see:
- ✅ **Connection Status**: "Connected - Monitoring active"
- 📊 **Real-time Metrics**: Fatigue score, blink rate, EAR values, PERCLOS
- 📈 **Live Charts**: Timeline of your eye health metrics
- 🧍 **Posture Status**: Current posture assessment
- ⚠️ **Health Alerts**: Warnings and recommendations

## 📊 Dashboard Features

### Metrics Display
- **Fatigue Score**: Overall eye strain level (0-100)
- **Blink Rate**: Blinks per minute (normal: 10-25)
- **Eye Aspect Ratio (EAR)**: Eye openness measure (0.2-0.4)
- **PERCLOS**: Percentage of eye closure time

### Visual Elements
- **Progress Bars**: Visual representation of metric levels
- **Color-coded Trends**: Green (good), Yellow (moderate), Red (concerning)
- **Real-time Charts**: Historical data visualization
- **Posture Avatar**: Visual posture status indicator

### Health Alerts
- **Critical Fatigue**: Take immediate break
- **High Fatigue**: Consider short break
- **Low Blink Rate**: Remember to blink regularly
- **High Eye Closure**: Drowsiness detected

## 🔧 Troubleshooting

### Dashboard Not Receiving Data
1. **Check Extension Status**: Ensure EyeZen extension is loaded and active
2. **Camera Permissions**: Make sure camera access is granted
3. **Console Logs**: Open DevTools (F12) and check for error messages
4. **Reload Extension**: Try reloading the extension in `chrome://extensions/`

### Connection Issues
- If status shows "Disconnected", try:
  1. Refreshing the dashboard page
  2. Restarting the extension
  3. Checking browser console for errors

### Demo Mode
If the extension isn't available, the dashboard will automatically enter demo mode with simulated data.

## 🎯 Expected Behavior

### Normal Operation
- Dashboard receives updates every 1 minute (matching extension detection interval)
- Metrics should show realistic values:
  - Fatigue Score: 0-100 (lower is better)
  - Blink Rate: 10-25 blinks/minute
  - EAR: 0.2-0.4 (higher = more open eyes)
  - PERCLOS: 0-20% (lower is better)

### Health Monitoring
- Green indicators: Healthy metrics
- Yellow indicators: Moderate concern
- Red indicators: Take action needed

## 📝 Data Management

### Controls
- **Start/Stop Monitoring**: Control data collection
- **Reset Data**: Clear all dashboard data
- **Export**: Save current session data

### Privacy
- All processing happens locally
- No data is sent to external servers
- Camera frames are processed and immediately discarded

## 🔗 Integration

The dashboard integrates with the EyeZen extension through:
1. **Chrome Extension Messaging**: Real-time data transfer
2. **Background Service Worker**: Message routing and forwarding
3. **Offscreen Document**: Camera processing and metrics calculation

---

**Need Help?** Check the browser console (F12) for detailed logs and error messages.