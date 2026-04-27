import { AnimatePresence, motion } from "motion/react";
import { Award, Calendar, Dumbbell, Flame, Moon, Sun, Target, Trophy, Zap } from "lucide-react";
import { type AchievementBadge } from "../services/achievements";

type Props = {
  badge: AchievementBadge | null;
};

const BADGE_UI_META: Record<string, { color: string; Icon: any }> = {
  "1": { color: "from-[#ff7b00] to-[#ff4500]", Icon: Flame },
  "2": { color: "from-[#4facfe] to-[#00f2fe]", Icon: Dumbbell },
  "3": { color: "from-[#43e97b] to-[#38f9d7]", Icon: Calendar },
  "4": { color: "from-[#8e2de2] to-[#4a00e0]", Icon: Moon },
  "5": { color: "from-[#f6d365] to-[#fda085]", Icon: Sun },
  "6": { color: "from-[#c79081] to-[#dfa579]", Icon: Trophy },
  "7": { color: "from-[#2af598] to-[#009efd]", Icon: Target },
  "8": { color: "from-[#f83600] to-[#f9d423]", Icon: Zap },
};

export function AchievementUnlockOverlay({ badge }: Props) {
  const meta = badge ? BADGE_UI_META[badge.id] : null;
  const Icon = meta?.Icon ?? Award;

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6 pointer-events-none"
        >
          <motion.div
            key={badge.id}
            initial={{ y: 20, scale: 0.92, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="w-full max-w-[320px] rounded-[26px] border border-white/10 bg-[#111111] p-7 text-center shadow-2xl"
          >
            <div className="text-[10px] tracking-[0.2em] text-[#d3a971] font-['JetBrains_Mono',_monospace] mb-2">
              ACHIEVEMENT UNLOCKED
            </div>
            <h3 className="text-[18px] text-white font-['Noto_Serif_SC',_serif] tracking-wider mb-5">解锁新成就</h3>
            <div className={`mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br ${meta?.color ?? "from-[#555] to-[#333]"} flex items-center justify-center shadow-lg`}>
              <Icon size={34} className="text-white" />
            </div>
            <div className="text-[20px] text-white font-['Noto_Serif_SC',_serif] tracking-wider mb-2">{badge.title}</div>
            <p className="text-[12px] text-white/60 font-['Noto_Serif_SC',_serif] leading-relaxed">{badge.description}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
