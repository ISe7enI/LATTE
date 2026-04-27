import { http } from "./http";

export type CoachWorkoutGuidance = {
  id: string;
  workoutId: string;
  studentId: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export const coachGuidanceService = {
  getByStudentId: async (studentId: string): Promise<CoachWorkoutGuidance[]> => {
    return http<CoachWorkoutGuidance[]>(`/coach/students/${studentId}/guidance`);
  },
  saveForWorkout: async (workoutId: string, studentId: string, note: string): Promise<CoachWorkoutGuidance> => {
    return http<CoachWorkoutGuidance>(`/coach/workouts/${workoutId}/guidance`, {
      method: "PUT",
      body: JSON.stringify({ studentId, note }),
    });
  },
};
