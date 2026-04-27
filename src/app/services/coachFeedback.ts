import { http } from "./http";

export interface Feedback {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  planName: string;
  metrics: {
    rpe: number; // 1-10
    doms: number; // 1-10
    fatigue: number; // 1-10
  };
  note: string;
  status: 'pending' | 'replied';
  coachReply?: string;
}

export const coachFeedbackService = {
  getFeedbacks: async (status?: "pending" | "replied"): Promise<Feedback[]> => {
    const query = status ? `?status=${status}` : "";
    return http<Feedback[]>(`/coach/feedbacks${query}`);
  },
  getPendingCount: async (): Promise<number> => {
    const pending = await coachFeedbackService.getFeedbacks("pending");
    return pending.length;
  },
  replyFeedback: async (id: string, reply: string): Promise<void> => {
    await http(`/coach/feedbacks/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ reply }),
    });
  },
  clearFeedbacks: async (status?: "pending" | "replied", studentId?: string): Promise<void> => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (studentId) params.set("studentId", studentId);
    const query = params.toString();
    await http(`/coach/feedbacks${query ? `?${query}` : ""}`, { method: "DELETE" });
  },
};