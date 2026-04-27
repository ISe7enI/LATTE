import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Background } from './components/Background';
import { TimerWidget } from './components/TimerWidget';
import { Activity, Dumbbell, Calendar, User, History } from 'lucide-react';
import { cn } from './utils';
import { type Exercise, type TrainingPlan, type CompletedWorkout } from './types';
import { userAppService } from './services/userApp';
import { buildBadgesFromWorkouts, type AchievementBadge } from './services/achievements';
import { toast } from 'sonner';
import { AchievementUnlockOverlay } from './components/AchievementUnlockOverlay';

import { Toaster } from './components/ui/sonner';

export type OutletContextType = {
  currentUserId: string;
  workoutTime: number;
  startTimer: (duration: number) => void;
  activeWorkoutExercises: Exercise[];
  setActiveWorkoutExercises: React.Dispatch<React.SetStateAction<Exercise[]>>;
  customPlans: TrainingPlan[];
  setCustomPlans: React.Dispatch<React.SetStateAction<TrainingPlan[]>>;
  completedWorkouts: CompletedWorkout[];
  deleteWorkoutById: (workoutId: string) => Promise<void>;
  finishWorkout: () => Promise<string | undefined>;
  userProfile: { nickname: string, avatar: string, gender: string, height: string, weight: string, age: string, goal: string, level: string };
  setUserProfile: React.Dispatch<React.SetStateAction<{ nickname: string, avatar: string, gender: string, height: string, weight: string, age: string, goal: string, level: string }>>;
  userPreferences: { restTime: string, reminder: boolean, theme: string, intensityLowThreshold: number, intensityHighThreshold: number };
  setUserPreferences: React.Dispatch<React.SetStateAction<{ restTime: string, reminder: boolean, theme: string, intensityLowThreshold: number, intensityHighThreshold: number }>>;
};

const initialExercises: Exercise[] = [];
const defaultUserProfile = { nickname: '', avatar: '', gender: '保密', height: '170', weight: '65', age: '25', goal: '增肌', level: '新手' };
const defaultUserPreferences = {
  restTime: '90',
  reminder: true,
  theme: 'dark',
  intensityLowThreshold: 4000,
  intensityHighThreshold: 10000,
};
const getWorkoutsCacheKey = (userId: string) => `latte.workouts.${userId}`;
const CLOUD_SYNC_KEY = 'latte.lastCloudSyncAt';

export function Root() {
  const currentUserId = localStorage.getItem("latte.userId") || '';
  const [timerActive, setTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(90);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [activeWorkoutExercises, setActiveWorkoutExercises] = useState<Exercise[]>(initialExercises);
  const [customPlans, setCustomPlans] = useState<TrainingPlan[]>([]);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [pendingUnlockBadges, setPendingUnlockBadges] = useState<AchievementBadge[]>([]);
  const [activeUnlockBadge, setActiveUnlockBadge] = useState<AchievementBadge | null>(null);
  const [userProfile, setUserProfile] = useState(defaultUserProfile);
  const [userPreferences, setUserPreferences] = useState(defaultUserPreferences);
  const location = useLocation();
  const navigate = useNavigate();
  const resolvedTheme =
    userPreferences.theme === 'system'
      ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : userPreferences.theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUserId) {
        setUserProfile(defaultUserProfile);
        setUserPreferences(defaultUserPreferences);
        setCustomPlans([]);
        setCompletedWorkouts([]);
        setActiveWorkoutExercises([]);
        return;
      }
      try {
        const [profile, preferences, personalPlans, workouts] = await Promise.all([
          userAppService.getProfile(currentUserId),
          userAppService.getPreferences(currentUserId),
          userAppService.getPlans(currentUserId, 'personal'),
          userAppService.getWorkouts(currentUserId),
        ]);

        setUserProfile({
          nickname: profile.nickname,
          avatar: profile.avatar ?? "",
          gender: profile.gender,
          height: profile.height,
          weight: profile.weight,
          age: profile.age,
          goal: profile.goal,
          level: profile.level,
        });
        setUserPreferences({
          restTime: preferences.restTime,
          reminder: preferences.reminder,
          theme: preferences.theme,
          intensityLowThreshold: preferences.intensityLowThreshold ?? 4000,
          intensityHighThreshold: preferences.intensityHighThreshold ?? 10000,
        });
        setCustomPlans(personalPlans);
        setCompletedWorkouts(workouts);
        localStorage.setItem(getWorkoutsCacheKey(currentUserId), JSON.stringify(workouts));
      } catch {
        // Do not clear current in-memory data on transient request failures.
        // This avoids "data disappeared" experience when backend/network is temporarily unavailable.
        if (!currentUserId) {
          setUserProfile(defaultUserProfile);
          setUserPreferences(defaultUserPreferences);
          setCustomPlans([]);
          setCompletedWorkouts([]);
          setActiveWorkoutExercises([]);
          return;
        }
        const cachedWorkouts = localStorage.getItem(getWorkoutsCacheKey(currentUserId));
        if (cachedWorkouts) {
          try {
            const parsed = JSON.parse(cachedWorkouts) as CompletedWorkout[];
            if (Array.isArray(parsed)) setCompletedWorkouts(parsed);
          } catch {
            // ignore invalid cache
          }
        }
      }
    };
    void loadUserData();
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    localStorage.setItem(getWorkoutsCacheKey(currentUserId), JSON.stringify(completedWorkouts));
  }, [currentUserId, completedWorkouts]);

  useEffect(() => {
    if (!isWorkoutStarted) {
      const hasCompletedSet = activeWorkoutExercises.some(ex => ex.sets.some(s => s.completed));
      if (hasCompletedSet) {
        setIsWorkoutStarted(true);
      }
    }
  }, [activeWorkoutExercises, isWorkoutStarted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutStarted) {
      interval = setInterval(() => {
        setWorkoutTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutStarted]);

  const [timerKey, setTimerKey] = useState(0);

  const startTimer = useCallback((duration: number) => {
    setTimerDuration(duration);
    setTimerActive(true);
    setTimerKey(prev => prev + 1);
  }, []);

  const closeTimer = useCallback(() => {
    setTimerActive(false);
  }, []);

  useEffect(() => {
    if (activeUnlockBadge || pendingUnlockBadges.length === 0) return;
    const [nextBadge, ...rest] = pendingUnlockBadges;
    setActiveUnlockBadge(nextBadge);
    setPendingUnlockBadges(rest);
  }, [activeUnlockBadge, pendingUnlockBadges]);

  useEffect(() => {
    if (!activeUnlockBadge) return;
    const timer = setTimeout(() => {
      setActiveUnlockBadge(null);
    }, 2400);
    return () => clearTimeout(timer);
  }, [activeUnlockBadge]);

  const finishWorkout = useCallback(async (): Promise<string | undefined> => {
    let savedWorkoutId: string | undefined;
    if (activeWorkoutExercises.length > 0) {
      const totalVolume = activeWorkoutExercises.reduce((acc, ex) => acc + ex.sets.reduce((setAcc, set) => set.completed ? setAcc + (set.weight * set.reps) : setAcc, 0), 0);
      
      // Generate dynamic title based on muscles used
      const rawMuscles = activeWorkoutExercises.map(ex => ex.muscle);
      const splitMuscles = rawMuscles.flatMap(m => m.split('/'));
      const uniqueMuscles = Array.from(new Set(splitMuscles));
      let dynamicTitle = "自由训练";
      
      if (uniqueMuscles.length === 1) {
        dynamicTitle = `${uniqueMuscles[0]}训练日`;
      } else if (uniqueMuscles.length === 2) {
        const shortMuscles = uniqueMuscles.map(m => m.replace('部', ''));
        dynamicTitle = `${shortMuscles.join(' / ')} 训练日`;
      } else if (uniqueMuscles.length > 2) {
        dynamicTitle = "全身综合训练日";
      }

      const newWorkout: CompletedWorkout = {
        id: `w-${Date.now()}`,
        date: new Date().toISOString(),
        timeSpent: workoutTime,
        totalVolume,
        exercises: [...activeWorkoutExercises],
        planTitle: dynamicTitle,
      };

      const prevBadges = buildBadgesFromWorkouts(completedWorkouts);
      const nextBadges = buildBadgesFromWorkouts([newWorkout, ...completedWorkouts]);
      const newlyUnlocked = nextBadges.filter((badge) => {
        const prev = prevBadges.find((b) => b.id === badge.id);
        return badge.unlocked && !prev?.unlocked;
      });

      setCompletedWorkouts(prev => [newWorkout, ...prev]);
      await userAppService.saveWorkout({
        id: newWorkout.id,
        userId: currentUserId,
        studentId: currentUserId,
        title: newWorkout.planTitle ?? '自由训练',
        planTitle: newWorkout.planTitle ?? '自由训练',
        date: newWorkout.date,
        duration: `${Math.round(newWorkout.timeSpent / 60)}分钟`,
        volume: newWorkout.totalVolume.toLocaleString(),
        timeSpent: newWorkout.timeSpent,
        totalVolume: newWorkout.totalVolume,
        exercises: newWorkout.exercises,
      });
      savedWorkoutId = newWorkout.id;
      localStorage.setItem(CLOUD_SYNC_KEY, new Date().toISOString());
      await userAppService.deleteWorkoutDraft(currentUserId);

      newlyUnlocked.forEach((badge) => {
        toast.success(`🎉 解锁成就：${badge.title}`);
      });
      if (newlyUnlocked.length > 0) {
        setPendingUnlockBadges((prev) => [...prev, ...newlyUnlocked]);
      }
    }
    
    setActiveWorkoutExercises([]);
    setWorkoutTime(0);
    setIsWorkoutStarted(false);
    setTimerActive(false);
    return savedWorkoutId;
  }, [activeWorkoutExercises, completedWorkouts, currentUserId, workoutTime]);

  const deleteWorkoutById = useCallback(
    async (workoutId: string) => {
      if (!workoutId) return;
      await userAppService.deleteWorkout(workoutId);
      setCompletedWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
      localStorage.setItem(CLOUD_SYNC_KEY, new Date().toISOString());
    },
    [],
  );

  return (
    <div className="relative min-h-screen bg-[#080808] text-white selection:bg-[#d3a971]/30 font-sans overflow-hidden flex justify-center">
      <Background />
      
      {/* Mobile container mimicking the App Flow */}
      <div className="relative w-full max-w-md h-screen flex flex-col bg-[#0a0a0a]/50 shadow-[0_0_100px_rgba(0,0,0,0.8)] border-x border-white/[0.02]">
        
        {/* Main Routed Content */}
        <Outlet
          context={{
            currentUserId,
            workoutTime,
            startTimer,
            activeWorkoutExercises,
            setActiveWorkoutExercises,
            customPlans,
            setCustomPlans,
            completedWorkouts,
            deleteWorkoutById,
            finishWorkout,
            userProfile,
            setUserProfile,
            userPreferences,
            setUserPreferences,
          } satisfies OutletContextType}
        />

        <TimerWidget 
          triggerTimestamp={timerKey}
          isActive={timerActive} 
          duration={timerDuration} 
          onClose={closeTimer} 
        />

        <Toaster theme={resolvedTheme === 'dark' ? 'dark' : 'light'} position="top-center" />
        <AchievementUnlockOverlay badge={activeUnlockBadge} />

        {/* Bottom Tab Bar */}
        {['/home', '/plan', '/log', '/history', '/profile'].includes(location.pathname) && (
        <nav className="absolute bottom-0 w-full h-[80px] bg-[#0a0a0a]/90 backdrop-blur-2xl border-t border-white/[0.03] z-40 pb-safe">
          <div className="flex items-center justify-around h-full px-6">
            {[
              { path: "/home", icon: Activity, label: "首页 HOME" },
              { path: "/plan", icon: Calendar, label: "计划 PLAN" },
              { path: "/log", icon: Dumbbell, label: "记录 LOG" },
              { path: "/history", icon: History, label: "历史 HIST" },
              { path: "/profile", icon: User, label: "我的 PROF" },
            ].map((tab, i) => {
              const active = location.pathname === tab.path;
              return (
                <button 
                  key={i}
                  onClick={() => navigate(tab.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 w-16 relative",
                    active ? "text-[#d3a971]" : "text-white/30 hover:text-white/50"
                  )}
                >
                  {active && (
                    <div className="absolute -top-[1px] w-6 h-[2px] bg-[#d3a971] shadow-[0_0_10px_#d3a971]" />
                  )}
                  <tab.icon size={18} strokeWidth={active ? 2 : 1.5} />
                  <span className="text-[9px] font-['Noto_Serif_SC',_serif] tracking-[0.05em] flex flex-col items-center gap-[1px]">
                    <span>{tab.label.split(' ')[0]}</span>
                    <span className="text-[7px] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.2em] opacity-40">{tab.label.split(' ')[1]}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
        )}
      </div>
    </div>
  );
}
