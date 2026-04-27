import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Shield, Lock, Eye, Fingerprint, FileText, AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '../utils';
import { authService } from '../services/auth';
import { toast } from 'sonner';

export function PrivacySecurity() {
  const navigate = useNavigate();
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [profilePublic, setProfilePublic] = useState(false);
  const [dataCollection, setDataCollection] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const resetPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setIsSavingPassword(false);
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('请完整填写当前密码和新密码');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('新密码至少 6 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('两次新密码输入不一致');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('新密码不能与当前密码相同');
      return;
    }

    try {
      setIsSavingPassword(true);
      setPasswordError('');
      await authService.changePassword(currentPassword, newPassword, confirmPassword);
      toast.success('密码已修改，请重新登录');
      setShowPasswordModal(false);
      resetPasswordModal();
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('latte.userId');
      navigate('/login');
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      setPasswordError(message || '密码修改失败，请稍后重试');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('请输入 DELETE 以确认注销');
      return;
    }
    try {
      setIsDeletingAccount(true);
      setDeleteError('');
      await authService.deleteAccount(deleteConfirmText);
      toast.success('账号已永久注销');
      setShowDeleteModal(false);
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('hasOnboarded');
      localStorage.removeItem('latte.userId');
      navigate('/login');
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      setDeleteError(message || '注销失败，请稍后重试');
    } finally {
      setIsDeletingAccount(false);
    }
  };

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
            SECURITY
          </span>
          <h1 className="text-[18px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90">
            隐私与安全
          </h1>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto px-6 pt-6 pb-24 space-y-8 scrollbar-hide">
        
        {/* Security Status */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-[20px] bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-[#d3a971]/20 flex items-center gap-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#d3a971]/10 blur-[40px] rounded-full pointer-events-none" />
          <div className="w-12 h-12 rounded-full bg-[#d3a971]/20 flex items-center justify-center text-[#d3a971] shadow-[0_0_20px_rgba(211,169,113,0.2)]">
            <Shield size={24} />
          </div>
          <div className="flex flex-col gap-1 z-10">
            <h2 className="text-[16px] font-['Noto_Serif_SC',_serif] text-white">账户已处于保护中</h2>
            <p className="text-[12px] text-white/50 font-['JetBrains_Mono',_monospace]">安全评级：高 (High Security)</p>
          </div>
        </motion.div>

        {/* Access Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <h3 className="text-[10px] font-['JetBrains_Mono',_monospace] text-white/30 tracking-[0.2em] px-2">登录与访问</h3>
          <div className="bg-[#141414]/50 border border-white/[0.03] rounded-[20px] overflow-hidden">
            
            <div 
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center justify-between p-4 border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-[10px] bg-white/[0.03] flex items-center justify-center text-white/40 group-hover:text-[#d3a971] transition-colors">
                  <Lock size={16} />
                </div>
                <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/80 group-hover:text-white transition-colors">修改登录密码</span>
              </div>
              <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-[10px] bg-white/[0.03] flex items-center justify-center text-white/40 group-hover:text-[#d3a971] transition-colors">
                    <Fingerprint size={16} />
                  </div>
                  <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/80 group-hover:text-white transition-colors">面容 ID / 触控 ID</span>
                </div>
              </div>
              <button 
                onClick={() => setBiometricEnabled(!biometricEnabled)}
                className={cn("w-10 h-6 rounded-full flex items-center px-1 transition-colors", biometricEnabled ? "bg-[#d3a971]" : "bg-white/10")}
              >
                <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" animate={{ x: biometricEnabled ? 16 : 0 }} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Privacy Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-[10px] font-['JetBrains_Mono',_monospace] text-white/30 tracking-[0.2em] px-2">数据隐私</h3>
          <div className="bg-[#141414]/50 border border-white/[0.03] rounded-[20px] overflow-hidden">
            
            <div className="flex items-center justify-between p-4 border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-[10px] bg-white/[0.03] flex items-center justify-center text-white/40 group-hover:text-[#d3a971] transition-colors">
                  <Eye size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/80 group-hover:text-white transition-colors">公开训练记录</span>
                  <span className="text-[10px] text-white/40 font-['Noto_Serif_SC',_serif]">允许好友查看你的训练动态</span>
                </div>
              </div>
              <button 
                onClick={() => setProfilePublic(!profilePublic)}
                className={cn("w-10 h-6 rounded-full flex items-center px-1 transition-colors", profilePublic ? "bg-[#d3a971]" : "bg-white/10")}
              >
                <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" animate={{ x: profilePublic ? 16 : 0 }} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-[10px] bg-white/[0.03] flex items-center justify-center text-white/40 group-hover:text-[#d3a971] transition-colors">
                  <FileText size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/80 group-hover:text-white transition-colors">改进计划数据收集</span>
                  <span className="text-[10px] text-white/40 font-['Noto_Serif_SC',_serif]">匿名发送使用数据以帮助改进应用</span>
                </div>
              </div>
              <button 
                onClick={() => setDataCollection(!dataCollection)}
                className={cn("w-10 h-6 rounded-full flex items-center px-1 transition-colors", dataCollection ? "bg-[#d3a971]" : "bg-white/10")}
              >
                <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" animate={{ x: dataCollection ? 16 : 0 }} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 pt-4"
        >
          <h3 className="text-[10px] font-['JetBrains_Mono',_monospace] text-red-500/50 tracking-[0.2em] px-2">危险区域 DANGER ZONE</h3>
          <div className="bg-[#141414]/50 border border-red-500/20 rounded-[20px] overflow-hidden">
            
            <div 
              onClick={() => {
                setDeleteConfirmText('');
                setDeleteError('');
                setShowDeleteModal(true);
              }}
              className="flex items-center justify-between p-4 hover:bg-red-500/10 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-[10px] bg-red-500/10 flex items-center justify-center text-red-400 group-hover:text-red-300 transition-colors">
                  <AlertTriangle size={16} />
                </div>
                <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-red-400/80 group-hover:text-red-400 transition-colors">永久注销账号</span>
              </div>
              <ChevronRight size={16} className="text-red-500/30 group-hover:text-red-500/60 transition-colors" />
            </div>

          </div>
        </motion.div>

      </main>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
              onClick={() => {
                setShowPasswordModal(false);
                resetPasswordModal();
              }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[320px] bg-[#141414] border border-white/10 rounded-[30px] p-8 flex flex-col gap-4 relative overflow-hidden shadow-2xl"
            >
              <h2 className="text-[18px] font-['Noto_Serif_SC',_serif] text-white tracking-wider mb-2 text-center">修改登录密码</h2>
              <div className="space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="当前密码"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#d3a971]/50 font-['JetBrains_Mono',_monospace]"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="新密码"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#d3a971]/50 font-['JetBrains_Mono',_monospace]"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="确认新密码"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#d3a971]/50 font-['JetBrains_Mono',_monospace]"
                />
                {passwordError && (
                  <p className="text-[12px] text-red-300 font-['Noto_Serif_SC',_serif]">{passwordError}</p>
                )}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    resetPasswordModal();
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 text-sm font-['Noto_Serif_SC',_serif] hover:bg-white/10 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => void handleSavePassword()}
                  disabled={isSavingPassword}
                  className="flex-1 py-3 rounded-xl bg-[#d3a971] text-black text-sm font-['Noto_Serif_SC',_serif] hover:bg-[#b89362] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingPassword ? '保存中...' : '保存更改'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteError('');
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[320px] bg-[#141414] border border-red-500/20 rounded-[30px] p-8 flex flex-col items-center gap-4 relative overflow-hidden shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-[18px] font-['Noto_Serif_SC',_serif] text-white tracking-wider text-center">永久注销账号</h2>
              <p className="text-[12px] text-white/50 text-center leading-relaxed font-['Noto_Serif_SC',_serif]">
                此操作将永久删除您的所有训练数据、成就徽章和教练指导记录。此操作<span className="text-red-400 font-bold">不可撤销</span>。
              </p>
              
              <div className="w-full mt-4 space-y-2">
                <label className="text-[10px] text-white/40 font-['Noto_Serif_SC',_serif]">
                  请输入 <span className="text-white font-bold font-['JetBrains_Mono',_monospace]">DELETE</span> 以确认：
                </label>
                <input 
                  type="text" 
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE" 
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500/50 font-['JetBrains_Mono',_monospace] text-center uppercase" 
                />
                {deleteError && (
                  <p className="text-[12px] text-red-300 font-['Noto_Serif_SC',_serif]">{deleteError}</p>
                )}
              </div>

              <div className="flex gap-3 mt-6 w-full">
                <button onClick={() => { setShowDeleteModal(false); setDeleteError(''); }} className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 text-sm font-['Noto_Serif_SC',_serif] hover:bg-white/10 transition-colors">取消</button>
                <button 
                  disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
                  onClick={() => void handleDeleteAccount()} 
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-['Noto_Serif_SC',_serif] hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingAccount ? '注销中...' : '确认注销'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}