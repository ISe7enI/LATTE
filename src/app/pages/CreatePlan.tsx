import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { type Exercise, type SetRecord, type TrainingPlan } from '../types';
import { type OutletContextType } from '../Root';
import { ExerciseSelectorModal } from '../components/ExerciseSelectorModal';
import { userAppService } from '../services/userApp';

export function CreatePlan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { customPlans, setCustomPlans, currentUserId } = useOutletContext<OutletContextType>();
  const editingPlanId = searchParams.get('edit');
  const editingPlan = useMemo(
    () => customPlans.find((plan) => plan.id === editingPlanId),
    [customPlans, editingPlanId],
  );
  
  const [planName, setPlanName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!editingPlan) return;
    setPlanName(editingPlan.title);
    setSelectedExercises(
      editingPlan.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) => ({
          ...set,
          id: `${set.id}-${Date.now()}`,
          completed: false,
        })),
      })),
    );
  }, [editingPlan]);

  const toggleExercise = (exercise: any) => {
    setSelectedExercises(prev => {
      const exists = prev.find(p => p.id === exercise.id);
      if (exists) {
        return prev.filter(p => p.id !== exercise.id);
      }
      return [...prev, {
        id: exercise.id,
        name: exercise.name,
        muscle: exercise.muscle,
        sets: [{ id: Date.now().toString(), type: 'N' as const, weight: 0, reps: 0, completed: false }]
      }];
    });
  };

  const updateSetField = (exerciseId: string, setId: string, field: keyof SetRecord, value: number) => {
    setSelectedExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) => (set.id === setId ? { ...set, [field]: value } : set)),
            }
          : exercise,
      ),
    );
  };

  const addSetToExercise = (exerciseId: string) => {
    setSelectedExercises((prev) =>
      prev.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        const lastSet = exercise.sets[exercise.sets.length - 1];
        const newSet: SetRecord = {
          id: `s-${Date.now()}`,
          type: "N",
          weight: lastSet?.weight ?? 0,
          reps: lastSet?.reps ?? 0,
          completed: false,
        };
        return { ...exercise, sets: [...exercise.sets, newSet] };
      }),
    );
  };

  const removeSetFromExercise = (exerciseId: string, setId: string) => {
    setSelectedExercises((prev) =>
      prev
        .map((exercise) =>
          exercise.id === exerciseId
            ? { ...exercise, sets: exercise.sets.filter((set) => set.id !== setId) }
            : exercise,
        )
        .filter((exercise) => exercise.sets.length > 0),
    );
  };

  const handleSave = async () => {
    if (!planName.trim() || selectedExercises.length === 0) return;

    // Summarize muscles
    const muscles = Array.from(new Set(selectedExercises.map(ex => ex.muscle)));
    const subtitle = muscles.length > 2 ? '全身综合' : muscles.join('/');

    const newPlan: TrainingPlan = {
      id: editingPlan?.id ?? Date.now().toString(),
      title: planName,
      subtitle: subtitle,
      time: `${Math.max(1, Math.round(selectedExercises.reduce((acc, ex) => acc + ex.sets.length, 0) * 4))} MINS`,
      sets: `${selectedExercises.reduce((acc, ex) => acc + ex.sets.length, 0)} SETS`,
      level: '自定',
      category: '个人计划',
      exercises: selectedExercises,
    };

    await userAppService.savePlan({ ...newPlan, userId: currentUserId, isSystem: false });
    if (editingPlan) {
      setCustomPlans(customPlans.map((plan) => (plan.id === newPlan.id ? newPlan : plan)));
    } else {
      setCustomPlans([...customPlans, newPlan]);
    }
    navigate('/plan');
  };

  return (
    <div className="flex flex-col h-full bg-[#080808] relative z-50">
      <header className="pt-12 px-6 pb-4 flex items-center justify-between border-b border-white/[0.03] backdrop-blur-xl bg-[#080808]/80 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[16px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/90">
              {editingPlan ? '编辑训练计划' : '制作训练计划'}
        </h1>
        <button 
          onClick={handleSave}
          disabled={!planName.trim() || selectedExercises.length === 0}
          className="w-10 h-10 flex items-center justify-center text-[#d3a971] disabled:text-white/20 transition-colors"
        >
          <Save size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pt-6 pb-24 space-y-8 scrollbar-hide">
        {/* Plan Name */}
        <div className="space-y-3">
          <label className="text-[12px] font-['JetBrains_Mono',_monospace] tracking-[0.2em] text-[#d3a971] uppercase">Plan Name</label>
          <input 
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="输入计划名称，例如：周一胸背超级组"
            className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-[14px] text-white placeholder-white/20 focus:outline-none focus:border-[#d3a971]/50 transition-colors"
          />
        </div>

        {/* Selected Summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[12px] font-['JetBrains_Mono',_monospace] tracking-[0.2em] text-[#d3a971] uppercase">Selected Exercises</label>
            <span className="text-[12px] text-white/40">{selectedExercises.length} 个动作</span>
          </div>
          {selectedExercises.length === 0 ? (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full h-24 rounded-xl border border-dashed border-[#d3a971]/30 hover:bg-[#d3a971]/5 transition-colors flex flex-col items-center justify-center text-[12px] text-[#d3a971]/80 gap-2"
            >
              <Plus size={20} className="text-[#d3a971]" />
              从动作库选择添加动作
            </button>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {selectedExercises.map(ex => (
                  <div key={ex.id} className="shrink-0 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center gap-2">
                    <span className="text-[12px] text-white/80">{ex.name}</span>
                    <button onClick={() => toggleExercise(ex)} className="text-white/30 hover:text-[#d3a971] transition-colors">
                      <Plus size={14} className="rotate-45" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {selectedExercises.map((exercise) => (
                  <div key={`sets-${exercise.id}`} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[13px] text-white/85 font-['Noto_Serif_SC',_serif]">{exercise.name}</span>
                      <button
                        onClick={() => addSetToExercise(exercise.id)}
                        className="text-[11px] text-[#d3a971] border border-[#d3a971]/30 rounded-full px-3 py-1 hover:bg-[#d3a971]/10"
                      >
                        + 增加组
                      </button>
                    </div>
                    <div className="space-y-2">
                      {exercise.sets.map((set, idx) => (
                        <div key={set.id} className="grid grid-cols-[32px_1fr_1fr_auto] gap-2 items-center">
                          <span className="text-[11px] text-white/40 text-center">{idx + 1}</span>
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) => updateSetField(exercise.id, set.id, 'weight', Number(e.target.value))}
                            placeholder="重量(kg)"
                            className="bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-2 py-1.5 text-[12px] text-white"
                          />
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => updateSetField(exercise.id, set.id, 'reps', Number(e.target.value))}
                            placeholder="次数"
                            className="bg-[#0a0a0a] border border-white/[0.06] rounded-lg px-2 py-1.5 text-[12px] text-white"
                          />
                          <button
                            onClick={() => removeSetFromExercise(exercise.id, set.id)}
                            className="text-[11px] text-red-300 px-2 py-1"
                          >
                            删
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3.5 rounded-xl border border-dashed border-[#d3a971]/30 hover:bg-[#d3a971]/5 transition-colors flex items-center justify-center text-[12px] text-[#d3a971]/80 gap-2 font-['Noto_Serif_SC',_serif] tracking-widest"
              >
                <Plus size={16} /> 继续添加动作
              </button>
            </div>
          )}
        </div>

        <ExerciseSelectorModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={toggleExercise}
          selectedIds={selectedExercises.map(e => e.id)}
        />
      </main>
    </div>
  );
}