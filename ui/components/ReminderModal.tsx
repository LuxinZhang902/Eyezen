import React, { useState, useEffect } from 'react';

interface ReminderModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSetReminder: (intervalMinutes: number) => void;
  onClearReminder: () => void;
  isReminderActive: boolean;
  currentInterval: number;
}

const ReminderModal: React.FC<ReminderModalProps> = ({
  isVisible,
  onClose,
  onSetReminder,
  onClearReminder,
  isReminderActive,
  currentInterval
}) => {
  const [selectedInterval, setSelectedInterval] = useState(currentInterval);
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [nextAlarmTime, setNextAlarmTime] = useState<Date | null>(null);

  // Update remaining time every second when reminder is active
  useEffect(() => {
    if (!isReminderActive || !isVisible) {
      setRemainingTime('');
      return;
    }

    const updateRemainingTime = async () => {
      try {
        // Get current alarms
        const alarms = await chrome.alarms.getAll();
        const reminderAlarm = alarms.find(alarm => alarm.name === 'break-reminder');
        
        if (reminderAlarm) {
          const now = Date.now();
          const timeUntilAlarm = reminderAlarm.scheduledTime - now;
          
          if (timeUntilAlarm > 0) {
            const minutes = Math.floor(timeUntilAlarm / (1000 * 60));
            const seconds = Math.floor((timeUntilAlarm % (1000 * 60)) / 1000);
            
            if (minutes > 0) {
              setRemainingTime(`${minutes}m ${seconds}s`);
            } else {
              setRemainingTime(`${seconds}s`);
            }
            setNextAlarmTime(new Date(reminderAlarm.scheduledTime));
          } else {
            setRemainingTime('Due now');
            setNextAlarmTime(null);
          }
        } else {
          setRemainingTime('No alarm set');
          setNextAlarmTime(null);
        }
      } catch (error) {
        console.error('Error getting alarm info:', error);
        setRemainingTime('Error loading');
        setNextAlarmTime(null);
      }
    };

    // Update immediately
    updateRemainingTime();
    
    // Update every second
    const interval = setInterval(updateRemainingTime, 1000);
    
    return () => clearInterval(interval);
  }, [isReminderActive, isVisible]);

  if (!isVisible) return null;

  const intervalOptions = [
    { value: 2, label: '2 minutes (test)' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ];

  const handleSetReminder = () => {
    onSetReminder(selectedInterval);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 max-w-sm mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Break Reminders</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isReminderActive && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-green-800">
                  Reminder active: Every {currentInterval} minutes
                </span>
              </div>
            </div>
            {remainingTime && (
              <div className="mt-2 pt-2 border-t border-green-200">
                <div className="flex items-center justify-between text-xs text-green-700">
                  <span>Next reminder in:</span>
                  <span className="font-mono font-semibold text-green-800">{remainingTime}</span>
                </div>
                {nextAlarmTime && (
                  <div className="text-xs text-green-600 mt-1">
                    Due at: {nextAlarmTime.toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Set reminder interval:
          </label>
          <div className="space-y-2">
            {intervalOptions.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="interval"
                  value={option.value}
                  checked={selectedInterval === option.value}
                  onChange={(e) => setSelectedInterval(Number(e.target.value))}
                  className="mr-3 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex space-x-3">
          {isReminderActive ? (
            <>
              <button
                onClick={onClearReminder}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Clear Reminder
              </button>
              <button
                onClick={handleSetReminder}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Update
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSetReminder}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Set Reminder
              </button>
            </>
          )}
        </div>

        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-800">
            💡 When the reminder triggers, you'll see a notification with resting suggestions to help protect your eyes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;