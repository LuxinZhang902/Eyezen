// MediaPipe Worker Loader with Lazy Loading Optimization
// This file loads and initializes MediaPipe in a web worker context with performance optimizations

let faceLandmarker = null;
let isInitialized = false;
let initializationPromise = null;

// Lazy loading cache for MediaPipe modules
let mediaPipeModuleCache = null;

// Initialize MediaPipe with lazy loading
async function initializeMediaPipe() {
  // Return existing initialization promise if already in progress
  if (initializationPromise) {
    return initializationPromise;
  }
  
  initializationPromise = (async () => {
    try {
      console.log('🚀 Initializing MediaPipe with lazy loading...');
      
      // Lazy load MediaPipe modules only when needed
      if (!mediaPipeModuleCache) {
        console.log('📦 Lazy loading MediaPipe modules...');
        mediaPipeModuleCache = await loadMediaPipeModules();
      }
      
      const { FilesetResolver, FaceLandmarker } = mediaPipeModuleCache;
      
      console.log('🔍 MediaPipe classes loaded:', { FilesetResolver: !!FilesetResolver, FaceLandmarker: !!FaceLandmarker });
      
      if (!FilesetResolver || !FaceLandmarker) {
        throw new Error('MediaPipe classes not available.');
      }
      
      // Create the vision fileset using local WASM files with optimized settings
      const vision = await FilesetResolver.forVisionTasks(
        './assets/wasm'
      );
      
      // Create FaceLandmarker with optimized configuration
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: './assets/wasm/face_landmarker.task',
          delegate: 'CPU' // Use CPU for better compatibility and lower memory usage
        },
        outputFaceBlendshapes: false, // Disable to reduce processing overhead
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5, // Increase threshold for better performance
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      isInitialized = true;
      console.log('✅ MediaPipe initialized successfully with optimizations');
      
    } catch (error) {
      console.error('❌ Failed to initialize MediaPipe:', error);
      initializationPromise = null; // Reset promise on failure
      throw error;
    }
  })();
  
  return initializationPromise;
}

// Lazy load MediaPipe modules with caching
async function loadMediaPipeModules() {
  try {
    let FilesetResolver, FaceLandmarker;
    
    if (typeof importScripts !== 'undefined') {
      // We're in a web worker - use the local vision bundle
      console.log('📦 Loading vision bundle from local assets...');
      const mediaPipeModule = await import('./vision_bundle.js');
      console.log('📦 Vision bundle loaded:', Object.keys(mediaPipeModule));
      FilesetResolver = mediaPipeModule.FilesetResolver;
      FaceLandmarker = mediaPipeModule.FaceLandmarker;
    } else {
      // Fallback for main thread
      console.log('📦 Loading from @mediapipe/tasks-vision package...');
      const mediaPipeModule = await import('@mediapipe/tasks-vision');
      FilesetResolver = mediaPipeModule.FilesetResolver;
      FaceLandmarker = mediaPipeModule.FaceLandmarker;
    }
    
    return { FilesetResolver, FaceLandmarker };
  } catch (error) {
    console.error('❌ Failed to load MediaPipe modules:', error);
    throw error;
  }
}

// Face detection function
function detectForVideo(imageData, timestamp) {
  if (!isInitialized || !faceLandmarker) {
    console.log('⚠️ MediaPipe not initialized yet');
    return {
      faceLandmarks: []
    };
  }
  
  try {
    const logTimestamp = new Date().toISOString();
    console.log(`🔍 [${logTimestamp}] Processing frame for face detection:`, {
      imageWidth: imageData.width,
      imageHeight: imageData.height,
      timestamp: timestamp
    });
    
    // Use real MediaPipe detection
    const results = faceLandmarker.detectForVideo(imageData, timestamp);
    
    // Log detection results
    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
      console.log('👤 Face detected! Received eye metrics:', {
        facesDetected: results.faceLandmarks.length,
        landmarksCount: results.faceLandmarks[0].length
      });
    } else {
      console.log(`❌ [${logTimestamp}] No face detected in frame`);
    }
    
    return results;
  } catch (error) {
    console.error('Face detection error:', error);
    return {
      faceLandmarks: []
    };
  }
}

const MediaPipeWorkerLoader = {
  async loadVisionTasks() {
    try {
      console.log('🚀 Loading real MediaPipe Vision Tasks...');
      
      await initializeMediaPipe();
      
      console.log('✅ MediaPipe Vision Tasks loaded successfully');
      return { initializeMediaPipe, detectForVideo };
      
    } catch (error) {
      console.error('❌ Failed to load MediaPipe Vision Tasks:', error);
      throw error;
    }
  }
};

// Export for use in worker
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MediaPipeWorkerLoader;
} else {
  globalThis.MediaPipeWorkerLoader = MediaPipeWorkerLoader;
  // Also expose the detectForVideo function globally for CV worker
  globalThis.detectForVideo = detectForVideo;
  globalThis.initializeMediaPipe = initializeMediaPipe;
}