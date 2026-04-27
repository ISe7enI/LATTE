export type SetType = "W" | "N" | "D" | "F"; // Warmup, Normal, Drop, Failure

export type SetRecord = {
  id: string;
  type: SetType;
  weight: number;
  reps: number;
  completed: boolean;
};

export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  sets: SetRecord[];
  isActive?: boolean;
  isSupersetWithNext?: boolean;
};

export type TrainingPlan = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  sets: string;
  level: string;
  category: string;
  exercises: Exercise[];
};

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  en: string;
  pinyin: string; // Pinyin initials
  muscle: string; // e.g. "胸部"
  secondaryMuscles?: string[];
  type: string; // 力量, 有氧, 拉伸
  equipment: string; // 杠铃, 哑铃, 绳索, 自重, 固定器械
  difficulty: number; // 1-5
  has3D?: boolean;
  image?: string;
  videoUrl?: string; // If any
  instructions: {
    start: string;
    execution: string;
    breathing: string;
  };
  tips: string[];
  mistakes: string[];
};

export type CompletedWorkout = {
  id: string;
  date: string;
  timeSpent: number; // in seconds
  totalVolume: number; // in kg
  exercises: Exercise[];
  planTitle?: string;
};