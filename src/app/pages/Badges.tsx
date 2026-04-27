import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Award, Flame, Dumbbell, Trophy, Calendar, Moon, Sun, Star, Check, Zap, Target } from 'lucide-react';
import { cn } from '../utils';
import { type OutletContextType } from '../Root';
import { buildBadgesFromWorkouts } from '../services/achievements';

type BadgeType = {
  id: string;
  title: string;
  description: string;
  icon: any;
  unlocked: boolean;
  date?: string;
  progress?: number;
  total?: number;
  color: string;
};

const BADGE_UI_META: Record<string, { icon: any; color: string }> = {
  '1': { icon: Flame, color: 'from-[#ff7b00] to-[#ff4500]' },
  '2': { icon: Dumbbell, color: 'from-[#4facfe] to-[#00f2fe]' },
  '3': { icon: Calendar, color: 'from-[#43e97b] to-[#38f9d7]' },
  '4': { icon: Moon, color: 'from-[#8e2de2] to-[#4a00e0]' },
  '5': { icon: Sun, color: 'from-[#f6d365] to-[#fda085]' },
  '6': { icon: Trophy, color: 'from-[#c79081] to-[#dfa579]' },
  '7': { icon: Target, color: 'from-[#2af598] to-[#009efd]' },
  '8': { icon: Zap, color: 'from-[#f83600] to-[#f9d423]' },
};

export function Badges() {
  const navigate = useNavigate();
  const { completedWorkouts } = useOutletContext<OutletContextType>();
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
  const badges = useMemo<BadgeType[]>(
    () =>
      buildBadgesFromWorkouts(completedWorkouts).map((badge) => ({
        ...badge,
        icon: BADGE_UI_META[badge.id]?.icon ?? Award,
        color: BADGE_UI_META[badge.id]?.color ?? 'from-[#444] to-[#222]',
      })),
    [completedWorkouts],
  );

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="flex flex-col h-full bg-[#080808] text-white relative overflow-hidden">
      <header className="pt-12 px-6 pb-4 relative z-20 flex items-center justify-between border-b border-white/[0.03] bg-[#0a0a0a]">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.2em] mb-1">
            ACHIEVEMENTS
          </span>
          <h1 className="text-[18px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90">
            成就徽章
          </h1>
        </div>
        <div className="w-10 flex justify-end">
          <div className="w-8 h-8 rounded-full bg-[#d3a971]/20 flex items-center justify-center text-[#d3a971] text-[10px] font-bold">
            {unlockedCount}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pt-6 pb-24 scrollbar-hide relative z-10">
        
        {/* Progress Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-[20px] bg-[#141414]/80 border border-white/[0.05] flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#d3a971]/5 to-transparent pointer-events-none" />
          <Award size={32} className="text-[#d3a971] mb-2 relative z-10" />
          <h2 className="text-[14px] font-['Noto_Serif_SC',_serif] text-white/80 relative z-10">总成就解锁进度</h2>
          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden mt-2 relative z-10">
            <div 
              className="h-full bg-[#d3a971] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${(unlockedCount / badges.length) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-['JetBrains_Mono',_monospace] text-white/40 mt-1 relative z-10">
            {unlockedCount} / {badges.length} UNLOCKED
          </span>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4">
          {badges.map((badge, idx) => (
            <motion.div 
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedBadge(badge)}
              className={cn(
                "p-5 rounded-[20px] border flex flex-col items-center text-center gap-3 cursor-pointer transition-all relative overflow-hidden group",
                badge.unlocked 
                  ? "bg-[#1a1a1a] border-white/10 hover:border-[#d3a971]/50" 
                  : "bg-[#0a0a0a] border-white/[0.02] hover:border-white/10 opacity-70 grayscale"
              )}
            >
              {/* Badge Icon Background Glow */}
              {badge.unlocked && (
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-b opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity",
                  badge.color
                )} />
              )}
              
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center relative z-10",
                badge.unlocked ? `bg-gradient-to-br ${badge.color} shadow-lg` : "bg-white/5 border border-white/10"
              )}>
                <badge.icon size={24} className={badge.unlocked ? "text-white" : "text-white/30"} />
                {badge.unlocked && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-black rounded-full border border-white/10 flex items-center justify-center">
                    <Star size={10} className="text-[#d3a971] fill-[#d3a971]" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center gap-1 z-10 w-full mt-2">
                <span className={cn(
                  "text-[12px] font-['Noto_Serif_SC',_serif] tracking-wider truncate w-full",
                  badge.unlocked ? "text-white" : "text-white/40"
                )}>
                  {badge.title}
                </span>
                {badge.unlocked ? (
                  <span className="text-[10px] font-['JetBrains_Mono',_monospace] text-[#d3a971]">
                    {badge.date}
                  </span>
                ) : (
                  <span className="text-[10px] font-['JetBrains_Mono',_monospace] text-white/30">
                    未解锁
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

      </main>

      {/* Badge Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm pointer-events-auto"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[320px] bg-[#141414] border border-white/10 rounded-[30px] p-8 flex flex-col items-center text-center relative overflow-hidden shadow-2xl"
            >
              {selectedBadge.unlocked && (
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-b opacity-10 pointer-events-none",
                  selectedBadge.color
                )} />
              )}
              
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center mb-6 relative z-10",
                selectedBadge.unlocked ? `bg-gradient-to-br ${selectedBadge.color} shadow-[0_0_40px_rgba(255,255,255,0.2)]` : "bg-white/5 border border-white/10"
              )}>
                <selectedBadge.icon size={40} className={selectedBadge.unlocked ? "text-white" : "text-white/30"} />
              </div>

              <h2 className="text-[20px] font-['Noto_Serif_SC',_serif] text-white mb-2 relative z-10 tracking-widest">
                {selectedBadge.title}
              </h2>
              
              <p className="text-[12px] text-white/60 font-['Noto_Serif_SC',_serif] mb-6 leading-relaxed relative z-10">
                {selectedBadge.description}
              </p>

              {selectedBadge.unlocked ? (
                <div className="flex items-center gap-2 text-[10px] font-['JetBrains_Mono',_monospace] text-[#d3a971] bg-[#d3a971]/10 px-4 py-2 rounded-full border border-[#d3a971]/20 relative z-10">
                  <Check size={12} />
                  已于 {selectedBadge.date} 解锁
                </div>
              ) : (
                <div className="w-full flex flex-col gap-2 relative z-10">
                  <div className="flex justify-between text-[10px] font-['JetBrains_Mono',_monospace] text-white/40 px-1">
                    <span>PROGRESS</span>
                    <span>{selectedBadge.progress || 0} / {selectedBadge.total || 1}</span>
                  </div>
                  <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-[#d3a971] rounded-full transition-all duration-1000"
                      style={{ width: `${((selectedBadge.progress || 0) / (selectedBadge.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => setSelectedBadge(null)}
                className="mt-8 w-full py-3 rounded-xl bg-white/5 text-white/60 text-[12px] hover:bg-white/10 transition-colors relative z-10 font-['Noto_Serif_SC',_serif] tracking-widest"
              >
                关闭
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}