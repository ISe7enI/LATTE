import "dotenv/config";
import cors from "cors";
import express, { type Request } from "express";
import { supabase } from "./supabase";
import { seedIfEmpty } from "./seed";
import { isSelfOrCoach, requireAuth, requireCoach } from "./auth";
import { hashPassword, verifyPassword } from "./password";
import type {
  CoachStudent,
  CoachWorkoutGuidance,
  DayPlan,
  Feedback,
  Template,
  UserPreferences,
  UserProfile,
  UserTrainingPlan,
  WorkoutDraft,
  WorkoutDetailData,
} from "./types";

export const app = express();
const port = Number(process.env.PORT ?? 8787);
type AuthedRequest = Request & { auth?: { userId: string; role: "user" | "coach" } };

async function getRegisteredUserIdSet(): Promise<Set<string>> {
  const { data, error } = await supabase.from("auth_users").select("id");
  if (error) throw error;
  return new Set((data ?? []).map((row) => String(row.id)));
}

async function buildCoachStudentSnapshot(coachId: string, studentId: string): Promise<CoachStudent | null> {
  const [{ data: profile, error: profileError }, { data: workouts, error: workoutError }] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", studentId).maybeSingle(),
    supabase.from("workouts").select("*").eq("userId", studentId).order("date", { ascending: false }),
  ]);
  if (profileError) throw profileError;
  if (workoutError) throw workoutError;
  if (!profile) return null;

  const rows = workouts ?? [];
  const total = rows.length;
  const completed = rows.filter((w) => Array.isArray(w.exercises) && w.exercises.length > 0).length;
  const completion = total === 0 ? 0 : Math.round((completed / total) * 100);
  const trend: "up" | "down" | "flat" =
    total === 0 ? "flat" : completion >= 80 ? "up" : completion >= 50 ? "flat" : "down";

  let lastActive = "暂无训练";
  if (rows[0]?.date) {
    const t = new Date(String(rows[0].date)).getTime();
    const diffHours = Math.floor((Date.now() - t) / (1000 * 60 * 60));
    if (diffHours < 1) lastActive = "刚刚";
    else if (diffHours < 24) lastActive = `${diffHours}小时前`;
    else lastActive = `${Math.floor(diffHours / 24)}天前`;
  }

  return {
    id: studentId,
    coachId,
    name: String(profile.nickname ?? studentId),
    target: String(profile.goal ?? "综合训练"),
    lastActive,
    completion,
    trend,
  };
}

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    env: {
      hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
      hasSupabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      onVercel: process.env.VERCEL === "1",
    },
  });
});

app.post("/api/auth/register", async (req, res) => {
  const { username, password, phone, code, createCoachPlaceholder } = req.body as {
    username?: string;
    password?: string;
    phone?: string;
    code?: string;
    createCoachPlaceholder?: boolean;
  };
  const normalizedUsername = String(username ?? "").trim();
  const plainPassword = String(password ?? "");
  const normalizedPhone = String(phone ?? "").trim();
  const normalizedCode = String(code ?? "").trim();
  if (normalizedUsername.length < 3) {
    return res.status(400).json({ message: "用户名至少 3 位" });
  }
  if (plainPassword.length < 6) {
    return res.status(400).json({ message: "密码至少 6 位" });
  }
  if (!/^1\d{10}$/.test(normalizedPhone)) {
    return res.status(400).json({ message: "注册需绑定 11 位手机号" });
  }
  if (!/^\d{6}$/.test(normalizedCode)) {
    return res.status(400).json({ message: "请输入 6 位手机验证码" });
  }

  const { data: existingPhoneUser, error: existingPhoneError } = await supabase
    .from("auth_users")
    .select("id")
    .eq("phone", normalizedPhone)
    .maybeSingle();
  if (existingPhoneError) return res.status(500).json({ message: existingPhoneError.message });
  if (existingPhoneUser) return res.status(409).json({ message: "该手机号已绑定其他账号" });

  const { data: codeRow, error: codeError } = await supabase
    .from("auth_phone_codes")
    .select("*")
    .eq("phone", normalizedPhone)
    .maybeSingle();
  if (codeError) return res.status(500).json({ message: codeError.message });
  if (!codeRow) return res.status(404).json({ message: "请先获取验证码" });
  if (String(codeRow.code) !== normalizedCode) return res.status(401).json({ message: "验证码错误" });
  if (new Date(String(codeRow.expiresAt)).getTime() < Date.now()) {
    return res.status(401).json({ message: "验证码已过期，请重新获取" });
  }

  const userId = `U${Date.now().toString().slice(-8)}`;
  const now = new Date().toISOString();
  const passwordHash = hashPassword(plainPassword);

  const { error: authError } = await supabase.from("auth_users").insert({
    id: userId,
    username: normalizedUsername,
    phone: normalizedPhone,
    passwordHash,
    createdAt: now,
  });
  if (authError) return res.status(500).json({ message: authError.message });

  const { error: profileError } = await supabase.from("user_profiles").upsert({
    id: userId,
    nickname: normalizedUsername,
    avatar: "",
    gender: "保密",
    height: "170",
    weight: "65",
    age: "25",
    goal: "增肌",
    level: "新手",
  });
  if (profileError) return res.status(500).json({ message: profileError.message });

  const { error: preferenceError } = await supabase.from("user_preferences").upsert({
    id: userId,
    restTime: "90",
    reminder: true,
    theme: "dark",
    intensityLowThreshold: 4000,
    intensityHighThreshold: 10000,
  });
  if (preferenceError) return res.status(500).json({ message: preferenceError.message });

  if (createCoachPlaceholder) {
    const coachId = userId;
    const { error: coachStudentError } = await supabase.from("coach_students").upsert({
      id: userId,
      coachId,
      name: normalizedUsername,
      target: "综合训练",
      lastActive: "刚注册",
      completion: 0,
      trend: "flat",
    });
    if (coachStudentError) return res.status(500).json({ message: coachStudentError.message });
  }

  return res.status(201).json({ userId, username: normalizedUsername, isNewUser: true });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  const normalizedUsername = String(username ?? "").trim();
  const plainPassword = String(password ?? "");
  if (!normalizedUsername || !plainPassword) {
    return res.status(400).json({ message: "请输入用户名和密码" });
  }

  const { data, error } = await supabase
    .from("auth_users")
    .select("id, username, passwordHash")
    .eq("username", normalizedUsername);
  if (error) return res.status(500).json({ message: error.message });
  const rows = data ?? [];
  if (rows.length === 0) return res.status(404).json({ message: "用户不存在，请先注册" });
  const matched = rows.find((row) => verifyPassword(plainPassword, String(row.passwordHash ?? "")));
  if (!matched) {
    return res.status(401).json({ message: "密码错误" });
  }

  return res.json({ userId: matched.id, username: matched.username, isNewUser: false });
});

app.post("/api/auth/phone/send-code", async (req, res) => {
  const { phone } = req.body as { phone?: string };
  const normalizedPhone = String(phone ?? "").trim();
  if (!/^1\d{10}$/.test(normalizedPhone)) {
    return res.status(400).json({ message: "请输入 11 位手机号" });
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const { error } = await supabase.from("auth_phone_codes").upsert({
    phone: normalizedPhone,
    code,
    expiresAt,
    updatedAt: new Date().toISOString(),
  });
  if (error) return res.status(500).json({ message: error.message });
  return res.json({ ok: true, code });
});

app.post("/api/auth/phone/login", async (req, res) => {
  const { phone, code } = req.body as { phone?: string; code?: string };
  const normalizedPhone = String(phone ?? "").trim();
  const normalizedCode = String(code ?? "").trim();
  if (!/^1\d{10}$/.test(normalizedPhone)) {
    return res.status(400).json({ message: "请输入 11 位手机号" });
  }
  if (!/^\d{6}$/.test(normalizedCode)) {
    return res.status(400).json({ message: "请输入 6 位验证码" });
  }

  const { data: codeRow, error: codeError } = await supabase
    .from("auth_phone_codes")
    .select("*")
    .eq("phone", normalizedPhone)
    .maybeSingle();
  if (codeError) return res.status(500).json({ message: codeError.message });
  if (!codeRow) return res.status(404).json({ message: "请先获取验证码" });
  if (String(codeRow.code) !== normalizedCode) return res.status(401).json({ message: "验证码错误" });
  if (new Date(String(codeRow.expiresAt)).getTime() < Date.now()) {
    return res.status(401).json({ message: "验证码已过期，请重新获取" });
  }

  const { data: existingUser, error: existingError } = await supabase
    .from("auth_users")
    .select("id, username, phone")
    .eq("phone", normalizedPhone)
    .maybeSingle();
  if (existingError) return res.status(500).json({ message: existingError.message });

  if (!existingUser) {
    return res.status(404).json({ message: "手机号未绑定账号，请先使用账号密码注册并绑定手机号" });
  }
  return res.json({ userId: existingUser.id, username: existingUser.username, isNewUser: false });
});

app.get("/api/workouts/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from("workouts").select("*").eq("id", id).maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  if (!data) return res.status(404).json({ message: "Workout not found" });
  let coachGuidance: string | undefined;
  let coachGuidanceUpdatedAt: string | undefined;
  const { data: guidanceRow, error: guidanceError } = await supabase
    .from("coach_workout_guidance")
    .select("note,updatedAt")
    .eq("workoutId", id)
    .maybeSingle();
  if (!guidanceError && guidanceRow) {
    coachGuidance = String(guidanceRow.note ?? "");
    coachGuidanceUpdatedAt = String(guidanceRow.updatedAt ?? "");
  }
  return res.json({
    ...data,
    duration: data.duration ?? `${Math.round((data.timeSpent ?? 0) / 60)}分钟`,
    volume: data.volume ?? String(data.totalVolume ?? 0),
    coachGuidance,
    coachGuidanceUpdatedAt,
  } as WorkoutDetailData);
});

app.use("/api/coach", requireCoach);
app.use("/api/user", requireAuth);

app.put("/api/user/password", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const { currentPassword, newPassword, confirmPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
  const oldPwd = String(currentPassword ?? "");
  const nextPwd = String(newPassword ?? "");
  const confirmPwd = String(confirmPassword ?? "");

  if (!oldPwd || !nextPwd || !confirmPwd) {
    return res.status(400).json({ message: "请完整填写当前密码和新密码" });
  }
  if (nextPwd.length < 6) {
    return res.status(400).json({ message: "新密码至少 6 位" });
  }
  if (nextPwd !== confirmPwd) {
    return res.status(400).json({ message: "两次新密码输入不一致" });
  }
  if (oldPwd === nextPwd) {
    return res.status(400).json({ message: "新密码不能与当前密码相同" });
  }

  const { data: authUser, error: authError } = await supabase
    .from("auth_users")
    .select("id,passwordHash")
    .eq("id", auth.userId)
    .maybeSingle();
  if (authError) return res.status(500).json({ message: authError.message });
  if (!authUser) return res.status(404).json({ message: "用户不存在，请重新登录" });

  const matched = verifyPassword(oldPwd, String(authUser.passwordHash ?? ""));
  if (!matched) return res.status(401).json({ message: "当前密码错误" });

  const nextHash = hashPassword(nextPwd);
  const { error: updateError } = await supabase
    .from("auth_users")
    .update({ passwordHash: nextHash })
    .eq("id", auth.userId);
  if (updateError) return res.status(500).json({ message: updateError.message });

  return res.json({ ok: true });
});

app.delete("/api/user/account", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const confirmText = String((req.body as { confirmText?: string })?.confirmText ?? "").trim().toUpperCase();
  if (confirmText !== "DELETE") {
    return res.status(400).json({ message: "请输入 DELETE 以确认注销" });
  }
  const userId = auth.userId;

  const { data: authUser, error: authFetchError } = await supabase
    .from("auth_users")
    .select("id,phone")
    .eq("id", userId)
    .maybeSingle();
  if (authFetchError) return res.status(500).json({ message: authFetchError.message });
  if (!authUser) return res.status(404).json({ message: "账号不存在或已注销" });

  const phone = String(authUser.phone ?? "").trim();
  const deleteSteps: Array<PromiseLike<{ error: any }>> = [
    supabase.from("coach_workout_guidance").delete().eq("studentId", userId),
    supabase.from("coach_workout_guidance").delete().eq("coachId", userId),
    supabase.from("coach_feedbacks").delete().eq("studentId", userId),
    supabase.from("coach_feedbacks").delete().eq("coachId", userId),
    supabase.from("coach_plans").delete().eq("studentId", userId),
    supabase.from("coach_plans").delete().eq("coachId", userId),
    supabase.from("coach_templates").delete().eq("coachId", userId),
    supabase.from("coach_students").delete().eq("id", userId),
    supabase.from("coach_students").delete().eq("coachId", userId),
    supabase.from("workout_drafts").delete().eq("userId", userId),
    supabase.from("workouts").delete().eq("userId", userId),
    supabase.from("workouts").delete().eq("studentId", userId),
    supabase.from("user_training_plans").delete().eq("userId", userId),
    supabase.from("user_preferences").delete().eq("id", userId),
    supabase.from("user_profiles").delete().eq("id", userId),
  ];
  if (phone) {
    deleteSteps.push(supabase.from("auth_phone_codes").delete().eq("phone", phone));
  }
  deleteSteps.push(supabase.from("auth_users").delete().eq("id", userId));

  for (const step of deleteSteps) {
    const { error } = await step;
    if (error) return res.status(500).json({ message: error.message });
  }
  return res.json({ ok: true });
});

app.get("/api/coach/students/:id/workouts", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const coachId = auth.userId;
  const { id } = req.params;
  const { data: linkedStudent, error: linkedError } = await supabase
    .from("coach_students")
    .select("id")
    .eq("id", id)
    .eq("coachId", coachId)
    .maybeSingle();
  if (linkedError) return res.status(500).json({ message: linkedError.message });
  if (!linkedStudent) return res.json([] as WorkoutDetailData[]);
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("studentId", id)
    .order("id", { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  return res.json((data ?? []) as WorkoutDetailData[]);
});

app.get("/api/coach/students/:id/guidance", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const coachId = auth.userId;
  const { id } = req.params;
  const { data, error } = await supabase
    .from("coach_workout_guidance")
    .select("*")
    .eq("coachId", coachId)
    .eq("studentId", id)
    .order("updatedAt", { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  return res.json((data ?? []) as CoachWorkoutGuidance[]);
});

app.put("/api/coach/workouts/:workoutId/guidance", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const coachId = auth.userId;
  const { workoutId } = req.params;
  const { studentId, note } = req.body as { studentId?: string; note?: string };
  const normalizedStudentId = String(studentId ?? "").trim();
  const normalizedNote = String(note ?? "").trim();
  if (!normalizedStudentId) return res.status(400).json({ message: "studentId is required" });
  if (!normalizedNote) return res.status(400).json({ message: "note is required" });
  const now = new Date().toISOString();
  const payload: CoachWorkoutGuidance = {
    id: `${coachId}:${normalizedStudentId}:${workoutId}`,
    coachId,
    workoutId,
    studentId: normalizedStudentId,
    note: normalizedNote,
    createdAt: now,
    updatedAt: now,
  };
  const { data, error } = await supabase
    .from("coach_workout_guidance")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  return res.json(data as CoachWorkoutGuidance);
});

app.get("/api/coach/feedbacks", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const coachId = auth.userId;
  const status = String(req.query.status ?? "");
  let query = supabase.from("coach_feedbacks").select("*").eq("coachId", coachId).order("date", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return res.status(500).json({ message: error.message });
  try {
    const registeredIds = await getRegisteredUserIdSet();
    const filtered = (data ?? []).filter((row) => registeredIds.has(String((row as Feedback).studentId)));
    return res.json(filtered as Feedback[]);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message ?? "Failed to filter feedbacks" });
  }
});

app.delete("/api/coach/feedbacks", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const coachId = auth.userId;
  const status = String(req.query.status ?? "").trim();
  const studentId = String(req.query.studentId ?? "").trim();

  let query = supabase.from("coach_feedbacks").delete().eq("coachId", coachId);
  if (status) query = query.eq("status", status);
  if (studentId) query = query.eq("studentId", studentId);
  const { error } = await query;
  if (error) return res.status(500).json({ message: error.message });
  return res.status(204).send();
});

app.post("/api/coach/feedbacks/:id/reply", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const coachId = auth.userId;
  const { id } = req.params;
  const { reply } = req.body as { reply?: string };
  if (!reply?.trim()) return res.status(400).json({ message: "reply is required" });
  const { data, error } = await supabase
    .from("coach_feedbacks")
    .update({ status: "replied", coachReply: reply })
    .eq("id", id)
    .eq("coachId", coachId)
    .select("*")
    .maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  if (data) {
    const studentId = String((data as Feedback).studentId ?? "");
    if (studentId) {
      // 优先把回复绑定到最近一条“学员反馈”对应的训练，再兜底到最近训练。
      let workoutId = String((data as Feedback).workoutId ?? "");
      if (workoutId) {
        const { data: targetWorkout } = await supabase.from("workouts").select("id").eq("id", workoutId).maybeSingle();
        if (!targetWorkout) workoutId = "";
      }
      const { data: latestFeedbackGuidance } = await supabase
        .from("coach_workout_guidance")
        .select("workoutId,id,updatedAt")
        .eq("coachId", coachId)
        .eq("studentId", studentId)
        .like("id", "%:student-feedback")
        .order("updatedAt", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!workoutId && latestFeedbackGuidance?.workoutId) {
        workoutId = String(latestFeedbackGuidance.workoutId);
      }
      if (!workoutId) {
        const { data: latestWorkout } = await supabase
          .from("workouts")
          .select("id")
          .eq("userId", studentId)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestWorkout?.id) workoutId = String(latestWorkout.id);
      }
      if (workoutId) {
        await supabase.from("coach_workout_guidance").upsert({
          id: `${coachId}:${studentId}:${workoutId}:coach-reply`,
          coachId,
          workoutId,
          studentId,
          note: `教练反馈：${reply.trim()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }
  return res.json(data);
});

app.get("/api/coach/plans", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const coachId = auth.userId;
  const studentId = String(req.query.studentId ?? "");
  let query = supabase.from("coach_plans").select("*").eq("coachId", coachId);
  if (studentId) query = query.eq("studentId", studentId);
  const { data, error } = await query.order("date", { ascending: true });
  if (error) return res.status(500).json({ message: error.message });
  return res.json(data as DayPlan[]);
});

app.get("/api/coach/plans/:studentId/:date", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const coachId = auth.userId;
  const { studentId, date } = req.params;
  const { data, error } = await supabase
    .from("coach_plans")
    .select("*")
    .eq("coachId", coachId)
    .eq("studentId", studentId)
    .eq("date", date)
    .maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  return res.json(data as DayPlan | null);
});

app.put("/api/coach/plans", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const coachId = auth.userId;
  const plan = req.body as DayPlan;
  const payload = { ...plan, coachId };
  const { data, error } = await supabase.from("coach_plans").upsert(payload).select("*").maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  return res.json(data);
});

app.get("/api/coach/templates", async (_req, res) => {
  const auth = (_req as AuthedRequest).auth!;
  const coachId = auth.userId;
  const { data, error } = await supabase
    .from("coach_templates")
    .select("*")
    .eq("coachId", coachId)
    .order("name", { ascending: true });
  if (error) return res.status(500).json({ message: error.message });
  return res.json(data as Template[]);
});

app.put("/api/coach/templates", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const coachId = auth.userId;
  const template = req.body as Template;
  const payload = { ...template, coachId };
  const { data, error } = await supabase.from("coach_templates").upsert(payload).select("*").maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  return res.json(data);
});

app.delete("/api/coach/templates/:id", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const coachId = auth.userId;
  const { id } = req.params;
  const { error } = await supabase.from("coach_templates").delete().eq("id", id).eq("coachId", coachId);
  if (error) return res.status(500).json({ message: error.message });
  return res.status(204).send();
});

app.get("/api/coach/students", async (_req, res) => {
  const auth = (_req as AuthedRequest).auth!;
  const coachId = auth.userId;
  const { data, error } = await supabase
    .from("coach_students")
    .select("*")
    .eq("coachId", coachId)
    .order("id", { ascending: true });
  if (error) return res.status(500).json({ message: error.message });
  try {
    const registeredIds = await getRegisteredUserIdSet();
    const filtered = (data ?? []).filter((row) => registeredIds.has(String((row as CoachStudent).id)));
    const snapshots: CoachStudent[] = [];
    for (const row of filtered) {
      const studentId = String((row as CoachStudent).id);
      const snapshot = await buildCoachStudentSnapshot(coachId, studentId);
      if (snapshot) snapshots.push(snapshot);
    }
    if (snapshots.length > 0) {
      await supabase.from("coach_students").upsert(snapshots);
    }
    return res.json(snapshots);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message ?? "Failed to filter students" });
  }
});

app.get("/api/coach/students/:id", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const coachId = auth.userId;
  const { id } = req.params;
  try {
    const registeredIds = await getRegisteredUserIdSet();
    if (!registeredIds.has(String(id))) return res.status(404).json({ message: "Student not found" });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message ?? "Failed to validate student" });
  }
  try {
    const snapshot = await buildCoachStudentSnapshot(coachId, id);
    if (!snapshot) return res.status(404).json({ message: "Student not found" });
    await supabase.from("coach_students").upsert(snapshot);
    return res.json(snapshot);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message ?? "Failed to load student" });
  }
});

app.put("/api/coach/students", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const coachId = auth.userId;
  const student = req.body as CoachStudent;
  const payload = { ...student, coachId };
  const { data, error } = await supabase.from("coach_students").upsert(payload).select("*").maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  return res.json(data);
});

app.post("/api/coach/students/link", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const coachId = auth.userId;
  const phone = String((req.body as { phone?: string; identifier?: string })?.phone ?? "")
    .trim()
    .replace(/\s+/g, "");
  const fallbackIdentifier = String((req.body as { identifier?: string })?.identifier ?? "")
    .trim()
    .replace(/\s+/g, "");
  const normalizedPhone = phone || fallbackIdentifier;
  if (!normalizedPhone) return res.status(400).json({ message: "请输入绑定手机号" });
  if (!/^\d{11}$/.test(normalizedPhone)) return res.status(400).json({ message: "手机号需为11位数字" });
  if (!/^1\d{10}$/.test(normalizedPhone)) return res.status(400).json({ message: "手机号格式不正确" });

  const { data: authUser, error: authError } = await supabase
    .from("auth_users")
    .select("id")
    .eq("phone", normalizedPhone)
    .maybeSingle();
  if (authError) return res.status(500).json({ message: authError.message });
  if (!authUser) return res.status(404).json({ message: "该手机号未绑定账号" });
  const userId = String(authUser.id);

  try {
    const student = await buildCoachStudentSnapshot(coachId, userId);
    if (!student) return res.status(404).json({ message: "用户不存在，请先注册并完成基础信息" });

    const { data, error } = await supabase.from("coach_students").upsert(student).select("*").maybeSingle();
    if (error) return res.status(500).json({ message: error.message });
    return res.json(data as CoachStudent);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message ?? "Failed to link student" });
  }
});

app.post("/api/user/feedbacks", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const studentId = auth.userId;
  const { planName, note, metrics, workoutId } = req.body as {
    planName?: string;
    note?: string;
    workoutId?: string;
    metrics?: { rpe?: number; doms?: number; fatigue?: number };
  };

  const normalizedNote = String(note ?? "").trim();
  if (!normalizedNote) return res.status(400).json({ message: "请填写评价内容" });
  const rpe = Number(metrics?.rpe ?? 0);
  const doms = Number(metrics?.doms ?? 0);
  const fatigue = Number(metrics?.fatigue ?? 0);
  const inRange = (v: number) => Number.isFinite(v) && v >= 1 && v <= 10;
  if (!inRange(rpe) || !inRange(doms) || !inRange(fatigue)) {
    return res.status(400).json({ message: "请填写 1-10 的训练评分" });
  }

  const { data: coachRows, error: coachRowsError } = await supabase
    .from("coach_students")
    .select("coachId")
    .eq("id", studentId);
  if (coachRowsError) return res.status(500).json({ message: coachRowsError.message });
  const coachId = String(coachRows?.[0]?.coachId ?? "");
  if (!coachId) return res.status(400).json({ message: "你当前尚未绑定教练，无法提交评价" });

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("nickname")
    .eq("id", studentId)
    .maybeSingle();
  if (profileError) return res.status(500).json({ message: profileError.message });

  const payload: Feedback = {
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    coachId,
    studentId,
    studentName: String(profile?.nickname ?? studentId),
    date: new Date().toISOString().slice(0, 10),
    planName: String(planName ?? "训练反馈"),
    workoutId: workoutId ? String(workoutId) : undefined,
    metrics: { rpe, doms, fatigue },
    note: normalizedNote,
    status: "pending",
  };
  const { data, error } = await supabase.from("coach_feedbacks").insert(payload).select("*").maybeSingle();
  if (error) return res.status(500).json({ message: error.message });

  if (workoutId) {
    await supabase
      .from("coach_workout_guidance")
      .upsert({
        id: `${coachId}:${studentId}:${workoutId}:student-feedback`,
        coachId,
        workoutId,
        studentId,
        note: `学员反馈：${normalizedNote}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
  }

  return res.status(201).json(data as Feedback);
});

app.delete("/api/coach/students/:id", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const coachId = auth.userId;
  const { id } = req.params;
  const [studentDelete, feedbackDelete] = await Promise.all([
    supabase.from("coach_students").delete().eq("id", id).eq("coachId", coachId),
    supabase.from("coach_feedbacks").delete().eq("studentId", id).eq("coachId", coachId),
  ]);
  if (studentDelete.error) return res.status(500).json({ message: studentDelete.error.message });
  if (feedbackDelete.error) return res.status(500).json({ message: feedbackDelete.error.message });
  return res.status(204).send();
});

app.get("/api/user/profile/:id", async (req, res) => {
  const { id } = req.params;
  const auth = (req as AuthedRequest).auth!;
  if (!isSelfOrCoach(auth, id)) return res.status(403).json({ message: "Forbidden" });
  const { data, error } = await supabase.from("user_profiles").select("*").eq("id", id).maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  if (!data) return res.status(404).json({ message: "User profile not found" });
  return res.json(data as UserProfile);
});

app.put("/api/user/profile/:id", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  if (!isSelfOrCoach(auth, req.params.id)) return res.status(403).json({ message: "Forbidden" });
  const payload = { ...(req.body as UserProfile), id: req.params.id };
  const { data, error } = await supabase.from("user_profiles").upsert(payload).select("*").maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  return res.json(data as UserProfile);
});

app.get("/api/user/preferences/:id", async (req, res) => {
  const { id } = req.params;
  const auth = (req as AuthedRequest).auth!;
  if (!isSelfOrCoach(auth, id)) return res.status(403).json({ message: "Forbidden" });
  const { data, error } = await supabase.from("user_preferences").select("*").eq("id", id).maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  if (!data) return res.status(404).json({ message: "User preferences not found" });
  return res.json(data as UserPreferences);
});

app.put("/api/user/preferences/:id", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  if (!isSelfOrCoach(auth, req.params.id)) return res.status(403).json({ message: "Forbidden" });
  const payload = { ...(req.body as UserPreferences), id: req.params.id };
  const { data, error } = await supabase.from("user_preferences").upsert(payload).select("*").maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  return res.json(data as UserPreferences);
});

app.get("/api/user/plans", async (req, res) => {
  const userId = String(req.query.userId ?? "");
  const auth = (req as AuthedRequest).auth!;
  if (userId && !isSelfOrCoach(auth, userId)) return res.status(403).json({ message: "Forbidden" });
  const type = String(req.query.type ?? "");
  let query = supabase.from("user_training_plans").select("*");
  if (type === "system") {
    query = query.eq("isSystem", true);
    if (userId) query = query.or(`userId.eq.${userId},userId.eq.SYSTEM`);
  } else if (userId) {
    query = query.eq("userId", userId);
  }
  if (type === "personal") query = query.eq("isSystem", false);
  const { data, error } = await query.order("title", { ascending: true });
  if (error) return res.status(500).json({ message: error.message });
  return res.json((data ?? []) as UserTrainingPlan[]);
});

app.get("/api/user/coach-plans", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const userId = String(req.query.userId ?? auth.userId);
  if (!isSelfOrCoach(auth, userId)) return res.status(403).json({ message: "Forbidden" });
  const { data, error } = await supabase
    .from("coach_plans")
    .select("*")
    .eq("studentId", userId)
    .order("date", { ascending: true });
  if (error) return res.status(500).json({ message: error.message });
  return res.json((data ?? []) as DayPlan[]);
});

app.get("/api/user/coach-student-status", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const userId = String(req.query.userId ?? auth.userId);
  if (!isSelfOrCoach(auth, userId)) return res.status(403).json({ message: "Forbidden" });
  const { data, error } = await supabase
    .from("coach_students")
    .select("id,coachId,lastActive")
    .eq("id", userId);
  if (error) return res.status(500).json({ message: error.message });
  const rows = (data ?? []) as Array<{ id: string; coachId: string; lastActive?: string | null }>;
  const linked = rows.some((row) => {
    const coachId = String(row.coachId ?? "");
    const lastActive = String(row.lastActive ?? "");
    // 排除注册时的自关联占位数据，其余关系都视为已绑定教练。
    return !(coachId === userId && lastActive === "刚注册");
  });
  return res.json({ linked });
});

app.put("/api/user/coach-plans/:id/complete", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const { id } = req.params;
  const { data: existing, error: existingError } = await supabase
    .from("coach_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (existingError) return res.status(500).json({ message: existingError.message });
  if (!existing) return res.status(404).json({ message: "教练计划不存在" });
  if (!isSelfOrCoach(auth, String(existing.studentId ?? ""))) return res.status(403).json({ message: "Forbidden" });

  const payload = { ...existing, status: "completed" as const };
  const { data, error } = await supabase.from("coach_plans").upsert(payload).select("*").maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  return res.json(data as DayPlan);
});

app.put("/api/user/plans", async (req, res) => {
  const plan = req.body as UserTrainingPlan;
  const auth = (req as AuthedRequest).auth!;
  if (!isSelfOrCoach(auth, plan.userId)) return res.status(403).json({ message: "Forbidden" });
  const { data, error } = await supabase.from("user_training_plans").upsert(plan).select("*").maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  return res.json(data as UserTrainingPlan);
});

app.delete("/api/user/plans/:id", async (req, res) => {
  const { id } = req.params;
  const auth = (req as AuthedRequest).auth!;
  const { data: existing, error: existingError } = await supabase
    .from("user_training_plans")
    .select("id,userId,isSystem")
    .eq("id", id)
    .maybeSingle();
  if (existingError) return res.status(500).json({ message: existingError.message });
  if (!existing) return res.status(404).json({ message: "计划不存在" });
  if (existing.isSystem) return res.status(403).json({ message: "系统计划不可删除" });
  if (!isSelfOrCoach(auth, String(existing.userId))) return res.status(403).json({ message: "Forbidden" });
  const { error } = await supabase.from("user_training_plans").delete().eq("id", id);
  if (error) return res.status(500).json({ message: error.message });
  return res.status(204).send();
});

app.get("/api/user/workouts", async (req, res) => {
  const userId = String(req.query.userId ?? "");
  const auth = (req as AuthedRequest).auth!;
  if (userId && !isSelfOrCoach(auth, userId)) return res.status(403).json({ message: "Forbidden" });
  let query = supabase.from("workouts").select("*");
  if (userId) query = query.eq("userId", userId);
  const { data, error } = await query.order("date", { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  return res.json(
    (data ?? []).map((row) => ({
      ...row,
      duration: row.duration ?? `${Math.round((row.timeSpent ?? 0) / 60)}分钟`,
      volume: row.volume ?? String(row.totalVolume ?? 0),
    })) as WorkoutDetailData[],
  );
});

app.post("/api/user/workouts", async (req, res) => {
  const workout = req.body as WorkoutDetailData;
  const auth = (req as AuthedRequest).auth!;
  const targetUserId = workout.userId ?? workout.studentId ?? "";
  if (!targetUserId || !isSelfOrCoach(auth, targetUserId)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const payload = {
    ...workout,
    studentId: workout.studentId ?? workout.userId,
    userId: workout.userId ?? workout.studentId,
    duration: workout.duration ?? `${Math.round((workout.timeSpent ?? 0) / 60)}分钟`,
    volume: workout.volume ?? String(workout.totalVolume ?? 0),
  };
  const { data, error } = await supabase.from("workouts").upsert(payload).select("*").maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  return res.json(data as WorkoutDetailData);
});

app.delete("/api/user/workouts/:id", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const { id } = req.params;
  const { data: existing, error: existingError } = await supabase
    .from("workouts")
    .select("id,userId,studentId")
    .eq("id", id)
    .maybeSingle();
  if (existingError) return res.status(500).json({ message: existingError.message });
  if (!existing) return res.status(404).json({ message: "训练记录不存在" });
  const ownerId = String(existing.userId ?? existing.studentId ?? "");
  if (!ownerId || !isSelfOrCoach(auth, ownerId)) return res.status(403).json({ message: "Forbidden" });

  const { error: guidanceError } = await supabase.from("coach_workout_guidance").delete().eq("workoutId", id);
  if (guidanceError) return res.status(500).json({ message: guidanceError.message });
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) return res.status(500).json({ message: error.message });
  return res.status(204).send();
});

app.get("/api/user/workout-draft", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const userId = String(req.query.userId ?? auth.userId);
  if (!isSelfOrCoach(auth, userId)) return res.status(403).json({ message: "Forbidden" });
  const { data, error } = await supabase.from("workout_drafts").select("*").eq("userId", userId).maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  return res.json((data as WorkoutDraft | null) ?? null);
});

app.put("/api/user/workout-draft", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const draft = req.body as WorkoutDraft;
  const userId = String(draft.userId ?? "");
  if (!userId) return res.status(400).json({ message: "userId is required" });
  if (!isSelfOrCoach(auth, userId)) return res.status(403).json({ message: "Forbidden" });
  const payload: WorkoutDraft = {
    userId,
    exercises: Array.isArray(draft.exercises) ? draft.exercises : [],
    updatedAt: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("workout_drafts").upsert(payload).select("*").maybeSingle();
  if (error) return res.status(500).json({ message: error.message });
  return res.json(data as WorkoutDraft);
});

app.delete("/api/user/workout-draft", async (req, res) => {
  const auth = (req as AuthedRequest).auth!;
  const userId = String(req.query.userId ?? auth.userId);
  if (!isSelfOrCoach(auth, userId)) return res.status(403).json({ message: "Forbidden" });
  const { error } = await supabase.from("workout_drafts").delete().eq("userId", userId);
  if (error) return res.status(500).json({ message: error.message });
  return res.status(204).send();
});

app.get("/api/user/export/workouts.csv", async (req, res) => {
  const userId = String(req.query.userId ?? "");
  const auth = (req as AuthedRequest).auth!;
  const targetUserId = userId || auth.userId;
  if (!isSelfOrCoach(auth, targetUserId)) return res.status(403).json({ message: "Forbidden" });

  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("userId", targetUserId)
    .order("date", { ascending: false });
  if (error) return res.status(500).json({ message: error.message });

  const rows = data ?? [];
  const lines = [
    "id,date,title,planTitle,timeSpentSeconds,totalVolume,exerciseCount",
    ...rows.map((row) =>
      [
        row.id,
        row.date,
        `"${String(row.title ?? "").replaceAll('"', '""')}"`,
        `"${String(row.planTitle ?? "").replaceAll('"', '""')}"`,
        String(row.timeSpent ?? 0),
        String(row.totalVolume ?? 0),
        String(Array.isArray(row.exercises) ? row.exercises.length : 0),
      ].join(","),
    ),
  ];
  const csv = lines.join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="workouts-${targetUserId}.csv"`);
  return res.status(200).send(csv);
});

if (process.env.VERCEL !== "1") {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on http://localhost:${port}`);

    // Seed should not block server availability when external network is flaky.
    seedIfEmpty().catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Seed failed (server still running):", error);
    });
  });
}

export default app;
