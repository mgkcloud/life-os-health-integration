// Health Data Types
export interface HealthData {
  userId: string;
  timestamp: string;
  date: string; // YYYY-MM-DD
  steps: number;
  stepsGoal: number;
  distance: number; // meters
  activeEnergyBurned: number; // kcal
  heartRate: number; // bpm
  heartRateVariability: number;
  sleepDuration: number; // hours
  sleepGoal: number;
  deepSleep: number; // hours
  remSleep: number; // hours
  workouts: number;
  workoutMinutes: number;
}

// Screen Time Data Types
export interface ScreenTimeData {
  userId: string;
  timestamp: string;
  date: string; // YYYY-MM-DD
  totalScreenTime: number; // minutes
  productiveTime: number; // minutes
  entertainmentTime: number; // minutes
  focusSessions: number; // count
  appUsage: AppUsage[];
  pickups: number; // device pickups
  notifications: number;
}

export interface AppUsage {
  appName: string;
  bundleId: string;
  category: 'productive' | 'entertainment' | 'neutral';
  timeSpent: number; // minutes
  pickups: number;
}

// Productivity Score Types
export interface ProductivityScore {
  userId: string;
  date: string;
  score: number; // 0-100
  breakdown: {
    stepsScore: number;
    sleepScore: number;
    focusScore: number;
    workoutScore: number;
  };
  streak: number; // consecutive days with score > 70
}

// Permission Status
export type PermissionStatus = 'not_requested' | 'denied' | 'granted';

export interface PermissionsState {
  healthKit: PermissionStatus;
  screenTime: PermissionStatus;
}

// Sync Status
export interface SyncState {
  lastSync: string | null;
  isSyncing: boolean;
  error: string | null;
}
