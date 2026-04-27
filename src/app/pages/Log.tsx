import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router';
import { Chart } from '../components/Chart';
import { ExerciseCard } from '../components/ExerciseCard';
import { type Exercise, type SetRecord, type TrainingPlan } from '../types';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { type OutletContextType } from '../Root';
import { Drawer } from 'vaul';
import { cn, toLocalDateKey } from '../utils';
import { motion } from 'motion/react';
import { userAppService } from '../services/userApp';
import { toast } from 'sonner';

export function Log() {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const coachPlanId = searchParams.get('coachPlanId') || '';
  
  const { workoutTime, startTimer, activeWorkoutExercises: exercises, setActiveWorkoutExercises: setExercises, customPlans, finishWorkout, completedWorkouts, userPreferences, currentUserId } = useOutletContext<OutletContextType>();
  const [recommendedPlans, setRecommendedPlans] = useState<TrainingPlan[]>([]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFinishDrawerOpen, setIsFinishDrawerOpen] = useState(false);
  const [activePlanTab, setActivePlanTab] = useState<'个人计划' | '系统推荐'>('个人计划');
  const [activeSystemCategory, setActiveSystemCategory] = useState<'部位专攻' | '增肌·男' | '增肌·女'>('部位专攻');
  const [pendingDraftExercises, setPendingDraftExercises] = useState<Exercise[] | null>(null);
  const [pendingDraftUpdatedAt, setPendingDraftUpdatedAt] = useState('');

  // Finish feedback states
  const [rpe, setRpe] = useState<number>(7);
  const [doms, setDoms] = useState<string>('轻微');
  const [fatigue, setFatigue] = useState<string>('中等');
  const [coachFeedbackNote, setCoachFeedbackNote] = useState('');
  const [isCoachLinked, setIsCoachLinked] = useState(false);
  const [isSubmittingFinish, setIsSubmittingFinish] = useState(false);

  const navigate = useNavigate();
  const uniqueToken = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const buildSessionExercises = (rawExercises: any[]): Exercise[] =>
    (rawExercises || []).map((ex: any, exIdx: number) => ({
      ...ex,
      id: `p-${uniqueToken()}-${exIdx}-${ex.id ?? 'ex'}`,
      isActive: false,
      sets: (ex.sets || []).map((s: any, setIdx: number) => ({
        ...s,
        id: `ps-${uniqueToken()}-${exIdx}-${setIdx}-${s.id ?? 'set'}`,
        completed: Boolean(s.completed),
      })),
    }));

  useEffect(() => {
    const loadDraft = async () => {
      if (!currentUserId) return;
      if (exercises.length > 0) return;
      try {
        const draft = await userAppService.getWorkoutDraft(currentUserId);
        if (draft && Array.isArray(draft.exercises) && draft.exercises.length > 0) {
          setPendingDraftExercises(buildSessionExercises(draft.exercises));
          setPendingDraftUpdatedAt(draft.updatedAt || '');
        }
      } catch {
        // Ignore draft load errors; normal training flow should continue.
      }
    };
    void loadDraft();
    // Only run when user or initial session changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, dateParam]);

  useEffect(() => {
    const load = async () => {
      const plans = await userAppService.getPlans(currentUserId, 'system');
      setRecommendedPlans(plans);
    };
    void load();
  }, [currentUserId]);

  useEffect(() => {
    const loadCoachStatus = async () => {
      if (!currentUserId) return;
      try {
        const status = await userAppService.getCoachStudentStatus(currentUserId);
        setIsCoachLinked(Boolean(status?.linked));
      } catch {
        setIsCoachLinked(false);
      }
    };
    void loadCoachStatus();
  }, [currentUserId]);

  useEffect(() => {
    if (pendingDraftExercises && exercises.length > 0) {
      setPendingDraftExercises(null);
      setPendingDraftUpdatedAt('');
    }
  }, [exercises, pendingDraftExercises]);

  useEffect(() => {
    if (!currentUserId) return;
    const timer = window.setTimeout(() => {
      const run = async () => {
        try {
          if (exercises.length === 0) {
            if (pendingDraftExercises) return;
            await userAppService.deleteWorkoutDraft(currentUserId);
            return;
          }
          await userAppService.saveWorkoutDraft(currentUserId, exercises);
        } catch {
          // Do not block user interactions on draft sync failure.
        }
      };
      void run();
    }, 700);
    return () => window.clearTimeout(timer);
  }, [currentUserId, exercises, pendingDraftExercises]);

  const handleRestoreDraft = () => {
    if (!pendingDraftExercises || pendingDraftExercises.length === 0) return;
    setExercises(pendingDraftExercises);
    setPendingDraftExercises(null);
    setPendingDraftUpdatedAt('');
    toast.success('已恢复上次未完成训练');
  };

  const handleClearDraft = async () => {
    if (!currentUserId) return;
    try {
      await userAppService.deleteWorkoutDraft(currentUserId);
      setPendingDraftExercises(null);
      setPendingDraftUpdatedAt('');
      toast.success('已清空训练草稿');
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || '清空草稿失败');
    }
  };

  const handleUpdateSet = (exerciseId: string, setId: string, field: keyof SetRecord, value: number) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
        };
      }
      return ex;
    }));
  };

  const handleCompleteSet = (exerciseId: string, setId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        const newSets = ex.sets.map(s => {
          if (s.id === setId) {
            const newCompleted = !s.completed;
            if (newCompleted) {
              startTimer(parseInt(userPreferences.restTime) || 90);
            }
            return { ...s, completed: newCompleted };
          }
            return s;
        });
        
        // Mark active exercise
        const isActive = !newSets.every(s => s.completed);
        return { ...ex, sets: newSets, isActive };
      }
      // If we made an exercise active, deactivate others
      return { ...ex, isActive: false };
    }));
  };

  const handleAddSet = (exerciseId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: SetRecord = lastSet ? {
          id: `s-${Date.now()}`,
          type: "N",
          weight: lastSet.weight,
          reps: lastSet.reps,
          completed: false
        } : {
          id: `s-${Date.now()}`,
          type: "N",
          weight: 0,
          reps: 0,
          completed: false
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet]
        };
      }
      return ex;
    }));
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  };

  const handleRemoveSet = (exerciseId: string, setId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.filter(s => s.id !== setId)
        };
      }
      return ex;
    }).filter(ex => ex.sets.length > 0)); // Optional: remove exercise if 0 sets left, but let's keep it simple
  };

  const handleViewDetails = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    navigate(`/exercises/${exerciseId}`, { state: { exercise } });
  };

  const handleAddPlanToWorkout = (plan: TrainingPlan | typeof recommendedPlans[0]) => {
    if (plan.exercises && plan.exercises.length > 0) {
      const newExercises = buildSessionExercises(plan.exercises).map((ex) => ({
        ...ex,
        sets: ex.sets.map((s) => ({ ...s, completed: false })),
      }));
      setExercises(prev => [...prev, ...newExercises]);
    }
    setIsDrawerOpen(false);
  };

  const formattedTime = [
    Math.floor(workoutTime / 3600),
    Math.floor((workoutTime % 3600) / 60),
    workoutTime % 60
  ].map(v => v.toString().padStart(2, '0')).join(':');

  const handleFinish = () => {
    setIsFinishDrawerOpen(true);
  };

  const domsToScore = (value: string) => {
    const map: Record<string, number> = { '无感': 2, '轻微': 4, '显著': 7, '严重': 9 };
    return map[value] ?? 5;
  };

  const fatigueToScore = (value: string) => {
    const map: Record<string, number> = { '极佳': 2, '正常': 4, '中等': 6, '偏高': 8 };
    return map[value] ?? 5;
  };

  const submitFinish = async () => {
    if (isSubmittingFinish) return;
    try {
      setIsSubmittingFinish(true);
      const finishedWorkoutId = await finishWorkout();
      if (isCoachLinked) {
        await userAppService.submitFeedback({
          workoutId: finishedWorkoutId,
          planName: '训练状态评估',
          note: coachFeedbackNote.trim() || `训练状态评估：DOMS ${doms}，疲劳 ${fatigue}`,
          metrics: {
            rpe: Number(rpe),
            doms: domsToScore(doms),
            fatigue: fatigueToScore(fatigue),
          },
        });
      }
      let targetCoachPlanId = coachPlanId;
      if (!targetCoachPlanId && isCoachLinked) {
        try {
          // 兜底：如果 URL 中 coachPlanId 丢失（例如中途切换 Tab），按“今天待完成计划”自动完成
          const todayKey = toLocalDateKey(new Date());
          const todayPlanned = (await userAppService.getCoachPlans(currentUserId)).find(
            (p) => p.date === todayKey && p.status === 'planned',
          );
          if (todayPlanned?.id) targetCoachPlanId = todayPlanned.id;
        } catch {
          // Ignore fallback lookup error; do not block finish flow.
        }
      }
      if (targetCoachPlanId) {
        try {
          await userAppService.completeCoachPlan(targetCoachPlanId);
        } catch (error: any) {
          const message = error instanceof Error ? error.message : String(error);
          toast.error(message || '教练计划完成状态同步失败');
        }
      }
      setIsFinishDrawerOpen(false);
      navigate('/finish');
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || '提交失败，请稍后重试');
    } finally {
      setIsSubmittingFinish(false);
    }
  };

  return (
    <>
      {/* Top Header */}
      <header className="pt-12 px-6 pb-4 relative z-20 flex flex-col border-b border-white/[0.03] backdrop-blur-xl bg-[#080808]/80">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/50 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.2em] mb-1">
              CURRENT SESSION
            </span>
            <h1 className="text-[20px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90">
              今日训练
            </h1>
          </div>
          <button onClick={handleFinish} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/50 hover:text-white transition-colors font-['JetBrains_Mono',_monospace] text-[10px] tracking-widest">
            FINISH
          </button>
        </div>
        
        <div className="flex items-center justify-between px-2 text-white/60">
          <div className="flex flex-col">
            <span className="text-[9px] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.1em] text-white/30 mb-1">DURATION</span>
            <span className="font-['JetBrains_Mono',_monospace] text-[#d3a971] text-sm tracking-wider">{formattedTime}</span>
          </div>
          <div className="w-[1px] h-6 bg-white/[0.05]" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.1em] text-white/30 mb-1">TOTAL VOL.</span>
            <span className="font-['JetBrains_Mono',_monospace] text-white/80 text-sm tracking-wider">{exercises.reduce((acc, ex) => acc + ex.sets.reduce((setAcc, set) => set.completed ? setAcc + (set.weight * set.reps) : setAcc, 0), 0).toLocaleString()} <span className="text-[10px] text-white/40">KG</span></span>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide relative z-10">
        <div className="px-5 pl-7">
          {pendingDraftExercises && pendingDraftExercises.length > 0 && (
            <div className="mb-4 rounded-2xl border border-[#d3a971]/25 bg-[#d3a971]/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] text-[#d3a971] font-['Noto_Serif_SC',_serif] tracking-wider">检测到上次未完成训练</p>
                  <p className="text-[11px] text-white/50 font-['JetBrains_Mono',_monospace] mt-1">
                    {pendingDraftExercises.length} 个动作{pendingDraftUpdatedAt ? ` · ${new Date(pendingDraftUpdatedAt).toLocaleString()}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void handleClearDraft()}
                    className="px-3 py-1.5 rounded-full border border-white/10 text-white/60 text-[11px] hover:bg-white/5 transition-colors"
                  >
                    清空
                  </button>
                  <button
                    onClick={handleRestoreDraft}
                    className="px-3 py-1.5 rounded-full bg-[#d3a971] text-black text-[11px] font-semibold hover:brightness-95 transition-colors"
                  >
                    恢复
                  </button>
                </div>
              </div>
            </div>
          )}
          <Chart workouts={completedWorkouts} />
          
          <div className="space-y-6 pb-6 relative z-10">
            {exercises.map((exercise, idx) => (
              <ExerciseCard 
                key={exercise.id} 
                exercise={exercise} 
                index={idx} 
                onUpdateSet={handleUpdateSet}
                onCompleteSet={handleCompleteSet}
                onAddSet={handleAddSet}
                onRemoveExercise={handleRemoveExercise}
                onRemoveSet={handleRemoveSet}
                onViewDetails={handleViewDetails}
                completedWorkouts={completedWorkouts}
              />
            ))}
          </div>
          
          <div className="flex gap-4 pb-12 pt-6">
            <button onClick={() => navigate('/exercises')} className="flex-1 py-4 rounded-[16px] border border-dashed border-white/[0.05] text-white/40 font-['Noto_Serif_SC',_serif] tracking-widest hover:bg-white/[0.02] hover:text-white/60 transition-all duration-300 hover:border-white/10 flex items-center justify-center gap-2">
              <Plus size={16} /> 添加新动作
            </button>
            <button onClick={() => setIsDrawerOpen(true)} className="flex-1 py-4 rounded-[16px] border border-dashed border-[#d3a971]/30 text-[#d3a971]/80 font-['Noto_Serif_SC',_serif] tracking-widest hover:bg-[#d3a971]/5 hover:text-[#d3a971] transition-all duration-300 flex items-center justify-center gap-2">
              <Plus size={16} /> 导入计划
            </button>
          </div>
        </div>
      </main>

      {/* Plan Selection Drawer */}
      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
          <Drawer.Content className="bg-[#121212] flex flex-col rounded-t-[24px] h-[80vh] mt-24 fixed bottom-0 left-0 right-0 z-[101] border-t border-white/[0.05] max-w-md mx-auto">
            <Drawer.Title className="sr-only">选择计划导入</Drawer.Title>
            <Drawer.Description className="sr-only">从系统推荐或个人创建的计划中选择一个导入到当前训练</Drawer.Description>
            <div className="p-4 bg-[#121212] rounded-t-[24px] flex-1 flex flex-col">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-6" />
              
              <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-lg font-['Noto_Serif_SC',_serif] tracking-widest text-white/90">选择计划导入</h2>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 mb-6 border-b border-white/[0.05] px-2">
                {(['个人计划', '系统推荐'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActivePlanTab(tab)}
                    className={cn(
                      "pb-3 text-[14px] font-['Noto_Serif_SC',_serif] tracking-widest relative transition-colors",
                      activePlanTab === tab ? "text-[#d3a971]" : "text-white/40 hover:text-white/60"
                    )}
                  >
                    {tab}
                    {activePlanTab === tab && (
                      <motion.div layoutId="planTabIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d3a971]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Lists */}
              <div className="flex-1 overflow-y-auto scrollbar-hide px-2 space-y-4 pb-12">
                {activePlanTab === '个人计划' && (
                  customPlans.length === 0 ? (
                    <div className="text-center py-12 text-white/30 text-[13px] font-['Noto_Serif_SC',_serif]">
                      暂无个人计划，请前往“计划”页面创建
                    </div>
                  ) : (
                    customPlans.map(plan => (
                      <div 
                        key={plan.id}
                        onClick={() => handleAddPlanToWorkout(plan)}
                        className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-[#d3a971]/30 transition-colors"
                      >
                        <div>
                          <h3 className="text-[15px] font-['Noto_Serif_SC',_serif] text-white/90 mb-1">{plan.title}</h3>
                          <p className="text-[12px] text-white/40 font-['Noto_Serif_SC',_serif]">{plan.exercises.length} 个动作 · {plan.time}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[#d3a971]/30 flex items-center justify-center text-[#d3a971]">
                          <Plus size={16} />
                        </div>
                      </div>
                    ))
                  )
                )}

                {activePlanTab === '系统推荐' && (
                  <div className="space-y-6 pb-4">
                    {/* Secondary Tabs for System Plans */}
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                      {(['部位专攻', '增肌·男', '增肌·女'] as const).map(category => (
                        <button 
                          key={category}
                          onClick={() => setActiveSystemCategory(category)}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-[12px] font-['Noto_Serif_SC',_serif] tracking-widest whitespace-nowrap transition-all",
                            activeSystemCategory === category 
                              ? "bg-white/10 text-white font-semibold" 
                              : "bg-white/[0.03] text-white/50 border border-white/[0.05] hover:text-white"
                          )}
                        >
                          {category}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {recommendedPlans.filter(p => p.category === activeSystemCategory).map(plan => (
                        <div 
                          key={plan.id}
                          onClick={() => handleAddPlanToWorkout(plan)}
                          className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-[#d3a971]/30 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] text-[#d3a971] bg-[#d3a971]/10 px-1.5 py-0.5 rounded font-['JetBrains_Mono',_monospace] tracking-wider">
                                {plan.level}
                              </span>
                              <h3 className="text-[15px] font-['Noto_Serif_SC',_serif] text-white/90">{plan.title}</h3>
                            </div>
                            <p className="text-[12px] text-white/40 font-['Noto_Serif_SC',_serif]">{plan.subtitle} · {plan.time}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full border border-[#d3a971]/30 flex items-center justify-center text-[#d3a971]">
                            <Plus size={16} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Finish Workout Feedback Drawer */}
      <Drawer.Root open={isFinishDrawerOpen} onOpenChange={setIsFinishDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
          <Drawer.Content className="bg-[#121212] flex flex-col rounded-t-[24px] mt-24 fixed bottom-0 left-0 right-0 z-[101] border-t border-white/[0.05] max-w-md mx-auto pb-8">
            <Drawer.Title className="sr-only">填写训练反馈</Drawer.Title>
            <Drawer.Description className="sr-only">评估当前状态</Drawer.Description>
            
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 mt-2">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-[20px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90">训练状态评估</h2>
                  <span className="text-[10px] text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.1em]">POST-WORKOUT FEEDBACK</span>
                </div>
                <button onClick={() => setIsFinishDrawerOpen(false)} className="p-2 text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                {/* 1. RPE */}
                <div>
                  <label className="text-[12px] font-['Noto_Serif_SC',_serif] text-white/60 block mb-3">平均 RPE (主观训练强度)</label>
                  <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-[10px] font-['JetBrains_Mono',_monospace] text-green-400">1 (极度轻松)</span>
                    <span className="text-xl font-['JetBrains_Mono',_monospace] text-[#d3a971]">{rpe}</span>
                    <span className="text-[10px] font-['JetBrains_Mono',_monospace] text-red-400">10 (绝对力竭)</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="0.5" 
                    value={rpe}
                    onChange={(e) => setRpe(parseFloat(e.target.value))}
                    className="w-full accent-[#d3a971] bg-[#1a1a1a] h-2 rounded-full appearance-none outline-none focus:outline-none"
                    style={{
                      backgroundImage: `linear-gradient(to right, #d3a971 0%, #d3a971 ${(rpe-1)/9*100}%, #1a1a1a ${(rpe-1)/9*100}%, #1a1a1a 100%)`
                    }}
                  />
                  <style>{`
                    input[type=range]::-webkit-slider-thumb {
                      appearance: none;
                      width: 20px;
                      height: 20px;
                      border-radius: 50%;
                      background: #d3a971;
                      cursor: pointer;
                      border: 2px solid #080808;
                      box-shadow: 0 0 10px rgba(211, 169, 113, 0.4);
                    }
                  `}</style>
                </div>

                {/* 2. DOMS */}
                <div>
                  <label className="text-[12px] font-['Noto_Serif_SC',_serif] text-white/60 block mb-3">肌肉酸痛度 (DOMS)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['无感', '轻微', '显著', '严重'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setDoms(level)}
                        className={cn(
                          "py-3 rounded-xl border text-[12px] font-['Noto_Serif_SC',_serif] transition-all",
                          doms === level 
                            ? "bg-[#d3a971] border-[#d3a971] text-[#080808] font-medium" 
                            : "bg-[#141414] border-white/[0.05] text-white/40 hover:bg-white/[0.02]"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Fatigue */}
                <div>
                  <label className="text-[12px] font-['Noto_Serif_SC',_serif] text-white/60 block mb-3">整体疲劳度 (CNS Fatigue)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['极佳', '正常', '中等', '偏高'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setFatigue(level)}
                        className={cn(
                          "py-3 rounded-xl border text-[12px] font-['Noto_Serif_SC',_serif] transition-all",
                          fatigue === level 
                            ? "bg-[#d3a971] border-[#d3a971] text-[#080808] font-medium" 
                            : "bg-[#141414] border-white/[0.05] text-white/40 hover:bg-white/[0.02]"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {isCoachLinked && (
                  <div>
                    <label className="text-[12px] font-['Noto_Serif_SC',_serif] text-white/60 block mb-3">给教练补充说明（可选）</label>
                    <textarea
                      value={coachFeedbackNote}
                      onChange={(e) => setCoachFeedbackNote(e.target.value)}
                      placeholder="例如：今天卧推后半程不稳定，希望下次重点看动作轨迹"
                      className="w-full min-h-[88px] rounded-xl bg-[#141414] border border-white/[0.05] text-[12px] text-white px-3 py-2 placeholder-white/30 focus:outline-none focus:border-[#d3a971]/35"
                    />
                    <p className="mt-2 text-[10px] text-[#d3a971]/70 font-['JetBrains_Mono',_monospace]">
                      已绑定教练：本次训练状态评估将同步发送给教练
                    </p>
                  </div>
                )}

                {!isCoachLinked && (
                  <div className="text-[11px] text-white/40 border border-white/[0.05] rounded-xl p-3 bg-[#141414]">
                    当前未被教练添加为学员，本次训练状态评估仅用于本地训练结束，不会发送给教练。
                  </div>
                )}

                <div className="pt-6">
                  <button 
                    onClick={submitFinish}
                    disabled={isSubmittingFinish}
                    className="w-full py-4 rounded-xl bg-[#d3a971] text-[#080808] font-['Noto_Serif_SC',_serif] font-bold text-[14px] tracking-[0.1em] hover:bg-white transition-colors"
                  >
                    {isSubmittingFinish ? '提交中...' : '提交并结束训练'}
                  </button>
                </div>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}