import React from 'react';
interface ReminderModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSetReminder: (intervalMinutes: number) => void;
    onClearReminder: () => void;
    isReminderActive: boolean;
    currentInterval: number;
}
declare const ReminderModal: React.FC<ReminderModalProps>;
export default ReminderModal;
