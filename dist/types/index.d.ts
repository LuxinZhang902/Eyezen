export interface EyeMetrics {
    blinkRate: number;
    fatigueIndex: number;
    posture: PostureStatus;
    earValue: number;
    perclosValue: number;
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
export declare enum PostureStatus {
    GOOD = "good",
    FORWARD = "forward",
    TILTED = "tilted",
    TOO_CLOSE = "too_close",
    TOO_FAR = "too_far"
}
export declare enum UserStatus {
    GOOD = "good",
    TIRED = "tired",
    CRITICAL = "critical"
}
export interface EyeScore {
    current: number;
    daily: number;
    weekly: number;
    trend: 'improving' | 'stable' | 'declining';
}
export interface EyeHealthScore {
    overall: number;
    components: {
        eyeStrain: number;
        blinkHealth: number;
        postureHealth: number;
        fatigueLevel: number;
    };
    trend: 'improving' | 'stable' | 'declining';
    recommendations: string[];
}
export interface BreakSession {
    id: string;
    type: BreakType;
    duration: number;
    startTime: number;
    endTime?: number;
    completed: boolean;
    activities: BreakActivity[];
}
export declare enum BreakType {
    MICRO = "micro",// 20 seconds
    SHORT = "short",// 5 minutes
    LONG = "long"
}
export interface BreakActivity {
    type: 'exercise' | 'massage' | 'hydration' | 'script';
    name: string;
    duration: number;
    completed: boolean;
    timestamp: number;
}
export interface MassagePoint {
    name: string;
    chineseName: string;
    position: {
        x: number;
        y: number;
    };
    description: string;
    benefits: string[];
    duration: number;
}
export declare enum MassagePointType {
    ZAN_ZHU = "zan_zhu",// 攒竹
    SI_BAI = "si_bai",// 四白
    JING_MING = "jing_ming"
}
export interface UserSettings {
    cameraEnabled: boolean;
    detectionSensitivity: 'low' | 'medium' | 'high';
    fatigueThreshold: number;
    reminderEnabled: boolean;
    reminderInterval: number;
    breakDuration: number;
    dataRetention: number;
    metricsOnly: boolean;
    language: string;
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    sounds: boolean;
    dailyBreakGoal: number;
    eyeScoreGoal: number;
}
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
export declare class EyeZenError extends Error {
    code: string;
    severity: 'low' | 'medium' | 'high';
    constructor(message: string, code: string, severity?: 'low' | 'medium' | 'high');
}
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export declare const DEFAULT_SETTINGS: UserSettings;
export declare const MASSAGE_POINTS: Record<MassagePointType, MassagePoint>;
export interface GoalsData {
    daily: {
        breaksTarget: number;
        eyeScoreTarget: number;
        notes?: string;
    };
    weekly: {
        consistencyTarget: number;
        avgScoreTarget: number;
        notes?: string;
    };
    monthly: {
        improvementTarget: number;
        streakTarget: number;
        notes?: string;
    };
}
export declare const DEFAULT_GOALS: GoalsData;
