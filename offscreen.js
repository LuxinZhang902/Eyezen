// Offscreen document for camera access
// This runs in a separate context where getUserMedia works reliably

let cameraStream = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REQUEST_CAMERA') {
    // Handle async camera request
    (async () => {
      try {
        // Request camera access in offscreen context
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Store stream globally for access from other contexts
        globalThis.eyeZenCameraStream = cameraStream;
        
        console.log('Camera activated successfully in offscreen document');
        
        // Send success response
        sendResponse({ success: true, message: 'Camera access granted' });
      } catch (error) {
        console.error('Failed to access camera in offscreen document:', error);
        
        // Handle specific permission errors with user-friendly messages
        let errorMessage = error.message;
        if (error.name === 'NotAllowedError' || error.message.includes('Permission denied') || error.message.includes('Permission dismissed')) {
          errorMessage = 'Camera permission was denied. Please allow camera access to use eye health monitoring features.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera to use this feature.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application.';
        }
        
        sendResponse({ success: false, error: errorMessage });
      }
    })();
    return true; // Keep message channel open for async response
  }
  
  if (message.type === 'STOP_CAMERA') {
    // Handle async camera stop request
    (async () => {
      try {
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          cameraStream = null;
          globalThis.eyeZenCameraStream = null;
          console.log('Camera stopped in offscreen document');
        }
        sendResponse({ success: true, message: 'Camera stopped' });
      } catch (error) {
        console.error('Failed to stop camera:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }
});

console.log('Offscreen document loaded for camera access');