import { http } from "./http";

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  sets: { reps: number; weight: number; type: 'N' | 'W' | 'D' }[];
}

export interface DayPlan {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  exercises: Exercise[];
  status: 'planned' | 'completed';
}

export interface Template {
  id: string;
  name: string;
  exercises: Exercise[];
}

export const coachScheduleService = {
  getPlansByStudent: async (studentId: string): Promise<DayPlan[]> => {
    return http<DayPlan[]>(`/coach/plans?studentId=${studentId}`);
  },
  getPlanByDate: async (studentId: string, date: string): Promise<DayPlan | null> => {
    return http<DayPlan | null>(`/coach/plans/${studentId}/${date}`);
  },
  savePlan: async (plan: DayPlan): Promise<void> => {
    await http("/coach/plans", {
      method: "PUT",
      body: JSON.stringify(plan),
    });
  },
  getTemplates: async (): Promise<Template[]> => {
    return http<Template[]>("/coach/templates");
  },
  saveTemplate: async (template: Template): Promise<void> => {
    await http("/coach/templates", {
      method: "PUT",
      body: JSON.stringify(template),
    });
  },
  deleteTemplate: async (id: string): Promise<void> => {
    await http(`/coach/templates/${id}`, { method: "DELETE" });
  },
};
