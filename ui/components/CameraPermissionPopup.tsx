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
      // Update settings to allow camera access
      await ChromeStorageService.updateSettings({
        cameraEnabled: true,
        metricsOnly: false // Allow full functionality
      });
      onApprove();
      handleClose();
    } catch (error) {
      console.error('Failed to approve camera access:', error);
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Camera Access Detected</h3>
              <p className="text-sm opacity-90">EyeZen wants to monitor your eye health</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Camera is currently active</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              EyeZen uses your camera to detect eye fatigue and provide personalized break recommendations. 
              Your privacy is protected - no video is recorded or transmitted.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">Important Choice</p>
                <p className="text-xs text-yellow-700 mt-1">
                  If you reject camera access, you'll only be able to use the set alarm feature.
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
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              OK
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            You can change this setting anytime in the extension options.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CameraPermissionPopup;