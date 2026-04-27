import { motion } from 'motion/react';
import { Settings, Award, Edit3, Shield, ArrowRight } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router';
import { useRef } from 'react';
import { type OutletContextType } from '../Root';
import { userAppService } from '../services/userApp';
import { toast } from 'sonner';

export function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUserId, userProfile, setUserProfile } = useOutletContext<OutletContextType>();
  const avatar = userProfile.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(userProfile.nickname || 'LATTE')}`;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const nextAvatar = reader.result as string;
        const nextProfile = { ...userProfile, avatar: nextAvatar };
        setUserProfile(nextProfile);
        try {
          await userAppService.updateProfile(currentUserId, { id: currentUserId, ...nextProfile });
          toast.success('头像已保存');
        } catch (error: any) {
          const message = error instanceof Error ? error.message : String(error);
          toast.error(message || '头像保存失败，请重试');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <header className="pt-12 px-6 pb-4 relative z-20 flex flex-col backdrop-blur-xl bg-[#080808]/80 border-b border-white/[0.03]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.2em] mb-1">
              PROFILE
            </span>
            <h1 className="text-[20px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90">
              个人中心
            </h1>
          </div>
          <button 
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide px-6 pt-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center mb-8 relative"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#d3a971]/20 blur-[60px] rounded-full pointer-events-none" />
          
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-b from-[#d3a971] to-[#141414] relative z-10 mb-4 shadow-[0_0_40px_rgba(211,169,113,0.3)]">
            <div 
              className="w-full h-full rounded-full border-2 border-black overflow-hidden relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit3 size={16} className="text-white mb-1" />
                <span className="text-[10px] text-white/90 font-['Noto_Serif_SC',_serif]">更换头像</span>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#d3a971] rounded-full border-2 border-[#0a0a0a] flex items-center justify-center shadow-lg">
              <Award size={12} className="text-black" />
            </div>
          </div>
          
          <h2 className="text-[22px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/90 relative z-10">{userProfile.nickname}</h2>
          <span className="text-[10px] text-[#d3a971]/80 font-['JetBrains_Mono',_monospace] uppercase tracking-[0.2em] mt-1 relative z-10">{userProfile.level} LIFTER</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="space-y-3"
        >
          <h3 className="text-[12px] font-['JetBrains_Mono',_monospace] tracking-[0.2em] text-white/40 uppercase px-2 mb-2">Metrics</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="p-4 rounded-[16px] bg-[#141414]/80 border border-white/[0.03] flex flex-col items-center justify-center">
              <span className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace] uppercase tracking-[0.1em] mb-1">BODY WEIGHT</span>
              <span className="text-[20px] font-['JetBrains_Mono',_monospace] text-[#d3a971] tracking-wider">{userProfile.weight}<span className="text-[12px] text-white/30 ml-1">KG</span></span>
            </div>
            <div className="p-4 rounded-[16px] bg-[#141414]/80 border border-white/[0.03] flex flex-col items-center justify-center">
              <span className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace] uppercase tracking-[0.1em] mb-1">AGE</span>
              <span className="text-[20px] font-['JetBrains_Mono',_monospace] text-white tracking-wider">{userProfile.age}<span className="text-[12px] text-white/30 ml-1">YRS</span></span>
            </div>
          </div>
          
          <h3 className="text-[12px] font-['JetBrains_Mono',_monospace] tracking-[0.2em] text-white/40 uppercase px-2 mb-2">Account</h3>

          <div className="bg-[#141414]/30 rounded-[20px] border border-white/[0.02] overflow-hidden">
            {[
              { icon: Shield, label: "隐私与安全", val: "Protected", path: "/privacy" },
              { icon: Award, label: "成就徽章", val: "12 Unlocked", path: "/badges" },
              { icon: Settings, label: "偏好设置", val: "", path: "/settings" },
            ].map((item, i) => (
              <div 
                key={i} 
                onClick={() => navigate(item.path)}
                className="flex items-center justify-between p-4 border-b border-white/[0.02] last:border-0 hover:bg-[#141414] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#d3a971] transition-colors">
                    <item.icon size={16} />
                  </div>
                  <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/80">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.val && <span className="text-[10px] text-white/30 font-['JetBrains_Mono',_monospace] tracking-[0.1em]">{item.val}</span>}
                  <ArrowRight size={14} className="text-white/20 group-hover:text-white/60 transition-colors" />
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => navigate('/coach')}
            className="w-full mt-6 py-4 rounded-[16px] bg-gradient-to-r from-[#1a140d] to-[#0a0a0a] border border-[#d3a971]/30 text-[#d3a971] font-['Noto_Serif_SC',_serif] tracking-widest hover:border-[#d3a971] hover:shadow-[0_0_20px_rgba(211,169,113,0.2)] transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            <Shield size={18} className="group-hover:scale-110 transition-transform text-[#d3a971]" />
            <span className="font-bold tracking-[0.2em]">切换教练模式</span>
          </button>
          
          <button 
            onClick={() => {
              localStorage.removeItem('isLoggedIn');
              localStorage.removeItem('hasOnboarded');
              localStorage.removeItem('latte.userId');
              navigate('/');
            }}
            className="w-full mt-6 py-4 rounded-[16px] bg-[#b24848]/10 border border-[#b24848]/20 text-[#b24848] font-['Noto_Serif_SC',_serif] tracking-widest hover:bg-[#b24848]/20 hover:text-[#ff6b6b] transition-all duration-300"
          >
            退出登录 LOG OUT
          </button>
        </motion.div>
      </main>
    </div>
  );
}
