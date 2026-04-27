import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Play, Flame, TrendingUp, PenSquare, Trash2 } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router';
import { cn, toLocalDateKey } from '../utils';
import { type OutletContextType } from '../Root';
import { type UserCoachPlan, userAppService } from '../services/userApp';
import { toast } from 'sonner';

export function Plan() {
  const navigate = useNavigate();
  const { customPlans, setCustomPlans, currentUserId, setActiveWorkoutExercises } = useOutletContext<OutletContextType>();
  const [activePlanCategory, setActivePlanCategory] = useState('部位专攻');
  const [recommendedPlans, setRecommendedPlans] = useState<any[]>([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(true);
  const [recommendedError, setRecommendedError] = useState('');
  const [isCoachLinked, setIsCoachLinked] = useState(false);
  const [isLoadingCoachLinked, setIsLoadingCoachLinked] = useState(true);
  const [coachPlans, setCoachPlans] = useState<UserCoachPlan[]>([]);
  const [isLoadingCoachPlans, setIsLoadingCoachPlans] = useState(true);
  const [coachPlansError, setCoachPlansError] = useState('');
  const [pendingDeletePlanId, setPendingDeletePlanId] = useState<string | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);

  const planCategories = ['部位专攻', '增肌·男', '增肌·女'];

  const loadRecommendedPlans = async () => {
    setIsLoadingRecommended(true);
    setRecommendedError('');
    try {
      const plans = await userAppService.getPlans(currentUserId, 'system');
      setRecommendedPlans(plans);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      setRecommendedError(message || '基础计划加载失败');
    } finally {
      setIsLoadingRecommended(false);
    }
  };

  useEffect(() => {
    void loadRecommendedPlans();
  }, [currentUserId]);

  const loadCoachPlans = async () => {
    if (!isCoachLinked) return;
    setIsLoadingCoachPlans(true);
    setCoachPlansError('');
    try {
      const plans = await userAppService.getCoachPlans(currentUserId);
      // 学员端仅展示待完成的教练计划，已完成自动从列表隐藏
      setCoachPlans((plans || []).filter((p) => p.status !== 'completed'));
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      setCoachPlansError(message || '教练计划加载失败');
    } finally {
      setIsLoadingCoachPlans(false);
    }
  };

  useEffect(() => {
    const loadCoachLinkedStatus = async () => {
      setIsLoadingCoachLinked(true);
      try {
        const status = await userAppService.getCoachStudentStatus(currentUserId);
        setIsCoachLinked(status.linked);
      } catch {
        setIsCoachLinked(false);
      } finally {
        setIsLoadingCoachLinked(false);
      }
    };
    void loadCoachLinkedStatus();
  }, [currentUserId]);

  useEffect(() => {
    if (!isCoachLinked) {
      setCoachPlans([]);
      setIsLoadingCoachPlans(false);
      setCoachPlansError('');
      return;
    }
    void loadCoachPlans();
  }, [currentUserId, isCoachLinked]);

  const displayedPlans = recommendedPlans.filter(p => p.category === activePlanCategory);
  const uniqueToken = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const todayKey = toLocalDateKey(new Date());

  const buildPlanExercisesForWorkout = (plan: any) =>
    (plan.exercises || []).map((ex: any, exIdx: number) => ({
      ...ex,
      id: `p-${uniqueToken()}-${exIdx}-${ex.id ?? 'ex'}`,
      isActive: false,
      sets: (ex.sets || []).map((s: any, setIdx: number) => ({
        ...s,
        id: `ps-${uniqueToken()}-${exIdx}-${setIdx}-${s.id ?? 'set'}`,
        completed: false,
      })),
    }));

  const handleStartPlan = (plan: any) => {
    const exercises = buildPlanExercisesForWorkout(plan);
    setActiveWorkoutExercises(exercises);
    navigate('/log?date=today');
  };

  const handleStartCoachPlan = async (plan: UserCoachPlan) => {
    const exercises = buildPlanExercisesForWorkout(plan);
    setActiveWorkoutExercises(exercises);
    navigate(`/log?date=today&coachPlanId=${encodeURIComponent(plan.id)}`);
  };

  const handleEditPlan = (plan: any) => {
    navigate(`/create-plan?edit=${encodeURIComponent(plan.id)}`);
  };

  const handleDeletePlan = async (planId: string) => {
    if (isDeletingPlan) return;
    try {
      setIsDeletingPlan(true);
      await userAppService.deletePlan(planId);
      setCustomPlans((prev) => prev.filter((plan) => plan.id !== planId));
      setPendingDeletePlanId(null);
      toast.success('计划已删除');
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || '删除失败，请稍后重试');
    } finally {
      setIsDeletingPlan(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <header className="pt-12 px-6 pb-4 relative z-20 flex flex-col backdrop-blur-xl bg-[#080808]/80 border-b border-white/[0.03]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.2em] mb-1">
              PROGRAMS
            </span>
            <h1 className="text-[20px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90">
              训练计划
            </h1>
          </div>
          <button 
            onClick={() => navigate('/create-plan')}
            className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-[#d3a971] hover:bg-[#d3a971]/10 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide px-6 pt-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {isLoadingCoachLinked ? (
            <div className="mb-8">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 snap-x">
                <div className="snap-center shrink-0 w-[220px] h-[220px] rounded-[20px] bg-white/[0.02] border border-white/[0.05] animate-pulse p-5" />
              </div>
            </div>
          ) : isCoachLinked ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-widest text-[#7cc8ff]">教练下发</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 snap-x">
              {isLoadingCoachPlans ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={`coach-skeleton-${i}`} className="snap-center shrink-0 w-[220px] h-[220px] rounded-[20px] bg-white/[0.02] border border-white/[0.05] animate-pulse p-5">
                    <div className="w-20 h-4 rounded bg-white/[0.08] mb-3" />
                    <div className="w-24 h-3 rounded bg-white/[0.06] mb-2" />
                    <div className="w-28 h-3 rounded bg-white/[0.06]" />
                  </div>
                ))
              ) : coachPlansError ? (
                <div className="snap-center w-[85vw] max-w-[340px] shrink-0 h-[220px] rounded-[20px] bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center gap-3 text-red-200">
                  <p className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider">教练计划加载失败</p>
                  <p className="text-[11px] font-['JetBrains_Mono',_monospace] text-red-100/70 max-w-[250px] text-center">{coachPlansError}</p>
                  <button
                    onClick={() => void loadCoachPlans()}
                    className="mt-1 px-5 py-2 rounded-full border border-red-300/30 bg-red-500/20 text-[11px] font-['Noto_Serif_SC',_serif] tracking-wider text-red-100 hover:bg-red-500/30 transition-colors"
                  >
                    重试加载
                  </button>
                </div>
              ) : coachPlans.length === 0 ? (
                <div className="snap-center w-[85vw] max-w-[340px] shrink-0 h-[220px] rounded-[20px] bg-white/[0.02] border border-white/[0.05] border-dashed flex flex-col items-center justify-center gap-3 text-white/40">
                  <p className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider">暂无教练下发计划</p>
                  <p className="text-[11px] font-['JetBrains_Mono',_monospace] text-white/30">教练发布后会自动出现在这里</p>
                </div>
              ) : coachPlans.map((plan, i) => (
                (() => {
                  const dateLabel =
                    plan.date === todayKey ? '今日待完成' : plan.date < todayKey ? '已过期待完成' : '即将到来';
                  const dateLabelClass =
                    plan.date === todayKey
                      ? 'text-[#7cc8ff] bg-[#7cc8ff]/10 border-[#7cc8ff]/30'
                      : plan.date < todayKey
                        ? 'text-orange-300 bg-orange-500/10 border-orange-400/30'
                        : 'text-emerald-300 bg-emerald-500/10 border-emerald-400/30';
                  return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="snap-center shrink-0 w-[220px] h-[220px] rounded-[20px] relative overflow-hidden group bg-gradient-to-br from-[#111722] to-[#090d14] border border-[#7cc8ff]/25 flex flex-col justify-between p-5 hover:border-[#7cc8ff]/55 transition-colors"
                >
                  <div>
                    <span className="text-[#7cc8ff] bg-[#7cc8ff]/10 border border-[#7cc8ff]/25 text-[10px] font-['JetBrains_Mono',_monospace] px-2 py-1 rounded-[6px] tracking-widest mb-3 inline-block">
                      PLANNED
                    </span>
                    <span className={cn("ml-2 border text-[10px] font-['JetBrains_Mono',_monospace] px-2 py-1 rounded-[6px] tracking-widest", dateLabelClass)}>
                      {dateLabel}
                    </span>
                    <h3 className="text-[16px] font-['Noto_Serif_SC',_serif] text-white/90 tracking-wider mb-2">教练日计划</h3>
                    <p className="text-[11px] text-white/40 font-['JetBrains_Mono',_monospace] tracking-widest">{plan.date}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.05]">
                    <div className="flex flex-col gap-1.5 text-[9px] font-['JetBrains_Mono',_monospace] text-white/45">
                      <span>{plan.exercises.length} 个动作</span>
                    </div>
                    <button
                      onClick={() => void handleStartCoachPlan(plan)}
                      className="w-8 h-8 rounded-full bg-[#7cc8ff] text-black flex items-center justify-center transition-all disabled:opacity-50"
                      disabled={plan.exercises.length === 0}
                    >
                      <Play size={14} fill="currentColor" className="ml-0.5" />
                    </button>
                  </div>
                </motion.div>
                  );
                })()
              ))}
            </div>
          </div>
          ) : null}

          {/* Custom Plans Module */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-widest text-[#d3a971]">个人计划</h3>
            </div>

            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 snap-x">
               {customPlans.length === 0 ? (
                 <div className="snap-center w-[85vw] max-w-[340px] shrink-0 h-[220px] rounded-[20px] bg-white/[0.02] border border-white/[0.05] border-dashed flex flex-col items-center justify-center gap-4 text-white/40">
                   <p className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider">暂无个人计划</p>
                   <button 
                     onClick={() => navigate('/create-plan')}
                     className="px-6 py-2 rounded-full bg-[#d3a971]/10 text-[#d3a971] text-[12px] font-['Noto_Serif_SC',_serif] tracking-widest border border-[#d3a971]/20 hover:bg-[#d3a971] hover:text-black transition-colors"
                   >
                     + 去创建
                   </button>
                 </div>
               ) : customPlans.map((plan, i) => (
                 <motion.div 
                   key={plan.id}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.1, duration: 0.5 }}
                   className="snap-center shrink-0 w-[220px] h-[240px] rounded-[20px] relative overflow-hidden group bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-[#d3a971]/30 flex flex-col justify-between p-5 hover:border-[#d3a971]/60 transition-colors"
                 >
                    <div>
                     <div className="flex items-center justify-between mb-3">
                       <span className="text-[#d3a971] bg-[#d3a971]/10 border border-[#d3a971]/20 text-[10px] font-['JetBrains_Mono',_monospace] px-2 py-1 rounded-[6px] tracking-widest">
                         {plan.level}
                       </span>
                       <div className="flex items-center gap-2">
                         <button
                           onClick={() => handleEditPlan(plan)}
                           className="w-7 h-7 rounded-full border border-white/[0.12] bg-white/[0.03] text-white/60 hover:text-[#d3a971] hover:border-[#d3a971]/40 transition-colors flex items-center justify-center"
                         >
                           <PenSquare size={14} />
                         </button>
                         <button
                           onClick={() => setPendingDeletePlanId(plan.id)}
                           className="w-7 h-7 rounded-full border border-red-400/25 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors flex items-center justify-center"
                         >
                           <Trash2 size={14} />
                         </button>
                       </div>
                     </div>
                      <h3 className="text-[16px] font-['Noto_Serif_SC',_serif] text-white/90 tracking-wider mb-2 line-clamp-2">{plan.title}</h3>
                      <p className="text-[11px] text-white/40 font-['Noto_Serif_SC',_serif] tracking-widest">{plan.subtitle}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.05]">
                      <div className="flex flex-col gap-1.5 text-[9px] font-['JetBrains_Mono',_monospace] text-white/40">
                         <span className="flex items-center gap-1.5"><Flame size={10} className="text-[#d3a971]" /> {plan.time}</span>
                         <span className="flex items-center gap-1.5"><TrendingUp size={10} className="text-[#d3a971]" /> {plan.sets}</span>
                      </div>
                     <button
                       onClick={() => handleStartPlan(plan)}
                       className="w-8 h-8 rounded-full bg-[#d3a971] text-black flex items-center justify-center transition-all"
                     >
                        <Play size={14} fill="currentColor" className="ml-0.5" />
                      </button>
                    </div>
                 </motion.div>
               ))}
            </div>
          </div>

          {/* Training Plans Module */}
          <div className="mb-4">
            <h3 className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/80 mb-5">基础计划</h3>

            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
              {planCategories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActivePlanCategory(cat)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[12px] font-['Noto_Serif_SC',_serif] tracking-widest whitespace-nowrap transition-all",
                    activePlanCategory === cat 
                      ? "bg-white/10 text-white font-semibold" 
                      : "bg-white/[0.03] text-white/50 border border-white/[0.05] hover:text-white"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-6 px-6 snap-x">
               {isLoadingRecommended ? (
                 Array.from({ length: 2 }).map((_, i) => (
                   <div key={`skeleton-${i}`} className="snap-center shrink-0 w-[200px] h-[220px] rounded-[20px] bg-white/[0.02] border border-white/[0.05] animate-pulse p-5">
                     <div className="w-14 h-5 rounded bg-white/[0.06] mb-4" />
                     <div className="w-28 h-4 rounded bg-white/[0.08] mb-2" />
                     <div className="w-20 h-3 rounded bg-white/[0.06]" />
                     <div className="mt-12 pt-4 border-t border-white/[0.05]">
                       <div className="w-20 h-3 rounded bg-white/[0.06] mb-2" />
                       <div className="w-16 h-3 rounded bg-white/[0.06]" />
                     </div>
                   </div>
                 ))
               ) : recommendedError ? (
                 <div className="snap-center w-[85vw] max-w-[340px] shrink-0 h-[220px] rounded-[20px] bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center gap-3 text-red-200">
                   <p className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider">基础计划加载失败</p>
                   <p className="text-[11px] font-['JetBrains_Mono',_monospace] text-red-100/70 max-w-[250px] text-center">
                     {recommendedError}
                   </p>
                   <button
                     onClick={() => void loadRecommendedPlans()}
                     className="mt-1 px-5 py-2 rounded-full border border-red-300/30 bg-red-500/20 text-[11px] font-['Noto_Serif_SC',_serif] tracking-wider text-red-100 hover:bg-red-500/30 transition-colors"
                   >
                     重试加载
                   </button>
                 </div>
               ) : displayedPlans.length === 0 ? (
                 <div className="snap-center w-[85vw] max-w-[340px] shrink-0 h-[220px] rounded-[20px] bg-white/[0.02] border border-white/[0.05] border-dashed flex flex-col items-center justify-center gap-3 text-white/40">
                   <p className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider">暂无该分类计划</p>
                   <p className="text-[11px] font-['JetBrains_Mono',_monospace] text-white/30">
                     当前分类：{activePlanCategory}
                   </p>
                 </div>
               ) : displayedPlans.map((plan, i) => (
                 <motion.div 
                   key={plan.id}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.1, duration: 0.5 }}
                   className="snap-center shrink-0 w-[200px] h-[220px] rounded-[20px] relative overflow-hidden group bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/[0.05] flex flex-col justify-between p-5 hover:border-[#d3a971]/30 transition-colors"
                 >
                    <div>
                      <span className="text-white/60 bg-white/[0.05] border border-white/[0.1] text-[10px] font-['JetBrains_Mono',_monospace] px-2 py-1 rounded-[6px] tracking-widest mb-4 inline-block">
                        {plan.level}
                      </span>
                      <h3 className="text-[16px] font-['Noto_Serif_SC',_serif] text-white/90 tracking-wider mb-2">{plan.title}</h3>
                      <p className="text-[11px] text-white/40 font-['Noto_Serif_SC',_serif] tracking-widest">{plan.subtitle}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.05]">
                      <div className="flex flex-col gap-1.5 text-[9px] font-['JetBrains_Mono',_monospace] text-white/40">
                         <span className="flex items-center gap-1.5"><Flame size={10} className="text-white/40" /> {plan.time}</span>
                         <span className="flex items-center gap-1.5"><TrendingUp size={10} className="text-white/40" /> {plan.sets}</span>
                      </div>
                      <button
                        onClick={() => handleStartPlan(plan)}
                        className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-white/60 transition-all group-hover:bg-[#d3a971] group-hover:text-black group-hover:border-[#d3a971]"
                      >
                        <Play size={14} fill="currentColor" className="ml-0.5" />
                      </button>
                    </div>
                 </motion.div>
               ))}
            </div>
          </div>

        </motion.div>
      </main>

      {pendingDeletePlanId && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-2xl border border-red-400/30 bg-[#111] p-5">
            <h3 className="text-[16px] text-white/90 font-['Noto_Serif_SC',_serif] tracking-wider mb-2">确认删除计划</h3>
            <p className="text-[12px] text-white/55 mb-5">删除后无法恢复，确定要删除这个个人计划吗？</p>
            <div className="flex justify-end gap-2">
              <button
                disabled={isDeletingPlan}
                onClick={() => setPendingDeletePlanId(null)}
                className="px-4 py-2 rounded-lg border border-white/10 text-white/70 text-[12px] disabled:opacity-50"
              >
                取消
              </button>
              <button
                disabled={isDeletingPlan}
                onClick={() => void handleDeletePlan(pendingDeletePlanId)}
                className="px-4 py-2 rounded-lg bg-red-500/90 text-white text-[12px] font-semibold disabled:opacity-60"
              >
                {isDeletingPlan ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}