import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Plus, Trash2, Dumbbell, FileText, X, Search, Check } from 'lucide-react';
import { coachScheduleService, Template, Exercise } from '../../services/coachSchedule';
import { cn } from '../../utils';
import { toast } from 'sonner';
import { ExerciseSelectorModal } from '../../components/ExerciseSelectorModal';

type Mode = 'list' | 'edit';

export function CoachTemplates() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('list');
  const [templates, setTemplates] = useState<Template[]>([]);
  
  // Edit mode state
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
  // Add Exercise state
  const [showAddExercise, setShowAddExercise] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      const data = await coachScheduleService.getTemplates();
      setTemplates(data);
    };
    void loadTemplates();
  }, []);

  const handleCreateNew = () => {
    const newTemplate: Template = {
      id: `t_${Date.now()}`,
      name: '新建训练模板',
      exercises: []
    };
    setEditingTemplate(newTemplate);
    setMode('edit');
  };

  const handleEdit = (t: Template) => {
    // Deep clone to avoid mutating directly
    setEditingTemplate(JSON.parse(JSON.stringify(t)));
    setMode('edit');
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await coachScheduleService.deleteTemplate(id);
    setTemplates(await coachScheduleService.getTemplates());
    toast.success('模板已删除');
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate || !editingTemplate.name.trim()) {
      toast.error('请填写模板名称');
      return;
    }
    if (editingTemplate.exercises.length === 0) {
      toast.error('请至少添加一个动作');
      return;
    }
    
    await coachScheduleService.saveTemplate(editingTemplate);
    setTemplates(await coachScheduleService.getTemplates());
    setMode('list');
    setEditingTemplate(null);
    toast.success('模板保存成功');
  };

  const handleAddExerciseToTemplate = (exName: string, exMuscle: string) => {
    if (!editingTemplate) return;
    
    const newEx: Exercise = {
      id: `ex_${Date.now()}`,
      name: exName,
      muscle: exMuscle,
      sets: [
        { reps: 10, weight: 0, type: 'N' },
        { reps: 10, weight: 0, type: 'N' },
        { reps: 10, weight: 0, type: 'N' }
      ]
    };

    setEditingTemplate({
      ...editingTemplate,
      exercises: [...editingTemplate.exercises, newEx]
    });
    
    toast.success(`已添加 ${exName}`);
  };

  const handleRemoveExercise = (exId: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      exercises: editingTemplate.exercises.filter(ex => ex.id !== exId)
    });
  };

  const handleUpdateSet = (exId: string, setIdx: number, field: 'reps' | 'weight', val: string) => {
    if (!editingTemplate) return;
    
    const num = parseInt(val) || 0;
    
    setEditingTemplate({
      ...editingTemplate,
      exercises: editingTemplate.exercises.map(ex => {
        if (ex.id === exId) {
          const newSets = [...ex.sets];
          newSets[setIdx] = { ...newSets[setIdx], [field]: num };
          return { ...ex, sets: newSets };
        }
        return ex;
      })
    });
  };

  const handleAddSet = (exId: string) => {
    if (!editingTemplate) return;
    
    setEditingTemplate({
      ...editingTemplate,
      exercises: editingTemplate.exercises.map(ex => {
        if (ex.id === exId) {
          const lastSet = ex.sets[ex.sets.length - 1];
          return { 
            ...ex, 
            sets: [...ex.sets, { ...lastSet, type: 'N' }] 
          };
        }
        return ex;
      })
    });
  };

  const handleRemoveSet = (exId: string, setIdx: number) => {
    if (!editingTemplate) return;
    
    setEditingTemplate({
      ...editingTemplate,
      exercises: editingTemplate.exercises.map(ex => {
        if (ex.id === exId) {
          return { ...ex, sets: ex.sets.filter((_, i) => i !== setIdx) };
        }
        return ex;
      })
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#080808] text-white relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#d3a971]/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#d3a971]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />

      {mode === 'list' && (
        <motion.div 
          key="list"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex flex-col h-full z-10"
        >
          <header className="pt-12 px-6 pb-4 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => navigate('/coach/dashboard')}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/50 hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.2em] mb-1">
                  TEMPLATE LIBRARY
                </span>
                <h1 className="text-[20px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90">
                  训练模板库
                </h1>
              </div>
              <div className="w-10" />
            </div>
            
            <button 
              onClick={handleCreateNew}
              className="w-full py-4 rounded-xl bg-[#d3a971] text-black font-medium tracking-widest hover:bg-[#d3a971]/90 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              新建训练模板
            </button>
          </header>

          <main className="flex-1 overflow-y-auto px-6 pb-24 space-y-4">
            {templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-white/30 text-[14px]">
                <FileText size={48} className="mb-4 text-white/10" />
                <p>暂无训练模板</p>
                <p className="text-[12px] mt-2">点击上方按钮创建一个模板</p>
              </div>
            ) : (
              templates.map((t, idx) => (
                <motion.div 
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleEdit(t)}
                  className="bg-[#141414] border border-white/[0.05] rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden cursor-pointer hover:border-[#d3a971]/30 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[16px] font-['Noto_Serif_SC',_serif] text-white group-hover:text-[#d3a971] transition-colors">
                        {t.name}
                      </h3>
                      <span className="text-[12px] text-white/40 font-['JetBrains_Mono',_monospace]">
                        包含 {t.exercises.length} 个训练动作
                      </span>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(e, t.id)}
                      className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {t.exercises.slice(0, 5).map(ex => (
                      <span key={ex.id} className="text-[10px] px-2 py-1 rounded bg-white/[0.03] text-white/50 border border-white/[0.05]">
                        {ex.name}
                      </span>
                    ))}
                    {t.exercises.length > 5 && (
                      <span className="text-[10px] px-2 py-1 rounded bg-white/[0.03] text-white/50 border border-white/[0.05]">
                        +{t.exercises.length - 5}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </main>
        </motion.div>
      )}

      {mode === 'edit' && editingTemplate && (
        <motion.div 
          key="edit"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="flex flex-col h-full z-20 absolute inset-0 bg-[#080808]"
        >
          <header className="pt-12 px-6 pb-4 border-b border-white/[0.05] flex items-center justify-between sticky top-0 bg-[#080808]/80 backdrop-blur-xl z-10">
            <button 
              onClick={() => setMode('list')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/50 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1 px-4">
              <input 
                type="text" 
                value={editingTemplate.name}
                onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                placeholder="模板名称 (如: 推胸突破日)"
                className="w-full bg-transparent border-b border-white/10 text-center text-[18px] font-['Noto_Serif_SC',_serif] text-white focus:outline-none focus:border-[#d3a971] pb-1 transition-colors"
              />
            </div>
            <button 
              onClick={handleSaveTemplate}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[#d3a971] text-black hover:bg-white transition-colors"
            >
              <Check size={20} />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-6 pb-32 space-y-4">
            {editingTemplate.exercises.map((ex, idx) => (
              <div key={ex.id} className="bg-[#141414] border border-white/[0.05] rounded-2xl overflow-hidden relative group">
                <div className="p-4 bg-white/[0.02] border-b border-white/[0.05] flex justify-between items-center relative overflow-hidden">
                  <div className="flex items-center gap-3 relative z-10">
                    <span className="text-[12px] font-['JetBrains_Mono',_monospace] text-[#d3a971] tracking-wider w-5">{(idx + 1).toString().padStart(2, '0')}</span>
                    <div className="flex flex-col">
                      <span className="text-[16px] font-['Noto_Serif_SC',_serif] text-white/90">{ex.name}</span>
                      <span className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace]">{ex.muscle}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveExercise(ex.id)}
                    className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors relative z-10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-['JetBrains_Mono',_monospace] text-white/30 uppercase tracking-wider mb-2 px-1">
                    <div className="col-span-2">SET</div>
                    <div className="col-span-4 text-center">KG</div>
                    <div className="col-span-4 text-center">REPS</div>
                    <div className="col-span-2 text-right">DEL</div>
                  </div>

                  <AnimatePresence initial={false}>
                    {ex.sets.map((set, setIdx) => (
                      <motion.div 
                        key={`${ex.id}_${setIdx}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-12 gap-2 items-center"
                      >
                        <div className="col-span-2 font-['JetBrains_Mono',_monospace] text-[#d3a971] text-[12px] flex justify-center">
                          {setIdx + 1}
                        </div>
                        <div className="col-span-4 flex justify-center">
                          <input 
                            type="number" 
                            value={set.weight || ''} 
                            onChange={(e) => handleUpdateSet(ex.id, setIdx, 'weight', e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-white/[0.05] rounded-lg py-2 text-center text-[16px] font-['JetBrains_Mono',_monospace] text-white focus:outline-none focus:border-[#d3a971]/50"
                          />
                        </div>
                        <div className="col-span-4 flex justify-center">
                          <input 
                            type="number" 
                            value={set.reps || ''} 
                            onChange={(e) => handleUpdateSet(ex.id, setIdx, 'reps', e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-white/[0.05] rounded-lg py-2 text-center text-[16px] font-['JetBrains_Mono',_monospace] text-white focus:outline-none focus:border-[#d3a971]/50"
                          />
                        </div>
                        <div className="col-span-2 flex justify-end pr-2">
                          <button 
                            onClick={() => handleRemoveSet(ex.id, setIdx)}
                            className="text-white/20 hover:text-red-400 p-1"
                            disabled={ex.sets.length <= 1}
                          >
                            <Trash2 size={14} className={ex.sets.length <= 1 ? "opacity-50 cursor-not-allowed" : ""} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <button 
                    onClick={() => handleAddSet(ex.id)}
                    className="w-full py-2.5 mt-2 rounded-lg border border-dashed border-white/[0.1] text-white/30 text-[12px] font-['JetBrains_Mono',_monospace] hover:text-[#d3a971] hover:border-[#d3a971]/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} /> ADD SET
                  </button>
                </div>
              </div>
            ))}

            <button 
              onClick={() => setShowAddExercise(true)}
              className="w-full py-4 rounded-xl border border-dashed border-[#d3a971]/30 text-[#d3a971]/80 font-['Noto_Serif_SC',_serif] tracking-widest hover:bg-[#d3a971]/5 hover:text-[#d3a971] transition-all duration-300 flex items-center justify-center gap-2 mt-4"
            >
              <Plus size={18} />
              从动作库选择添加动作
            </button>
          </main>
        </motion.div>
      )}

      <ExerciseSelectorModal 
        isOpen={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onSelect={(exercise) => handleAddExerciseToTemplate(exercise.name, exercise.muscle)}
      />
    </div>
  );
}