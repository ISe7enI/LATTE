import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Flame, TrendingUp, Trophy, X, ArrowRight } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router';
import { cn } from '../utils';
import { type OutletContextType } from '../Root';

export function Home() {
  const navigate = useNavigate();
  const { workoutTime, activeWorkoutExercises, completedWorkouts = [], userProfile } = useOutletContext<OutletContextType>();
  const avatar = userProfile.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(userProfile.nickname || 'LATTE')}`;
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);

  useEffect(() => {
    const isFirstTime = sessionStorage.getItem('firstTimeHome');
    if (isFirstTime === 'true') {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setShowFirstTimeModal(true);
        sessionStorage.removeItem('firstTimeHome');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const totalCompletedSets = activeWorkoutExercises.reduce((acc, ex) => 
    acc + ex.sets.filter(s => s.completed).length, 0
  );

  const durationMinutes = Math.floor(workoutTime / 60);

  const today = new Date();
  const todayDay = today.getDay();
  const todayIndex = todayDay === 0 ? 6 : todayDay - 1;

  const hasTrainedToday = completedWorkouts.some(w => {
    const d = new Date(w.date);
    return d.toDateString() === today.toDateString();
  });

  const weekProgress = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
    const trained = completedWorkouts.some((w) => {
      const d = new Date(w.date);
      const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      return idx === i;
    });

    return { day, trained, isToday: i === todayIndex };
  });

  const dynamicHistory = completedWorkouts.map(w => {
    const d = new Date(w.date);
    const isToday = d.toDateString() === today.toDateString();
    const dateStr = isToday ? 'TODAY' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    return {
      title: w.planTitle || '自由训练',
      date: dateStr,
      vol: w.totalVolume.toLocaleString()
    };
  });

  const combinedHistory = dynamicHistory.slice(0, 4);

  return (
    <div className="flex flex-col h-full relative">
      <AnimatePresence>
        {showFirstTimeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
              onClick={() => setShowFirstTimeModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[320px] bg-[#141414] rounded-[24px] border border-[#d3a971]/20 p-6 flex flex-col pointer-events-auto z-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#d3a971]/10 blur-[40px] rounded-full pointer-events-none" />
              <button 
                onClick={() => setShowFirstTimeModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-white/40 hover:text-white"
              >
                <X size={16} />
              </button>
              
              <div className="w-12 h-12 rounded-xl bg-[#d3a971]/10 border border-[#d3a971]/30 flex items-center justify-center text-[#d3a971] mb-5">
                <Flame size={24} />
              </div>
              
              <h2 className="text-[20px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90 mb-2">
                欢迎加入, {userProfile.nickname}
              </h2>
              <p className="text-[13px] font-['Noto_Serif_SC',_serif] text-white/50 leading-relaxed mb-8">
                完善你的身体数据（身高、体重、健身目标），以获取更精准的训练建议和容量分析。
              </p>
              
              <div className="flex flex-col gap-3 mt-auto">
                <button 
                  onClick={() => {
                    setShowFirstTimeModal(false);
                    navigate('/settings');
                  }}
                  className="w-full py-3.5 rounded-xl bg-[#d3a971] text-black font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-[#b89362] transition-colors"
                >
                  立即完善
                  <ArrowRight size={16} />
                </button>
                <button 
                  onClick={() => setShowFirstTimeModal(false)}
                  className="w-full py-3.5 rounded-xl border border-white/10 text-white/60 font-['Noto_Serif_SC',_serif] tracking-widest hover:bg-white/5 hover:text-white transition-colors"
                >
                  稍后再说
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="pt-12 px-6 pb-4 relative z-20 flex flex-col backdrop-blur-xl bg-[#080808]/80 border-b border-white/[0.03]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.2em] mb-1">
              WELCOME BACK
            </span>
            <h1 className="text-[24px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90 font-bold">
              Progress is not linear
            </h1>
          </div>
          <div 
            onClick={() => navigate('/profile')}
            className="w-12 h-12 rounded-full overflow-hidden border border-white/10 cursor-pointer hover:border-[#d3a971]/50 transition-colors"
          >
            <img src={avatar} alt="Avatar" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-all duration-300" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide px-6">
        {/* Quick Start Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-4 rounded-[20px] bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/[0.05] p-6 overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#d3a971]/10 blur-[50px] rounded-full" />
          
          <div className="relative z-10 flex flex-col">
            <span className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace] tracking-[0.1em] mb-2">TODAY</span>
            <h2 className="text-[20px] font-['Noto_Serif_SC',_serif] tracking-wider text-white mb-6">
              今日计划
            </h2>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-white/50 font-['JetBrains_Mono',_monospace] text-[11px]">
                <span className="flex items-center gap-1.5"><Flame size={14} className="text-[#d3a971]" /> {durationMinutes} MINS</span>
                <span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-[#d3a971]" /> {totalCompletedSets} SETS</span>
              </div>
              
              <button onClick={() => navigate('/log?date=today')} className="w-12 h-12 rounded-full bg-[#d3a971] text-black flex items-center justify-center shadow-[0_0_20px_rgba(211,169,113,0.3)] hover:scale-105 transition-transform duration-300">
                <Play size={20} fill="currentColor" className="ml-1" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Weekly Progress */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 cursor-pointer hover:bg-white/[0.02] p-4 -mx-4 rounded-[20px] transition-colors"
          onClick={() => navigate('/analytics')}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/80">本周进度</h3>
            <span className="text-[10px] text-[#d3a971] font-['JetBrains_Mono',_monospace] tracking-[0.1em]">
              {weekProgress.filter(d => d.trained).length}/7 DAYS
            </span>
          </div>
          
          <div className="flex justify-between gap-2">
            {weekProgress.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-10 h-12 rounded-xl flex items-center justify-center border transition-all",
                  d.trained ? "bg-[#d3a971]/10 border-[#d3a971]/30 text-[#d3a971]" : 
                  d.isToday ? "bg-white/5 border-white/20 text-white" : 
                  "bg-transparent border-white/5 text-white/20"
                )}>
                  {d.trained ? <Trophy size={16} /> : <span className="text-[12px] font-['JetBrains_Mono',_monospace]">{d.day}</span>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8"
        >
          <h3 className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/80 mb-4">近期动态</h3>
          
          <div className="space-y-3">
            {combinedHistory.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-[16px] bg-[#141414]/50 border border-white/[0.03] hover:bg-[#141414] transition-colors">
                <div className="flex flex-col">
                  <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/80 mb-1">{item.title}</span>
                  <span className="text-[9px] text-white/40 font-['JetBrains_Mono',_monospace] tracking-[0.1em]">{item.date}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-['JetBrains_Mono',_monospace] text-white/90 text-[13px]">{item.vol} <span className="text-[9px] text-white/40">KG</span></span>
                  <span className="text-[9px] text-[#d3a971] font-['JetBrains_Mono',_monospace] tracking-[0.1em]">VOLUME</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
