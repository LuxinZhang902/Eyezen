// Core types for EyeZen Chrome Extension

// Eye tracking and fatigue detection types
export interface EyeMetrics {
  blinkRate: number; // blinks per minute
  fatigueIndex: number; // 0-100 scale
  posture: PostureStatus;
  earValue: number; // Eye Aspect Ratio
  perclosValue: number; // Percentage of Eye Closure
  timestamp: number;
}

export interface FaceLandmarks {
  leftEye: Point[];
  rightEye: Point[];
  nose: Point[];
  mouth: Point[];
}

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export enum PostureStatus {
  GOOD = 'good',
  FORWARD = 'forward',
  TILTED = 'tilted',
  TOO_CLOSE = 'too_close',
  TOO_FAR = 'too_far'
}

// User status and scoring
export enum UserStatus {
  GOOD = 'good',
  TIRED = 'tired',
  CRITICAL = 'critical'
}

export interface EyeScore {
  current: number; // 0-100
  daily: number;
  weekly: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface EyeHealthScore {
  overall: number; // 0-100
  components: {
    eyeStrain: number;
    blinkHealth: number;
    postureHealth: number;
    fatigueLevel: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

// Break and reminder types
export interface BreakSession {
  id: string;
  type: BreakType;
  duration: number; // in seconds
  startTime: number;
  endTime?: number;
  completed: boolean;
  activities: BreakActivity[];
}

export enum BreakType {
  MICRO = 'micro', // 20 seconds
  SHORT = 'short', // 5 minutes
  LONG = 'long' // 15 minutes
}

export interface BreakActivity {
  type: 'exercise' | 'massage' | 'hydration' | 'script';
  name: string;
  duration: number;
  completed: boolean;
  timestamp: number;
}

// TCM Massage points
export interface MassagePoint {
  name: string;
  chineseName: string;
  position: { x: number; y: number }; // relative to face image
  description: string;
  benefits: string[];
  duration: number; // seconds
}

export enum MassagePointType {
  ZAN_ZHU = 'zan_zhu', // 攒竹
  SI_BAI = 'si_bai', // 四白
  JING_MING = 'jing_ming' // 睛明
}

// Settings and preferences
export interface UserSettings {
  // Detection settings
  cameraEnabled: boolean;
  detectionSensitivity: 'low' | 'medium' | 'high';
  fatigueThreshold: number; // 0-100
  
  // Reminder settings
  reminderEnabled: boolean;
  reminderInterval: number; // minutes
  breakDuration: number; // minutes
  
  // Privacy settings
  dataRetention: number; // days
  metricsOnly: boolean;
  
  // UI settings
  language: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  sounds: boolean;
  
  // Goals
  dailyBreakGoal: number;
  eyeScoreGoal: number;
}

// Storage and data types
export interface UserData {
  settings: UserSettings;
  metrics: EyeMetrics[];
  breaks: BreakSession[];
  events: UserEvent[];
  score: EyeScore;
  lastUpdated: number;
}

export interface UserEvent {
  id: string;
  type: 'alert' | 'break' | 'massage' | 'hydration' | 'setting_change';
  timestamp: number;
  data: any;
  severity?: 'low' | 'medium' | 'high';
}

// Chrome AI API types
export interface ChromeAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChromeAICapabilities {
  available: 'readily' | 'after-download' | 'no';
}

export interface ChromeAISession {
  prompt(input: string | ChromeAIMessage[]): Promise<string>;
  destroy(): void;
}

// Legacy types for backward compatibility
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CoachingScript {
  id: string;
  type: 'motivation' | 'instruction' | 'relaxation';
  content: string;
  duration: number;
  language: string;
  generated: number;
}

export interface WeeklySummary {
  weekStart: number;
  weekEnd: number;
  totalBreaks: number;
  averageEyeScore: number;
  fatigueEvents: number;
  improvements: string[];
  recommendations: string[];
  generated: number;
}

// Component props types
export interface PopupProps {
  status: UserStatus;
  eyeScore: number;
  onStartBreak: () => void;
  onOpenSettings: () => void;
}

export interface DashboardProps {
  userData: UserData;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  onExportData: () => void;
  onEraseData: () => void;
}

export interface BreakRitualProps {
  breakType: BreakType;
  onComplete: (activities: BreakActivity[]) => void;
  onSkip: () => void;
}

// Chrome extension specific types
export interface ChromeMessage {
  type: string;
  data?: any;
  timestamp: number;
}

export interface AlarmInfo {
  name: string;
  scheduledTime: number;
  periodInMinutes?: number;
}

// Error types
export class EyeZenError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' = 'medium'
  ) {
    super(message);
    this.name = 'EyeZenError';
  }
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Constants
export const DEFAULT_SETTINGS: UserSettings = {
  cameraEnabled: false,
  detectionSensitivity: 'medium',
  fatigueThreshold: 70,
  reminderEnabled: true,
  reminderInterval: 20,
  breakDuration: 20,
  dataRetention: 30,
  metricsOnly: false,
  language: 'en',
  theme: 'auto',
  notifications: true,
  sounds: true,
  dailyBreakGoal: 8,
  eyeScoreGoal: 80
};

export const MASSAGE_POINTS: Record<MassagePointType, MassagePoint> = {
  [MassagePointType.ZAN_ZHU]: {
    name: 'Zan Zhu',
    chineseName: '攒竹',
    position: { x: 0.3, y: 0.25 },
    description: 'Inner end of eyebrow',
    benefits: ['Relieves eye strain', 'Reduces headaches', 'Improves focus'],
    duration: 30
  },
  [MassagePointType.SI_BAI]: {
    name: 'Si Bai',
    chineseName: '四白',
    position: { x: 0.35, y: 0.45 },
    description: 'Below the center of the eye',
    benefits: ['Brightens eyes', 'Reduces dark circles', 'Improves circulation'],
    duration: 30
  },
  [MassagePointType.JING_MING]: {
    name: 'Jing Ming',
    chineseName: '睛明',
    position: { x: 0.25, y: 0.35 },
    description: 'Inner corner of the eye',
    benefits: ['Clears vision', 'Reduces eye fatigue', 'Calms the mind'],
    duration: 30
  }
};

// Export all types
// Note: Chrome types will be available via @types/chrome package
// Additional type exports can be added here as needed