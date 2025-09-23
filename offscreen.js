// Offscreen document for camera access and CV processing
// This runs in a separate context where getUserMedia works reliably

let cameraStream = null;
let cvWorker = null;
let videoElement = null;
let canvas = null;
let isProcessing = false;
let frameCount = 0;

console.log('🎬 Offscreen document message listener registered');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle incoming messages without logging every single one
  
  if (message.type === 'DOWNLOAD_FRAME') {
    console.log('📸 Processing DOWNLOAD_FRAME message in offscreen document');
    
    // Handle async download frame request
    (async () => {
      try {
        if (!videoElement || !canvas) {
          sendResponse({ success: false, error: 'Camera not initialized' });
          return;
        }
        
        // Wait for video to be ready if it's not already
        const waitForVideo = async () => {
          return new Promise((resolve, reject) => {
            const checkVideo = () => {
              if (videoElement.readyState >= 2 && videoElement.currentTime > 0) {
                resolve(true);
              } else if (videoElement.readyState >= 2) {
                // Video metadata is loaded, just need to wait for playback
                setTimeout(checkVideo, 100);
              } else {
                // Video not ready, wait a bit more
                setTimeout(checkVideo, 200);
              }
            };
            
            // Start checking immediately
            checkVideo();
            
            // Timeout after 5 seconds
            setTimeout(() => {
              reject(new Error('Video failed to start playing within 5 seconds'));
            }, 5000);
          });
        };
        
        // Wait for video to be ready
        await waitForVideo();
        
        console.log(`📹 Video ready: readyState=${videoElement.readyState}, currentTime=${videoElement.currentTime}, dimensions=${videoElement.videoWidth}x${videoElement.videoHeight}`);
        
        // Capture current frame
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create download URL
          const url = URL.createObjectURL(blob);
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `eyezen-frame-${timestamp}.png`;
          
          // Create download link and trigger download
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // Clean up
          URL.revokeObjectURL(url);
          // Note: Don't clear canvas here to avoid interfering with ongoing CV processing
          
          console.log('📸 Frame downloaded successfully:', filename);
          sendResponse({ success: true, filename: filename });
        } else {
          sendResponse({ success: false, error: 'Failed to create image blob' });
        }
        }, 'image/png');
        
        return true; // Keep sendResponse alive for async operation
      } catch (error) {
        console.error('❌ Failed to download frame:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep message port open for async response
  } else if (message.type === 'REQUEST_CAMERA') {
    console.log('🎥 Processing REQUEST_CAMERA message in offscreen document');
    // Handle async camera request
    (async () => {
      try {
        // Request camera access in offscreen context
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Store stream globally for access from other contexts
        globalThis.eyeZenCameraStream = cameraStream;
        
        // Initialize CV processing pipeline
        // console.log('🎥 Camera stream obtained, initializing CV processing...');
        await initializeCVProcessing(cameraStream);
        
        console.log('✅ Camera activated successfully in offscreen document with CV processing');
        
        // Send success response back using sendResponse
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
        
        // Send error response back using sendResponse
        sendResponse({ success: false, error: errorMessage });
      }
    })();
    return true; // Keep message port open for async response
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
        
        // Send success response back using sendResponse
        sendResponse({ success: true, message: 'Camera stopped' });
      } catch (error) {
        console.error('Failed to stop camera:', error);
        
        // Send error response back using sendResponse
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep message port open for async response
  }
  
  if (message.type === 'GET_CAMERA_STATE') {
    // Return current camera state
    const isActive = cameraStream !== null && cameraStream.getTracks().some(track => track.readyState === 'live');
    
    // Send response back using sendResponse
    sendResponse({ isActive });
    return true; // Keep message port open for response
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
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Wait for video to be ready
    console.log('⏳ Waiting for video metadata...');
    await new Promise((resolve) => {
      videoElement.onloadedmetadata = async () => {
        console.log(`📐 Video dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        // Explicitly start playing the video
        try {
          await videoElement.play();
          console.log('▶️ Video started playing successfully');
        } catch (error) {
          console.warn('⚠️ Video autoplay failed, but this is normal in some contexts:', error);
        }
        
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
          // Tell the worker to start processing
          cvWorker.postMessage({ type: 'start' });
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
  
  console.log('🎬 Starting timer-based frame processing every 2 minutes...');
  isProcessing = true;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let detectionCount = 0;
  
  function processFrame() {
    if (!isProcessing || !videoElement || videoElement.paused || videoElement.ended) {
      console.log('⏹️ Frame processing stopped');
      return;
    }
    
    try {
      // Check if video is actually playing
      if (videoElement.readyState < 2) {
        console.log('⚠️ Video not ready yet, skipping detection');
        setTimeout(processFrame, 120000); // Try again in 2 minutes
        return;
      }
      
      frameCount++;
      if (frameCount % 5 === 0) { // Log every 5 minutes at 1-minute intervals
        console.log(`🔍 Detection active - Frame ${frameCount} processed (1-minute intervals)`);
      }
      
      // Draw current video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Get image data from canvas
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
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
    
    // Schedule next detection for real-time processing (~15 FPS)
    setTimeout(processFrame, 60000); // 1 minute interval
  }
  
  // Start the first detection immediately
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
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas = null;
  }
  
  console.log('CV processing stopped and cleaned up');
}

console.log('Offscreen document loaded for camera access and CV processing');