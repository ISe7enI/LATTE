import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useOutletContext } from 'react-router';
import { ChevronRight, ArrowRight, Dumbbell, Activity, Calendar, User, Check } from 'lucide-react';
import { type OutletContextType } from '../Root';
import { cn } from '../utils';
import { userAppService } from '../services/userApp';

export function Onboarding() {
  const navigate = useNavigate();
  const { currentUserId, userProfile, setUserProfile } = useOutletContext<OutletContextType>();
  const [step, setStep] = useState(0);
  const [tempNickname, setTempNickname] = useState(userProfile.nickname || '');
  const [tempUnit, setTempUnit] = useState('metric');

  useEffect(() => {
    setTempNickname(userProfile.nickname || '');
  }, [userProfile.nickname]);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!tempNickname.trim()) {
      alert("请输入昵称");
      return;
    }
    const nextProfile = { ...userProfile, id: currentUserId, nickname: tempNickname.trim() };
    setUserProfile((prev) => ({ ...prev, nickname: tempNickname.trim() }));
    if (currentUserId) {
      try {
        await userAppService.updateProfile(currentUserId, nextProfile);
      } catch {
        // Keep local state; user can retry update from Settings later.
      }
    }
    localStorage.setItem('hasOnboarded', 'true');
    localStorage.setItem('isLoggedIn', 'true');
    // Signal to Home page that this is a first time visit after onboarding
    sessionStorage.setItem('firstTimeHome', 'true');
    navigate('/home');
  };

  const slides = [
    // Step 1: Slogan & Brand
    <div key="slide0" className="flex flex-col items-center justify-center h-full text-center px-8 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-[#d3a971]/5 blur-[80px] rounded-full pointer-events-none" />
      <div className="w-20 h-20 border-2 border-[#d3a971] rotate-45 mb-12 flex items-center justify-center shadow-[0_0_40px_rgba(211,169,113,0.2)]">
        <div className="w-8 h-8 bg-white/20 -rotate-45" />
      </div>
      <h1 className="text-[32px] font-['Noto_Serif_SC',_serif] tracking-wider text-white mb-4 leading-tight">
        铸造钢铁躯躯
      </h1>
      <p className="text-[14px] font-['JetBrains_Mono',_monospace] text-[#d3a971] tracking-[0.2em] uppercase leading-relaxed">
        Progress is<br/>not linear
      </p>
    </div>,

    // Step 2: Core Feature - Smart Plan
    <div key="slide1" className="flex flex-col h-full px-8 py-16 pt-32">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-[#d3a971] mb-8 shadow-lg">
        <Calendar size={28} />
      </div>
      <h2 className="text-[24px] font-['Noto_Serif_SC',_serif] tracking-wider text-white mb-4">
        智能训练计划
      </h2>
      <p className="text-[14px] font-['Noto_Serif_SC',_serif] text-white/50 leading-relaxed max-w-[280px]">
        根据你的目标和水平，量身定制专属力量训练。自动记录超级组、动作递增负荷，规划你的成长路线。
      </p>
      <div className="flex-1 flex items-center justify-center relative mt-12">
        <div className="w-full max-w-[240px] aspect-[4/3] rounded-2xl border border-white/[0.05] bg-gradient-to-br from-[#141414] to-[#0a0a0a] relative overflow-hidden flex flex-col p-4 shadow-2xl">
           <div className="w-full h-2 bg-white/5 rounded-full mb-3" />
           <div className="w-3/4 h-2 bg-white/5 rounded-full mb-3" />
           <div className="w-1/2 h-2 bg-[#d3a971]/40 rounded-full mb-6" />
           <div className="flex gap-2">
             <div className="w-8 h-8 rounded-lg bg-white/5" />
             <div className="flex-1 rounded-lg bg-white/5" />
           </div>
        </div>
      </div>
    </div>,

    // Step 3: Core Feature - Progress Tracking
    <div key="slide2" className="flex flex-col h-full px-8 py-16 pt-32">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-[#d3a971] mb-8 shadow-lg">
        <Activity size={28} />
      </div>
      <h2 className="text-[24px] font-['Noto_Serif_SC',_serif] tracking-wider text-white mb-4">
        硬核数据追踪
      </h2>
      <p className="text-[14px] font-['Noto_Serif_SC',_serif] text-white/50 leading-relaxed max-w-[280px]">
        力量体积曲线、肌肉群热力图、总容量分析。让每一滴汗水都有迹可循，见证力量的真实增长。
      </p>
      <div className="flex-1 flex items-center justify-center relative mt-12">
        <div className="w-full max-w-[240px] aspect-[4/3] rounded-2xl border border-white/[0.05] bg-gradient-to-br from-[#141414] to-[#0a0a0a] relative overflow-hidden flex items-end justify-between p-4 px-6 gap-2 shadow-2xl">
          <div className="w-full h-[40%] bg-[#d3a971]/20 rounded-t-sm" />
          <div className="w-full h-[60%] bg-[#d3a971]/40 rounded-t-sm" />
          <div className="w-full h-[30%] bg-[#d3a971]/10 rounded-t-sm" />
          <div className="w-full h-[80%] bg-[#d3a971]/80 rounded-t-sm relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-[#d3a971] font-bold">+15%</div>
          </div>
          <div className="w-full h-[100%] bg-[#d3a971] rounded-t-sm shadow-[0_0_15px_rgba(211,169,113,0.5)]" />
        </div>
      </div>
    </div>,

    // Step 4: Core Feature - History & Analysis
    <div key="slide3" className="flex flex-col h-full px-8 py-16 pt-32">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-[#d3a971] mb-8 shadow-lg">
        <Dumbbell size={28} />
      </div>
      <h2 className="text-[24px] font-['Noto_Serif_SC',_serif] tracking-wider text-white mb-4">
        沉浸式训练体验
      </h2>
      <p className="text-[14px] font-['Noto_Serif_SC',_serif] text-white/50 leading-relaxed max-w-[280px]">
        暗黑工业风界面，专注每一次举起与放下。内置组间休息计时器，全屏防误触模式，为你打造无干扰的健身房。
      </p>
      <div className="flex-1 flex items-center justify-center relative mt-12">
        <div className="w-32 h-32 rounded-full border-4 border-white/5 border-t-[#d3a971] border-r-[#d3a971] rotate-45 flex items-center justify-center relative shadow-[0_0_30px_rgba(211,169,113,0.1)]">
           <div className="absolute -rotate-45 text-2xl font-['JetBrains_Mono',_monospace] font-bold text-white">90<span className="text-sm text-white/50 ml-1">s</span></div>
        </div>
      </div>
    </div>,

    // Step 5: Initial Setup
    <div key="slide4" className="flex flex-col h-full px-8 py-16 pt-24 overflow-y-auto scrollbar-hide">
      <div className="mb-10">
        <h2 className="text-[28px] font-['Noto_Serif_SC',_serif] tracking-wider text-white mb-2">
          身份验证
        </h2>
        <p className="text-[12px] font-['JetBrains_Mono',_monospace] text-white/40 tracking-[0.1em] uppercase">
          Initialize Profile
        </p>
      </div>

      <div className="space-y-8">
        {/* Nickname */}
        <div className="space-y-3">
          <label className="text-[12px] font-['Noto_Serif_SC',_serif] text-white/60 tracking-wider block">代号 (昵称)</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
              <User size={18} />
            </div>
            <input 
              type="text"
              value={tempNickname}
              onChange={(e) => setTempNickname(e.target.value)}
              placeholder="如: IronLifter"
              className="w-full bg-[#141414] border border-white/[0.05] rounded-2xl px-12 py-4 text-white text-[14px] outline-none focus:border-[#d3a971]/50 transition-all font-['JetBrains_Mono',_monospace]"
            />
          </div>
        </div>

        {/* Unit System */}
        <div className="space-y-3">
          <label className="text-[12px] font-['Noto_Serif_SC',_serif] text-white/60 tracking-wider block">计量单位制</label>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setTempUnit('metric')}
              className={cn(
                "py-4 rounded-2xl text-[14px] font-['Noto_Serif_SC',_serif] transition-all border flex items-center justify-center gap-2",
                tempUnit === 'metric' 
                  ? "bg-[#d3a971]/10 border-[#d3a971]/30 text-[#d3a971]" 
                  : "bg-[#141414] border-white/[0.05] text-white/40 hover:text-white"
              )}
            >
              公制 <span className="text-[10px] font-['JetBrains_Mono',_monospace] opacity-50">(KG/CM)</span>
            </button>
            <button 
              onClick={() => setTempUnit('imperial')}
              className={cn(
                "py-4 rounded-2xl text-[14px] font-['Noto_Serif_SC',_serif] transition-all border flex items-center justify-center gap-2",
                tempUnit === 'imperial' 
                  ? "bg-[#d3a971]/10 border-[#d3a971]/30 text-[#d3a971]" 
                  : "bg-[#141414] border-white/[0.05] text-white/40 hover:text-white"
              )}
            >
              英制 <span className="text-[10px] font-['JetBrains_Mono',_monospace] opacity-50">(LB/IN)</span>
            </button>
          </div>
        </div>

        {/* Note */}
        <div className="pt-6 border-t border-white/[0.05]">
          <p className="text-[11px] text-white/30 font-['Noto_Serif_SC',_serif] leading-relaxed">
            *其他身体档案信息（如身高、体重、健身目标等）可在稍后进入「设置」页面中完善。当前仅需最小必要信息。
          </p>
        </div>
      </div>
    </div>
  ];

  return (
    <div className="flex flex-col h-full bg-[#080808] relative overflow-hidden">
      {/* Skip Button */}
      {step > 0 && step < 4 && (
        <button 
          onClick={() => setStep(4)}
          className="absolute top-12 right-6 z-20 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.05] text-[12px] text-white/40 font-['Noto_Serif_SC',_serif] hover:text-white transition-colors"
        >
          跳过
        </button>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {slides[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="px-8 pb-12 pt-6 relative z-20 flex items-center justify-between">
        {/* Indicators */}
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                step === i ? "w-6 bg-[#d3a971]" : "w-2 bg-white/10"
              )}
            />
          ))}
        </div>

        {/* Action Button */}
        <button 
          onClick={handleNext}
          className={cn(
            "h-14 rounded-full flex items-center justify-center font-bold tracking-wider transition-all duration-300 active:scale-95 group",
            step === 4 
              ? "w-32 bg-[#d3a971] text-black font-['Noto_Serif_SC',_serif]" 
              : "w-14 bg-white/10 text-[#d3a971] border border-white/5 hover:bg-white/20"
          )}
        >
          {step === 4 ? (
            <span className="flex items-center gap-2">
              完成 <Check size={16} />
            </span>
          ) : (
            <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
          )}
        </button>
      </div>
    </div>
  );
}
