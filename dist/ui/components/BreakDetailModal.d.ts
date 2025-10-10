import React from 'react';
import { BreakType } from '../../types/index';
interface BreakDetailModalProps {
    isOpen: boolean;
    breakType: BreakType | null;
    onClose: () => void;
    onStartBreak: (breakType: BreakType) => void;
}
declare const BreakDetailModal: React.FC<BreakDetailModalProps>;
export default BreakDetailModal;
