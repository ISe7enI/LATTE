import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, User, Bell, Clock, Database, Smartphone, ChevronRight, Download, Link2, Activity, Dumbbell, Scale, Check, UserCircle, Users } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router';
import { type OutletContextType } from '../Root';
import { cn } from '../utils';
import { userAppService } from '../services/userApp';

const CLOUD_SYNC_KEY = 'latte.lastCloudSyncAt';

const formatSyncText = (iso: string | null) => {
  if (!iso) return '未同步';
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return '未同步';
  const diffMs = Math.max(0, Date.now() - ts);
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '已同步 刚刚';
  if (diffMin < 60) return `已同步 ${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `已同步 ${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `已同步 ${diffDay}d ago`;
};

export function Settings() {
  const navigate = useNavigate();
  const { currentUserId, userProfile, setUserProfile, userPreferences, setUserPreferences } = useOutletContext<OutletContextType>();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempProfile, setTempProfile] = useState(userProfile);
  const [tempRestTime, setTempRestTime] = useState(userPreferences.restTime);
  const [tempIntensityLow, setTempIntensityLow] = useState(String(userPreferences.intensityLowThreshold));
  const [tempIntensityHigh, setTempIntensityHigh] = useState(String(userPreferences.intensityHighThreshold));
  const [showProDialog, setShowProDialog] = useState(false);
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<string | null>(
    localStorage.getItem(CLOUD_SYNC_KEY),
  );

  const markCloudSynced = () => {
    const now = new Date().toISOString();
    localStorage.setItem(CLOUD_SYNC_KEY, now);
    setLastCloudSyncAt(now);
  };

  useEffect(() => {
    setTempRestTime(userPreferences.restTime);
    setTempIntensityLow(String(userPreferences.intensityLowThreshold));
    setTempIntensityHigh(String(userPreferences.intensityHighThreshold));
  }, [userPreferences]);

  const handleSaveProfile = async () => {
    setUserProfile(tempProfile);
    await userAppService.updateProfile(currentUserId, {
      id: currentUserId,
      ...tempProfile,
    });
    markCloudSynced();
    setEditingField(null);
  };

  const handleSaveRestTime = async () => {
    const next = { ...userPreferences, restTime: tempRestTime };
    setUserPreferences(next);
    await userAppService.updatePreferences(currentUserId, {
      id: currentUserId,
      ...next,
    });
    markCloudSynced();
    setEditingField(null);
  };

  const handleSaveIntensityThresholds = async () => {
    const low = Number(tempIntensityLow);
    const high = Number(tempIntensityHigh);
    const safeLow = Number.isFinite(low) && low > 0 ? Math.round(low) : userPreferences.intensityLowThreshold;
    const safeHighRaw = Number.isFinite(high) && high > safeLow ? Math.round(high) : userPreferences.intensityHighThreshold;
    const safeHigh = safeHighRaw > safeLow ? safeHighRaw : safeLow + 1000;
    const next = {
      ...userPreferences,
      intensityLowThreshold: safeLow,
      intensityHighThreshold: safeHigh,
    };
    setUserPreferences(next);
    setTempIntensityLow(String(next.intensityLowThreshold));
    setTempIntensityHigh(String(next.intensityHighThreshold));
    await userAppService.updatePreferences(currentUserId, {
      id: currentUserId,
      ...next,
    });
    markCloudSynced();
    setEditingField(null);
  };

  const persistProfilePatch = async (patch: Partial<typeof userProfile>) => {
    const next = { ...userProfile, ...patch };
    setUserProfile(next);
    setTempProfile(next);
    await userAppService.updateProfile(currentUserId, {
      id: currentUserId,
      ...next,
    });
    markCloudSynced();
  };

  const persistPreferencesPatch = async (patch: Partial<typeof userPreferences>) => {
    const next = { ...userPreferences, ...patch };
    setUserPreferences(next);
    await userAppService.updatePreferences(currentUserId, {
      id: currentUserId,
      ...next,
    });
    markCloudSynced();
  };

  const handleExportTrainingData = async () => {
    const blob = await userAppService.exportWorkoutsCsv(currentUserId);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `latte-workouts-${currentUserId}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full relative bg-[#080808]">
      <header className="pt-12 px-6 pb-4 relative z-20 flex flex-col border-b border-white/[0.03] bg-[#0a0a0a]">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.2em] mb-1">
              SYSTEM CONFIG
            </span>
            <h1 className="text-[20px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90">
              设置
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide px-6 pt-6">
        <div className="space-y-8">
          
          {/* PROFILE GROUP */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
            <h3 className="text-[10px] font-['JetBrains_Mono',_monospace] text-white/30 tracking-[0.2em] px-2">个人档案 PROFILE</h3>
            <div className="bg-[#141414]/50 border border-white/[0.03] rounded-[20px] overflow-hidden">
              
              {/* Nickname */}
              <div className="border-b border-white/[0.02]">
                <div onClick={() => setEditingField(editingField === 'nickname' ? null : 'nickname')} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-[10px] bg-white/[0.03] flex items-center justify-center text-white/40 group-hover:text-[#d3a971] transition-colors"><UserCircle size={16} strokeWidth={1.5} /></div>
                    <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/80 group-hover:text-white transition-colors">用户昵称</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-['JetBrains_Mono',_monospace] text-white/40 group-hover:text-[#d3a971]/70 transition-colors">{userProfile.nickname}</span>
                    <ChevronRight size={16} className={cn("text-white/20 transition-all", editingField === 'nickname' && "rotate-90")} />
                  </div>
                </div>
                <AnimatePresence>
                  {editingField === 'nickname' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-4 pt-0 flex gap-2">
                        <input autoFocus type="text" value={tempProfile.nickname} onChange={e => setTempProfile({...tempProfile, nickname: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/[0.05] rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#d3a971]/50 text-center font-['JetBrains_Mono',_monospace]" placeholder="输入昵称" />
                        <button onClick={handleSaveProfile} className="bg-[#d3a971] text-black rounded-xl px-4 flex items-center justify-center hover:bg-[#b89362] transition-colors"><Check size={16} /></button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Gender */}
              <div className="border-b border-white/[0.02]">
                <div onClick={() => setEditingField(editingField === 'gender' ? null : 'gender')} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-[10px] bg-white/[0.03] flex items-center justify-center text-white/40 group-hover:text-[#d3a971] transition-colors"><Users size={16} strokeWidth={1.5} /></div>
                    <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/80 group-hover:text-white transition-colors">性别</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-['Noto_Serif_SC',_serif] text-white/40 group-hover:text-[#d3a971]/70 transition-colors">{userProfile.gender}</span>
                    <ChevronRight size={16} className={cn("text-white/20 transition-all", editingField === 'gender' && "rotate-90")} />
                  </div>
                </div>
                <AnimatePresence>
                  {editingField === 'gender' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-4 pt-0 grid grid-cols-3 gap-2">
                        {['男', '女', '保密'].map(g => (
                          <button key={g} onClick={async () => { await persistProfilePatch({ gender: g }); setEditingField(null); }} className={cn("py-2 rounded-xl text-sm font-['Noto_Serif_SC',_serif] transition-colors border", userProfile.gender === g ? "bg-[#d3a971]/10 border-[#d3a971]/30 text-[#d3a971]" : "bg-[#0a0a0a] border-white/[0.05] text-white/60 hover:text-white hover:border-white/20")}>{g}</button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Metrics */}
              <div className="border-b border-white/[0.02]">
                <div 
                  onClick={() => setEditingField(editingField === 'metrics' ? null : 'metrics')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-[10px] bg-white/[0.03] flex items-center justify-center text-white/40 group-hover:text-[#d3a971] transition-colors"><User size={16} strokeWidth={1.5} /></div>
                    <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/80 group-hover:text-white transition-colors">身高 / 体重 / 年龄</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-['JetBrains_Mono',_monospace] text-white/40 group-hover:text-[#d3a971]/70 transition-colors">{userProfile.height}cm / {userProfile.weight}kg / {userProfile.age}</span>
                    <ChevronRight size={16} className={cn("text-white/20 transition-all", editingField === 'metrics' && "rotate-90")} />
                  </div>
                </div>
                <AnimatePresence>
                  {editingField === 'metrics' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-4 pt-0 flex gap-2">
                        <input autoFocus type="number" value={tempProfile.height} onChange={e => setTempProfile({...tempProfile, height: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/[0.05] rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#d3a971]/50 text-center font-['JetBrains_Mono',_monospace]" placeholder="身高(cm)" />
                        <input type="number" value={tempProfile.weight} onChange={e => setTempProfile({...tempProfile, weight: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/[0.05] rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#d3a971]/50 text-center font-['JetBrains_Mono',_monospace]" placeholder="体重(kg)" />
                        <input type="number" value={tempProfile.age} onChange={e => setTempProfile({...tempProfile, age: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/[0.05] rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#d3a971]/50 text-center font-['JetBrains_Mono',_monospace]" placeholder="年龄" />
                        <button onClick={handleSaveProfile} className="bg-[#d3a971] text-black rounded-xl px-4 flex items-center justify-center hover:bg-[#b89362] transition-colors"><Check size={16} /></button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Goal */}
              <div className="border-b border-white/[0.02]">
                <div onClick={() => setEditingField(editingField === 'goal' ? null : 'goal')} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-[10px] bg-white/[0.03] flex items-center justify-center text-white/40 group-hover:text-[#d3a971] transition-colors"><Activity size={16} strokeWidth={1.5} /></div>
                    <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/80 group-hover:text-white transition-colors">健身目标</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-['Noto_Serif_SC',_serif] text-white/40 group-hover:text-[#d3a971]/70 transition-colors">{userProfile.goal}</span>
                    <ChevronRight size={16} className={cn("text-white/20 transition-all", editingField === 'goal' && "rotate-90")} />
                  </div>
                </div>
                <AnimatePresence>
                  {editingField === 'goal' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                        {['增肌', '减脂', '塑形', '维持'].map(g => (
                          <button key={g} onClick={async () => { await persistProfilePatch({ goal: g }); setEditingField(null); }} className={cn("py-2 rounded-xl text-sm font-['Noto_Serif_SC',_serif] transition-colors border", userProfile.goal === g ? "bg-[#d3a971]/10 border-[#d3a971]/30 text-[#d3a971]" : "bg-[#0a0a0a] border-white/[0.05] text-white/60 hover:text-white hover:border-white/20")}>{g}</button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Level */}
              <div className="border-b border-white/[0.02]">
                <div onClick={() => setEditingField(editingField === 'level' ? null : 'level')} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-[10px] bg-white/[0.03] flex items-center justify-center text-white/40 group-hover:text-[#d3a971] transition-colors"><Dumbbell size={16} strokeWidth={1.5} /></div>
                    <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/80 group-hover:text-white transition-colors">训练水平</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-['Noto_Serif_SC',_serif] text-white/40 group-hover:text-[#d3a971]/70 transition-colors">{userProfile.level}</span>
                    <ChevronRight size={16} className={cn("text-white/20 transition-all", editingField === 'level' && "rotate-90")} />
                  </div>
                </div>
                <AnimatePresence>
                  {editingField === 'level' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-4 pt-0 grid grid-cols-3 gap-2">
                        {['新手', '中级', '高级'].map(l => (
                          <button key={l} onClick={async () => { await persistProfilePatch({ level: l }); setEditingField(null); }} className={cn("py-2 rounded-xl text-sm font-['Noto_Serif_SC',_serif] transition-colors border", userProfile.level === l ? "bg-[#d3a971]/10 border-[#d3a971]/30 text-[#d3a971]" : "bg-[#0a0a0a] border-white/[0.05] text-white/60 hover:text-white hover:border-white/20")}>{l}</button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Units - Static */}
              <div className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-[10px] bg-white/[0.03] flex items-center justify-center text-white/40 group-hover:text-[#d3a971] transition-colors"><Scale size={16} strokeWidth={1.5} /></div>
                  <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/80 group-hover:text-white transition-colors">单位设置</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-['JetBrains_Mono',_monospace] text-white/40 group-hover:text-[#d3a971]/70 transition-colors">公制 (kg/cm)</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* PREFERENCES GROUP */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-3">
            <h3 className="text-[10px] font-['JetBrains_Mono',_monospace] text-white/30 tracking-[0.2em] px-2">偏好设置 PREFERENCES</h3>
            <div className="bg-[#141414]/50 border border-white/[0.03] rounded-[20px] overflow-hidden">
              
              {/* Rest Time */}
              <div className="border-b border-white/[0.02]">
                <div onClick={() => setEditingField(editingField === 'rest' ? null : 'rest')} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-[10px] bg-white/[0.03] flex items-center justify-center text-white/40 group-hover:text-[#d3a971] transition-colors"><Clock size={16} strokeWidth={1.5} /></div>
                    <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/80 group-hover:text-white transition-colors">默认组间休息</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-['JetBrains_Mono',_monospace] text-white/40 group-hover:text-[#d3a971]/70 transition-colors">{userPreferences.restTime}s</span>
                    <ChevronRight size={16} className={cn("text-white/20 transition-all", editingField === 'rest' && "rotate-90")} />
                  </div>
                </div>
                <AnimatePresence>
                  {editingField === 'rest' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-4 pt-0 flex gap-2 items-center">
                        <input autoFocus type="number" value={tempRestTime} onChange={e => setTempRestTime(e.target.value)} className="flex-1 bg-[#0a0a0a] border border-white/[0.05] rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#d3a971]/50 text-center font-['JetBrains_Mono',_monospace]" placeholder="休息秒数" />
                        <span className="text-white/40 font-['JetBrains_Mono',_monospace] text-sm">s</span>
                        <button onClick={handleSaveRestTime} className="bg-[#d3a971] text-black rounded-xl px-4 py-2 flex items-center justify-center hover:bg-[#b89362] transition-colors"><Check size={16} /></button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Training Reminder */}
              <div className="border-b border-white/[0.02]">
                <div className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-[10px] bg-white/[0.03] flex items-center justify-center text-white/40 group-hover:text-[#d3a971] transition-colors"><Bell size={16} strokeWidth={1.5} /></div>
                    <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/80 group-hover:text-white transition-colors">训练提醒</span>
                  </div>
                  <button 
                    onClick={async () => await persistPreferencesPatch({ reminder: !userPreferences.reminder })}
                    className={cn("w-10 h-6 rounded-full flex items-center px-1 transition-colors", userPreferences.reminder ? "bg-[#d3a971]" : "bg-white/10")}
                  >
                    <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" animate={{ x: userPreferences.reminder ? 16 : 0 }} />
                  </button>
                </div>
              </div>

              {/* Theme */}
              <div className="border-b border-white/[0.02]">
                <div onClick={() => setEditingField(editingField === 'theme' ? null : 'theme')} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-[10px] bg-white/[0.03] flex items-center justify-center text-white/40 group-hover:text-[#d3a971] transition-colors"><Smartphone size={16} strokeWidth={1.5} /></div>
                    <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/80 group-hover:text-white transition-colors">外观模式</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-['Noto_Serif_SC',_serif] text-white/40 group-hover:text-[#d3a971]/70 transition-colors">
                      {userPreferences.theme === 'dark' ? '深色' : userPreferences.theme === 'light' ? '浅色' : '跟随系统'}
                    </span>
                    <ChevronRight size={16} className={cn("text-white/20 transition-all", editingField === 'theme' && "rotate-90")} />
                  </div>
                </div>
                <AnimatePresence>
                  {editingField === 'theme' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-4 pt-0 grid grid-cols-3 gap-2">
                        {[
                          { id: 'dark', label: '深色' },
                          { id: 'light', label: '浅色' },
                          { id: 'system', label: '跟随系统' }
                        ].map(t => (
                          <button key={t.id} onClick={async () => { await persistPreferencesPatch({ theme: t.id }); setEditingField(null); }} className={cn("py-2 rounded-xl text-sm font-['Noto_Serif_SC',_serif] transition-colors border", userPreferences.theme === t.id ? "bg-[#d3a971]/10 border-[#d3a971]/30 text-[#d3a971]" : "bg-[#0a0a0a] border-white/[0.05] text-white/60 hover:text-white hover:border-white/20")}>{t.label}</button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Analytics intensity thresholds */}
              <div>
                <div onClick={() => setEditingField(editingField === 'intensity-threshold' ? null : 'intensity-threshold')} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-[10px] bg-white/[0.03] flex items-center justify-center text-white/40 group-hover:text-[#d3a971] transition-colors"><Activity size={16} strokeWidth={1.5} /></div>
                    <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/80 group-hover:text-white transition-colors">分析强度阈值</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-['JetBrains_Mono',_monospace] text-white/40 group-hover:text-[#d3a971]/70 transition-colors">
                      {userPreferences.intensityLowThreshold} / {userPreferences.intensityHighThreshold}
                    </span>
                    <ChevronRight size={16} className={cn("text-white/20 transition-all", editingField === 'intensity-threshold' && "rotate-90")} />
                  </div>
                </div>
                <AnimatePresence>
                  {editingField === 'intensity-threshold' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="p-4 pt-0 flex gap-2 items-center">
                        <input autoFocus type="number" value={tempIntensityLow} onChange={e => setTempIntensityLow(e.target.value)} className="flex-1 bg-[#0a0a0a] border border-white/[0.05] rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#d3a971]/50 text-center font-['JetBrains_Mono',_monospace]" placeholder="低强度上限" />
                        <input type="number" value={tempIntensityHigh} onChange={e => setTempIntensityHigh(e.target.value)} className="flex-1 bg-[#0a0a0a] border border-white/[0.05] rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#d3a971]/50 text-center font-['JetBrains_Mono',_monospace]" placeholder="高强度阈值" />
                        <button onClick={handleSaveIntensityThresholds} className="bg-[#d3a971] text-black rounded-xl px-4 py-2 flex items-center justify-center hover:bg-[#b89362] transition-colors"><Check size={16} /></button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </motion.div>

          {/* DATA GROUP */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-3">
            <h3 className="text-[10px] font-['JetBrains_Mono',_monospace] text-white/30 tracking-[0.2em] px-2">数据管理 DATA & SYNC</h3>
            <div className="bg-[#141414]/50 border border-white/[0.03] rounded-[20px] overflow-hidden">
              {[
                { icon: Database, label: "云端同步", val: formatSyncText(lastCloudSyncAt), onClick: undefined },
                { icon: Download, label: "导出训练数据", val: "CSV", onClick: handleExportTrainingData },
                { icon: Link2, label: "Apple Health 连接", val: "待接入", onClick: undefined },
              ].map((item, i) => (
                <button key={i} onClick={item.onClick} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors border-b border-white/[0.02] last:border-b-0 group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-[10px] bg-white/[0.03] flex items-center justify-center text-white/40 group-hover:text-[#d3a971] transition-colors"><item.icon size={16} strokeWidth={1.5} /></div>
                    <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/80 group-hover:text-white transition-colors">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-['JetBrains_Mono',_monospace] text-white/40 group-hover:text-[#d3a971]/70 transition-colors">{item.val}</span>
                    <ChevronRight size={16} className="text-white/20 group-hover:text-white/40 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Pro Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => setShowProDialog(true)}
            className="mt-8 p-5 rounded-[20px] bg-gradient-to-br from-[#d3a971]/10 to-transparent border border-[#d3a971]/20 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-[#d3a971]/40 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#d3a971]/20 blur-[30px] rounded-full group-hover:bg-[#d3a971]/30 transition-colors" />
            <span className="text-[10px] font-['JetBrains_Mono',_monospace] tracking-[0.2em] text-[#d3a971] mb-2 px-2 py-1 border border-[#d3a971]/30 rounded bg-[#d3a971]/10">COMING SOON</span>
            <h3 className="text-[16px] font-['Noto_Serif_SC',_serif] tracking-widest text-[#d3a971] mb-2">解锁 LATTE PRO</h3>
            <p className="text-[12px] text-white/40 font-sans leading-relaxed mb-4 max-w-[200px]">
              智能计划、饮食记录、Apple Watch 支持及更多高级分析功能。
            </p>
            <button className="px-6 py-2 rounded-full bg-[#d3a971] text-black text-[12px] font-['Noto_Serif_SC',_serif] tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(211,169,113,0.3)]">
              了解更多
            </button>
          </motion.div>
          <AnimatePresence>
            {showProDialog && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowProDialog(false)}
                className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-[360px] rounded-[20px] border border-[#d3a971]/55 bg-[#13110c] shadow-[0_0_30px_rgba(211,169,113,0.25)] p-5"
                >
                  <div className="text-[10px] mb-2 inline-flex items-center px-2 py-1 rounded border border-[#d3a971]/40 text-[#d3a971] font-['JetBrains_Mono',_monospace] tracking-[0.18em]">
                    LATTE PRO
                  </div>
                  <h3 className="text-[18px] text-[#f3d7ad] font-['Noto_Serif_SC',_serif] tracking-wider mb-3">
                    PRO 功能预览
                  </h3>
                  <div className="space-y-2 text-[13px] text-[#f5e6cc]/85">
                    <div>• 智能周期计划（按目标自动分期）</div>
                    <div>• 饮食与体重联动追踪</div>
                    <div>• Apple Watch 训练同步</div>
                    <div>• 高级分析面板（趋势/预测/动作表现）</div>
                    <div>• 教练协作增强（批注、复盘与阶段报告）</div>
                  </div>
                  <button
                    onClick={() => setShowProDialog(false)}
                    className="mt-5 w-full rounded-[12px] py-2 text-[13px] font-['Noto_Serif_SC',_serif] tracking-widest bg-[#d3a971] text-black hover:bg-[#b89362] transition-colors"
                  >
                    我知道了
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-center pt-8 pb-4">
            <span className="text-[10px] font-['JetBrains_Mono',_monospace] text-white/20 tracking-widest">
              LATTE v1.0.0 (build 20260315)
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}