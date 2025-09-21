// Offscreen document for camera access and CV processing
// This runs in a separate context where getUserMedia works reliably

let cameraStream = null;
let cvWorker = null;
let videoElement = null;
let canvas = null;
let isProcessing = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REQUEST_CAMERA') {
    // Handle async camera request
    (async () => {
      try {
        // Request camera access in offscreen context
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Store stream globally for access from other contexts
        globalThis.eyeZenCameraStream = cameraStream;
        
        // Initialize CV processing pipeline
        console.log('🎥 Camera stream obtained, initializing CV processing...');
        await initializeCVProcessing(cameraStream);
        
        console.log('✅ Camera activated successfully in offscreen document with CV processing');
        
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
        // Stop CV processing
        await stopCVProcessing();
        
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
  
  if (message.type === 'GET_CAMERA_STATE') {
    // Return current camera state
    const isActive = cameraStream !== null && cameraStream.getTracks().some(track => track.readyState === 'live');
    sendResponse({ isActive });
    return true;
  }
});

// Initialize CV processing pipeline
async function initializeCVProcessing(stream) {
  try {
    console.log('🔧 Initializing CV processing pipeline...');
    
    // Create video element to display camera stream
    console.log('📹 Creating video element...');
    videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    videoElement.muted = true;
    videoElement.playsInline = true;
    
    // Create canvas for frame extraction
    console.log('🎨 Creating canvas for frame extraction...');
    canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Wait for video to be ready
    console.log('⏳ Waiting for video metadata...');
    await new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        console.log(`📐 Video dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        resolve();
      };
    });
    
    // Create CV Worker
    console.log('👷 Creating CV worker...');
    cvWorker = new Worker('/cv-worker.js');
    
    // Handle worker messages
    cvWorker.onmessage = (event) => {
      const { type, data } = event.data;
      console.log('📨 Received message from CV worker:', type, data);
      
      switch (type) {
        case 'ready':
          console.log('CV Worker initialized:', data.message);
          startFrameProcessing();
          break;
        case 'metrics':
          console.log('👁️ Eye metrics received:', data);
          // Forward metrics to popup/background
          chrome.runtime.sendMessage({
            type: 'EYE_METRICS',
            data: data
          });
          break;
        case 'error':
          console.error('CV Worker error:', data.error);
          break;
      }
    };
    
    cvWorker.onerror = (error) => {
      console.error('❌ CV Worker error:', error);
    };
    
    // Initialize worker with MediaPipe model
    console.log('🚀 Initializing worker with MediaPipe model...');
    cvWorker.postMessage({
      type: 'init',
      data: { modelPath: '/assets/wasm/face_landmarker.task' }
    });
    
    console.log('✅ CV processing initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize CV processing:', error);
  }
}

// Start processing video frames
function startFrameProcessing() {
  if (!videoElement || !canvas || !cvWorker || isProcessing) {
    console.log('⚠️ Cannot start frame processing - missing components or already processing');
    return;
  }
  
  console.log('🎬 Starting frame processing loop at ~15 FPS...');
  isProcessing = true;
  const ctx = canvas.getContext('2d');
  let frameCount = 0;
  
  function processFrame() {
    if (!isProcessing || !videoElement || videoElement.paused || videoElement.ended) {
      console.log('⏹️ Frame processing stopped');
      return;
    }
    
    try {
      // Draw current video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Get image data from canvas
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      frameCount++;
      if (frameCount % 15 === 0) { // Log every second
        console.log(`🎞️ Processing frame ${frameCount} (${canvas.width}x${canvas.height})`);
      }
      
      // Send frame to CV worker for processing
      cvWorker.postMessage({
        type: 'process',
        data: {
          imageData: imageData,
          timestamp: performance.now()
        }
      });
      
      // Clear canvas immediately for privacy (frame not stored)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
    } catch (error) {
      console.error('❌ Frame processing error:', error);
    }
    
    // Continue processing at ~15 FPS
    setTimeout(processFrame, 67); // ~15 FPS (1000ms / 15 = 67ms)
  }
  
  // Start the processing loop
  processFrame();
}

// Stop CV processing
async function stopCVProcessing() {
  isProcessing = false;
  
  if (cvWorker) {
    cvWorker.postMessage({ type: 'cleanup' });
    cvWorker.terminate();
    cvWorker = null;
  }
  
  if (videoElement) {
    videoElement.srcObject = null;
    videoElement = null;
  }
  
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas = null;
  }
  
  console.log('CV processing stopped and cleaned up');
}

console.log('Offscreen document loaded for camera access and CV processing');