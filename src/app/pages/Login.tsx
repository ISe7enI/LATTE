import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { Phone, Check, ChevronRight, X, User, Lock } from 'lucide-react';
import { cn } from '../utils';
import { authService } from '../services/auth';

export function Login() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [loginMode, setLoginMode] = useState<'phone' | 'password'>('phone');
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState('');
  const [inlineSuccess, setInlineSuccess] = useState('');
  const [createCoachPlaceholder, setCreateCoachPlaceholder] = useState(false);

  const completeLogin = (userId: string, isNewUser: boolean) => {
    localStorage.setItem('latte.userId', userId);
    localStorage.setItem('isLoggedIn', 'true');
    if (isNewUser) {
      localStorage.setItem('hasOnboarded', 'false');
      navigate('/onboarding');
      return;
    }
    localStorage.setItem('hasOnboarded', 'true');
    navigate('/home');
  };

  const handlePasswordSubmit = async () => {
    setInlineError('');
    setInlineSuccess('');
    if (!agreed) {
      setInlineError("请先阅读并同意隐私政策");
      return;
    }
    if (!username.trim()) {
      setInlineError("请输入用户名");
      return;
    }
    if (!password) {
      setInlineError("请输入密码");
      return;
    }
    if (isRegister) {
      if (!/^1\d{10}$/.test(phone.trim())) {
        setInlineError("注册需绑定 11 位手机号");
        return;
      }
      if (!/^\d{6}$/.test(phoneCode.trim())) {
        setInlineError("请输入 6 位手机验证码");
        return;
      }
      if (password.length < 6) {
        setInlineError("密码至少 6 位");
        return;
      }
      if (password !== confirmPassword) {
        setInlineError("两次密码不一致");
        return;
      }
    }
    setIsSubmitting(true);
    try {
      if (isRegister) {
        const result = await authService.register(
          username.trim(),
          password,
          phone.trim(),
          phoneCode.trim(),
          createCoachPlaceholder,
        );
        completeLogin(result.userId, true);
        return;
      }
      const result = await authService.login(username.trim(), password);
      completeLogin(result.userId, false);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      setInlineError(message || "登录失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendPhoneCode = async () => {
    setInlineError('');
    setInlineSuccess('');
    if (!/^1\d{10}$/.test(phone.trim())) {
      setInlineError("请输入 11 位手机号");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await authService.sendPhoneCode(phone.trim());
      setInlineSuccess(`验证码已发送（测试环境：${result.code}）`);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      setInlineError(message || "验证码发送失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneLoginSubmit = async () => {
    setInlineError('');
    setInlineSuccess('');
    if (!agreed) {
      setInlineError("请先阅读并同意隐私政策");
      return;
    }
    if (!/^1\d{10}$/.test(phone.trim())) {
      setInlineError("请输入 11 位手机号");
      return;
    }
    if (!/^\d{6}$/.test(phoneCode.trim())) {
      setInlineError("请输入 6 位验证码");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await authService.loginByPhone(phone.trim(), phoneCode.trim());
      completeLogin(result.userId, result.isNewUser);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      setInlineError(message || "手机号登录失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#080808] relative px-6 py-12">
      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacy && (
          <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
              onClick={() => setShowPrivacy(false)}
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full h-[85vh] bg-[#141414] rounded-t-[32px] border-t border-white/[0.05] flex flex-col pointer-events-auto z-10 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]"
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10 rounded-full" />
              <button 
                onClick={() => setShowPrivacy(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-white/50 hover:text-white"
              >
                <X size={16} />
              </button>
              
              <div className="px-8 pt-10 pb-6 border-b border-white/[0.05]">
                <h2 className="text-[20px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90">
                  隐私政策与免责声明
                </h2>
                <p className="text-[12px] font-['JetBrains_Mono',_monospace] text-[#d3a971] tracking-[0.1em] mt-1">
                  PRIVACY POLICY & DISCLAIMER
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6 text-sm text-white/60 font-['Noto_Serif_SC',_serif] leading-relaxed">
                <div>
                  <h3 className="text-white/80 font-bold mb-2">1. 免责声明</h3>
                  <p>本App提供的训练计划、健身建议及数据分析仅供参考。由于个体差异，任何训练计划均存在潜在的运动风险。用户在开始任何训练计划前，应确保自身身体状况良好，必要时请咨询专业医生或专业教练。</p>
                </div>
                <div>
                  <h3 className="text-white/80 font-bold mb-2">2. 隐私数据收集</h3>
                  <p>为了给您提供个性化的健身服务，我们需要收集您的基本身体数据（包括但不限于身高、体重、年龄、性别等）以及训练数据记录。我们承诺仅收集实现核心功能所必需的最小必要信息。</p>
                </div>
                <div>
                  <h3 className="text-white/80 font-bold mb-2">3. 数据保护</h3>
                  <p>所有收集的数据均经过加密处理并安全存储。未经您的明确授权，我们绝不会将您的个人数据提供给任何第三方。</p>
                </div>
              </div>
              
              <div className="p-6 border-t border-white/[0.05] bg-[#0a0a0a]">
                <button 
                  onClick={() => {
                    setAgreed(true);
                    setShowPrivacy(false);
                    // Automatically continue after agreement in register mode
                    if (isRegister) {
                      void handlePasswordSubmit();
                    }
                  }}
                  className="w-full py-4 rounded-2xl bg-[#d3a971] text-black font-bold tracking-widest active:scale-[0.98] transition-transform"
                >
                  同意协议并继续
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="w-12 h-12 border border-[#d3a971] rotate-45 mb-8 flex items-center justify-center">
             <div className="w-4 h-4 bg-white/20 -rotate-45" />
          </div>
          <h1 className="text-[28px] font-['Noto_Serif_SC',_serif] tracking-wider text-white mb-2 transition-all">
            {isRegister ? "档案注册" : "进入训练基地"}
          </h1>
          <p className="text-[12px] font-['JetBrains_Mono',_monospace] text-white/40 tracking-[0.2em] transition-all">
            {isRegister ? "CREATE ACCOUNT" : "ENTER THE TRAINING GROUND"}
          </p>
        </div>

        {/* Auth mode tabs */}
        <div className="mb-8 border-b border-white/[0.05]">
          {isRegister ? (
            <div className="pb-3 text-[14px] font-['Noto_Serif_SC',_serif] text-[#d3a971] relative inline-block">
              账号密码注册
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#d3a971]" />
            </div>
          ) : (
            <div className="flex gap-6">
              <button
                onClick={() => setLoginMode('phone')}
                className={cn(
                  "pb-3 text-[14px] font-['Noto_Serif_SC',_serif] transition-colors relative",
                  loginMode === 'phone' ? "text-[#d3a971]" : "text-white/40 hover:text-white/70"
                )}
              >
                手机快捷登录
                {loginMode === 'phone' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#d3a971]" />}
              </button>
              <button
                onClick={() => setLoginMode('password')}
                className={cn(
                  "pb-3 text-[14px] font-['Noto_Serif_SC',_serif] transition-colors relative",
                  loginMode === 'password' ? "text-[#d3a971]" : "text-white/40 hover:text-white/70"
                )}
              >
                账号密码登录
                {loginMode === 'password' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#d3a971]" />}
              </button>
            </div>
          )}
        </div>

        {/* Inputs */}
        <AnimatePresence mode="wait">
            <motion.div 
              key={isRegister || loginMode === 'password' ? "password-inputs" : "phone-inputs"}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 mb-8"
            >
              {(isRegister || loginMode === 'password') ? (
                <>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#d3a971] transition-colors">
                      <User size={18} />
                    </div>
                    <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="用户名 Username"
                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-12 py-4 text-white text-[14px] outline-none focus:border-[#d3a971]/50 focus:bg-[#141414] transition-all placeholder:text-white/20 font-['JetBrains_Mono',_monospace]"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#d3a971] transition-colors">
                      <Lock size={18} />
                    </div>
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="密码 Password"
                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-12 py-4 text-white text-[14px] outline-none focus:border-[#d3a971]/50 focus:bg-[#141414] transition-all placeholder:text-white/20 font-['JetBrains_Mono',_monospace]"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#d3a971] transition-colors">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="手机号 Phone Number"
                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-12 py-4 text-white text-[14px] outline-none focus:border-[#d3a971]/50 focus:bg-[#141414] transition-all placeholder:text-white/20 font-['JetBrains_Mono',_monospace]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      placeholder="短信验证码 Code"
                      className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-4 text-white text-[14px] outline-none focus:border-[#d3a971]/50 focus:bg-[#141414] transition-all placeholder:text-white/20 font-['JetBrains_Mono',_monospace]"
                    />
                    <button
                      onClick={() => void handleSendPhoneCode()}
                      disabled={isSubmitting}
                      className="bg-white/[0.05] border border-white/[0.05] text-[#d3a971] px-5 rounded-2xl text-[12px] font-['Noto_Serif_SC',_serif] whitespace-nowrap hover:bg-[#d3a971]/10 transition-colors disabled:opacity-60"
                    >
                      获取
                    </button>
                  </div>
                </>
              )}
              
              <AnimatePresence>
                {isRegister && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden space-y-3"
                  >
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#d3a971] transition-colors">
                        <Phone size={18} />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="绑定手机号 Phone Number"
                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-12 py-4 text-white text-[14px] outline-none focus:border-[#d3a971]/50 focus:bg-[#141414] transition-all placeholder:text-white/20 font-['JetBrains_Mono',_monospace]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value)}
                        placeholder="短信验证码 Code"
                        className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-4 text-white text-[14px] outline-none focus:border-[#d3a971]/50 focus:bg-[#141414] transition-all placeholder:text-white/20 font-['JetBrains_Mono',_monospace]"
                      />
                      <button
                        onClick={() => void handleSendPhoneCode()}
                        disabled={isSubmitting}
                        className="bg-white/[0.05] border border-white/[0.05] text-[#d3a971] px-5 rounded-2xl text-[12px] font-['Noto_Serif_SC',_serif] whitespace-nowrap hover:bg-[#d3a971]/10 transition-colors disabled:opacity-60"
                      >
                        获取
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#d3a971] transition-colors">
                        <Lock size={18} />
                      </div>
                      <input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="确认密码 Confirm Password"
                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-12 py-4 text-white text-[14px] outline-none focus:border-[#d3a971]/50 focus:bg-[#141414] transition-all placeholder:text-white/20 font-['JetBrains_Mono',_monospace]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isRegister && (
                <button
                  type="button"
                  onClick={() => setCreateCoachPlaceholder((prev) => !prev)}
                  className={cn(
                    "w-full mt-2 rounded-xl border px-4 py-3 text-left text-[12px] font-['Noto_Serif_SC',_serif] transition-colors",
                    createCoachPlaceholder
                      ? "border-[#d3a971]/50 bg-[#d3a971]/10 text-[#d3a971]"
                      : "border-white/[0.08] bg-white/[0.02] text-white/60 hover:text-white/80",
                  )}
                >
                  {createCoachPlaceholder ? "已启用" : "可选"}：注册后自动创建教练学员占位关系
                </button>
              )}
            </motion.div>
        </AnimatePresence>

        {(inlineError || inlineSuccess) && (
          <div className={cn("mb-4 text-[12px] rounded-xl px-3 py-2 border", inlineError ? "text-[#ff8b8b] border-[#ff8b8b]/20 bg-[#ff8b8b]/10" : "text-[#9de7bf] border-[#9de7bf]/20 bg-[#9de7bf]/10")}>
            {inlineError || inlineSuccess}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4 mb-8">
          <button 
            onClick={() => {
              if (isRegister && !agreed) {
                setShowPrivacy(true);
              } else {
                if (!isRegister && loginMode === 'phone') {
                  void handlePhoneLoginSubmit();
                } else {
                  void handlePasswordSubmit();
                }
              }
            }}
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-[#d3a971] text-black font-['Noto_Serif_SC',_serif] tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-[#b89362] transition-colors group shadow-[0_0_20px_rgba(211,169,113,0.2)]"
          >
            {isSubmitting ? "处理中..." : isRegister ? "立即注册 REGISTER" : "登录 LOGIN"}
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="w-full py-4 rounded-2xl border border-white/10 text-white/60 font-['Noto_Serif_SC',_serif] tracking-widest flex items-center justify-center gap-2 hover:border-[#d3a971]/50 hover:bg-white/5 hover:text-white transition-colors"
          >
            {isRegister ? "已有账号？立即登录" : "没有账号？注册新账号"}
          </button>
        </div>

        {/* Removed quick-login alternatives intentionally */}
      </div>

      {/* Agreement Checkbox */}
      <div className="mt-auto flex items-start justify-center gap-3">
        <button 
          onClick={() => setAgreed(!agreed)}
          className={cn(
            "mt-0.5 flex-shrink-0 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors",
            agreed ? "bg-[#d3a971] border-[#d3a971]" : "border-white/20 bg-white/[0.02]"
          )}
        >
          {agreed && <Check size={10} className="text-black stroke-[3]" />}
        </button>
        <span className="text-[11px] text-white/40 font-['Noto_Serif_SC',_serif] leading-relaxed max-w-[240px]">
          我已阅读并同意 <button onClick={() => setShowPrivacy(true)} className="text-[#d3a971] underline underline-offset-2 decoration-[#d3a971]/30">用户免责声明</button> 及 <button onClick={() => setShowPrivacy(true)} className="text-[#d3a971] underline underline-offset-2 decoration-[#d3a971]/30">隐私政策</button>
        </span>
      </div>
    </div>
  );
}
