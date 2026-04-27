import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MessageSquare, ClipboardList, Activity, BarChart2, Plus, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { cn } from '../../utils';
import { toast } from 'sonner';
import { PlanCalendar } from './components/PlanCalendar';
import { coachStudentsService, CoachStudent } from '../../services/coachStudents';
import { coachWorkoutsService } from '../../services/coachWorkouts';
import { coachScheduleService, type DayPlan } from '../../services/coachSchedule';
import { coachFeedbackService, type Feedback } from '../../services/coachFeedback';
import { coachGuidanceService } from '../../services/coachGuidance';
import type { WorkoutDetailData } from '../../services/api';

type Tab = 'guidance' | 'progress' | 'plan';

export function StudentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const initialStudent = location.state?.student as CoachStudent | undefined;
  const [student, setStudent] = useState<CoachStudent | null>(initialStudent ?? null);
  const [studentLoadError, setStudentLoadError] = useState('');

  const [activeTab, setActiveTab] = useState<Tab>(location.state?.activeTab || 'guidance');
  const [feedback, setFeedback] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<Array<WorkoutDetailData & { feedback?: string }>>([]);
  const [plans, setPlans] = useState<DayPlan[]>([]);
  const [studentFeedbacks, setStudentFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    const loadStudent = async () => {
      if (!id) return;
      try {
        const data = await coachStudentsService.getById(id);
        setStudent(data);
        setStudentLoadError('');
      } catch (error: any) {
        const message = error instanceof Error ? error.message : String(error);
        setStudentLoadError(message || '学员信息加载失败');
      }
    };
    void loadStudent();
  }, [id]);

  useEffect(() => {
    const loadWorkouts = async () => {
      if (!id) return;
      try {
        const [data, guidanceRows] = await Promise.all([
          coachWorkoutsService.getByStudentId(id),
          coachGuidanceService.getByStudentId(id),
        ]);
        const guidanceMap = new Map(guidanceRows.map((row) => [row.workoutId, row.note]));
        setWorkouts(data.map((w) => ({ ...w, feedback: guidanceMap.get(w.id) ?? "" })));
      } catch {
        setWorkouts([]);
      }
    };
    void loadWorkouts();
  }, [id]);

  useEffect(() => {
    const loadPlansAndFeedback = async () => {
      if (!id) return;
      try {
        const [planRows, pending, replied] = await Promise.all([
          coachScheduleService.getPlansByStudent(id),
          coachFeedbackService.getFeedbacks("pending"),
          coachFeedbackService.getFeedbacks("replied"),
        ]);
        setPlans(planRows);
        setStudentFeedbacks([...pending, ...replied].filter((f) => f.studentId === id));
      } catch {
        setPlans([]);
        setStudentFeedbacks([]);
      }
    };
    void loadPlansAndFeedback();
  }, [id]);

  const handleSendFeedback = () => {
    void (async () => {
      if (!feedback.trim() || !selectedWorkout || !id) return;
      try {
        await coachGuidanceService.saveForWorkout(selectedWorkout, id, feedback.trim());
        const guidanceRows = await coachGuidanceService.getByStudentId(id);
        const guidanceMap = new Map(guidanceRows.map((row) => [row.workoutId, row.note]));
        setWorkouts((prev) => prev.map((w) => ({ ...w, feedback: guidanceMap.get(w.id) ?? w.feedback })));
        toast.success('指导反馈已发送至学员APP');
        setFeedback('');
        setSelectedWorkout(null);
      } catch (error: any) {
        const message = error instanceof Error ? error.message : String(error);
        toast.error(message || '发送失败，请稍后重试');
      }
    })();
  };

  const progressData = useMemo(() => {
    const avg = (arr: number[]) => (arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length);
    const rpes = studentFeedbacks.map((f) => f.metrics.rpe);
    const domss = studentFeedbacks.map((f) => f.metrics.doms);
    const fatigues = studentFeedbacks.map((f) => f.metrics.fatigue);
    const avgRpe = Number(avg(rpes).toFixed(1));
    const avgDoms = Number(avg(domss).toFixed(1));
    const avgFatigue = Number(avg(fatigues).toFixed(1));

    const domsLabel = avgDoms >= 8 ? '严重' : avgDoms >= 6 ? '显著' : avgDoms >= 3 ? '轻微' : '无感';
    const fatigueLabel = avgFatigue >= 8 ? '偏高' : avgFatigue >= 6 ? '中等' : avgFatigue >= 3 ? '正常' : '极佳';

    let alertTitle = '状态良好';
    let alertDesc = '基于最近真实反馈，学员状态平稳，可按计划推进。';
    let alertLevel: 'danger' | 'warning' | 'good' | 'normal' = 'normal';
    if (avgRpe >= 8.5 && avgFatigue >= 7) {
      alertTitle = '教练预警：过度训练风险';
      alertDesc = '真实反馈显示强度和疲劳均偏高，建议安排减载周。';
      alertLevel = 'danger';
    } else if (avgFatigue >= 7 || avgDoms >= 7) {
      alertTitle = '恢复预警：疲劳偏高';
      alertDesc = '真实反馈显示恢复压力较大，建议减少辅助动作容量。';
      alertLevel = 'warning';
    } else if (avgRpe > 0 && avgRpe <= 7 && avgFatigue <= 4) {
      alertTitle = '状态提示：恢复良好';
      alertDesc = '真实反馈显示恢复状态较好，可考虑小幅度进阶负重。';
      alertLevel = 'good';
    }

    const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const last4 = sortedWorkouts.slice(-4);
    const e1rmData = last4.map((w, idx) => {
      let s = 0;
      let b = 0;
      let d = 0;
      for (const ex of w.exercises ?? []) {
        for (const set of ex.sets ?? []) {
          const est = (set.weight ?? 0) * (1 + (set.reps ?? 0) / 30);
          if (ex.name.includes('蹲')) s = Math.max(s, Math.round(est));
          if (ex.name.includes('卧推') || ex.name.toLowerCase().includes('bench')) b = Math.max(b, Math.round(est));
          if (ex.name.includes('硬拉') || ex.name.toLowerCase().includes('deadlift')) d = Math.max(d, Math.round(est));
        }
      }
      return { week: `近${last4.length - idx}次`, s, b, d };
    });

    const muscleVolumeMap = new Map<string, number>();
    for (const w of workouts) {
      for (const ex of w.exercises ?? []) {
        const vol = (ex.sets ?? []).reduce((acc, s) => acc + (s.weight ?? 0) * (s.reps ?? 0), 0);
        muscleVolumeMap.set(ex.muscle, (muscleVolumeMap.get(ex.muscle) ?? 0) + vol);
      }
    }
    const volumeData = Array.from(muscleVolumeMap.entries())
      .slice(0, 6)
      .map(([name, current]) => {
        const optimal = Math.max(1000, Math.round(current * 0.9));
        const status = current > optimal * 1.15 ? '偏高' : current < optimal * 0.85 ? '偏低' : '完美';
        return { name, current: Math.round(current / 100), optimal: Math.round(optimal / 100), status };
      });

    const completionRate = plans.length === 0 ? 0 : Math.round((plans.filter((p) => p.status === 'completed').length / plans.length) * 100);
    const prCount = Math.max(0, e1rmData.length - 1);

    return {
      avgRpe,
      doms: domsLabel,
      fatigue: fatigueLabel,
      alertTitle,
      alertDesc,
      alertLevel,
      e1rmData: e1rmData.length > 0 ? e1rmData : [{ week: '暂无', s: 0, b: 0, d: 0 }],
      volumeData,
      completionRate,
      prCount,
    };
  }, [plans, studentFeedbacks, workouts]);

  const trainedDateSet = useMemo(() => {
    return new Set((workouts ?? []).map((w) => String(w.date || "").slice(0, 10)).filter(Boolean));
  }, [workouts]);

  const assignedPlanRows = useMemo(() => {
    const byDate = new Map<string, { date: string; status: 'planned' | 'completed'; exerciseCount: number }>();
    for (const p of plans) {
      byDate.set(p.date, {
        date: p.date,
        status: p.status,
        exerciseCount: p.exercises?.length ?? 0,
      });
    }
    for (const w of workouts) {
      const date = String(w.date || "").slice(0, 10);
      if (!date) continue;
      const current = byDate.get(date);
      byDate.set(date, {
        date,
        status: 'completed',
        exerciseCount: current?.exerciseCount ?? (w.exercises?.length ?? 0),
      });
    }
    return Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [plans, workouts]);

  if (!student && studentLoadError) {
    return (
      <div className="flex flex-col h-full bg-[#080808] items-center justify-center px-6 text-center">
        <p className="text-[14px] text-white/70 mb-3">{studentLoadError}</p>
        <button
          onClick={() => navigate('/coach/dashboard')}
          className="px-4 py-2 rounded-xl bg-[#d3a971] text-black text-[12px] font-semibold"
        >
          返回教练控制台
        </button>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col h-full bg-[#080808] items-center justify-center">
        <p className="text-[13px] text-white/50">学员信息加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#080808] relative z-50">
      <header className="pt-12 px-6 pb-4 flex flex-col border-b border-[#d3a971]/20 bg-[#141414] sticky top-0 z-10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate('/coach/dashboard')} className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-[#d3a971] transition-colors -ml-2">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.2em] mb-0.5">
              STUDENT PROFILE
            </span>
            <h1 className="text-[18px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/90 font-bold">
              {student.name}
            </h1>
          </div>
          <div className="w-10" />
        </div>

        {/* Custom Tab Navigation */}
        <div className="flex bg-[#0a0a0a] rounded-xl p-1 border border-white/[0.05]">
          {[
            { id: 'guidance', label: '训练指导', icon: Activity },
            { id: 'progress', label: '进度追踪', icon: BarChart2 },
            { id: 'plan', label: '计划排期', icon: ClipboardList },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-['Noto_Serif_SC',_serif] tracking-wider transition-all relative",
                  isActive ? "text-black bg-[#d3a971] font-bold shadow-[0_0_10px_rgba(211,169,113,0.2)]" : "text-white/40 hover:text-white/70"
                )}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pt-6 pb-24 scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'guidance' && (
              <div className="space-y-4">
                <h2 className="text-[14px] font-['JetBrains_Mono',_monospace] tracking-[0.1em] text-[#d3a971] uppercase mb-4">Recent Workouts</h2>
                
                {workouts.map((workout, i) => (
                  <div key={workout.id} className="bg-[#141414] rounded-2xl p-4 border border-white/[0.05] flex flex-col gap-3 group">
                    <div 
                      onClick={() => navigate(`/history/${workout.id}`, { state: { workout, isCoachView: true, studentName: student.name } })}
                      className="flex justify-between items-start cursor-pointer group hover:bg-white/[0.02] -m-2 p-2 rounded-xl transition-all"
                    >
                      <div>
                        <h3 className="text-[15px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90 mb-1 group-hover:text-[#d3a971] transition-colors flex items-center gap-1">
                          {workout.title}
                        </h3>
                        <span className="text-[11px] text-white/40 font-['JetBrains_Mono',_monospace]">{workout.date}</span>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className="text-[10px] text-white/30 uppercase font-['JetBrains_Mono',_monospace] block">Volume</span>
                          <span className="text-[14px] text-[#d3a971] font-['JetBrains_Mono',_monospace]">{workout.volume} <span className="text-[10px]">KG</span></span>
                        </div>
                        <span className="text-white/20 group-hover:text-[#d3a971] transition-all group-hover:translate-x-1 duration-300">›</span>
                      </div>
                    </div>
                    
                    {workout.feedback ? (
                      <div className="bg-[#d3a971]/10 rounded-xl p-3 border border-[#d3a971]/20">
                        <span className="text-[10px] text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase block mb-1">Coach Feedback</span>
                        <p className="text-[12px] text-white/80 leading-relaxed font-sans">{workout.feedback}</p>
                      </div>
                    ) : selectedWorkout === workout.id ? (
                      <div className="space-y-3 mt-2 pt-3 border-t border-white/[0.05]">
                        <textarea 
                          value={feedback}
                          onChange={e => setFeedback(e.target.value)}
                          placeholder="输入动作指导或建议..."
                          className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#d3a971]/50 min-h-[80px] resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setSelectedWorkout(null)} className="px-4 py-2 rounded-lg text-[12px] text-white/40 hover:text-white transition-colors">取消</button>
                          <button onClick={handleSendFeedback} className="px-4 py-2 rounded-lg bg-[#d3a971] text-black text-[12px] font-bold shadow-lg flex items-center gap-1">
                            <MessageSquare size={14} /> 发送指导
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setSelectedWorkout(workout.id)}
                        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-white/[0.05] border-dashed text-[12px] text-white/30 hover:text-[#d3a971] hover:border-[#d3a971]/30 transition-all"
                      >
                        <Plus size={14} /> 添加指导反馈
                      </button>
                    )}
                  </div>
                ))}
                {workouts.length === 0 && (
                  <div className="text-[12px] text-white/40 py-6 text-center border border-white/[0.05] rounded-xl">
                    暂无训练记录
                  </div>
                )}
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* 1. Readiness / Fatigue Monitor */}
                <div className="space-y-4">
                  <h2 className="text-[14px] font-['JetBrains_Mono',_monospace] tracking-[0.1em] text-[#d3a971] uppercase flex items-center gap-2">
                    <Activity size={16} />
                    学员主观状态与疲劳
                  </h2>
                  <div className="bg-[#141414] rounded-2xl p-4 border border-white/[0.05] flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1 p-3 bg-white/[0.02] rounded-xl border border-white/[0.02]">
                        <span className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace]">平均 RPE (强度)</span>
                        <span className={cn(
                          "text-xl font-['JetBrains_Mono',_monospace]",
                          progressData.avgRpe >= 8.5 ? "text-red-400" : progressData.avgRpe <= 7 ? "text-green-400" : "text-[#d3a971]"
                        )}>
                          {progressData.avgRpe}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 p-3 bg-white/[0.02] rounded-xl border border-white/[0.02]">
                        <span className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace]">肌肉酸痛 (DOMS)</span>
                        <span className={cn(
                          "text-xl font-['JetBrains_Mono',_monospace]",
                          progressData.doms === '严重' ? "text-red-400" : progressData.doms === '无感' ? "text-green-400" : "text-[#d3a971]"
                        )}>
                          {progressData.doms}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 p-3 bg-white/[0.02] rounded-xl border border-white/[0.02]">
                        <span className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace]">整体疲劳度</span>
                        <span className={cn(
                          "text-xl font-['JetBrains_Mono',_monospace]",
                          progressData.fatigue === '偏高' ? "text-orange-400" : progressData.fatigue === '极佳' ? "text-green-400" : "text-[#d3a971]"
                        )}>
                          {progressData.fatigue}
                        </span>
                      </div>
                    </div>
                    
                    <div className={cn(
                      "p-3 border rounded-xl flex items-start gap-3 transition-colors",
                      progressData.alertLevel === 'danger' ? "bg-red-500/10 border-red-500/20" :
                      progressData.alertLevel === 'warning' ? "bg-orange-500/10 border-orange-500/20" :
                      progressData.alertLevel === 'good' ? "bg-green-500/10 border-green-500/20" :
                      "bg-white/[0.02] border-white/[0.05]"
                    )}>
                      <div className={cn(
                        "mt-0.5 w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.6)] animate-pulse",
                        progressData.alertLevel === 'danger' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" :
                        progressData.alertLevel === 'warning' ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" :
                        progressData.alertLevel === 'good' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" :
                        "bg-[#d3a971] shadow-[0_0_8px_rgba(211,169,113,0.6)]"
                      )} />
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-[13px] font-medium mb-1",
                          progressData.alertLevel === 'danger' ? "text-red-400" :
                          progressData.alertLevel === 'warning' ? "text-orange-400" :
                          progressData.alertLevel === 'good' ? "text-green-400" :
                          "text-[#d3a971]"
                        )}>
                          {progressData.alertTitle}
                        </span>
                        <span className={cn(
                          "text-[11px] leading-relaxed",
                          progressData.alertLevel === 'danger' ? "text-red-400/70" :
                          progressData.alertLevel === 'warning' ? "text-orange-400/70" :
                          progressData.alertLevel === 'good' ? "text-green-400/70" :
                          "text-white/60"
                        )}>
                          {progressData.alertDesc}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Core Lifts Tracker (1RM) */}
                <div className="space-y-4">
                  <h2 className="text-[14px] font-['JetBrains_Mono',_monospace] tracking-[0.1em] text-[#d3a971] uppercase flex items-center gap-2">
                    <BarChart2 size={16} />
                    预估极限力量趋势 (e1RM)
                  </h2>
                  <div className="h-56 bg-[#141414] rounded-2xl p-4 border border-white/[0.05]">
                    <div className="flex items-center gap-4 mb-4 px-2">
                      <div className="flex items-center gap-2 text-[10px] font-['JetBrains_Mono',_monospace] text-white/50"><div className="w-2 h-2 rounded-full bg-[#d3a971]" /> 深蹲</div>
                      <div className="flex items-center gap-2 text-[10px] font-['JetBrains_Mono',_monospace] text-white/50"><div className="w-2 h-2 rounded-full bg-white/80" /> 卧推</div>
                      <div className="flex items-center gap-2 text-[10px] font-['JetBrains_Mono',_monospace] text-white/50"><div className="w-2 h-2 rounded-full bg-[#3b82f6]" /> 硬拉</div>
                    </div>
                    <ResponsiveContainer width="100%" height="75%">
                      <LineChart data={progressData.e1rmData}>
                        <XAxis key="sbd-x" dataKey="week" stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis key="sbd-y" stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} width={30} domain={['dataMin - 10', 'dataMax + 10']} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Line key="l-s" isAnimationActive={true} type="monotone" dataKey="s" stroke="#d3a971" strokeWidth={2} dot={{ fill: '#d3a971', r: 3, strokeWidth: 0 }} />
                        <Line key="l-b" isAnimationActive={true} type="monotone" dataKey="b" stroke="#ffffff" strokeWidth={2} dot={{ fill: '#ffffff', r: 3, strokeWidth: 0 }} />
                        <Line key="l-d" isAnimationActive={true} type="monotone" dataKey="d" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. Muscle Group Volume Distribution */}
                <div className="space-y-4">
                  <h2 className="text-[14px] font-['JetBrains_Mono',_monospace] tracking-[0.1em] text-[#d3a971] uppercase flex items-center gap-2">
                    <ClipboardList size={16} />
                    每周部位容量监控
                  </h2>
                  <div className="bg-[#141414] rounded-2xl p-5 border border-white/[0.05]">
                    <div className="space-y-5">
                      {progressData.volumeData.map((muscle, idx) => (
                        <div key={idx} className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-end">
                            <span className="text-[12px] text-white/80">{muscle.name}</span>
                            <div className="flex items-center gap-2 text-[10px] font-['JetBrains_Mono',_monospace]">
                              <span className={cn(
                                muscle.status === '偏高' ? 'text-orange-400' : 
                                muscle.status === '偏低' ? 'text-blue-400' : 'text-green-400'
                              )}>{muscle.current} 组</span>
                              <span className="text-white/30">/ {muscle.optimal} 建议</span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden relative">
                            <div 
                              className={cn(
                                "h-full rounded-full absolute left-0 top-0 transition-all duration-1000",
                                muscle.status === '偏高' ? 'bg-orange-500' : 
                                muscle.status === '偏低' ? 'bg-blue-500' : 'bg-green-500'
                              )} 
                              style={{ width: `${Math.min((muscle.current / (Math.max(muscle.current, muscle.optimal) + 2)) * 100, 100)}%` }} 
                            />
                            {/* Optimal target line marker */}
                            <div 
                              className="absolute top-0 h-full w-[2px] bg-white z-10 shadow-[0_0_4px_#fff]" 
                              style={{ left: `${(muscle.optimal / (Math.max(muscle.current, muscle.optimal) + 2)) * 100}%` }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#141414] rounded-xl p-4 border border-white/[0.05]">
                    <span className="text-[10px] text-white/40 block mb-1">计划完成率</span>
                    <span className="text-[20px] text-green-500 font-['JetBrains_Mono',_monospace]">{progressData.completionRate}%</span>
                  </div>
                  <div className="bg-[#141414] rounded-xl p-4 border border-white/[0.05]">
                    <span className="text-[10px] text-white/40 block mb-1">本周达成 PR</span>
                    <span className="text-[20px] text-[#d3a971] font-['JetBrains_Mono',_monospace]">{progressData.prCount}项</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'plan' && (
              <div className="space-y-6">
                <PlanCalendar
                  studentId={id || '1'}
                  studentName={student.name}
                  plans={plans}
                  trainedDates={trainedDateSet}
                />

                <div className="space-y-3">
                  <h2 className="text-[14px] font-['JetBrains_Mono',_monospace] tracking-[0.1em] text-white/40 uppercase mb-2">Assigned Plans</h2>
                  
                  {(assignedPlanRows.length === 0 ? [] : assignedPlanRows).map((plan) => {
                    const exerciseCount = plan.exerciseCount ?? 0;
                    const progress = plan.status === 'completed' ? 100 : Math.min(95, Math.max(20, exerciseCount * 10));
                    return (
                    <div key={plan.date} className="bg-[#141414] rounded-2xl p-4 border border-white/[0.05] relative overflow-hidden">
                      <div 
                        onClick={() => navigate(`/coach/student/${id}/plan/${plan.date}`, { state: { studentName: student.name } })}
                        className="flex justify-between items-start mb-3 relative z-10 cursor-pointer hover:bg-white/[0.02] -mx-2 -mt-2 p-2 rounded-xl transition-colors group"
                      >
                        <div>
                          <h3 className="text-[15px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90 mb-1 group-hover:text-[#d3a971] transition-colors">{plan.date} 训练计划</h3>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-sans inline-block", plan.status === 'planned' ? "bg-green-500/10 text-green-500" : "bg-white/5 text-white/30")}>
                            {plan.status === 'planned' ? '进行中' : '已完成'}
                          </span>
                        </div>
                        <span className="text-[14px] font-['JetBrains_Mono',_monospace] text-[#d3a971] group-hover:text-[#e8c690] transition-colors">{progress}%</span>
                      </div>
                      
                      <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden relative z-10 mb-3">
                        <div className={cn("h-full rounded-full", progress === 100 ? "bg-white/20" : "bg-[#d3a971]")} style={{ width: `${progress}%` }} />
                      </div>
                      
                      <div className="flex items-center gap-2 text-[11px] text-white/40 bg-white/[0.02] p-2 rounded-lg">
                        <Calendar size={12} className="text-[#d3a971]/70" />
                        <span>动作数: {exerciseCount}</span>
                      </div>
                    </div>
                  )})}
                  {assignedPlanRows.length === 0 && (
                    <div className="bg-[#141414] rounded-2xl p-4 border border-white/[0.05] text-[12px] text-white/40">
                      暂无已分配训练计划
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}