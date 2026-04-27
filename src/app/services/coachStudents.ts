import { http } from "./http";

export type CoachStudent = {
  id: string;
  name: string;
  target: string;
  lastActive: string;
  completion: number;
  trend: "up" | "down" | "flat";
};

export const coachStudentsService = {
  list: async (): Promise<CoachStudent[]> => {
    return http<CoachStudent[]>("/coach/students");
  },
  getById: async (id: string): Promise<CoachStudent> => {
    return http<CoachStudent>(`/coach/students/${id}`);
  },
  save: async (student: CoachStudent): Promise<void> => {
    await http("/coach/students", { method: "PUT", body: JSON.stringify(student) });
  },
  linkUser: async (phone: string): Promise<CoachStudent> => {
    return http<CoachStudent>("/coach/students/link", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },
  remove: async (id: string): Promise<void> => {
    await http(`/coach/students/${id}`, { method: "DELETE" });
  },
};
