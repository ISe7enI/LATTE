import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Shield, ArrowLeft, Key, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils';

export function CoachEntry() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('coach_authorized');
    if (isAuth === 'true') {
      navigate('/coach/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      if (code === 'COACH2026' || code === '') {
        localStorage.setItem('coach_authorized', 'true');
        navigate('/coach/dashboard', { replace: true });
      } else {
        setError(true);
        setIsApplying(false);
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-[#080808] relative z-50">
      <header className="pt-12 px-6 pb-4 flex items-center justify-between border-b border-white/[0.03] backdrop-blur-xl bg-[#080808]/80 sticky top-0 z-10">
        <button onClick={() => navigate('/profile')} className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[16px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/90">
          教练授权
        </h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto px-6 pt-12 pb-24 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 rounded-full bg-[#d3a971]/10 flex items-center justify-center mb-6 border border-[#d3a971]/30"
        >
          <Shield size={40} className="text-[#d3a971]" />
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[24px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/90 mb-2 text-center"
        >
          硬核教练模式
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[14px] text-white/40 text-center mb-12 max-w-[280px]"
        >
          仅对认证教练开放，为您提供专业的学员管理、数据分析与计划排期功能。
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full space-y-6"
        >
          <div className="space-y-3">
            <label className="text-[12px] font-['JetBrains_Mono',_monospace] tracking-[0.2em] text-[#d3a971] uppercase">Authorization Code</label>
            <div className="relative">
              <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input 
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(false); }}
                placeholder="输入授权码 (可留空体验)"
                className={cn(
                  "w-full bg-white/[0.02] border rounded-xl pl-12 pr-4 py-4 text-[14px] text-white placeholder-white/20 focus:outline-none transition-colors",
                  error ? "border-[#b24848]/50 focus:border-[#b24848]" : "border-white/[0.05] focus:border-[#d3a971]/50"
                )}
              />
            </div>
            {error && <span className="text-[12px] text-[#b24848] pl-2">授权码不正确，请重试</span>}
          </div>

          <button 
            onClick={handleApply}
            disabled={isApplying}
            className="w-full py-4 rounded-[16px] bg-[#d3a971] text-black font-['Noto_Serif_SC',_serif] tracking-widest font-bold hover:bg-[#d3a971]/90 transition-all flex items-center justify-center gap-2"
          >
            {isApplying ? (
              <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 size={18} />
                验证并开启
              </>
            )}
          </button>

          <button 
            onClick={() => navigate('/profile')}
            className="w-full py-4 rounded-[16px] bg-white/[0.03] border border-white/[0.05] text-white/60 font-['Noto_Serif_SC',_serif] tracking-widest hover:text-white transition-all"
          >
            返回普通模式
          </button>
        </motion.div>
      </main>
    </div>
  );
}