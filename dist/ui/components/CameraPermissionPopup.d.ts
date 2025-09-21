/**
 * Camera Permission Popup Component
 * Shows when camera access is detected, allows user to approve or reject
 */
import React from 'react';
interface CameraPermissionPopupProps {
    isVisible: boolean;
    onApprove: () => void;
    onReject: () => void;
    onClose: () => void;
}
declare const CameraPermissionPopup: React.FC<CameraPermissionPopupProps>;
export default CameraPermissionPopup;
