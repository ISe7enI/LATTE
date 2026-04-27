import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, MessageSquare, Check, X, Send, Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '../../utils';
import { coachFeedbackService, Feedback } from '../../services/coachFeedback';
import { toast } from 'sonner';

export function CoachFeedbacks() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      const pending = await coachFeedbackService.getFeedbacks("pending");
      setFeedbacks(pending);
    };
    void load();
  }, []);

  const handleOpenDrawer = (f: Feedback) => {
    setSelectedFeedback(f);
    setReplyText('');
  };

  const handleSendReply = async () => {
    if (!selectedFeedback) return;
    if (!replyText.trim()) {
      toast.error('请输入回复内容');
      return;
    }

    await coachFeedbackService.replyFeedback(selectedFeedback.id, replyText);
    toast.success('已发送教练反馈');
    
    const pending = await coachFeedbackService.getFeedbacks("pending");
    setFeedbacks(pending);
    setSelectedFeedback(null);
  };

  const handleClearAllPending = async () => {
    if (isClearing || feedbacks.length === 0) return;
    try {
      setIsClearing(true);
      await coachFeedbackService.clearFeedbacks("pending");
      setFeedbacks([]);
      toast.success('已清空待跟进反馈');
      setShowClearConfirm(false);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || '清空失败，请稍后重试');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#080808] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none -translate-y-1/2 -translate-x-1/3" />

      <header className="pt-12 px-6 pb-4 flex flex-col gap-6 relative z-10">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/coach/dashboard')}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace] uppercase tracking-[0.2em] mb-1">
              STUDENT FEEDBACK
            </span>
            <h1 className="text-[20px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90">
              待跟进反馈
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={isClearing || feedbacks.length === 0}
              className="px-2.5 h-7 rounded-full border border-white/[0.12] bg-white/[0.03] text-[10px] text-white/65 hover:text-white hover:border-white/25 transition-colors disabled:opacity-40"
            >
              {isClearing ? '清空中...' : '一键清空'}
            </button>
            <div className="w-6 h-6 rounded-full bg-[#d3a971]/20 text-[#d3a971] flex items-center justify-center text-[10px] font-['JetBrains_Mono',_monospace]">
              {feedbacks.length}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-24 space-y-4 relative z-10">
        {feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/30 text-[14px]">
            <Check size={48} className="mb-4 text-white/10" />
            <p>太棒了，所有反馈均已处理完毕！</p>
          </div>
        ) : (
          feedbacks.map((f, idx) => (
            <motion.div 
              key={f.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleOpenDrawer(f)}
              className="bg-[#141414] border border-white/[0.05] rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden cursor-pointer hover:border-white/10 transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-[12px] font-bold text-[#d3a971]">
                      {f.studentName.charAt(0)}
                    </div>
                    <span className="text-[14px] font-['JetBrains_Mono',_monospace] text-white">
                      {f.studentName}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/40 mt-1">{f.date} · {f.planName}</span>
                </div>
                {f.metrics.rpe >= 8 && (
                  <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20">
                    高强度警告
                  </span>
                )}
              </div>
              
              <p className="text-[13px] text-white/70 font-['Noto_Serif_SC',_serif] leading-relaxed line-clamp-2">
                "{f.note}"
              </p>

              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-[10px] font-['JetBrains_Mono',_monospace]">
                  <Activity size={12} className="text-white/30" />
                  <span className="text-white/50">RPE: <span className={f.metrics.rpe >= 8 ? "text-red-400" : "text-[#d3a971]"}>{f.metrics.rpe}</span></span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-['JetBrains_Mono',_monospace]">
                  <TrendingUp size={12} className="text-white/30" />
                  <span className="text-white/50">DOMS: <span className={f.metrics.doms >= 7 ? "text-orange-400" : "text-[#d3a971]"}>{f.metrics.doms}</span></span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </main>

      {/* Reply Drawer */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
          >
            <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" onClick={() => !isClearing && setShowClearConfirm(false)} />
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 6 }}
              className="relative w-full max-w-[320px] rounded-2xl border border-white/[0.08] bg-[#121212] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.55)]"
            >
              <h3 className="text-[16px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90 mb-2">一键清空待跟进</h3>
              <p className="text-[12px] text-white/55 leading-relaxed mb-5">
                确认清空当前所有待跟进反馈吗？此操作不可恢复。
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  disabled={isClearing}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-white/70 text-[12px] hover:bg-white/[0.04] transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={() => void handleClearAllPending()}
                  disabled={isClearing}
                  className="flex-1 py-2.5 rounded-xl bg-[#d3a971] text-black text-[12px] font-semibold hover:brightness-95 transition-colors disabled:opacity-60"
                >
                  {isClearing ? '清空中...' : '确认清空'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none"
          >
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" 
              onClick={() => setSelectedFeedback(null)} 
            />
            
            <div className="bg-[#141414] border-t border-white/[0.05] rounded-t-3xl w-full max-h-[85vh] pointer-events-auto flex flex-col relative">
              <div className="flex items-center justify-between p-6 border-b border-white/[0.05]">
                <h2 className="text-[18px] font-['Noto_Serif_SC',_serif] text-white">处理学员反馈</h2>
                <button 
                  onClick={() => setSelectedFeedback(null)}
                  className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-white/50 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Student Info & Note */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-['JetBrains_Mono',_monospace] text-white/40">{selectedFeedback.date}</span>
                    <span className="text-[12px] text-[#d3a971]">{selectedFeedback.planName}</span>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[14px] text-white/80 font-['Noto_Serif_SC',_serif] leading-relaxed">
                    "{selectedFeedback.note}"
                  </div>
                </div>

                {/* Metrics Visualization */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-black/30 rounded-xl p-3 border border-white/[0.02] flex flex-col items-center justify-center gap-1">
                    <span className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace]">RPE 强度</span>
                    <span className={cn(
                      "text-[20px] font-['JetBrains_Mono',_monospace] font-bold",
                      selectedFeedback.metrics.rpe >= 8 ? "text-red-400" : "text-white"
                    )}>
                      {selectedFeedback.metrics.rpe}
                    </span>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 border border-white/[0.02] flex flex-col items-center justify-center gap-1">
                    <span className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace]">DOMS 酸痛</span>
                    <span className={cn(
                      "text-[20px] font-['JetBrains_Mono',_monospace] font-bold",
                      selectedFeedback.metrics.doms >= 7 ? "text-orange-400" : "text-white"
                    )}>
                      {selectedFeedback.metrics.doms}
                    </span>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 border border-white/[0.02] flex flex-col items-center justify-center gap-1">
                    <span className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace]">整体疲劳</span>
                    <span className={cn(
                      "text-[20px] font-['JetBrains_Mono',_monospace] font-bold",
                      selectedFeedback.metrics.fatigue >= 8 ? "text-red-400" : "text-white"
                    )}>
                      {selectedFeedback.metrics.fatigue}
                    </span>
                  </div>
                </div>

                {/* AI Warning (Mock) */}
                {(selectedFeedback.metrics.rpe >= 8 || selectedFeedback.metrics.fatigue >= 8) && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-3 items-start">
                    <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-red-200/80 leading-relaxed">
                      智能分析系统检测到该学员当前承受较高训练压力，建议在下一周期的排期中降低15%的整体容量，或增加1个额外恢复日。
                    </p>
                  </div>
                )}

                {/* Reply Area */}
                <div className="space-y-2 pt-2">
                  <label className="text-[12px] text-white/50 font-['Noto_Serif_SC',_serif]">教练指导 / 调整策略</label>
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="输入给学员的指导意见或下节课的调整说明..."
                    className="w-full bg-black/50 border border-white/[0.1] rounded-xl p-4 text-[14px] text-white placeholder-white/20 focus:outline-none focus:border-[#d3a971]/50 focus:ring-1 focus:ring-[#d3a971]/20 transition-all min-h-[120px] resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/[0.05] bg-[#141414]">
                <button 
                  onClick={handleSendReply}
                  className="w-full py-4 rounded-xl bg-[#d3a971] text-black font-medium tracking-widest hover:bg-[#d3a971]/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  发送反馈并归档
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}