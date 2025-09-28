import React, { useState, useEffect, useRef } from 'react';
import { BreakType } from '../../types/index';

interface BreakDetailModalProps {
  isOpen: boolean;
  breakType: BreakType | null;
  onClose: () => void;
  onStartBreak: (breakType: BreakType) => void;
}

interface BreakInfo {
  title: string;
  duration: number; // in seconds
  icon: string;
  description: string;
  instructions: string[];
  benefits: string[];
  color: {
    primary: string;
    secondary: string;
    gradient: string;
  };
}

interface TimerState {
  isRunning: boolean;
  timeRemaining: number;
  totalTime: number;
  isCompleted: boolean;
}

const BREAK_INFO: Record<BreakType, BreakInfo> = {
  [BreakType.MICRO]: {
    title: 'Quick Break',
    duration: 20,
    icon: '⚡',
    description: 'A quick 20-second eye exercise to refresh your vision and reduce strain.',
    instructions: [
      'Look away from your screen',
      'Focus on an object 20 feet away',
      'Blink slowly and deliberately',
      'Take a deep breath and relax'
    ],
    benefits: [
      'Reduces eye strain',
      'Prevents dry eyes',
      'Improves focus',
      'Quick refresh'
    ],
    color: {
      primary: 'yellow-500',
      secondary: 'orange-400',
      gradient: 'from-yellow-300 to-orange-400'
    }
  },
  [BreakType.SHORT]: {
    title: 'Eye Break',
    duration: 300, // 5 minutes
    icon: '👁️',
    description: 'A comprehensive 5-minute break with eye exercises and relaxation techniques.',
    instructions: [
      'Follow the 20-20-20 rule',
      'Perform gentle eye movements',
      'Practice blinking exercises',
      'Do neck and shoulder stretches',
      'Hydrate with water'
    ],
    benefits: [
      'Deep eye relaxation',
      'Improved circulation',
      'Reduced muscle tension',
      'Better posture',
      'Enhanced productivity'
    ],
    color: {
      primary: 'green-500',
      secondary: 'emerald-400',
      gradient: 'from-green-400 to-emerald-500'
    }
  },
  [BreakType.LONG]: {
    title: 'Wellness Break',
    duration: 900, // 15 minutes
    icon: '🧘',
    description: 'A complete 15-minute wellness session with meditation, exercises, and eye care.',
    instructions: [
      'Step away from your workspace',
      'Practice mindful breathing',
      'Do comprehensive eye exercises',
      'Perform TCM acupressure massage',
      'Take a short walk if possible',
      'Hydrate and have a healthy snack'
    ],
    benefits: [
      'Complete eye restoration',
      'Stress reduction',
      'Improved mental clarity',
      'Better circulation',
      'Enhanced well-being',
      'Increased energy'
    ],
    color: {
      primary: 'purple-500',
      secondary: 'indigo-400',
      gradient: 'from-purple-400 to-indigo-500'
    }
  }
};

const BreakDetailModal: React.FC<BreakDetailModalProps> = ({
  isOpen,
  breakType,
  onClose,
  onStartBreak
}) => {
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    timeRemaining: 0,
    totalTime: 0,
    isCompleted: false
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const breakInfo = breakType ? BREAK_INFO[breakType] : null;

  useEffect(() => {
    if (breakType && breakInfo) {
      setTimerState({
        isRunning: false,
        timeRemaining: breakInfo.duration,
        totalTime: breakInfo.duration,
        isCompleted: false
      });
    }
  }, [breakType, breakInfo]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setTimerState(prev => ({ ...prev, isRunning: true }));
    
    timerRef.current = setInterval(() => {
      setTimerState(prev => {
        if (prev.timeRemaining <= 1) {
          // Timer completed
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          playCompletionSound();
          return {
            ...prev,
            timeRemaining: 0,
            isRunning: false,
            isCompleted: true
          };
        }
        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        };
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimerState(prev => ({ ...prev, isRunning: false }));
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      timeRemaining: prev.totalTime,
      isCompleted: false
    }));
  };

  const playCompletionSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const handleStartBreak = () => {
    if (breakType) {
      onStartBreak(breakType);
      onClose();
    }
  };

  const getProgressPercentage = (): number => {
    if (timerState.totalTime === 0) return 0;
    return ((timerState.totalTime - timerState.timeRemaining) / timerState.totalTime) * 100;
  };

  if (!isOpen || !breakType || !breakInfo) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`bg-gradient-to-br ${breakInfo.color.gradient} p-6 rounded-t-2xl text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-center">
            <div className="text-4xl mb-2">{breakInfo.icon}</div>
            <h2 className="text-2xl font-bold mb-2">{breakInfo.title}</h2>
            <p className="text-white/90 text-sm">{breakInfo.description}</p>
          </div>
        </div>

        {/* Timer Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-gray-800 mb-2">
              {formatTime(timerState.timeRemaining)}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className={`bg-gradient-to-r ${breakInfo.color.gradient} h-3 rounded-full transition-all duration-1000`}
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center space-x-3">
              {!timerState.isRunning && !timerState.isCompleted && (
                <button
                  onClick={startTimer}
                  className={`px-6 py-2 bg-${breakInfo.color.primary} text-white rounded-lg hover:bg-${breakInfo.color.secondary} transition-colors flex items-center space-x-2`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>Start</span>
                </button>
              )}
              
              {timerState.isRunning && (
                <button
                  onClick={pauseTimer}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Pause</span>
                </button>
              )}
              
              <button
                onClick={resetTimer}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                <span>Reset</span>
              </button>
            </div>

            {timerState.isCompleted && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-green-800">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Break completed! Great job!</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Instructions</h3>
          <ul className="space-y-2">
            {breakInfo.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                <span className={`w-5 h-5 rounded-full bg-${breakInfo.color.primary} text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  {index + 1}
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Benefits */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Benefits</h3>
          <div className="grid grid-cols-2 gap-2">
            {breakInfo.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                <svg className={`w-4 h-4 text-${breakInfo.color.primary}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 flex space-x-3">
          <button
            onClick={handleStartBreak}
            className={`flex-1 bg-gradient-to-r ${breakInfo.color.gradient} text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 font-medium`}
          >
            Start Full Break Session
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreakDetailModal;