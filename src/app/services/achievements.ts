import { type CompletedWorkout, type Exercise } from "../types";

export type AchievementBadge = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  date?: string;
  progress: number;
  total: number;
};

const formatDate = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
};

const getCompletedSets = (exercise: Exercise) => exercise.sets.filter((set) => set.completed);

const isBenchPressExercise = (exerciseName: string) => {
  const raw = exerciseName.toLowerCase();
  const n = raw.replace(/\s+/g, "");
  const isCnBarbellBench =
    n.includes("杠铃卧推") ||
    (n.includes("杠铃") && (n.includes("卧推") || n.includes("平板卧推")));
  const isEnBarbellBench =
    n.includes("barbellbenchpress") ||
    (n.includes("barbell") && n.includes("bench") && n.includes("press"));
  return isCnBarbellBench || isEnBarbellBench;
};

const isCoreExercise = (exercise: Exercise) => {
  const name = exercise.name.toLowerCase();
  const muscle = exercise.muscle.toLowerCase();
  return (
    muscle.includes("核心") ||
    muscle.includes("腹") ||
    name.includes("核心") ||
    name.includes("卷腹") ||
    name.includes("平板支撑")
  );
};

export const buildBadgesFromWorkouts = (completedWorkouts: CompletedWorkout[]): AchievementBadge[] => {
  const ordered = [...completedWorkouts]
    .filter((workout) => Boolean(workout.date))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const firstWorkout = ordered[0];

  let benchReps = 0;
  let nightDate: string | undefined;
  let earlyDate: string | undefined;
  let totalSeconds = 0;
  let coreWorkoutCount = 0;
  let hoursUnlockDate: string | undefined;
  let coreUnlockDate: string | undefined;
  let benchUnlockDate: string | undefined;
  const monthCounter = new Map<string, number>();
  let monthUnlockDate: string | undefined;

  const maxByExercise = new Map<string, number>();
  let pbBreaks = 0;
  let pbUnlockDate: string | undefined;

  for (const workout of ordered) {
    const dt = new Date(workout.date);
    if (!Number.isNaN(dt.getTime())) {
      const hour = dt.getHours();
      if (!nightDate && hour >= 22) nightDate = workout.date;
      if (!earlyDate && hour < 7) earlyDate = workout.date;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const newCount = (monthCounter.get(key) ?? 0) + 1;
      monthCounter.set(key, newCount);
      if (!monthUnlockDate && newCount >= 20) monthUnlockDate = workout.date;
    }

    totalSeconds += workout.timeSpent ?? 0;
    if (!hoursUnlockDate && totalSeconds >= 100 * 3600) {
      hoursUnlockDate = workout.date;
    }

    let hasCoreExerciseInWorkout = false;
    for (const exercise of workout.exercises ?? []) {
      const completedSets = getCompletedSets(exercise);
      if (isBenchPressExercise(exercise.name)) {
        for (const set of completedSets) {
          benchReps += set.reps || 0;
          if (!benchUnlockDate && benchReps >= 100) benchUnlockDate = workout.date;
        }
      }

      if (isCoreExercise(exercise) && completedSets.length > 0) {
        hasCoreExerciseInWorkout = true;
      }

      for (const set of completedSets) {
        const weight = set.weight || 0;
        const prevMax = maxByExercise.get(exercise.name) ?? 0;
        if (weight > prevMax) {
          if (prevMax > 0) {
            pbBreaks += 1;
            if (!pbUnlockDate && pbBreaks >= 5) pbUnlockDate = workout.date;
          }
          maxByExercise.set(exercise.name, weight);
        }
      }
    }
    if (hasCoreExerciseInWorkout) {
      coreWorkoutCount += 1;
      if (!coreUnlockDate && coreWorkoutCount >= 50) {
        coreUnlockDate = workout.date;
      }
    }
  }

  const hours = Math.floor(totalSeconds / 3600);

  return [
    {
      id: "1",
      title: "初见成效",
      description: "完成你的第一次完整训练计划",
      unlocked: Boolean(firstWorkout),
      date: formatDate(firstWorkout?.date),
      progress: Math.min(ordered.length, 1),
      total: 1,
    },
    {
      id: "2",
      title: "百斩骑士",
      description: "累计完成1000次杠铃卧推",
      unlocked: benchReps >= 1000,
      date: formatDate(benchUnlockDate),
      progress: Math.min(benchReps, 1000),
      total: 1000,
    },
    {
      id: "3",
      title: "自律达人",
      description: "一个月累计训练20次",
      unlocked: Boolean(monthUnlockDate),
      date: formatDate(monthUnlockDate),
      progress: Math.min(Math.max(...Array.from(monthCounter.values()), 0), 20),
      total: 20,
    },
    {
      id: "4",
      title: "夜猫子",
      description: "在晚上 22:00 之后完成一次训练",
      unlocked: Boolean(nightDate),
      date: formatDate(nightDate),
      progress: nightDate ? 1 : 0,
      total: 1,
    },
    {
      id: "5",
      title: "早鸟奇迹",
      description: "在早上 07:00 之前完成一次训练",
      unlocked: Boolean(earlyDate),
      date: formatDate(earlyDate),
      progress: earlyDate ? 1 : 0,
      total: 1,
    },
    {
      id: "6",
      title: "钢铁之躯",
      description: "总计训练时长达到 100 小时",
      unlocked: hours >= 100,
      date: formatDate(hoursUnlockDate),
      progress: Math.min(hours, 100),
      total: 100,
    },
    {
      id: "7",
      title: "绝对核心",
      description: "完成 50 次核心专项训练",
      unlocked: coreWorkoutCount >= 50,
      date: formatDate(coreUnlockDate),
      progress: Math.min(coreWorkoutCount, 50),
      total: 50,
    },
    {
      id: "8",
      title: "超越极限",
      description: "突破单项动作的历史最大重量 5 次",
      unlocked: pbBreaks >= 5,
      date: formatDate(pbUnlockDate),
      progress: Math.min(pbBreaks, 5),
      total: 5,
    },
  ];
};
