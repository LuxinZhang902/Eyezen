/**
 * Popup Component
 * Main popup interface for the EyeZen Chrome Extension
 */
import React from 'react';
import { BreakType } from '../../types/index';
interface PopupProps {
    onStartBreak: (breakType: BreakType) => void;
    onOpenSettings: () => void;
}
declare const Popup: React.FC<PopupProps>;
export default Popup;
