import { motion } from 'motion/react';
import { ChevronLeft, Share, Trash2, Edit3, CheckCircle2, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { useNavigate, useParams, useLocation, useOutletContext } from 'react-router';
import { cn } from '../utils';
import { useEffect, useState } from 'react';
import { api, WorkoutDetailData } from '../services/api';
import type { OutletContextType } from '../Root';
import { toast } from 'sonner';
import { userAppService } from '../services/userApp';

export function WorkoutDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { deleteWorkoutById } = useOutletContext<OutletContextType>();
  const { isCoachView, studentName, workout: stateWorkout } = location.state || {};

  const [workout, setWorkout] = useState<WorkoutDetailData | null>(() => {
    if (stateWorkout) {
      return {
        id: stateWorkout.id || id || '',
        title: stateWorkout.title,
        date: stateWorkout.date,
        duration: "计算中...",
        volume: stateWorkout.volume ? stateWorkout.volume.toString() : "0",
        exercises: []
      };
    }
    return null;
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingExerciseKey, setEditingExerciseKey] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    const fetchWorkout = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getWorkoutDetail(id, isCoachView);
        setWorkout(data);
      } catch (err: any) {
        setError(err.message || '获取训练详情失败');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkout();
  }, [id, isCoachView]);

  const handleShare = async () => {
    if (!workout) return;
    const shareText = [
      `训练记录：${workout.title}`,
      `日期：${new Date(workout.date).toLocaleString()}`,
      `时长：${workout.duration}`,
      `容量：${workout.volume}`,
      `动作数：${workout.exercises.length}`,
    ].join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: workout.title, text: shareText });
        return;
      }
      await navigator.clipboard.writeText(shareText);
      toast.success('训练记录已复制到剪贴板');
    } catch {
      toast.info('分享已取消');
    }
  };

  const updateSetField = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
    setWorkout((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as WorkoutDetailData;
      const ex = next.exercises?.[exerciseIndex];
      if (!ex?.sets?.[setIndex]) return prev;
      ex.sets[setIndex][field] = Number.isFinite(value) ? value : 0;
      return next;
    });
  };

  const saveWorkoutEdit = async () => {
    if (!workout || !id) return;
    const userId = localStorage.getItem('latte.userId') || '';
    if (!userId) {
      toast.error('请先登录后再编辑');
      return;
    }
    try {
      setIsSavingEdit(true);
      await userAppService.saveWorkout({
        ...workout,
        id,
        userId,
        studentId: userId,
      } as any);
      toast.success('训练记录已保存');
      setEditingExerciseKey(null);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || '保存失败，请稍后重试');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative bg-[#080808]">
      <header className="pt-12 px-6 pb-6 relative z-20 flex flex-col bg-[#141414]/30 backdrop-blur-xl border-b border-white/[0.03]">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            {!isCoachView && (
              <>
                <button
                  onClick={() => void handleShare()}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/50 hover:text-[#d3a971] transition-colors"
                >
                  <Share size={18} />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/50 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#d3a971] shadow-[0_0_8px_#d3a971]" />
            <span className="text-[10px] text-[#d3a971]/80 font-['JetBrains_Mono',_monospace] uppercase tracking-[0.2em]">
              {isCoachView ? `${studentName} 的训练记录` : 'COMPLETED SESSION'}
            </span>
          </div>
          {workout ? (
            <>
              <h1 className="text-[24px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90 mb-1">
                {workout.title}
              </h1>
              <span className="text-[12px] text-white/40 font-['JetBrains_Mono',_monospace] tracking-wider">
                {workout.date}
              </span>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-3 rounded-[16px] bg-[#1a1a1a] border border-white/[0.03] flex flex-col items-center">
                  <span className="text-[10px] text-[#d3a971]/60 font-['JetBrains_Mono',_monospace] tracking-[0.1em] mb-1">DURATION</span>
                  <span className="font-['JetBrains_Mono',_monospace] text-[18px] text-white">{workout.duration.replace('分钟', 'm')}</span>
                </div>
                <div className="p-3 rounded-[16px] bg-[#1a1a1a] border border-white/[0.03] flex flex-col items-center">
                  <span className="text-[10px] text-[#d3a971]/60 font-['JetBrains_Mono',_monospace] tracking-[0.1em] mb-1">VOLUME</span>
                  <span className="font-['JetBrains_Mono',_monospace] text-[18px] text-white">{workout.volume}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="animate-pulse flex flex-col mt-2">
              <div className="h-8 bg-white/5 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-white/5 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-[72px] bg-white/5 rounded-[16px]"></div>
                <div className="h-[72px] bg-white/5 rounded-[16px]"></div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide px-6 pt-6">
        {error ? (
          <div className="flex flex-col items-center justify-center h-40 bg-[#141414]/50 border border-red-500/10 rounded-[20px] p-5">
            <AlertCircle className="text-red-400 mb-3" size={32} />
            <p className="text-red-400/80 text-[14px]">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[12px] text-white/60 transition-colors"
            >
              重试
            </button>
          </div>
        ) : loading && (!workout || workout.exercises.length === 0) ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-[#d3a971]" size={24} />
            <span className="ml-3 text-[12px] text-white/40 tracking-wider">同步云端数据中...</span>
          </div>
        ) : workout && workout.exercises.length > 0 ? (
          <>
            {!!workout.coachGuidance && (
              <div className="mb-5 bg-[#141414]/70 border border-[#d3a971]/20 rounded-[16px] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={14} className="text-[#d3a971]" />
                  <span className="text-[11px] tracking-wider text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase">
                    教练指导
                  </span>
                </div>
                <p className="text-[13px] text-white/80 leading-relaxed">{workout.coachGuidance}</p>
                {!!workout.coachGuidanceUpdatedAt && (
                  <div className="mt-2 text-[10px] text-white/35 font-['JetBrains_Mono',_monospace]">
                    更新于 {new Date(workout.coachGuidanceUpdatedAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}
            <h3 className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/80 mb-4 flex items-center justify-between">
              训练动作
              <span className="text-[9px] text-[#d3a971] font-['JetBrains_Mono',_monospace] border border-[#d3a971]/30 px-2 py-0.5 rounded tracking-widest">{workout.exercises.length} EXERCISES</span>
            </h3>

            <div className="space-y-4">
              {workout.exercises.map((ex, i) => {
                const exerciseKey = `${ex.name}-${i}`;
                const isEditing = editingExerciseKey === exerciseKey;
                return (
                <motion.div 
                  key={exerciseKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#141414]/50 border border-white/[0.03] rounded-[20px] p-5 relative overflow-hidden"
                >
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <CheckCircle2 size={40} className="text-[#d3a971]" strokeWidth={1} />
              </div>

              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex flex-col">
                  <h4 className="text-[16px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90">
                    {ex.name}
                  </h4>
                  <span className="text-[10px] text-[#d3a971]/70 font-['JetBrains_Mono',_monospace] uppercase tracking-[0.15em] mt-1">
                    {ex.muscle}
                  </span>
                </div>
                <button
                  onClick={() => setEditingExerciseKey(isEditing ? null : exerciseKey)}
                  className="w-8 h-8 rounded-full hover:bg-white/[0.05] text-white/30 flex items-center justify-center transition-colors"
                >
                  <Edit3 size={14} />
                </button>
              </div>

              <div className="space-y-[2px] relative z-10">
                <div className="flex text-[9px] font-['JetBrains_Mono',_monospace] text-white/30 px-2 pb-2 uppercase tracking-[0.2em] border-b border-white/[0.03] mb-2">
                  <div className="w-[20%]">SET</div>
                  <div className="w-[40%] text-center">KG</div>
                  <div className="w-[40%] text-center">REPS</div>
                </div>

                {ex.sets.map((set, j) => (
                  <div key={j} className="flex items-center rounded-[10px] py-1.5 px-2 bg-gradient-to-r from-transparent via-[#d3a971]/[0.02] to-transparent border border-[#d3a971]/[0.02]">
                    <div className="w-[20%] flex">
                      <div className={cn(
                        "w-5 h-5 rounded flex items-center justify-center text-[10px] font-['JetBrains_Mono',_monospace]",
                        set.type === "W" ? "text-[#8b6f4e] bg-[#8b6f4e]/10" :
                        set.type === "D" ? "text-[#b24848] bg-[#b24848]/10" :
                        "text-[#d3a971]"
                      )}>
                        {set.type === "N" ? j + 1 : set.type}
                      </div>
                    </div>
                    <div className="w-[40%] text-center font-['JetBrains_Mono',_monospace] text-[14px] text-white/70">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={set.weight}
                          onChange={(e) => updateSetField(i, j, 'weight', Number(e.target.value || 0))}
                          className="w-16 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-center text-white"
                        />
                      ) : (
                        set.weight
                      )}
                    </div>
                    <div className="w-[40%] text-center font-['JetBrains_Mono',_monospace] text-[14px] text-white/70">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={set.reps}
                          onChange={(e) => updateSetField(i, j, 'reps', Number(e.target.value || 0))}
                          className="w-16 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-center text-white"
                        />
                      ) : (
                        set.reps
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {isEditing && (
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setEditingExerciseKey(null)}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-white/60 text-[12px]"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => void saveWorkoutEdit()}
                    disabled={isSavingEdit}
                    className="px-3 py-1.5 rounded-lg bg-[#d3a971] text-black text-[12px] font-semibold disabled:opacity-60"
                  >
                    {isSavingEdit ? '保存中...' : '保存'}
                  </button>
                </div>
              )}
            </motion.div>
          )})}
        </div>
      </>
    ) : (
      <div className="flex flex-col items-center justify-center h-40 text-white/40 text-[12px]">
        暂无训练数据
      </div>
    )}
  </main>

      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 bg-black/65 backdrop-blur-[2px] flex items-center justify-center px-6">
          <div className="w-full max-w-[320px] rounded-2xl border border-white/[0.08] bg-[#121212] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.55)]">
            <h3 className="text-[16px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90 mb-2">删除训练记录</h3>
            <p className="text-[12px] text-white/55 leading-relaxed mb-5">
              确认删除本次训练记录吗？删除后将无法恢复。
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-white/70 text-[12px] hover:bg-white/[0.04] transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  if (!id || isDeleting) return;
                  try {
                    setIsDeleting(true);
                    await deleteWorkoutById(id);
                    toast.success('训练记录已删除');
                    setShowDeleteConfirm(false);
                    navigate('/history');
                  } catch (error: any) {
                    const message = error instanceof Error ? error.message : String(error);
                    toast.error(message || '删除失败，请稍后重试');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-[#d3a971] text-black text-[12px] font-semibold hover:brightness-95 transition-colors disabled:opacity-60"
              >
                {isDeleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
</div>
);
}