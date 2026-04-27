import { http } from "./http";

export interface WorkoutSet {
  reps: number;
  weight: number;
  type: 'W' | 'N' | 'D';
}

export interface Exercise {
  name: string;
  muscle: string;
  sets: WorkoutSet[];
}

export interface WorkoutDetailData {
  id: string;
  studentId?: string;
  title: string;
  date: string;
  duration: string;
  volume: string;
  exercises: Exercise[];
  coachGuidance?: string;
  coachGuidanceUpdatedAt?: string;
}

export const api = {
  getWorkoutDetail: async (id: string, isCoachView?: boolean): Promise<WorkoutDetailData> => {
    void isCoachView;
    return http<WorkoutDetailData>(`/workouts/${id}`);
  }
};
