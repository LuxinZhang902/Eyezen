// MediaPipe Worker Loader - Compatibility wrapper for web workers
// This file provides MediaPipe functionality in web worker context

// Create a minimal MediaPipe implementation that works in workers
const MediaPipeWorkerLoader = {
  async loadVisionTasks() {
    // For now, we'll create mock implementations to avoid CSP issues
    // In a production environment, you would need to bundle MediaPipe properly
    
    const FilesetResolver = {
      async forVisionTasks(wasmPath) {
        console.log('Mock FilesetResolver initialized with path:', wasmPath);
        return {
          wasmPath: wasmPath
        };
      }
    };
    
    const FaceLandmarker = {
      async createFromOptions(vision, options) {
        console.log('Mock FaceLandmarker created with options:', options);
        return {
          detectForVideo(imageData, timestamp) {
            // Mock face detection - returns empty results
            return {
              faceLandmarks: [],
              faceBlendshapes: [],
              facialTransformationMatrixes: []
            };
          },
          close() {
            console.log('Mock FaceLandmarker closed');
          }
        };
      }
    };
    
    // Make classes available globally
    globalThis.FilesetResolver = FilesetResolver;
    globalThis.FaceLandmarker = FaceLandmarker;
    
    return { FilesetResolver, FaceLandmarker };
  }
};

// Export for use in worker
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MediaPipeWorkerLoader;
} else {
  globalThis.MediaPipeWorkerLoader = MediaPipeWorkerLoader;
}