import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { ChevronLeft, MoreVertical, Plus, Send, Copy, Dumbbell, Trash2, Search, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../../utils';
import { coachScheduleService, DayPlan, Exercise, Template } from '../../services/coachSchedule';
import { ExerciseSelectorModal } from '../../components/ExerciseSelectorModal';

const MUSCLE_CATEGORIES = ["全部", "胸部", "背部", "腿部", "肩部", "手臂", "核心", "全身"];

export function CoachPlanDay() {
  const navigate = useNavigate();
  const { id, date } = useParams<{ id: string; date: string }>();
  const location = useLocation();
  const studentName = location.state?.studentName || '学员';

  const [plan, setPlan] = useState<DayPlan | null>(null);
  
  // Modals state
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showTemplateSelect, setShowTemplateSelect] = useState(false);
  const [showImportAction, setShowImportAction] = useState<{ template: Template } | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!id || !date) return;
      const [existing, loadedTemplates] = await Promise.all([
        coachScheduleService.getPlanByDate(id, date),
        coachScheduleService.getTemplates(),
      ]);
      setTemplates(loadedTemplates);
      if (existing) {
        setPlan(existing);
      } else {
        setPlan({ id: `new-${Date.now()}`, date, studentId: id, status: 'planned', exercises: [] });
      }
    };
    void loadData();
  }, [id, date]);

  const handleBack = () => {
    navigate(`/coach/student/${id}`, { 
      state: { student: { name: studentName }, activeTab: 'plan' } 
    });
  };

  const handleSend = async () => {
    if (plan && id) {
      await coachScheduleService.savePlan({ ...plan, status: 'planned' });
      toast.success('发送完成', { position: 'top-center' });
      setTimeout(() => handleBack(), 1000);
    }
  };

  const handleAddExercise = (exName: string, muscle: string) => {
    if (!plan) return;
    const newEx: Exercise = {
      id: `ex-${Date.now()}`,
      name: exName,
      muscle,
      sets: [{ reps: 10, weight: 0, type: 'N' }, { reps: 10, weight: 0, type: 'N' }]
    };
    setPlan({ ...plan, exercises: [...plan.exercises, newEx] });
    toast.success(`已添加 ${exName}`);
  };

  const handleRemoveExercise = (exId: string) => {
    if (!plan) return;
    setPlan({ ...plan, exercises: plan.exercises.filter(e => e.id !== exId) });
  };

  const handleAddSet = (exId: string) => {
    if (!plan) return;
    const newExercises = plan.exercises.map(ex => {
      if (ex.id === exId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, { 
            reps: lastSet ? lastSet.reps : 10, 
            weight: lastSet ? lastSet.weight : 0, 
            type: 'N' as const 
          }]
        };
      }
      return ex;
    });
    setPlan({ ...plan, exercises: newExercises });
  };

  const handleRemoveSet = (exId: string, setIndex: number) => {
    if (!plan) return;
    const newExercises = plan.exercises.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          sets: ex.sets.filter((_, idx) => idx !== setIndex)
        };
      }
      return ex;
    });
    setPlan({ ...plan, exercises: newExercises });
  };

  const handleUpdateSet = (exId: string, setIndex: number, field: 'reps' | 'weight', value: number) => {
    if (!plan) return;
    const newExercises = plan.exercises.map(ex => {
      if (ex.id === exId) {
        const newSets = [...ex.sets];
        newSets[setIndex] = { ...newSets[setIndex], [field]: value };
        return { ...ex, sets: newSets };
      }
      return ex;
    });
    setPlan({ ...plan, exercises: newExercises });
  };

  const handleImportTemplate = (template: Template, mode: 'append' | 'overwrite') => {
    if (!plan) return;
    const newExercises = template.exercises.map(e => ({ ...e, id: `ex-${Date.now()}-${Math.random()}` }));
    
    if (mode === 'overwrite') {
      setPlan({ ...plan, exercises: newExercises });
    } else {
      setPlan({ ...plan, exercises: [...plan.exercises, ...newExercises] });
    }
    
    setShowImportAction(null);
    setShowTemplateSelect(false);
    setShowMoreMenu(false);
  };

  if (!plan) return null;

  return (
    <div className="flex flex-col h-full relative bg-[#080808]">
      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
      <header className="pt-12 px-6 pb-6 relative z-20 flex flex-col bg-[#141414]/30 backdrop-blur-xl border-b border-white/[0.03]">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={handleBack}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-4 relative">
            <span className="text-[12px] text-[#d3a971]/80 font-['JetBrains_Mono',_monospace] uppercase tracking-widest border border-[#d3a971]/20 bg-[#d3a971]/10 px-3 py-1 rounded-full">
              {studentName}
            </span>
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/50 hover:text-white transition-colors"
            >
              <MoreVertical size={20} />
            </button>

            <AnimatePresence>
              {showMoreMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-12 right-0 w-48 bg-[#1a1a1a] border border-white/[0.05] rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  <button 
                    onClick={() => { setShowTemplateSelect(true); setShowMoreMenu(false); }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-[14px] text-white/80 hover:bg-white/5 transition-colors"
                  >
                    <Copy size={16} className="text-[#d3a971]" />
                    导入模板
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <h1 className="text-[24px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90 mb-1">
          排期训练
        </h1>
        <span className="text-[14px] text-white/40 font-['JetBrains_Mono',_monospace] tracking-widest">
          {date}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 px-6 pt-6 scrollbar-hide">
        {plan.exercises.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center mt-20">
            <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-6 text-white/20">
              <Dumbbell size={32} />
            </div>
            <h3 className="text-[18px] font-['Noto_Serif_SC',_serif] text-white/90 mb-2">空空如也</h3>
            <p className="text-[12px] text-white/40 mb-10 max-w-[200px] mx-auto leading-relaxed">
              为 {studentName} 的 {date} 添加新的训练动作，或直接导入模板
            </p>
            
            <div className="flex flex-col gap-4 w-full max-w-[240px]">
              <button 
                onClick={() => setShowAddExercise(true)}
                className="w-full py-3.5 rounded-xl bg-[#d3a971] text-black font-medium tracking-widest hover:bg-[#d3a971]/90 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                添加动作
              </button>
              <button 
                onClick={() => setShowTemplateSelect(true)}
                className="w-full py-3.5 rounded-xl bg-[#1a1a1a] border border-white/[0.05] text-white/80 tracking-widest hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                <Copy size={18} className="text-white/40" />
                导入模板
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {plan.exercises.map((ex, i) => (
              <motion.div 
                key={ex.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#141414]/50 border border-white/[0.03] rounded-[20px] p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <h4 className="text-[16px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90">
                      {ex.name}
                    </h4>
                    <span className="text-[10px] text-[#d3a971]/70 font-['JetBrains_Mono',_monospace] uppercase tracking-[0.15em] mt-1">
                      {ex.muscle}
                    </span>
                  </div>
                  <button onClick={() => handleRemoveExercise(ex.id)} className="w-8 h-8 rounded-full hover:bg-white/[0.05] text-red-400/50 hover:text-red-400 flex items-center justify-center transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex text-[10px] text-white/30 font-['JetBrains_Mono',_monospace] uppercase tracking-wider px-3 pb-1">
                    <div className="w-[15%]">SET</div>
                    <div className="w-[35%] text-center">KG</div>
                    <div className="w-[35%] text-center">REPS</div>
                    <div className="w-[15%]"></div>
                  </div>
                  {ex.sets.map((set, j) => (
                    <div key={j} className="flex items-center rounded-xl py-1.5 px-3 bg-white/[0.02] border border-white/[0.03]">
                      <div className="w-[15%] text-[12px] text-[#d3a971] font-['JetBrains_Mono',_monospace]">{j + 1}</div>
                      <div className="w-[35%] flex justify-center">
                        <input 
                          type="number" 
                          value={set.weight || ''} 
                          onChange={(e) => handleUpdateSet(ex.id, j, 'weight', Number(e.target.value))}
                          placeholder="-"
                          className="w-14 text-center bg-transparent border-b border-white/10 focus:border-[#d3a971] text-[14px] text-white/90 font-['JetBrains_Mono',_monospace] outline-none transition-colors"
                        />
                      </div>
                      <div className="w-[35%] flex justify-center">
                        <input 
                          type="number" 
                          value={set.reps || ''} 
                          onChange={(e) => handleUpdateSet(ex.id, j, 'reps', Number(e.target.value))}
                          placeholder="-"
                          className="w-12 text-center bg-transparent border-b border-white/10 focus:border-[#d3a971] text-[14px] text-white/90 font-['JetBrains_Mono',_monospace] outline-none transition-colors"
                        />
                      </div>
                      <div className="w-[15%] flex justify-end">
                        <button 
                          onClick={() => handleRemoveSet(ex.id, j)}
                          className="w-6 h-6 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => handleAddSet(ex.id)}
                    className="w-full mt-2 py-2 rounded-xl text-[12px] text-[#d3a971] bg-[#d3a971]/5 hover:bg-[#d3a971]/10 border border-[#d3a971]/10 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={14} /> 添加组
                  </button>
                </div>
              </motion.div>
            ))}

            <button 
              onClick={() => setShowAddExercise(true)}
              className="w-full py-4 mt-6 rounded-xl border border-dashed border-white/10 text-white/40 hover:bg-white/[0.02] hover:text-white/80 hover:border-white/20 transition-all flex items-center justify-center gap-2 text-[14px]"
            >
              <Plus size={16} />
              添加训练动作
            </button>
          </div>
        )}
      </main>

      {/* Footer Send Button */}
      {plan.exercises.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#080808] via-[#080808]/80 to-transparent z-10">
          <button 
            onClick={handleSend}
            className="w-full py-4 rounded-xl bg-[#d3a971] text-black font-bold tracking-widest text-[16px] flex items-center justify-center gap-2 hover:bg-[#d3a971]/90 transition-all"
          >
            <Send size={18} />
            发送学员
          </button>
        </div>
      )}

      {/* Exercise Library Modal (Matches Exercises.tsx) */}
      <ExerciseSelectorModal 
        isOpen={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onSelect={(exercise) => handleAddExercise(exercise.name, exercise.muscle)}
      />

      {/* Mock Template Select Modal */}
      <AnimatePresence>
        {showTemplateSelect && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#141414] w-full max-w-[400px] rounded-3xl border border-white/[0.05] overflow-hidden"
            >
              <div className="p-6 border-b border-white/[0.05]">
                <h3 className="text-[18px] font-['Noto_Serif_SC',_serif] text-white mb-2">导入模板</h3>
                <p className="text-[12px] text-white/40">选择一个模板应用到当天的训练计划中</p>
              </div>
              <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                {templates.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => {
                      if (plan.exercises.length > 0) {
                        setShowImportAction({ template: t });
                      } else {
                        handleImportTemplate(t, 'overwrite');
                      }
                    }}
                    className="w-full p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-[#d3a971]/30 transition-all text-left"
                  >
                    <div className="text-[16px] text-white/90 mb-1">{t.name}</div>
                    <div className="text-[12px] text-[#d3a971]">{t.exercises.length} 个动作</div>
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-white/[0.05]">
                <button onClick={() => setShowTemplateSelect(false)} className="w-full py-3 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors">
                  取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Append/Overwrite Action Modal */}
      <AnimatePresence>
        {showImportAction && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-black/90 flex items-end sm:items-center justify-center p-4 pb-12 sm:p-6"
          >
            <motion.div 
              initial={{ y: '100%', scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: '100%', scale: 0.95 }}
              className="bg-[#1a1a1a] w-full max-w-[400px] rounded-3xl border border-white/[0.05] p-6 shadow-2xl"
            >
              <h3 className="text-[20px] font-['Noto_Serif_SC',_serif] text-white mb-2 text-center">覆盖还是追加？</h3>
              <p className="text-[14px] text-white/40 text-center mb-8">
                当前日期已经存在 {plan.exercises.length} 个训练动作，导入模板将会...
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => handleImportTemplate(showImportAction.template, 'append')}
                  className="w-full py-4 rounded-xl bg-[#d3a971]/10 border border-[#d3a971]/30 text-[#d3a971] hover:bg-[#d3a971]/20 transition-colors"
                >
                  追加到当前计划中
                </button>
                <button 
                  onClick={() => handleImportTemplate(showImportAction.template, 'overwrite')}
                  className="w-full py-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  清除当前计划并覆盖
                </button>
                <button 
                  onClick={() => setShowImportAction(null)}
                  className="w-full py-4 rounded-xl text-white/40 hover:text-white/80 transition-colors mt-2"
                >
                  取消导入
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}