export type SetType = "W" | "N" | "D";

export interface WorkoutSet {
  reps: number;
  weight: number;
  type: SetType;
}

export interface Exercise {
  id?: string;
  name: string;
  muscle: string;
  sets: WorkoutSet[];
}

export interface WorkoutDetailData {
  id: string;
  studentId: string;
  userId?: string;
  title: string;
  date: string;
  duration: string;
  volume: string;
  timeSpent?: number;
  totalVolume?: number;
  planTitle?: string;
  exercises: Exercise[];
}

export interface WorkoutDraft {
  userId: string;
  exercises: any[];
  updatedAt: string;
}

export interface Feedback {
  id: string;
  coachId: string;
  studentId: string;
  studentName: string;
  date: string;
  planName: string;
  workoutId?: string;
  metrics: {
    rpe: number;
    doms: number;
    fatigue: number;
  };
  note: string;
  status: "pending" | "replied";
  coachReply?: string;
}

export interface DayPlan {
  id: string;
  coachId: string;
  date: string;
  studentId: string;
  exercises: Exercise[];
  status: "planned" | "completed";
}

export interface Template {
  id: string;
  coachId: string;
  name: string;
  exercises: Exercise[];
}

export interface CoachStudent {
  id: string;
  coachId: string;
  name: string;
  target: string;
  lastActive: string;
  completion: number;
  trend: "up" | "down" | "flat";
}

export interface CoachWorkoutGuidance {
  id: string;
  coachId: string;
  workoutId: string;
  studentId: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  avatar: string;
  gender: string;
  height: string;
  weight: string;
  age: string;
  goal: string;
  level: string;
}

export interface UserPreferences {
  id: string;
  restTime: string;
  reminder: boolean;
  theme: string;
  intensityLowThreshold: number;
  intensityHighThreshold: number;
}

export interface UserTrainingPlan {
  id: string;
  userId: string;
  title: string;
  subtitle: string;
  time: string;
  sets: string;
  level: string;
  category: string;
  isSystem: boolean;
  exercises: Exercise[];
}

export interface AuthUser {
  id: string;
  username: string;
  phone?: string | null;
  passwordHash: string;
  createdAt: string;
}
