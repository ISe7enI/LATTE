import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, MoreHorizontal, Play } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { cn } from '../utils';

export function PlanDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const plan = {
    name: "新手三分化",
    progress: "第3周 / 共8周",
    percent: 35,
    days: [
      { day: "周一", title: "推力日 (胸/肩/三头)", isRest: false, active: true },
      { day: "周二", title: "拉力日 (背/二头/后束)", isRest: false },
      { day: "周三", title: "休息日", isRest: true },
      { day: "周四", title: "腿部日 (股四/腘绳/小腿)", isRest: false },
      { day: "周五", title: "休息日", isRest: true },
      { day: "周六", title: "弱点强化", isRest: false },
      { day: "周日", title: "休息日", isRest: true },
    ]
  };

  return (
    <div className="flex flex-col h-full relative bg-[#080808]">
      <header className="pt-12 px-6 pb-6 relative z-20 flex flex-col bg-gradient-to-b from-[#1a1a1a] to-[#080808]">
        <div className="absolute inset-0 bg-[#d3a971]/5 blur-[80px] rounded-b-[40px] pointer-events-none" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/50 hover:text-white transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-col relative z-10">
          <span className="text-[10px] text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d3a971]" />
            CURRENT PLAN
          </span>
          <h1 className="text-[28px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90 mb-4">
            {plan.name}
          </h1>
          
          <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono',_monospace] text-white/60 mb-3">
            <span>PROGRESS</span>
            <span className="text-[#d3a971]">{plan.progress}</span>
          </div>
          
          <div className="w-full h-1.5 bg-[#141414] rounded-full overflow-hidden border border-white/[0.05]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${plan.percent}%` }}
              transition={{ delay: 0.2, duration: 1 }}
              className="h-full bg-[#d3a971] rounded-full shadow-[0_0_10px_#d3a971]"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide px-6 pt-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/80">本周安排</h3>
          <span className="text-[9px] text-[#d3a971]/70 font-['JetBrains_Mono',_monospace] tracking-[0.1em] px-2 py-0.5 rounded border border-[#d3a971]/30">WEEK 3</span>
        </div>

        <div className="space-y-3 relative">
          <div className="absolute left-[19px] top-6 bottom-10 w-[2px] bg-gradient-to-b from-[#d3a971]/20 via-white/[0.05] to-transparent pointer-events-none" />
          
          {plan.days.map((day, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "relative pl-12 py-3 rounded-[16px] transition-all group",
                day.active ? "bg-[#141414]/50 border border-white/[0.05] shadow-[0_4px_20px_rgba(0,0,0,0.2)]" : "hover:bg-white/[0.02]"
              )}
            >
              {/* Timeline Node */}
              <div className={cn(
                "absolute left-[12px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-[3px] border-[#080808] z-10 transition-colors",
                day.active ? "bg-[#d3a971] shadow-[0_0_12px_#d3a971]" : "bg-[#2a2a2a] group-hover:bg-white/20",
                day.isRest && "bg-transparent border-white/20"
              )} />
              
              {day.isRest ? (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-['JetBrains_Mono',_monospace] tracking-[0.2em] mb-1 text-white/30">
                      {day.day}
                    </span>
                    <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/20">
                      {day.title}
                    </span>
                  </div>
                </div>
              ) : (
                <details className="w-full group/details">
                  <summary className="flex items-center justify-between list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-[10px] font-['JetBrains_Mono',_monospace] tracking-[0.2em] mb-1 transition-colors",
                        day.active ? "text-[#d3a971]" : "text-white/40 group-hover/details:text-[#d3a971]/70"
                      )}>
                        {day.day}
                      </span>
                      <span className={cn(
                        "text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider transition-colors",
                        "text-white/80 group-hover/details:text-white"
                      )}>
                        {day.title}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {day.active && (
                        <button 
                          onClick={(e) => { e.preventDefault(); navigate('/log'); }} 
                          className="w-10 h-10 rounded-full bg-[#d3a971] text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(211,169,113,0.3)] z-10"
                        >
                          <Play size={16} fill="currentColor" className="ml-1" />
                        </button>
                      )}
                      {!day.active && (
                        <button 
                          onClick={(e) => e.preventDefault()}
                          className="text-[10px] text-white/30 font-['JetBrains_Mono',_monospace] tracking-widest px-3 py-1.5 rounded-full border border-white/[0.05] hover:border-[#d3a971]/30 hover:text-[#d3a971] transition-all z-10"
                        >
                          EDIT
                        </button>
                      )}
                    </div>
                  </summary>
                  
                  <div className="mt-5 pt-4 border-t border-white/[0.05] flex flex-col gap-2 animate-in fade-in duration-300">
                    {[
                      { n: '杠铃卧推', m: '胸部', sets: '4 SETS × 8-12 REPS' },
                      { n: '上斜哑铃推举', m: '肩部/胸部', sets: '4 SETS × 10-12 REPS' },
                      { n: '绳索下压', m: '三头肌', sets: '3 SETS × 12-15 REPS' }
                    ].map((ex, i) => (
                      <div key={i} className="flex justify-between items-center bg-white/[0.02] p-3 rounded-xl border border-white/[0.03]">
                        <div className="flex flex-col">
                          <span className="text-[13px] text-white/90">{ex.n}</span>
                          <span className="text-[10px] text-[#d3a971]/80 font-['JetBrains_Mono',_monospace] mt-0.5">{ex.m}</span>
                        </div>
                        <span className="text-[11px] text-white/40 font-['JetBrains_Mono',_monospace]">{ex.sets}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {day.active && !day.isRest && (
                <div className="mt-4 pt-4 border-t border-white/[0.05] grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1 p-2 rounded-[12px] bg-black/40">
                    <span className="text-[9px] text-[#d3a971]/60 font-['JetBrains_Mono',_monospace] tracking-wider">EXERCISES</span>
                    <span className="text-[13px] font-['JetBrains_Mono',_monospace] text-white">6</span>
                  </div>
                  <div className="flex flex-col gap-1 p-2 rounded-[12px] bg-black/40">
                    <span className="text-[9px] text-[#d3a971]/60 font-['JetBrains_Mono',_monospace] tracking-wider">EST. TIME</span>
                    <span className="text-[13px] font-['JetBrains_Mono',_monospace] text-white">65m</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}