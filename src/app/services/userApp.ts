import { http } from "./http";
import type { CompletedWorkout, Exercise, TrainingPlan } from "../types";
import type { WorkoutDetailData } from "./api";

export type UserProfile = {
  id: string;
  nickname: string;
  avatar: string;
  gender: string;
  height: string;
  weight: string;
  age: string;
  goal: string;
  level: string;
};

export type UserPreferences = {
  id: string;
  restTime: string;
  reminder: boolean;
  theme: string;
  intensityLowThreshold: number;
  intensityHighThreshold: number;
};

export type UserTrainingPlan = TrainingPlan & {
  userId: string;
  isSystem: boolean;
};

export type UserCoachPlan = {
  id: string;
  date: string;
  studentId: string;
  status: "planned" | "completed";
  exercises: Array<{
    id?: string;
    name: string;
    muscle: string;
    sets: Array<{ reps: number; weight: number; type: "W" | "N" | "D" }>;
  }>;
};

export type UserWorkoutDraft = {
  userId: string;
  exercises: Exercise[];
  updatedAt: string;
};

export type CoachStudentStatus = {
  linked: boolean;
};

export type UserFeedbackPayload = {
  workoutId?: string;
  planName?: string;
  note: string;
  metrics: {
    rpe: number;
    doms: number;
    fatigue: number;
  };
};

export const userAppService = {
  getProfile: (userId: string) => http<UserProfile>(`/user/profile/${userId}`),
  updateProfile: (userId: string, payload: UserProfile) =>
    http<UserProfile>(`/user/profile/${userId}`, { method: "PUT", body: JSON.stringify(payload) }),

  getPreferences: (userId: string) => http<UserPreferences>(`/user/preferences/${userId}`),
  updatePreferences: (userId: string, payload: UserPreferences) =>
    http<UserPreferences>(`/user/preferences/${userId}`, { method: "PUT", body: JSON.stringify(payload) }),

  getPlans: (userId: string, type?: "system" | "personal") =>
    http<UserTrainingPlan[]>(`/user/plans?userId=${userId}${type ? `&type=${type}` : ""}`),
  getCoachStudentStatus: (userId: string) =>
    http<CoachStudentStatus>(`/user/coach-student-status?userId=${userId}`),
  getCoachPlans: (userId: string) => http<UserCoachPlan[]>(`/user/coach-plans?userId=${userId}`),
  completeCoachPlan: (planId: string) =>
    http<UserCoachPlan>(`/user/coach-plans/${encodeURIComponent(planId)}/complete`, { method: "PUT" }),
  savePlan: (plan: UserTrainingPlan) => http<UserTrainingPlan>("/user/plans", { method: "PUT", body: JSON.stringify(plan) }),
  deletePlan: (id: string) => http<void>(`/user/plans/${id}`, { method: "DELETE" }),

  getWorkouts: async (userId: string): Promise<CompletedWorkout[]> => {
    const rows = await http<WorkoutDetailData[]>(`/user/workouts?userId=${userId}`);
    return rows.map((row) => ({
      id: row.id,
      date: row.date,
      timeSpent: row.timeSpent ?? 0,
      totalVolume: row.totalVolume ?? (Number(String(row.volume).replace(/,/g, "")) || 0),
      exercises: row.exercises as any,
      planTitle: row.planTitle ?? row.title,
    }));
  },
  saveWorkout: (workout: WorkoutDetailData) => http("/user/workouts", { method: "POST", body: JSON.stringify(workout) }),
  deleteWorkout: (workoutId: string) => http<void>(`/user/workouts/${encodeURIComponent(workoutId)}`, { method: "DELETE" }),
  getWorkoutDraft: (userId: string) => http<UserWorkoutDraft | null>(`/user/workout-draft?userId=${userId}`),
  saveWorkoutDraft: (userId: string, exercises: Exercise[]) =>
    http<UserWorkoutDraft>("/user/workout-draft", {
      method: "PUT",
      body: JSON.stringify({ userId, exercises }),
    }),
  deleteWorkoutDraft: (userId: string) => http<void>(`/user/workout-draft?userId=${userId}`, { method: "DELETE" }),
  submitFeedback: (payload: UserFeedbackPayload) =>
    http<{ id: string }>("/user/feedbacks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  exportWorkoutsCsv: async (userId: string): Promise<Blob> => {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/user/export/workouts.csv?userId=${encodeURIComponent(userId)}`, {
      headers: {
        "x-user-id": userId,
        "x-user-role": "user",
      },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Export failed: ${response.status}`);
    }
    return response.blob();
  },
};
