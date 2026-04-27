import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Play, Dumbbell, Activity, Calendar, Star, Info, TrendingUp, History } from 'lucide-react';
import { useNavigate, useParams, useOutletContext, useLocation } from 'react-router';
import { cn } from '../utils';
import { type OutletContextType } from '../Root';
import { exerciseLibraryData } from '../data/exercises';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function ExerciseDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();
  const passedExercise = state?.exercise;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'tutorial' | 'data'>('tutorial');
  const [isFav, setIsFav] = useState(false);
  const { setActiveWorkoutExercises, completedWorkouts } = useOutletContext<OutletContextType>();

  const foundExercise =
    exerciseLibraryData.find(e => e.id === id) ||
    exerciseLibraryData.find(e => e.name === passedExercise?.name) ||
    passedExercise ||
    exerciseLibraryData[0];

  useEffect(() => {
    const saved = localStorage.getItem('workout_favorites');
    if (saved) {
      try {
        const favs = JSON.parse(saved);
        setIsFav(favs.includes(foundExercise.id));
      } catch(e) {}
    }
  }, [foundExercise.id]);

  const toggleFavorite = () => {
    const saved = localStorage.getItem('workout_favorites');
    let favs: string[] = [];
    if (saved) {
      try { favs = JSON.parse(saved); } catch(e) {}
    }
    
    if (favs.includes(foundExercise.id)) {
      favs = favs.filter(f => f !== foundExercise.id);
      setIsFav(false);
    } else {
      favs.push(foundExercise.id);
      setIsFav(true);
    }
    localStorage.setItem('workout_favorites', JSON.stringify(favs));
  };

  const rawInstructions = foundExercise.instructions;
  const normalizeInstruction = (value: string | undefined) =>
    value && value.trim() && value.trim() !== "无数据" ? value.trim() : "";
  const exercise = {
    ...foundExercise,
    tips: foundExercise.tips || [],
    mistakes: foundExercise.mistakes || [],
    instructions: {
      start: normalizeInstruction(rawInstructions?.start),
      execution: normalizeInstruction(rawInstructions?.execution),
      breathing: normalizeInstruction(rawInstructions?.breathing),
    },
  };

  const historyData = (() => {
    const rows = completedWorkouts
      .filter((workout) =>
        workout.exercises.some(
          (ex) => ex.id === exercise.id || ex.name === exercise.name,
        ),
      )
      .map((workout) => {
        const targetExercises = workout.exercises.filter(
          (ex) => ex.id === exercise.id || ex.name === exercise.name,
        );
        let weight = 0;
        let volume = 0;
        targetExercises.forEach((ex) => {
          ex.sets.forEach((set) => {
            const hasCompletedFlag = typeof set.completed === "boolean";
            if (hasCompletedFlag && !set.completed) return;
            weight = Math.max(weight, Number(set.weight) || 0);
            volume += (Number(set.weight) || 0) * (Number(set.reps) || 0);
          });
        });
        return {
          id: workout.id,
          date: new Date(workout.date).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }),
          weight: Math.round(weight),
          volume: Math.round(volume),
          rawDate: new Date(workout.date).getTime(),
        };
      })
      .sort((a, b) => a.rawDate - b.rawDate)
      .filter((row) => row.weight > 0 || row.volume > 0);
    return rows;
  })();
  const hasHistory = historyData.length > 0;
  const maxWeight = hasHistory ? Math.max(...historyData.map(d => d.weight)) : 0;

  return (
    <div className="flex flex-col h-full relative bg-[#080808]">
      <header className="absolute top-12 left-6 right-6 z-30 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[#141414]/80 backdrop-blur-xl border border-white/[0.05] text-white/50 hover:text-white transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={toggleFavorite}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[#141414]/80 backdrop-blur-xl border border-white/[0.05] text-white/50 hover:text-white transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
        >
          <Star size={18} className={isFav ? "fill-[#d3a971] text-[#d3a971]" : ""} />
        </button>
      </header>

      {/* 3D Demo / Image Area */}
      <div className="h-[35%] min-h-[280px] relative bg-gradient-to-b from-[#1a1a1a] to-[#080808] overflow-hidden flex items-center justify-center shrink-0">
        {exercise.image && (
          <img src={exercise.image} alt={exercise.name} className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity" />
        )}
        <div className="absolute inset-0 bg-[#d3a971]/5 blur-[100px] rounded-full mix-blend-screen" />
        
        {/* Decorative Grid */}
        <div className="absolute inset-0" 
          style={{ 
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            transform: 'perspective(500px) rotateX(60deg) scale(2) translateY(-100px)',
            transformOrigin: 'top center'
          }} 
        />

        <div className="relative z-10 w-[60%] aspect-square max-w-[200px] border border-[#d3a971]/20 bg-gradient-to-br from-[#141414] to-transparent rounded-[24px] shadow-[0_0_40px_rgba(211,169,113,0.1)] flex flex-col items-center justify-center cursor-pointer group hover:border-[#d3a971]/50 transition-all duration-500 overflow-hidden">
          {exercise.image && isPlaying ? (
            <img src={exercise.image} alt={exercise.name} className="w-full h-full object-cover opacity-90 transition-all duration-500" />
          ) : (
            <>
              <Dumbbell size={48} className="text-[#d3a971]/50 mb-4 group-hover:scale-110 transition-transform duration-500" strokeWidth={1} />
              {!isPlaying ? (
                <button 
                  onClick={() => setIsPlaying(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#d3a971]/10 text-[#d3a971] text-[10px] font-['JetBrains_Mono',_monospace] tracking-[0.2em] border border-[#d3a971]/30 hover:bg-[#d3a971] hover:text-black transition-all"
                >
                  <Play size={12} fill="currentColor" />
                  LOAD 3D DEMO
                </button>
              ) : (
                <span className="text-[#d3a971] text-[10px] font-['JetBrains_Mono',_monospace] tracking-[0.2em] animate-pulse">
                  LOADING MODEL...
                </span>
              )}
            </>
          )}
        </div>

        {/* Tab Switcher overlaid at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4">
          <div className="bg-[#141414]/90 backdrop-blur-md p-1 rounded-full border border-white/[0.05] flex">
            <button 
              onClick={() => setActiveTab('tutorial')}
              className={cn(
                "px-6 py-2 rounded-full text-[12px] font-sans tracking-widest transition-all",
                activeTab === 'tutorial' ? "bg-[#d3a971] text-black font-bold" : "text-white/50 hover:text-white"
              )}
            >
              动作教学
            </button>
            <button 
              onClick={() => setActiveTab('data')}
              className={cn(
                "px-6 py-2 rounded-full text-[12px] font-sans tracking-widest transition-all",
                activeTab === 'data' ? "bg-[#d3a971] text-black font-bold" : "text-white/50 hover:text-white"
              )}
            >
              数据概览
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide px-6 pt-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-[28px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90 mb-1">
            {exercise.name}
          </h1>
          <span className="text-[12px] text-white/30 font-['JetBrains_Mono',_monospace] uppercase tracking-[0.1em] mb-4">
            {exercise.en}
          </span>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-['JetBrains_Mono',_monospace] tracking-wider mb-2">
            <span className="px-2 py-1 rounded-[6px] bg-[#d3a971]/10 text-[#d3a971] border border-[#d3a971]/20">
              {exercise.muscle}
            </span>
            <span className="px-2 py-1 rounded-[6px] bg-white/5 text-white/60 border border-white/[0.05]">
              {exercise.type}
            </span>
            <span className="px-2 py-1 rounded-[6px] bg-white/5 text-white/60 border border-white/[0.05]">
              {exercise.equipment}
            </span>
            <div className="flex items-center gap-1 text-white/40 ml-2">
              <span className="mr-1 text-[10px] uppercase">难度</span>
              {[...Array(5)].map((_, i) => (
                <div key={i} className={cn("w-1 h-1 rounded-full", i < exercise.difficulty ? "bg-[#d3a971]" : "bg-white/10")} />
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'tutorial' ? (
            <motion.div 
              key="tutorial"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Detailed Instructions */}
              <section className="bg-[#141414]/50 border border-white/[0.03] rounded-[20px] p-5">
                <h3 className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-widest text-[#d3a971] mb-5 flex items-center gap-2">
                  <Info size={16} className="text-[#d3a971]" />
                  动作要领
                </h3>
                
                <div className="space-y-5">
                  <div className="relative pl-6 before:content-[''] before:absolute before:left-[11px] before:top-1 before:bottom-[-20px] before:w-[2px] before:bg-gradient-to-b before:from-[#d3a971]/50 before:to-transparent">
                    <div className="absolute left-1 top-1 w-5 h-5 rounded-full bg-[#d3a971]/20 border border-[#d3a971] flex items-center justify-center text-[10px] font-bold text-[#d3a971]">1</div>
                    <h4 className="text-[13px] text-white font-bold mb-1 tracking-wider">起始姿势</h4>
                    <p className="text-[13px] text-white/60 leading-relaxed font-sans">{exercise.instructions.start || "暂无真实动作要领数据"}</p>
                  </div>
                  
                  <div className="relative pl-6 before:content-[''] before:absolute before:left-[11px] before:top-1 before:bottom-[-20px] before:w-[2px] before:bg-gradient-to-b before:from-[#d3a971]/50 before:to-transparent">
                    <div className="absolute left-1 top-1 w-5 h-5 rounded-full bg-[#d3a971]/20 border border-[#d3a971] flex items-center justify-center text-[10px] font-bold text-[#d3a971]">2</div>
                    <h4 className="text-[13px] text-white font-bold mb-1 tracking-wider">执行过程</h4>
                    <p className="text-[13px] text-white/60 leading-relaxed font-sans">{exercise.instructions.execution || "暂无真实执行过程数据"}</p>
                  </div>

                  <div className="relative pl-6">
                    <div className="absolute left-1 top-1 w-5 h-5 rounded-full bg-[#d3a971]/20 border border-[#d3a971] flex items-center justify-center text-[10px] font-bold text-[#d3a971]">3</div>
                    <h4 className="text-[13px] text-white font-bold mb-1 tracking-wider">呼吸节奏</h4>
                    <p className="text-[13px] text-white/60 leading-relaxed font-sans">{exercise.instructions.breathing || "暂无真实呼吸节奏数据"}</p>
                  </div>
                </div>
              </section>

              {/* Tips & Mistakes */}
              <div className="grid grid-cols-1 gap-4">
                {exercise.tips.length > 0 && (
                  <section className="bg-[#141414]/50 border border-[#d3a971]/20 rounded-[20px] p-5">
                    <h3 className="text-[13px] font-['Noto_Serif_SC',_serif] tracking-widest text-[#d3a971] mb-3 flex items-center gap-2">
                      <Star size={14} /> 核心技巧
                    </h3>
                    <ul className="space-y-2">
                      {exercise.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3 text-[13px] text-white/70 leading-relaxed font-sans">
                          <span className="text-[#d3a971] mt-1 text-[10px]">●</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {exercise.mistakes.length > 0 && (
                  <section className="bg-red-500/5 border border-red-500/20 rounded-[20px] p-5">
                    <h3 className="text-[13px] font-['Noto_Serif_SC',_serif] tracking-widest text-red-400 mb-3 flex items-center gap-2">
                      <span className="w-1 h-3 bg-red-400 rounded-full" /> 常见错误
                    </h3>
                    <ul className="space-y-2">
                      {exercise.mistakes.map((mistake, i) => (
                        <li key={i} className="flex items-start gap-3 text-[13px] text-white/60 leading-relaxed font-sans">
                          <span className="text-red-400/50 mt-0.5 text-[12px]">✗</span>
                          {mistake}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="data"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* PR Section */}
              <section className="bg-gradient-to-br from-[#d3a971]/20 to-[#141414] border border-[#d3a971]/30 rounded-[20px] p-5 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#d3a971]/20 blur-[20px] rounded-full" />
                <h3 className="text-[12px] font-['JetBrains_Mono',_monospace] tracking-widest text-[#d3a971] mb-1 flex items-center gap-2">
                  <TrendingUp size={14} /> PERSONAL RECORD
                </h3>
                <p className="text-[12px] text-white/60 font-sans tracking-wider mb-4">个人最佳纪录</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[48px] font-['JetBrains_Mono',_monospace] leading-none text-white font-bold">{maxWeight}</span>
                  <span className="text-[16px] text-[#d3a971] font-['JetBrains_Mono',_monospace]">KG</span>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 mb-1">创造日期</span>
                    <span className="text-[12px] text-white font-['JetBrains_Mono',_monospace]">{hasHistory ? historyData[historyData.length - 1]?.date : '--'}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-white/40 mb-1">估算 1RM</span>
                    <span className="text-[12px] text-white font-['JetBrains_Mono',_monospace]">{hasHistory ? Math.round(maxWeight * 1.15) : 0} KG</span>
                  </div>
                </div>
              </section>

              {/* Chart Section */}
              <section className="bg-[#141414]/50 border border-white/[0.03] rounded-[20px] p-5">
                <h3 className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/90 mb-6 flex items-center gap-2">
                  <Activity size={16} className="text-white/50" />
                  近期趋势
                </h3>
                <div className="h-[200px] w-full">
                  {hasHistory ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart accessibilityLayer={false} data={historyData}>
                      <defs key="defs-layer">
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop key="stop1" offset="5%" stopColor="#d3a971" stopOpacity={0.3}/>
                          <stop key="stop2" offset="95%" stopColor="#d3a971" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        key="x-axis"
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'JetBrains Mono'}}
                        dy={10}
                      />
                      <YAxis 
                        key="y-axis"
                        hide 
                        domain={['dataMin - 10', 'dataMax + 10']} 
                      />
                      <Tooltip 
                        key="tooltip"
                        contentStyle={{ 
                          backgroundColor: '#1a1a1a', 
                          border: '1px solid rgba(211,169,113,0.2)',
                          borderRadius: '12px',
                          fontFamily: 'JetBrains Mono',
                          fontSize: '12px'
                        }}
                        itemStyle={{ color: '#d3a971' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
                      />
                      <Area 
                        key="area"
                        type="monotone" 
                        dataKey="weight" 
                        name="最重(KG)"
                        stroke="#d3a971" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorWeight)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[12px] text-white/40">
                      暂无该动作训练数据，完成训练后会自动生成趋势图。
                    </div>
                  )}
                </div>
              </section>

              {/* History List */}
              <section className="bg-[#141414]/50 border border-white/[0.03] rounded-[20px] p-5">
                <h3 className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/90 mb-4 flex items-center gap-2">
                  <History size={16} className="text-white/50" />
                  历史记录
                </h3>
                <div className="space-y-3">
                  {hasHistory ? [...historyData].reverse().slice(0, 5).map((record, i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-white/[0.05] last:border-0 last:pb-0">
                      <span className="text-[12px] text-white/50 font-['JetBrains_Mono',_monospace]">{record.date}</span>
                      <div className="flex items-center gap-4 text-right">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-white/30 uppercase">最重</span>
                          <span className="text-[13px] text-white font-['JetBrains_Mono',_monospace]">{record.weight}kg</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-white/30 uppercase">总容量</span>
                          <span className="text-[13px] text-white font-['JetBrains_Mono',_monospace]">{record.volume}kg</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-[12px] text-white/40 py-2">暂无历史记录</div>
                  )}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-8 pb-4">
          <button 
            onClick={() => {
              setActiveWorkoutExercises(prev => {
                const isAlreadyAdded = prev.some(p => p.id === exercise.id);
                if (isAlreadyAdded) return prev;
                return [
                  ...prev,
                  {
                    id: exercise.id,
                    name: exercise.name,
                    muscle: exercise.muscle,
                    isActive: false,
                    sets: [
                      { id: `s-${Date.now()}-1`, type: "N", weight: 0, reps: 0, completed: false }
                    ]
                  }
                ];
              });
              navigate('/log?date=today');
            }}
            className="w-full py-4 rounded-[16px] bg-[#d3a971] text-black font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-[#c29a65] transition-colors"
          >
            <Calendar size={18} />
            将动作加入今日训练
          </button>
        </div>
      </main>
    </div>
  );
}