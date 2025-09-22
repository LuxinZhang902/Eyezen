/**
 * Camera Permission Popup Component
 * Shows when camera access is detected, allows user to approve or reject
 */

import React, { useState, useEffect } from 'react';
import { ChromeStorageService } from '../../core/storage/index';

interface CameraPermissionPopupProps {
  isVisible: boolean;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}

const CameraPermissionPopup: React.FC<CameraPermissionPopupProps> = ({
  isVisible,
  onApprove,
  onReject,
  onClose
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  const handleApprove = async () => {
    try {
      // Create offscreen document if it doesn't exist
      const existingContexts = await chrome.runtime.getContexts({});
      const offscreenDocument = existingContexts.find(
        (context) => context.contextType === 'OFFSCREEN_DOCUMENT'
      );
      
      if (!offscreenDocument) {
        await chrome.offscreen.createDocument({
          url: 'offscreen.html',
          reasons: [chrome.offscreen.Reason.USER_MEDIA],
          justification: 'Camera access for eye health monitoring'
        });
      }
      
      // Request camera access through offscreen document
      const response = await new Promise<{success: boolean; error?: string}>((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'REQUEST_CAMERA' },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (!response) {
              reject(new Error('No response received from offscreen document'));
              return;
            }
            resolve(response);
          }
        );
      });
      
      if (response.success) {
        // Update settings to allow camera access
        await ChromeStorageService.updateSettings({
          cameraEnabled: true,
          metricsOnly: false // Allow full functionality
        });
        
        console.log('Camera activated successfully');
        // Show success message
        alert('🎉 Camera access granted! Full AI-powered eye health monitoring is now active.');
        onApprove();
      } else {
        // Handle camera permission denial gracefully
        console.warn('Camera access denied:', response.error);
        
        // Update settings to metrics-only mode
        await ChromeStorageService.updateSettings({
          cameraEnabled: false,
          metricsOnly: true
        });
        
        // Show user-friendly message with instructions
        const message = `${response.error || 'Camera access was denied.'}

💡 To enable full AI features later:
1. Click the camera icon in Chrome's address bar
2. Select "Always allow" for camera access
3. Reload the extension

For now, you can still use basic timer reminders.`;
        alert(message);
        onApprove(); // Still call onApprove to close the popup
      }
      
      // Don't auto-close the popup - let parent component handle it
    } catch (error) {
      console.error('Failed to approve camera access:', error);
      // Still call onApprove even if camera permission fails
      onApprove();
    }
  };

  const handleReject = async () => {
    try {
      // Update settings to restrict features to alarm-only
      await ChromeStorageService.updateSettings({
        cameraEnabled: false,
        metricsOnly: true // Restrict to basic functionality
      });
      onReject();
      handleClose();
    } catch (error) {
      console.error('Failed to reject camera access:', error);
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-200 ${
          isAnimating ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-white rounded-lg shadow-xl max-w-sm mx-4 transform transition-all duration-200 ${
        isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Camera Permission Required</h3>
              <p className="text-sm opacity-90">EyeZen wants to monitor your eye health</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Camera access needed for AI features</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              EyeZen uses your camera to detect eye fatigue and provide personalized break recommendations. 
              <strong>Your privacy is protected</strong> - no video is recorded or transmitted, and images are only used for one-time analysis.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-green-800">Privacy Guarantee</p>
                  <p className="text-xs text-green-700 mt-1">
                    • No video recording or storage<br/>
                    • Images processed locally only<br/>
                    • One-time analysis, then deleted<br/>
                    • No data sent to external servers
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">Next Step</p>
                <p className="text-xs text-blue-700 mt-1">
                  Clicking "Allow Camera Access" will show Chrome's permission dialog. Choose "Allow" there to enable full AI features.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6">
          <div className="flex space-x-3">
            <button
              onClick={handleReject}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Reject
            </button>
            <button
              onClick={handleApprove}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              Allow Camera Access
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-3 whitespace-nowrap">
            You can change this setting anytime in the extension options.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CameraPermissionPopup;