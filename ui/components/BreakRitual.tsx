import React, { useState, useEffect, useRef } from 'react';
import { BreakRitualProps, BreakType, BreakActivity, MassagePoint, MASSAGE_POINTS, MassagePointType } from '../../types/index';

interface BreakRitualState {
  phase: 'preparation' | 'timer' | 'massage' | 'hydration' | 'script' | 'completion';
  timeRemaining: number;
  currentActivity: BreakActivity | null;
  completedActivities: BreakActivity[];
  massageStep: number;
  scriptContent: string;
}

const BreakRitual: React.FC<BreakRitualProps> = ({ breakType, onComplete, onSkip }) => {
  const [state, setState] = useState<BreakRitualState>({
    phase: 'preparation',
    timeRemaining: getBreakDuration(breakType),
    currentActivity: null,
    completedActivities: [],
    massageStep: 0,
    scriptContent: ''
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mountedRef = useRef(true);

  function getBreakDuration(type: BreakType): number {
    switch (type) {
      case BreakType.MICRO: return 20;
      case BreakType.SHORT: return 300; // 5 minutes
      case BreakType.LONG: return 900; // 15 minutes
      default: return 20;
    }
  }

  useEffect(() => {
    if (state.phase === 'timer' && state.timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            timeRemaining: prev.timeRemaining - 1
          }));
        }
      }, 1000);
    } else if (state.timeRemaining === 0 && state.phase === 'timer') {
      if (mountedRef.current) {
        handleTimerComplete();
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.timeRemaining, state.phase]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleTimerComplete = () => {
    playNotificationSound();
    if (mountedRef.current) {
      if (breakType === BreakType.MICRO) {
        setState(prev => ({ ...prev, phase: 'completion' }));
      } else {
        setState(prev => ({ ...prev, phase: 'massage' }));
      }
    }
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  const startTimer = () => {
    const activity: BreakActivity = {
      type: 'exercise',
      name: '20-20-20 Rule',
      duration: state.timeRemaining,
      completed: false,
      timestamp: Date.now()
    };
    if (mountedRef.current) {
      setState(prev => ({
        ...prev,
        phase: 'timer',
        currentActivity: activity
      }));
    }
  };

  const startMassage = () => {
    const activity: BreakActivity = {
      type: 'massage',
      name: 'TCM Eye Massage',
      duration: 90, // 30 seconds per point
      completed: false,
      timestamp: Date.now()
    };
    if (mountedRef.current) {
      setState(prev => ({
        ...prev,
        phase: 'massage',
        currentActivity: activity,
        massageStep: 0
      }));
    }
  };

  const nextMassageStep = () => {
    const massagePoints = Object.values(MASSAGE_POINTS);
    if (state.massageStep < massagePoints.length - 1) {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, massageStep: prev.massageStep + 1 }));
      }
    } else {
      completeMassage();
    }
  };

  const completeMassage = () => {
    if (state.currentActivity && mountedRef.current) {
      const completedActivity = { ...state.currentActivity, completed: true };
      setState(prev => ({
        ...prev,
        completedActivities: [...prev.completedActivities, completedActivity],
        phase: 'hydration',
        currentActivity: null
      }));
    }
  };

  const completeHydration = () => {
    const activity: BreakActivity = {
      type: 'hydration',
      name: 'Hydration Break',
      duration: 30,
      completed: true,
      timestamp: Date.now()
    };
    if (mountedRef.current) {
      setState(prev => ({
        ...prev,
        completedActivities: [...prev.completedActivities, activity],
        phase: 'script'
      }));
      generateScript();
    }
  };

  const generateScript = async () => {
    // Placeholder for AI-generated script
    const scripts = [
      "Take a deep breath and let your shoulders relax. You're doing great by taking this break.",
      "Gently close your eyes and imagine a peaceful scene. Your eyes deserve this rest.",
      "Feel the tension leaving your eye muscles as you blink slowly and deliberately."
    ];
    const randomScript = scripts[Math.floor(Math.random() * scripts.length)];
    if (mountedRef.current) {
      setState(prev => ({ ...prev, scriptContent: randomScript }));
    }
  };

  const completeScript = () => {
    const activity: BreakActivity = {
      type: 'script',
      name: 'Mindfulness Script',
      duration: 60,
      completed: true,
      timestamp: Date.now()
    };
    if (mountedRef.current) {
      setState(prev => ({
        ...prev,
        completedActivities: [...prev.completedActivities, activity],
        phase: 'completion'
      }));
    }
  };

  const handleComplete = () => {
    onComplete(state.completedActivities);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentMassagePoint = (): MassagePoint => {
    const points = Object.values(MASSAGE_POINTS);
    return points[state.massageStep] || points[0];
  };

  const renderPreparation = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800">Time for a Break!</h2>
      <p className="text-gray-600">
        {breakType === BreakType.MICRO 
          ? "Let's do a quick 20-second eye exercise"
          : "Let's take a proper break with eye exercises and relaxation"
        }
      </p>
      <div className="space-y-3">
        <button
          onClick={startTimer}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Break ({formatTime(state.timeRemaining)})
        </button>
        <button
          onClick={onSkip}
          className="w-full bg-gray-300 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Skip This Time
        </button>
      </div>
    </div>
  );

  const renderTimer = () => (
    <div className="text-center space-y-6">
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="54"
            fill="none" stroke="#e5e7eb" strokeWidth="8"
          />
          <circle
            cx="60" cy="60" r="54"
            fill="none" stroke="#3b82f6" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - (getBreakDuration(breakType) - state.timeRemaining) / getBreakDuration(breakType))}`}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">{formatTime(state.timeRemaining)}</span>
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-800">Look at something 20 feet away</h3>
      <p className="text-gray-600">Focus on a distant object to relax your eye muscles</p>
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">💡 Tip: Look out a window or at the far end of the room</p>
      </div>
    </div>
  );

  const renderMassage = () => {
    const currentPoint = getCurrentMassagePoint();
    return (
      <div className="text-center space-y-6">
        <h3 className="text-xl font-semibold text-gray-800">TCM Eye Massage</h3>
        <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-lg">
          <div className="relative w-48 h-48 mx-auto mb-4 bg-white rounded-full shadow-lg">
            {/* Face outline */}
            <svg className="w-full h-full" viewBox="0 0 200 200">
              <ellipse cx="100" cy="100" rx="80" ry="90" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
              {/* Eyes */}
              <ellipse cx="75" cy="80" rx="15" ry="8" fill="white" stroke="#374151" strokeWidth="1" />
              <ellipse cx="125" cy="80" rx="15" ry="8" fill="white" stroke="#374151" strokeWidth="1" />
              {/* Massage point */}
              <circle 
                cx={100 + (currentPoint.position.x - 0.5) * 160} 
                cy={100 + (currentPoint.position.y - 0.5) * 180}
                r="8" 
                fill="#ef4444" 
                className="animate-pulse"
              />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-800">{currentPoint.name}</h4>
          <p className="text-sm text-gray-600 mb-2">{currentPoint.chineseName}</p>
          <p className="text-gray-700 mb-4">{currentPoint.description}</p>
          <div className="text-sm text-green-700 space-y-1">
            {currentPoint.benefits.map((benefit, index) => (
              <p key={index}>• {benefit}</p>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Gently massage this point for 30 seconds</p>
          <button
            onClick={nextMassageStep}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
          >
            {state.massageStep < Object.values(MASSAGE_POINTS).length - 1 ? 'Next Point' : 'Complete Massage'}
          </button>
        </div>
      </div>
    );
  };

  const renderHydration = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 22 12 18.77 5.82 22 7 13.87 2 9l6.91-.74L12 2z"/>
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-800">Hydration Time</h3>
      <p className="text-gray-600">Take a moment to drink some water and refresh yourself</p>
      <div className="bg-blue-50 p-6 rounded-lg space-y-4">
        <div className="text-6xl">💧</div>
        <p className="text-blue-800">Proper hydration helps maintain eye moisture and reduces strain</p>
      </div>
      <button
        onClick={completeHydration}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
      >
        I've Had Some Water
      </button>
    </div>
  );

  const renderScript = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-800">Mindful Moment</h3>
      <div className="bg-purple-50 p-6 rounded-lg">
        <p className="text-lg text-purple-900 leading-relaxed italic">
          "{state.scriptContent}"
        </p>
      </div>
      <p className="text-sm text-gray-600">Take a moment to reflect on this message</p>
      <button
        onClick={completeScript}
        className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors"
      >
        Continue
      </button>
    </div>
  );

  const renderCompletion = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800">Break Complete!</h2>
      <p className="text-gray-600">Great job taking care of your eyes. You completed:</p>
      <div className="bg-green-50 p-4 rounded-lg space-y-2">
        {state.completedActivities.map((activity, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-green-800">✓ {activity.name}</span>
            <span className="text-green-600">{activity.duration}s</span>
          </div>
        ))}
      </div>
      <button
        onClick={handleComplete}
        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
      >
        Return to Work
      </button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <audio ref={audioRef} preload="auto">
        <source src="/assets/sounds/notification.mp3" type="audio/mpeg" />
      </audio>
      
      {state.phase === 'preparation' && renderPreparation()}
      {state.phase === 'timer' && renderTimer()}
      {state.phase === 'massage' && renderMassage()}
      {state.phase === 'hydration' && renderHydration()}
      {state.phase === 'script' && renderScript()}
      {state.phase === 'completion' && renderCompletion()}
    </div>
  );
};

export default BreakRitual;