import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Search, UserPlus, TrendingUp, TrendingDown, Calendar, Trash2, ShieldCheck, ChevronRight, MessageSquare, PlusSquare, FileText } from 'lucide-react';
import { cn } from '../../utils';
import { coachScheduleService } from '../../services/coachSchedule';
import { coachFeedbackService } from '../../services/coachFeedback';
import { coachStudentsService, CoachStudent } from '../../services/coachStudents';

export type StudentType = CoachStudent;

export function CoachDashboard() {
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('latte.userId') || '';
  const firstGuideKey = `coach.first-guide-dismissed.${currentUserId}`;
  const [students, setStudents] = useState<StudentType[]>([]);
  const [hasLoadedStudents, setHasLoadedStudents] = useState(false);
  const [showFirstGuide, setShowFirstGuide] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [phoneHint, setPhoneHint] = useState('');
  const [phoneHintType, setPhoneHintType] = useState<'error' | 'success' | ''>('');
  const [pendingCount, setPendingCount] = useState(0);
  const [templateCount, setTemplateCount] = useState(0);
  const [recentReviews, setRecentReviews] = useState<Array<{ student: string; rating: number; comment: string; date: string }>>([]);

  const loadStudents = async () => {
    const data = await coachStudentsService.list();
    setStudents(data);
    setHasLoadedStudents(true);
  };

  const loadStats = async (studentIds?: string[]) => {
    const [pending, replied, templates] = await Promise.all([
      coachFeedbackService.getPendingCount(),
      coachFeedbackService.getFeedbacks("replied"),
      coachScheduleService.getTemplates(),
    ]);
    setPendingCount(pending);
    setTemplateCount(templates.length);
    const allFeedbacks = [...replied, ...(await coachFeedbackService.getFeedbacks("pending"))];
    const visibleIds = new Set(studentIds ?? students.map((s) => s.id));
    const filteredFeedbacks = allFeedbacks.filter((f) => visibleIds.has(f.studentId));
    const reviews = filteredFeedbacks
      .slice(0, 3)
      .map((f) => ({
        student: f.studentName,
        rating: Math.max(1, Math.min(5, Math.round((f.metrics.rpe + f.metrics.doms + f.metrics.fatigue) / 6))),
        comment: f.note,
        date: f.date,
      }));
    setRecentReviews(reviews);
  };

  useEffect(() => {
    void loadStudents();
  }, []);

  useEffect(() => {
    void loadStats(students.map((s) => s.id));
  }, [students]);

  useEffect(() => {
    if (!hasLoadedStudents || students.length > 0 || !currentUserId) return;
    const dismissed = localStorage.getItem(firstGuideKey) === 'true';
    if (!dismissed) {
      setShowFirstGuide(true);
    }
  }, [currentUserId, firstGuideKey, hasLoadedStudents, students.length]);

  const handleExitCoachMode = () => {
    localStorage.removeItem('coach_authorized');
    navigate('/profile', { replace: true });
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = searchQuery.trim().replace(/\s+/g, '');
    if (!normalized) {
      setPhoneHint('请输入手机号');
      setPhoneHintType('error');
      return;
    }
    if (!/^\d{11}$/.test(normalized)) {
      setPhoneHint('手机号需为11位数字');
      setPhoneHintType('error');
      return;
    }
    if (!/^1\d{10}$/.test(normalized)) {
      setPhoneHint('手机号格式不正确');
      setPhoneHintType('error');
      return;
    }

    try {
      await coachStudentsService.linkUser(normalized);
      setStudents(await coachStudentsService.list());
      setSearchQuery('');
      setPhoneHint('添加成功');
      setPhoneHintType('success');
      setIsAdding(false);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      setPhoneHint(message || '未查询到绑定账号');
      setPhoneHintType('error');
    }
  };

  const removeStudent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await coachStudentsService.remove(id);
    const nextStudents = await coachStudentsService.list();
    setStudents(nextStudents);
    void loadStats(nextStudents.map((s) => s.id));
  };

  const dismissFirstGuide = () => {
    setShowFirstGuide(false);
    if (currentUserId) {
      localStorage.setItem(firstGuideKey, 'true');
    }
  };

  const openAddFirstStudent = () => {
    setIsAdding(true);
    dismissFirstGuide();
  };

  return (
    <div className="flex flex-col h-full bg-[#080808] relative z-50">
      <header className="pt-12 px-6 pb-4 flex items-center justify-between border-b border-[#d3a971]/20 bg-[#141414] sticky top-0 z-10">
        <div className="flex items-center gap-2 text-[#d3a971]">
          <ShieldCheck size={20} />
          <h1 className="text-[18px] font-['Noto_Serif_SC',_serif] tracking-widest font-bold">
            教练控制台
          </h1>
        </div>
        <button 
          onClick={handleExitCoachMode}
          className="flex items-center gap-1.5 text-[12px] font-['JetBrains_Mono',_monospace] tracking-wider text-white/50 hover:text-white transition-colors"
        >
          <LogOut size={14} />
          <span>EXIT</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pt-6 pb-24 space-y-8 scrollbar-hide">
        <AnimatePresence>
          {showFirstGuide && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl border border-[#d3a971]/25 bg-[#d3a971]/10"
            >
              <h3 className="text-[14px] font-['Noto_Serif_SC',_serif] text-[#d3a971] tracking-wider mb-1">欢迎进入教练模式</h3>
              <p className="text-[12px] text-white/60 mb-3">你还没有学员，先添加第一个学员即可开始管理训练计划与反馈。</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={openAddFirstStudent}
                  className="px-3 py-2 rounded-xl bg-[#d3a971] text-black text-[12px] font-semibold hover:brightness-95 transition-colors"
                >
                  去添加第一个学员
                </button>
                <button
                  onClick={dismissFirstGuide}
                  className="px-3 py-2 rounded-xl border border-white/[0.12] text-white/60 text-[12px] hover:bg-white/[0.04] transition-colors"
                >
                  稍后再说
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            className="p-4 rounded-2xl bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/[0.05] relative overflow-hidden flex flex-col justify-between h-[100px] cursor-pointer hover:border-white/20 transition-colors"
            onClick={() => navigate('/coach/feedbacks')}
          >
            <span className="text-[10px] text-white/40 font-['Noto_Serif_SC',_serif] tracking-[0.1em]">待跟进反馈</span>
            <div className="flex items-end gap-2">
              <span className="text-[24px] font-['JetBrains_Mono',_monospace] text-white leading-none">
                {pendingCount}
              </span>
              <span className="text-[10px] text-white/30 font-['Noto_Serif_SC',_serif] mb-1">条未读</span>
            </div>
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white/[0.03] flex items-center justify-center text-white/30">
              <ChevronRight size={12} />
            </div>
            <MessageSquare size={40} className="absolute -right-2 -bottom-2 text-white/5" />
          </div>
          <div 
            className="p-4 rounded-2xl bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-[#d3a971]/10 relative overflow-hidden cursor-pointer hover:border-[#d3a971]/30 transition-colors flex flex-col justify-between h-[100px]"
            onClick={() => navigate('/coach/templates')}
          >
            <span className="text-[10px] text-[#d3a971]/60 font-['Noto_Serif_SC',_serif] tracking-[0.1em]">训练模板库</span>
            <div className="flex items-end gap-2">
              <span className="text-[24px] font-['JetBrains_Mono',_monospace] text-[#d3a971] leading-none">
                {templateCount}
              </span>
              <span className="text-[10px] text-[#d3a971]/50 font-['Noto_Serif_SC',_serif] mb-1">个活动模板</span>
            </div>
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#d3a971]/10 flex items-center justify-center text-[#d3a971]">
              <ChevronRight size={12} />
            </div>
            <FileText size={40} className="absolute -right-2 -bottom-2 text-[#d3a971]/5" />
          </div>
        </div>

        {/* Add Student Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <h2 className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/90">学员管理</h2>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="text-[12px] font-['JetBrains_Mono',_monospace] text-[#d3a971] flex items-center gap-1 hover:text-[#e5c18c] transition-colors"
            >
              <UserPlus size={14} /> Add
            </button>
          </div>
          
          <AnimatePresence>
            {isAdding && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleAddStudent}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={e => {
                        const next = e.target.value;
                        setSearchQuery(next);
                        const normalized = next.trim().replace(/\s+/g, '');
                        if (!normalized) {
                          setPhoneHint('');
                          setPhoneHintType('');
                          return;
                        }
                        if (!/^\d+$/.test(normalized)) {
                          setPhoneHint('仅支持输入数字手机号');
                          setPhoneHintType('error');
                          return;
                        }
                        if (normalized.length < 11) {
                          setPhoneHint(`手机号位数不足（还差 ${11 - normalized.length} 位）`);
                          setPhoneHintType('error');
                          return;
                        }
                        if (normalized.length > 11) {
                          setPhoneHint('手机号位数过长');
                          setPhoneHintType('error');
                          return;
                        }
                        if (!/^1\d{10}$/.test(normalized)) {
                          setPhoneHint('手机号格式不正确');
                          setPhoneHintType('error');
                          return;
                        }
                        setPhoneHint('手机号格式正确，可查询添加');
                        setPhoneHintType('success');
                      }}
                      placeholder="输入用户绑定手机号（11位）..."
                      className="w-full bg-[#141414] border border-white/[0.05] rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#d3a971]/30 transition-colors"
                    />
                    {phoneHint && (
                      <p
                        className={cn(
                          "mt-2 text-[11px]",
                          phoneHintType === 'success' ? "text-green-400/80" : "text-red-400/80"
                        )}
                      >
                        {phoneHint}
                      </p>
                    )}
                  </div>
                  <button 
                    type="submit"
                    disabled={!/^1\d{10}$/.test(searchQuery.trim().replace(/\s+/g, ''))}
                    className="h-10 px-4 rounded-xl bg-white/[0.05] border border-white/[0.05] text-[12px] font-['Noto_Serif_SC',_serif] hover:bg-[#d3a971]/10 hover:text-[#d3a971] hover:border-[#d3a971]/30 transition-all disabled:opacity-40 disabled:hover:bg-white/[0.05] disabled:hover:text-white disabled:hover:border-white/[0.05]"
                  >
                    搜索添加
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Student List */}
          <div className="space-y-3">
            {students.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-white/20 border border-white/[0.02] border-dashed rounded-2xl">
                <UserPlus size={24} className="mb-2 opacity-50" />
                <span className="text-[12px]">暂无学员记录，点击Add添加</span>
              </div>
            ) : (
              students.map((student, i) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/coach/student/${student.id}`, { state: { student } })}
                  className="flex items-center p-4 rounded-2xl bg-[#141414] border border-white/[0.03] hover:border-[#d3a971]/30 cursor-pointer group transition-all relative overflow-hidden"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d3a971]/20 to-[#141414] border border-[#d3a971]/30 flex items-center justify-center text-[#d3a971] font-bold font-sans mr-4 shrink-0 shadow-[0_0_15px_rgba(211,169,113,0.1)] relative z-10">
                    {student.name.charAt(0)}
                  </div>
                  
                  <div className="flex-1 flex flex-col min-w-0 pr-4 relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[15px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90 truncate">{student.name}</span>
                      <span className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace] shrink-0">{student.lastActive}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[#d3a971]/70 truncate flex-1">{student.target}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={cn(
                          "text-[10px] font-['JetBrains_Mono',_monospace]",
                          student.completion >= 80 ? "text-green-500/80" : student.completion >= 60 ? "text-yellow-500/80" : "text-red-500/80"
                        )}>
                          {student.completion}%
                        </span>
                        {student.trend === 'up' ? <TrendingUp size={10} className="text-green-500/80" /> : 
                         student.trend === 'down' ? <TrendingDown size={10} className="text-red-500/80" /> : 
                         <span className="w-2 h-0.5 bg-yellow-500/80" />}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end justify-center gap-3 shrink-0 border-l border-white/[0.05] pl-4 h-full relative z-10">
                    <button 
                      onClick={(e) => removeStudent(student.id, e)}
                      className="text-white/20 hover:text-red-500/80 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={16} className="text-white/20 group-hover:text-[#d3a971] transition-colors" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Recent Feedback Reviews */}
        <div className="space-y-3">
          <h2 className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/90">学员评价</h2>
          <div className="space-y-3">
            {recentReviews.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#141414] border border-white/[0.03] text-[12px] text-white/40">
                暂无真实评价数据（来自学员反馈）
              </div>
            ) : recentReviews.map((review, i) => (
              <div key={i} className="p-4 rounded-2xl bg-[#141414] border border-white/[0.03]">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-['JetBrains_Mono',_monospace] text-white/80">{review.student}</span>
                    <div className="flex gap-0.5">
                      {[...Array(review.rating)].map((_, j) => (
                        <span key={j} className="text-[#d3a971] text-[10px]">★</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-white/30">{review.date}</span>
                </div>
                <p className="text-[12px] text-white/60 font-sans">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}