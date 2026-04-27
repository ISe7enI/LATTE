import { motion, AnimatePresence } from 'motion/react';
import { Timer, X, Pause, Play, Square } from 'lucide-react';
import { cn } from '../utils';
import { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// A tiny 1-second silent MP3 base64 to keep background execution somewhat alive on mobile browsers
const SILENT_MP3 = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU5LjE2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAANHAAAAAAAAAAGKBAAAAAB//OEAAAAAAAAAAAAAAAAAAAAAANHAAAAAAAAAAGKBAAAAAA";

export function TimerWidget({ 
  isActive, 
  duration, 
  onClose,
  triggerTimestamp = 0
}: { 
  isActive: boolean; 
  duration: number; 
  onClose: () => void;
  triggerTimestamp?: number;
}) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const endTimeRef = useRef<number | null>(null);
  const remainingRef = useRef<number>(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Add a way to track the current active session globally to detect when prop triggers a restart
  const [sessionKey, setSessionKey] = useState<number>(0);

  useEffect(() => {
    if (isActive) {
      setSessionKey(Date.now());
      remainingRef.current = duration; // Reset remaining on new trigger
      setIsPaused(false);
    }
  }, [isActive, duration, triggerTimestamp]);

  // Check for interrupted app timer on initial load
  useEffect(() => {
    const savedState = localStorage.getItem('rest_timer_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        const now = Date.now();
        
        // If app was killed and we are reopening, standard request says "App被杀后重新打开App时提示'计时已中断'"
        // We will just show the toast and clear it, or if it's paused we can recover it. Let's just clear and warn as requested.
        if (parsed.endTime && parsed.endTime > now && !parsed.isPaused) {
          toast.error('计时已中断', {
            description: '后台服务由于系统限制被回收',
            icon: <Timer size={16} className="text-[#d3a971]" />
          });
        }
        localStorage.removeItem('rest_timer_state');
      } catch (e) {}
    }
  }, []);

  // Timer core logic based on absolute Date.now()
  useEffect(() => {
    if (!isActive) {
      setIsExpanded(false);
      setIsPaused(false);
      localStorage.removeItem('rest_timer_state');
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    // Play silent audio to keep iOS tab alive
    if (!audioRef.current) {
      audioRef.current = new Audio(SILENT_MP3);
      audioRef.current.loop = true;
      audioRef.current.playsInline = true;
    }
    audioRef.current.play().catch(() => {});

    if (!isPaused) {
      if (remainingRef.current === duration) {
        endTimeRef.current = Date.now() + duration * 1000;
      } else {
        endTimeRef.current = Date.now() + remainingRef.current * 1000;
      }
      
      localStorage.setItem('rest_timer_state', JSON.stringify({
        endTime: endTimeRef.current,
        duration,
        isPaused: false
      }));

      const interval = setInterval(() => {
        if (!endTimeRef.current) return;
        const now = Date.now();
        const diff = Math.ceil((endTimeRef.current - now) / 1000);
        
        if (diff <= 0) {
          setTimeLeft(0);
          clearInterval(interval);
          finishTimer();
        } else {
          setTimeLeft(diff);
          remainingRef.current = diff;
        }
      }, 1000);

      // Trigger immediate update
      const initialDiff = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      setTimeLeft(Math.max(0, initialDiff));
      remainingRef.current = Math.max(0, initialDiff);

      return () => clearInterval(interval);
    } else {
      localStorage.setItem('rest_timer_state', JSON.stringify({
        remaining: remainingRef.current,
        duration,
        isPaused: true
      }));
      if (audioRef.current) audioRef.current.pause();
    }
  }, [isActive, isPaused, duration, sessionKey]);

  const finishTimer = useCallback(() => {
    // Vibrate
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500]);
    }
    
    // Create an oscillator for beep sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1);
    } catch(e) {}

    toast.success('组间休息结束', {
      description: '准备开始下一组训练！',
      style: { background: '#d3a971', color: '#000', border: 'none' },
    });

    onClose();
  }, [onClose]);

  const togglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(!isPaused);
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const progress = duration > 0 ? timeLeft / duration : 0;

  // Handle long press to expand (desktop uses onClick to simulate)
  const handleInteract = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <AnimatePresence>
      {isActive && timeLeft > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, scale: 0.9, filter: 'blur(10px)' }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto"
          onClick={handleInteract}
        >
          {/* Dynamic Island Base */}
          <motion.div 
            animate={{ 
              width: isExpanded ? 340 : 160,
              height: isExpanded ? 160 : 40,
              borderRadius: isExpanded ? 32 : 24,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="bg-black text-white overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)] border border-white/10 relative cursor-pointer"
          >
            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 p-5 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-[#d3a971] text-[10px] font-['JetBrains_Mono',_monospace] uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Timer size={12} className="animate-pulse" />
                        REST TIMER
                      </span>
                      <span className="text-white text-[42px] font-['JetBrains_Mono',_monospace] leading-none tracking-tight">
                        {mins}:{secs}
                      </span>
                    </div>
                    <button 
                      onClick={handleStop}
                      className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  
                  {/* Progress Line */}
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden my-3">
                    <motion.div 
                      className="h-full bg-[#d3a971]"
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={togglePause}
                      className="flex-1 h-12 rounded-[16px] bg-[#d3a971] text-black font-bold flex items-center justify-center gap-2 hover:bg-[#c29a65] transition-colors"
                    >
                      {isPaused ? <Play fill="currentColor" size={16} /> : <Pause fill="currentColor" size={16} />}
                      {isPaused ? "继续" : "暂停"}
                    </button>
                    <button 
                      onClick={handleStop}
                      className="w-16 h-12 rounded-[16px] bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <Square fill="currentColor" size={16} className="text-red-400" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Collapsed Content (Pill) */
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 px-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-[#d3a971]">
                    {isPaused ? <Pause size={14} /> : <Timer size={14} className="animate-pulse" />}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Tiny wave animation when playing */}
                    {!isPaused && (
                      <div className="flex gap-[2px] items-center h-3 mr-2">
                        <motion.div animate={{ height: ["40%", "100%", "40%"] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-0.5 bg-[#d3a971]/50 rounded-full" />
                        <motion.div animate={{ height: ["100%", "40%", "100%"] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-0.5 bg-[#d3a971]/50 rounded-full" />
                        <motion.div animate={{ height: ["60%", "100%", "60%"] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-0.5 bg-[#d3a971]/50 rounded-full" />
                      </div>
                    )}
                    <span className="text-[14px] font-['JetBrains_Mono',_monospace] text-[#d3a971] tracking-wider font-bold">
                      {mins}:{secs}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}