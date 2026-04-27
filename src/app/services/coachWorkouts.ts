import { http } from "./http";
import type { WorkoutDetailData } from "./api";

export const coachWorkoutsService = {
  getByStudentId: async (studentId: string): Promise<WorkoutDetailData[]> => {
    return http<WorkoutDetailData[]>(`/coach/students/${studentId}/workouts`);
  },
};
