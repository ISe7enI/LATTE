import { useState } from 'react';
import { cn } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { Check, MoreHorizontal, Dumbbell, Link as LinkIcon, Plus, History, Trash2, Eye } from 'lucide-react';
import { type Exercise, type SetRecord, type CompletedWorkout } from '../types';

interface Props {
  exercise: Exercise;
  index: number;
  onUpdateSet: (exerciseId: string, setId: string, field: keyof SetRecord, value: number) => void;
  onCompleteSet: (exerciseId: string, setId: string) => void;
  onAddSet?: (exerciseId: string) => void;
  onRemoveExercise?: (exerciseId: string) => void;
  onRemoveSet?: (exerciseId: string, setId: string) => void;
  onViewDetails?: (exerciseId: string) => void;
  completedWorkouts?: CompletedWorkout[];
}

export function ExerciseCard({ 
  exercise, 
  index, 
  onUpdateSet, 
  onCompleteSet, 
  onAddSet,
  onRemoveExercise,
  onRemoveSet,
  onViewDetails,
  completedWorkouts = []
}: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeSetMenu, setActiveSetMenu] = useState<string | null>(null);

  // Find recent history of this exercise from completed workouts
  const recentHistory = [...completedWorkouts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .flatMap(w => {
      const exRecord = w.exercises.find(e => e.name === exercise.name);
      if (!exRecord || exRecord.sets.length === 0) return [];
      
      const completedSets = exRecord.sets.filter(s => s.completed);
      if (completedSets.length === 0) return [];

      const volume = completedSets.reduce((acc, s) => acc + (s.weight * s.reps), 0);
      const topSet = completedSets.reduce((max, s) => (s.weight * s.reps) > (max.weight * max.reps) ? s : max, completedSets[0]);
      
      const d = new Date(w.date);
      return [{
        date: `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`,
        volume,
        topSet: `${topSet.weight}kg × ${topSet.reps}`
      }];
    })
    .slice(0, 3); // Get last 3

  const displayHistory = recentHistory;

  return (
    <div className="relative group">
      {/* Superset indicator line */}
      {exercise.isSupersetWithNext && (
        <div className="absolute left-[-16px] top-[40px] bottom-[-60px] w-[14px] border-l-[1.5px] border-y-[1.5px] border-[#d3a971]/30 rounded-l-[12px] z-0" />
      )}
      
      {/* Active state ambient glow */}
      {exercise.isActive && (
        <div className="absolute inset-0 bg-[#d3a971]/[0.03] blur-[40px] rounded-full pointer-events-none" />
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative rounded-[16px] bg-[#141414]/80 backdrop-blur-2xl border border-white/[0.04] transition-all duration-500 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
          exercise.isActive 
            ? "border-l-[3px] border-l-[#d3a971] shadow-[0_0_40px_rgba(211,169,113,0.06),_0_8px_32px_rgba(0,0,0,0.5)] bg-[#1a1a1a]" 
            : "border-l-[3px] border-l-transparent hover:border-white/[0.08]"
        )}
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="relative w-10 h-10 rounded-[10px] bg-gradient-to-br from-white/[0.08] to-transparent border border-white/[0.05] flex items-center justify-center text-[#d3a971]">
                <Dumbbell size={18} strokeWidth={1.5} />
                {exercise.isSupersetWithNext && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#d3a971] border-2 border-[#141414] flex items-center justify-center text-black">
                    <LinkIcon size={8} strokeWidth={3} />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <h3 className="text-[17px] font-['Noto_Serif_SC',_serif] tracking-[0.05em] text-white/[0.95] leading-tight">
                  {exercise.name}
                </h3>
                <div className="flex items-center gap-2 mt-[2px]">
                  <span className="text-[10px] text-[#d3a971]/70 font-['JetBrains_Mono',_monospace] uppercase tracking-[0.15em]">
                    {exercise.muscle}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[10px] text-white/30 font-['JetBrains_Mono',_monospace] uppercase tracking-[0.1em]">
                    {exercise.id.slice(0, 4)}
                  </span>
                </div>
              </div>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="text-white/20 hover:text-white/60 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/[0.05]"
              >
                <MoreHorizontal size={18} />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-32 bg-[#1a1a1a] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col"
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onViewDetails?.(exercise.id);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-left text-[12px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                      <Eye size={14} className="text-white/40" />
                      查看详情
                    </button>
                    <div className="h-px bg-white/[0.05] w-full" />
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onRemoveExercise?.(exercise.id);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-left text-[12px] font-['Noto_Serif_SC',_serif] tracking-widest text-[#ff4444]/70 hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors"
                    >
                      <Trash2 size={14} className="text-[#ff4444]/50" />
                      删除动作
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-[2px]">
            {/* Headers */}
            <div className="flex text-[9px] font-['JetBrains_Mono',_monospace] text-white/30 px-3 pb-2 uppercase tracking-[0.2em] border-b border-white/[0.03] mb-2">
              <div className="w-[15%] text-left">SET</div>
              <div className="w-[25%] text-center">KG</div>
              <div className="w-[25%] text-center">REPS</div>
              <div className="w-[35%] text-right">STATUS</div>
            </div>

            {/* Sets list */}
            {exercise.sets.map((set, i) => (
              <div 
                key={set.id}
                className={cn(
                  "flex items-center rounded-xl p-2 px-3 transition-all duration-300",
                  set.completed 
                    ? "bg-gradient-to-r from-transparent via-[#d3a971]/[0.03] to-transparent border border-[#d3a971]/[0.05]" 
                    : "hover:bg-white/[0.02] border border-transparent"
                )}
              >
                {/* Set number/type */}
                <div className="w-[15%] flex justify-start">
                  <div className={cn(
                    "min-w-[22px] h-[22px] px-1 rounded flex items-center justify-center text-[11px] font-['JetBrains_Mono',_monospace] tracking-wider",
                    set.completed ? "text-[#d3a971]" : "text-white/40",
                    set.type === "W" && "text-[#8b6f4e] bg-[#8b6f4e]/10 border border-[#8b6f4e]/20",
                    set.type === "D" && "text-[#b24848] bg-[#b24848]/10 border border-[#b24848]/20",
                    set.type === "F" && "text-[#ff3333] bg-[#ff3333]/10 border border-[#ff3333]/20"
                  )}>
                    {set.type === "N" ? (i + 1).toString().padStart(2, '0') : set.type}
                  </div>
                </div>

                {/* Weight Input */}
                <div className="w-[25%] flex justify-center relative">
                  <input
                    type="number"
                    value={set.weight || ''}
                    placeholder="0"
                    onChange={(e) => onUpdateSet(exercise.id, set.id, 'weight', e.target.value === '' ? 0 : Number(e.target.value))}
                    className={cn(
                      "w-full bg-transparent text-center font-['JetBrains_Mono',_monospace] text-[16px] outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                      set.completed ? "text-white/50" : "text-white/90 focus:text-[#d3a971]"
                    )}
                  />
                </div>

                {/* Reps Input */}
                <div className="w-[25%] flex justify-center">
                  <input
                    type="number"
                    value={set.reps || ''}
                    placeholder="0"
                    onChange={(e) => onUpdateSet(exercise.id, set.id, 'reps', e.target.value === '' ? 0 : Number(e.target.value))}
                    className={cn(
                      "w-full bg-transparent text-center font-['JetBrains_Mono',_monospace] text-[16px] outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                      set.completed ? "text-white/50" : "text-white/90 focus:text-[#d3a971]"
                    )}
                  />
                </div>

                {/* Complete Button */}
                <div className="w-[35%] flex justify-end items-center gap-1.5 relative">
                  <div className="relative flex items-center">
                    <button
                      onClick={() => setActiveSetMenu(activeSetMenu === set.id ? null : set.id)}
                      className={cn(
                        "w-6 h-[26px] flex items-center justify-center rounded-[6px] transition-colors z-20",
                        activeSetMenu === set.id ? "text-white/80 bg-white/[0.05]" : "text-white/20 hover:text-white/60 hover:bg-white/[0.02]"
                      )}
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    
                    <AnimatePresence>
                      {activeSetMenu === set.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, x: 10 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95, x: 10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-[calc(100%+8px)] top-0 w-24 bg-[#1a1a1a] border border-white/[0.08] rounded-[8px] shadow-xl overflow-hidden z-50 flex items-center"
                        >
                          <button
                            onClick={() => {
                              setActiveSetMenu(null);
                              onRemoveSet?.(exercise.id, set.id);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[#ff4444]/70 hover:text-[#ff4444] hover:bg-[#ff4444]/10 transition-colors text-[11px] font-['Noto_Serif_SC',_serif] tracking-widest"
                          >
                            <Trash2 size={12} className="text-[#ff4444]/50" />
                            删除该组
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <button
                    onClick={() => onCompleteSet(exercise.id, set.id)}
                    className={cn(
                      "w-12 h-[26px] rounded-[6px] border transition-all duration-300 flex items-center justify-center overflow-hidden relative",
                      set.completed 
                        ? "bg-[#d3a971] border-[#d3a971] shadow-[0_0_12px_rgba(211,169,113,0.3)]" 
                        : "bg-white/[0.03] border-white/10 hover:border-[#d3a971]/40 hover:bg-white/[0.05]"
                    )}
                  >
                    {set.completed && <div className="absolute inset-0 bg-white/20 blur-[2px] rounded-full scale-y-50 -translate-y-2" />}
                    <Check 
                      size={14} 
                      className={cn(
                        "transition-all duration-300 z-10", 
                        set.completed ? "scale-100 text-black opacity-100" : "scale-50 text-transparent opacity-0"
                      )} 
                      strokeWidth={3} 
                    />
                    {!set.completed && (
                      <span className="text-[9px] font-['JetBrains_Mono',_monospace] tracking-widest text-white/30 z-10">DONE</span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Modules */}
          <div className="mt-4 pt-4 border-t border-white/[0.03] grid grid-cols-2 gap-3">
            <button
              onClick={() => onAddSet && onAddSet(exercise.id)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-[12px] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-[#d3a971]/30 transition-all group"
            >
              <Plus size={14} className="text-[#d3a971]/70 group-hover:text-[#d3a971] transition-colors" />
              <span className="text-[12px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/70 group-hover:text-white transition-colors">
                新增一组
              </span>
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-4 rounded-[12px] border transition-all group",
                showHistory 
                  ? "bg-[#d3a971]/10 border-[#d3a971]/30" 
                  : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-[#d3a971]/30"
              )}
            >
              <History size={14} className={cn("transition-colors", showHistory ? "text-[#d3a971]" : "text-[#d3a971]/70 group-hover:text-[#d3a971]")} />
              <span className={cn(
                "text-[12px] font-['Noto_Serif_SC',_serif] tracking-widest transition-colors",
                showHistory ? "text-[#d3a971]" : "text-white/70 group-hover:text-white"
              )}>
                动作历史
              </span>
            </button>
          </div>

          {/* History Panel */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-white/[0.03] space-y-3">
                  <div className="flex text-[9px] font-['JetBrains_Mono',_monospace] text-white/30 uppercase tracking-[0.2em] mb-2">
                    <div className="w-1/3">DATE</div>
                    <div className="w-1/3 text-center">VOLUME</div>
                    <div className="w-1/3 text-right">TOP SET</div>
                  </div>
                  {displayHistory.map((hist, idx) => (
                    <div key={idx} className="flex items-center text-[12px] font-['JetBrains_Mono',_monospace] tracking-wider py-1">
                      <div className="w-1/3 text-white/50">{hist.date}</div>
                      <div className="w-1/3 text-center text-white/70">{hist.volume} <span className="text-[9px] text-white/30">KG</span></div>
                      <div className="w-1/3 text-right text-[#d3a971]/90">{hist.topSet}</div>
                    </div>
                  ))}
                  {displayHistory.length === 0 && (
                    <div className="text-[11px] text-white/35 py-2 text-center border border-white/[0.05] rounded-lg">
                      暂无该动作真实历史记录
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}