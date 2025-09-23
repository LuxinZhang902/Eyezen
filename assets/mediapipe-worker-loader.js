// MediaPipe Worker Loader
// This file loads and initializes MediaPipe in a web worker context

let faceLandmarker = null;
let isInitialized = false;

// Initialize MediaPipe
async function initializeMediaPipe() {
  try {
    console.log('Initializing MediaPipe...');
    
    // Import MediaPipe using dynamic import
    let FilesetResolver, FaceLandmarker;
    
    console.log('🔄 Attempting to load MediaPipe modules...');
    
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
    
    console.log('🔍 MediaPipe classes loaded:', { FilesetResolver: !!FilesetResolver, FaceLandmarker: !!FaceLandmarker });
    
    if (!FilesetResolver || !FaceLandmarker) {
      throw new Error('MediaPipe classes not available.');
    }
    
    // Create the vision fileset using local WASM files
    const vision = await FilesetResolver.forVisionTasks(
      './assets/wasm'
    );
    
    // Create FaceLandmarker
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU'
      },
      outputFaceBlendshapes: true,
      runningMode: 'VIDEO',
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    isInitialized = true;
    console.log('MediaPipe initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize MediaPipe:', error);
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
    // Use real MediaPipe detection
    const results = faceLandmarker.detectForVideo(imageData, timestamp);
    
    // Log successful detection
    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
      console.log('👤 Face detected! Received eye metrics:', {
        facesDetected: results.faceLandmarks.length,
        landmarksCount: results.faceLandmarks[0].length
      });
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
}