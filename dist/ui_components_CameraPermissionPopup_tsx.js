"use strict";
(self["webpackChunkeyezen_chrome_extension"] = self["webpackChunkeyezen_chrome_extension"] || []).push([["ui_components_CameraPermissionPopup_tsx"],{

/***/ "./ui/components/CameraPermissionPopup.tsx":
/*!*************************************************!*\
  !*** ./ui/components/CameraPermissionPopup.tsx ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _core_storage_index__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../core/storage/index */ "./core/storage/index.ts");

/**
 * Camera Permission Popup Component
 * Shows when camera access is detected, allows user to approve or reject
 */


const CameraPermissionPopup = ({ isVisible, onApprove, onReject, onClose }) => {
    const [isAnimating, setIsAnimating] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
        if (isVisible) {
            setIsAnimating(true);
        }
    }, [isVisible]);
    const handleApprove = async () => {
        try {
            // Create offscreen document if it doesn't exist
            const existingContexts = await chrome.runtime.getContexts({});
            const offscreenDocument = existingContexts.find((context) => context.contextType === 'OFFSCREEN_DOCUMENT');
            if (!offscreenDocument) {
                await chrome.offscreen.createDocument({
                    url: 'offscreen.html',
                    reasons: [chrome.offscreen.Reason.USER_MEDIA],
                    justification: 'Camera access for eye health monitoring'
                });
            }
            // Request camera access through offscreen document
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ type: 'REQUEST_CAMERA' }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    if (!response) {
                        reject(new Error('No response received from offscreen document'));
                        return;
                    }
                    resolve(response);
                });
            });
            if (response.success) {
                // Update settings to allow camera access
                await _core_storage_index__WEBPACK_IMPORTED_MODULE_2__.ChromeStorageService.updateSettings({
                    cameraEnabled: true,
                    metricsOnly: false // Allow full functionality
                });
                console.log('Camera activated successfully');
                // Show success message
                alert('🎉 Camera access granted! Full AI-powered eye health monitoring is now active.');
                onApprove();
            }
            else {
                // Handle camera permission denial gracefully
                console.warn('Camera access denied:', response.error);
                // Update settings to metrics-only mode
                await _core_storage_index__WEBPACK_IMPORTED_MODULE_2__.ChromeStorageService.updateSettings({
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
        }
        catch (error) {
            console.error('Failed to approve camera access:', error);
            // Still call onApprove even if camera permission fails
            onApprove();
        }
    };
    const handleReject = async () => {
        try {
            // Update settings to restrict features to alarm-only
            await _core_storage_index__WEBPACK_IMPORTED_MODULE_2__.ChromeStorageService.updateSettings({
                cameraEnabled: false,
                metricsOnly: true // Restrict to basic functionality
            });
            onReject();
            handleClose();
        }
        catch (error) {
            console.error('Failed to reject camera access:', error);
        }
    };
    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(() => {
            onClose();
        }, 200);
    };
    if (!isVisible)
        return null;
    return ((0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: `absolute inset-0 bg-black transition-opacity duration-200 ${isAnimating ? 'opacity-50' : 'opacity-0'}`, onClick: handleClose }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: `relative bg-white rounded-lg shadow-xl max-w-sm mx-4 transform transition-all duration-200 ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`, children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-t-lg", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center space-x-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-8 h-8 bg-white/20 rounded-full flex items-center justify-center", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" }) }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("h3", { className: "text-lg font-semibold", children: "Camera Permission Required" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm opacity-90", children: "EyeZen wants to monitor your eye health" })] })] }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "p-6", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "mb-4", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-center space-x-2 mb-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "w-3 h-3 bg-orange-500 rounded-full animate-pulse" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("span", { className: "text-sm font-medium text-gray-700", children: "Camera access needed for AI features" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", { className: "text-gray-600 text-sm leading-relaxed", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("strong", { children: "Your privacy is protected" }), " - no video is recorded or transmitted, and images are only used for one-time analysis."] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: () => alert('📹 Detailed Setup Instructions:\n\n1. Click "Allow Camera Access" below\n2. Chrome will show a permission dialog\n3. Select "Always allow" for reliable access\n4. If dialog closes quickly, manually set permissions:\n   • Click camera icon in Chrome address bar\n   • Select "Always allow"\n   • Refresh this extension'), className: "text-xs text-blue-600 hover:text-blue-800 underline mt-2 transition-colors", children: "View detailed setup instructions \u2192" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex items-start space-x-2", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", { className: "w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-sm font-medium text-blue-800", children: "Next Step" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs text-blue-700 mt-1", children: "Clicking \"Allow Camera Access\" will show Chrome's permission dialog. Choose \"Allow\" there to enable full AI features." })] })] }) })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "px-6 pb-6", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", { className: "flex space-x-3", children: [(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: handleReject, className: "flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300", children: "Reject" }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("button", { onClick: handleApprove, className: "flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-300", children: "Allow Camera Access" })] }), (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("p", { className: "text-xs text-gray-500 text-center mt-3 whitespace-nowrap", children: "You can change this setting anytime in the extension options." })] })] })] }));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (CameraPermissionPopup);


/***/ })

}]);
//# sourceMappingURL=ui_components_CameraPermissionPopup_tsx.js.map