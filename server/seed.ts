import { supabase } from "./supabase";
import type {
  UserPreferences,
  UserProfile,
  UserTrainingPlan,
  WorkoutDetailData,
} from "./types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries - 1) {
        await sleep(250 * (i + 1));
      }
    }
  }
  throw lastError;
}

const workouts: WorkoutDetailData[] = [
  {
    id: "w1",
    studentId: "U001",
    userId: "U001",
    title: "力量举突破 - 胸部",
    date: "今天 10:30",
    duration: "85分钟",
    volume: "14,500",
    timeSpent: 5100,
    totalVolume: 14500,
    planTitle: "力量举突破 - 胸部",
    exercises: [
      {
        name: "杠铃卧推",
        muscle: "胸大肌",
        sets: [
          { reps: 10, weight: 60, type: "W" },
          { reps: 8, weight: 80, type: "N" },
          { reps: 5, weight: 100, type: "N" },
          { reps: 3, weight: 110, type: "N" },
        ],
      },
    ],
  },
  {
    id: "w2",
    studentId: "U002",
    userId: "U002",
    title: "核心与减脂",
    date: "昨天 15:00",
    duration: "45分钟",
    volume: "3,200",
    timeSpent: 2700,
    totalVolume: 3200,
    planTitle: "核心与减脂",
    exercises: [
      {
        name: "平板支撑",
        muscle: "核心",
        sets: [
          { reps: 60, weight: 0, type: "N" },
          { reps: 60, weight: 0, type: "N" },
        ],
      },
    ],
  },
  {
    id: "w3",
    studentId: "U003",
    userId: "U003",
    title: "背部拉伸",
    date: "10月12日",
    duration: "62分钟",
    volume: "2,800",
    timeSpent: 3720,
    totalVolume: 2800,
    planTitle: "背部拉伸",
    exercises: [
      {
        name: "引体向上",
        muscle: "背阔肌",
        sets: [
          { reps: 10, weight: 0, type: "N" },
          { reps: 8, weight: 0, type: "N" },
        ],
      },
    ],
  },
];

const userProfiles: UserProfile[] = [
  { id: "U001", nickname: "Lukas C.", avatar: "", gender: "男", height: "175", weight: "70", age: "25", goal: "增肌", level: "中级" },
];

const userPreferences: UserPreferences[] = [
  {
    id: "U001",
    restTime: "90",
    reminder: true,
    theme: "dark",
    intensityLowThreshold: 4000,
    intensityHighThreshold: 10000,
  },
];

const userTrainingPlans: UserTrainingPlan[] = [
  {
    id: "sys-1",
    userId: "SYSTEM",
    title: "胸部突破日",
    subtitle: "(胸/前束/三头)",
    time: "45 MINS",
    sets: "24 SETS",
    level: "胸",
    category: "部位专攻",
    isSystem: true,
    exercises: [{ id: "se-1", name: "杠铃卧推", muscle: "胸部", sets: [{ reps: 10, weight: 60, type: "N" }] }],
  },
  {
    id: "sys-2",
    userId: "SYSTEM",
    title: "背部厚度日",
    subtitle: "(背/后束/二头)",
    time: "50 MINS",
    sets: "28 SETS",
    level: "背",
    category: "部位专攻",
    isSystem: true,
    exercises: [{ id: "se-2", name: "杠铃划船", muscle: "背部", sets: [{ reps: 10, weight: 60, type: "N" }] }],
  },
  {
    id: "sys-male-1",
    userId: "SYSTEM",
    title: "增肌·男 初级推拉腿",
    subtitle: "(胸背腿/每周3练)",
    time: "60 MINS",
    sets: "30 SETS",
    level: "初级",
    category: "增肌·男",
    isSystem: true,
    exercises: [
      { id: "m1-1", name: "杠铃卧推", muscle: "胸部", sets: [{ reps: 8, weight: 50, type: "N" }] },
      { id: "m1-2", name: "引体向上", muscle: "背部", sets: [{ reps: 8, weight: 0, type: "N" }] },
      { id: "m1-3", name: "杠铃深蹲", muscle: "腿部", sets: [{ reps: 8, weight: 60, type: "N" }] },
    ],
  },
  {
    id: "sys-male-2",
    userId: "SYSTEM",
    title: "增肌·男 中级上/下肢",
    subtitle: "(容量进阶/每周4练)",
    time: "70 MINS",
    sets: "36 SETS",
    level: "中级",
    category: "增肌·男",
    isSystem: true,
    exercises: [
      { id: "m2-1", name: "上斜卧推", muscle: "胸部", sets: [{ reps: 10, weight: 45, type: "N" }] },
      { id: "m2-2", name: "哑铃划船", muscle: "背部", sets: [{ reps: 10, weight: 26, type: "N" }] },
      { id: "m2-3", name: "传统硬拉", muscle: "背部", sets: [{ reps: 5, weight: 90, type: "N" }] },
    ],
  },
  {
    id: "sys-female-1",
    userId: "SYSTEM",
    title: "增肌·女 臀腿优先",
    subtitle: "(臀腿核心/每周3练)",
    time: "55 MINS",
    sets: "28 SETS",
    level: "初级",
    category: "增肌·女",
    isSystem: true,
    exercises: [
      { id: "f1-1", name: "杠铃深蹲", muscle: "腿部", sets: [{ reps: 10, weight: 35, type: "N" }] },
      { id: "f1-2", name: "哑铃卧推", muscle: "胸部", sets: [{ reps: 10, weight: 12, type: "N" }] },
      { id: "f1-3", name: "平板支撑", muscle: "核心", sets: [{ reps: 45, weight: 0, type: "N" }] },
    ],
  },
  {
    id: "sys-female-2",
    userId: "SYSTEM",
    title: "增肌·女 全身塑形",
    subtitle: "(上肢线条+下肢力量)",
    time: "60 MINS",
    sets: "32 SETS",
    level: "中级",
    category: "增肌·女",
    isSystem: true,
    exercises: [
      { id: "f2-1", name: "哑铃推举", muscle: "肩部", sets: [{ reps: 10, weight: 10, type: "N" }] },
      { id: "f2-2", name: "绳索夹胸", muscle: "胸部", sets: [{ reps: 12, weight: 15, type: "N" }] },
      { id: "f2-3", name: "杠铃弯举", muscle: "手臂", sets: [{ reps: 12, weight: 15, type: "N" }] },
    ],
  },
];

async function hasRows(table: string): Promise<boolean> {
  const { count, error } = await withRetry(() =>
    supabase.from(table).select("*", { count: "exact", head: true }),
  );
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function seedIfEmpty() {
  if (!(await hasRows("workouts"))) {
    const { error } = await withRetry(() => supabase.from("workouts").upsert(workouts));
    if (error) throw error;
  }
  if (!(await hasRows("user_profiles"))) {
    const { error } = await withRetry(() => supabase.from("user_profiles").upsert(userProfiles));
    if (error) throw error;
  }
  if (!(await hasRows("user_preferences"))) {
    const { error } = await withRetry(() => supabase.from("user_preferences").upsert(userPreferences));
    if (error) throw error;
  }
  if (!(await hasRows("user_training_plans"))) {
    const { error } = await withRetry(() => supabase.from("user_training_plans").upsert(userTrainingPlans));
    if (error) throw error;
  }
  // Keep baseline system plans up-to-date even when table already has user data.
  const systemPlans = userTrainingPlans.filter((plan) => plan.userId === "SYSTEM");
  if (systemPlans.length > 0) {
    const { error } = await withRetry(() => supabase.from("user_training_plans").upsert(systemPlans));
    if (error) throw error;
  }
}
