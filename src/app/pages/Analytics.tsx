import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, BarChart3, ChevronLeft, Flame, X } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router';
import { cn, toLocalDateKey } from '../utils';
import { type OutletContextType } from '../Root';
import { type CompletedWorkout } from '../types';

type TimeRange = "本周" | "本月" | "本年" | "全部";
const HEATMAP_STEP_PX = 16;

function startOfWeekMonday(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - day + 1);
  return d;
}

function endOfWeekSunday(date: Date) {
  const start = startOfWeekMonday(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

function buildHeatmapColumns(startDate: Date, endDate: Date) {
  const rangeStart = new Date(startDate);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(endDate);
  rangeEnd.setHours(23, 59, 59, 999);

  const firstWeekStart = startOfWeekMonday(rangeStart);
  const lastWeekEnd = endOfWeekSunday(rangeEnd);
  const columns: Date[][] = [];
  let cursor = new Date(firstWeekStart);

  while (cursor <= lastWeekEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(cursor);
      day.setDate(cursor.getDate() + i);
      week.push(day);
    }
    columns.push(week);
    cursor.setDate(cursor.getDate() + 7);
  }

  return {
    columns,
    firstWeekStart,
    inRange: (day: Date) => day >= rangeStart && day <= rangeEnd,
  };
}

function inRange(date: Date, range: TimeRange) {
  const now = new Date();
  if (range === '全部') return true;
  if (range === '本年') return date.getFullYear() === now.getFullYear();
  if (range === '本月') return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  const day = now.getDay() === 0 ? 7 : now.getDay();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - day + 1);
  return date >= monday && date <= now;
}

function ActivityCalendar({
  workouts,
  range,
  intensityLowThreshold,
  intensityHighThreshold,
}: {
  workouts: CompletedWorkout[];
  range: TimeRange;
  intensityLowThreshold: number;
  intensityHighThreshold: number;
}) {
  const [selectedDay, setSelectedDay] = useState<{ date: string; workouts: number; volume: number; minutes: number } | null>(null);
  const byDay = useMemo(() => {
    const map = new Map<string, { workouts: number; volume: number; minutes: number }>();
    workouts.forEach((w) => {
      const key = toLocalDateKey(w.date);
      const prev = map.get(key) ?? { workouts: 0, volume: 0, minutes: 0 };
      map.set(key, {
        workouts: prev.workouts + 1,
        volume: prev.volume + (w.totalVolume ?? 0),
        minutes: prev.minutes + Math.round((w.timeSpent ?? 0) / 60),
      });
    });
    return map;
  }, [workouts]);

  const intensity = (vol: number) => {
    if (vol <= 0) return 0;
    if (vol < intensityLowThreshold) return 1;
    return vol < intensityHighThreshold ? 2 : 3;
  };
  const color = (level: number) =>
    level === 3
      ? 'bg-[#d3a971] border border-[#d3a971]'
      : level === 2
        ? 'bg-[#d3a971]/60 border border-[#d3a971]/40'
        : level === 1
          ? 'bg-[#d3a971]/30 border border-[#d3a971]/20'
          : 'bg-white/[0.02] border border-white/[0.02]';

  const now = new Date();

  const renderDayCell = (d: Date, dayNum: number) => {
    const key = toLocalDateKey(d);
    const vol = byDay.get(key)?.volume ?? 0;
    const level = intensity(vol);
    return (
      <div
        key={key}
        onClick={() => {
          const info = byDay.get(key);
          if (info) setSelectedDay({ date: key, ...info });
        }}
        className={cn(
          "aspect-square rounded-[8px] flex items-center justify-center",
          level > 0 ? "cursor-pointer active:scale-95 transition-transform" : "",
          color(level),
        )}
      >
        <span className={cn("text-[12px]", level > 1 ? "text-black font-bold" : "text-white/60")}>{dayNum}</span>
      </div>
    );
  };

  const renderMonthGrid = (year: number, month: number, title?: string, keyPrefix?: string) => {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    return (
      <div key={keyPrefix ?? `${year}-${month}`} className="mb-5 last:mb-0">
        {title && (
          <div className="mb-2 text-[11px] text-[#d3a971]/80 font-['JetBrains_Mono',_monospace] tracking-[0.1em]">
            {title}
          </div>
        )}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`e-${year}-${month}-${i}`} className="aspect-square rounded-[8px]" />
          ))}
          {Array.from({ length: count }).map((_, i) => {
            const dayNum = i + 1;
            const d = new Date(year, month, dayNum);
            return renderDayCell(d, dayNum);
          })}
        </div>
      </div>
    );
  };

  const renderByRange = () => {
    if (range === "本周") {
      const today = new Date();
      const day = today.getDay() === 0 ? 7 : today.getDay();
      const monday = new Date(today);
      monday.setHours(0, 0, 0, 0);
      monday.setDate(today.getDate() - day + 1);
      const days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
      });
      return (
        <div className="grid grid-cols-7 gap-2">
          {days.map((d) => renderDayCell(d, d.getDate()))}
        </div>
      );
    }

    if (range === "本年") {
      const year = now.getFullYear();
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      const { columns, firstWeekStart, inRange } = buildHeatmapColumns(start, end);
      const monthLabels = Array.from({ length: 12 }).map((_, month) => {
        const monthStart = new Date(year, month, 1);
        const weekIndex = Math.floor((monthStart.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
        return { label: `${month + 1}月`, weekIndex };
      });
      return (
        <div className="overflow-x-auto scrollbar-hide pb-1">
          <div className="relative inline-block">
            <div className="h-5 relative mb-2">
              {monthLabels.map((item) => (
                <span
                  key={`year-label-${item.label}`}
                  className="absolute top-0 text-[10px] text-[#d3a971]/75 font-['JetBrains_Mono',_monospace] whitespace-nowrap"
                  style={{ left: `${item.weekIndex * HEATMAP_STEP_PX}px` }}
                >
                  {item.label}
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              {columns.map((week, wIndex) => (
                <div key={`year-week-${wIndex}`} className="flex flex-col gap-1">
                  {week.map((d) => {
                    const key = toLocalDateKey(d);
                    if (!inRange(d)) {
                      return <div key={`year-empty-${key}`} className="w-3 h-3 rounded-[3px] bg-transparent" />;
                    }
                    const vol = byDay.get(key)?.volume ?? 0;
                    const level = intensity(vol);
                    return (
                      <div
                        key={`year-cell-${key}`}
                        onClick={() => {
                          const info = byDay.get(key);
                          if (info) setSelectedDay({ date: key, ...info });
                        }}
                        className={cn(
                          "w-3 h-3 rounded-[3px]",
                          level > 0 ? "cursor-pointer active:scale-95 transition-transform" : "",
                          color(level),
                        )}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (range === "全部") {
      const dates = workouts.map((w) => new Date(w.date)).sort((a, b) => a.getTime() - b.getTime());
      const firstDate = dates[0] ?? new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDate = dates[dates.length - 1] ?? now;
      const start = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
      const end = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
      const { columns, firstWeekStart, inRange } = buildHeatmapColumns(start, end);
      const monthLabels: Array<{ label: string; weekIndex: number }> = [];
      let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      const monthEnd = new Date(end.getFullYear(), end.getMonth(), 1);
      while (cursor <= monthEnd) {
        const weekIndex = Math.floor((cursor.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
        monthLabels.push({ label: `${cursor.getFullYear()}年${cursor.getMonth() + 1}月`, weekIndex });
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      }
      return (
        <div className="overflow-x-auto scrollbar-hide pb-1">
          <div className="relative inline-block">
            <div className="h-5 relative mb-2">
              {monthLabels.map((item) => (
                <span
                  key={`all-label-${item.label}`}
                  className="absolute top-0 text-[10px] text-[#d3a971]/75 font-['JetBrains_Mono',_monospace] whitespace-nowrap"
                  style={{ left: `${item.weekIndex * HEATMAP_STEP_PX}px` }}
                >
                  {item.label}
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              {columns.map((week, wIndex) => (
                <div key={`all-week-${wIndex}`} className="flex flex-col gap-1">
                  {week.map((d) => {
                    const key = toLocalDateKey(d);
                    if (!inRange(d)) {
                      return <div key={`all-empty-${key}`} className="w-3 h-3 rounded-[3px] bg-transparent" />;
                    }
                    const vol = byDay.get(key)?.volume ?? 0;
                    const level = intensity(vol);
                    return (
                      <div
                        key={`all-cell-${key}`}
                        onClick={() => {
                          const info = byDay.get(key);
                          if (info) setSelectedDay({ date: key, ...info });
                        }}
                        className={cn(
                          "w-3 h-3 rounded-[3px]",
                          level > 0 ? "cursor-pointer active:scale-95 transition-transform" : "",
                          color(level),
                        )}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return renderMonthGrid(now.getFullYear(), now.getMonth(), undefined, "month-current");
  };

  return (
    <>
      {range !== "本年" && range !== "全部" && (
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
            <div key={d} className="text-center text-[10px] text-white/30">{d}</div>
          ))}
        </div>
      )}
      {renderByRange()}

      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[400px] bg-[#141414] border border-white/[0.05] rounded-[24px] p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-[18px] text-white/90">训练记录</h3>
                <button onClick={() => setSelectedDay(null)} className="w-8 h-8 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-white/40">
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-2 text-[13px] text-white/70">
                <div>日期：{selectedDay.date}</div>
                <div>训练次数：{selectedDay.workouts}</div>
                <div>训练容量：{selectedDay.volume.toLocaleString()} KG</div>
                <div>训练时长：{selectedDay.minutes} MIN</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function Analytics() {
  const navigate = useNavigate();
  const { completedWorkouts = [], userPreferences } = useOutletContext<OutletContextType>();
  const [timeRange, setTimeRange] = useState<TimeRange>("本月");
  const intensityLowThreshold = Math.max(1, Math.round(userPreferences.intensityLowThreshold || 4000));
  const intensityHighThreshold = Math.max(intensityLowThreshold + 1, Math.round(userPreferences.intensityHighThreshold || 10000));
  const filtered = useMemo(
    () => completedWorkouts.filter((w) => inRange(new Date(w.date), timeRange)),
    [completedWorkouts, timeRange],
  );
  const data = useMemo(() => {
    const workouts = filtered.length;
    const volumeNum = filtered.reduce((acc, w) => acc + (Number(w.totalVolume) || 0), 0);
    const timeHours = filtered.reduce((acc, w) => acc + (Number(w.timeSpent) || 0), 0) / 3600;

    const bucket = { chest: 0, back: 0, shoulder: 0, legs: 0, other: 0 };
    filtered.forEach((w) => {
      const exercises = Array.isArray(w.exercises) ? w.exercises : [];
      exercises.forEach((ex) => {
        const sets = Array.isArray(ex?.sets) ? ex.sets : [];
        const exVol = sets.reduce((acc, s) => acc + ((Number(s?.weight) || 0) * (Number(s?.reps) || 0)), 0);
        const muscle = String(ex?.muscle ?? '');
        if (/胸/.test(muscle)) bucket.chest += exVol;
        else if (/背/.test(muscle)) bucket.back += exVol;
        else if (/肩/.test(muscle)) bucket.shoulder += exVol;
        else if (/腿|臀|股|腘/.test(muscle)) bucket.legs += exVol;
        else bucket.other += exVol;
      });
    });
    const total = Object.values(bucket).reduce((a, b) => a + b, 0) || 1;
    const toPercent = (v: number) => Math.round((v / total) * 100);

    return {
      workouts,
      volume: volumeNum.toLocaleString(),
      time: `${timeHours.toFixed(1)}h`,
      muscles: [
        { name: "胸部 CHEST", percent: toPercent(bucket.chest), width: `${toPercent(bucket.chest)}%` },
        { name: "背部 BACK", percent: toPercent(bucket.back), width: `${toPercent(bucket.back)}%` },
        { name: "肩部 SHOULDER", percent: toPercent(bucket.shoulder), width: `${toPercent(bucket.shoulder)}%` },
        { name: "腿部 LEGS", percent: toPercent(bucket.legs), width: `${toPercent(bucket.legs)}%` },
        { name: "其他 OTHER", percent: toPercent(bucket.other), width: `${toPercent(bucket.other)}%` },
      ],
    };
  }, [filtered]);

  return (
    <div className="flex flex-col h-full relative bg-[#080808]">
      <header className="pt-12 px-6 pb-4 relative z-20 flex flex-col border-b border-white/[0.03] bg-[#0a0a0a]">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.2em] mb-1">
              PERFORMANCE
            </span>
            <h1 className="text-[20px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90">
              数据分析
            </h1>
          </div>
          <div className="w-10" />
        </div>

        <div className="flex items-center bg-[#141414] p-1 rounded-[12px] border border-white/[0.05]">
          {(["本周", "本月", "本年", "全部"] as TimeRange[]).map((range) => (
            <button 
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "flex-1 py-2 text-[12px] font-['Noto_Serif_SC',_serif] tracking-widest rounded-[8px] transition-all",
                timeRange === range ? "bg-[#d3a971]/10 text-[#d3a971] shadow-[0_0_12px_rgba(211,169,113,0.1)]" : "text-white/40 hover:text-white/80"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide px-6 pt-6">
        {/* Overview */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-[20px] bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/[0.05] relative overflow-hidden"
          >
            <Activity className="absolute top-4 right-4 text-[#d3a971]/20" size={32} />
            <span className="text-[10px] text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.1em] mb-2 block">WORKOUTS</span>
            <div className="flex items-baseline gap-1 mt-4">
              <motion.span 
                key={data.workouts}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[32px] font-['JetBrains_Mono',_monospace] text-white"
              >
                {data.workouts}
              </motion.span>
              <span className="text-[12px] font-['Noto_Serif_SC',_serif] text-white/40 tracking-widest">次</span>
            </div>
          </motion.div>

          <div className="grid grid-rows-2 gap-3">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-[16px] bg-[#141414]/50 border border-white/[0.03] flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="text-[9px] text-[#d3a971]/70 font-['JetBrains_Mono',_monospace] tracking-[0.1em] mb-1">VOLUME</span>
                <motion.span 
                  key={data.volume}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-['JetBrains_Mono',_monospace] text-[16px] text-white/90"
                >
                  {data.volume}
                </motion.span>
              </div>
              <BarChart3 size={16} className="text-white/20" />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-4 rounded-[16px] bg-[#141414]/50 border border-white/[0.03] flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="text-[9px] text-[#d3a971]/70 font-['JetBrains_Mono',_monospace] tracking-[0.1em] mb-1">TIME</span>
                <motion.span 
                  key={data.time}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-['JetBrains_Mono',_monospace] text-[16px] text-white/90"
                >
                  {data.time}
                </motion.span>
              </div>
              <Flame size={16} className="text-white/20" />
            </motion.div>
          </div>
        </div>

        {/* Training Calendar / Heatmap */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/80">训练日历</h3>
            <span className="text-[9px] text-[#d3a971] font-['JetBrains_Mono',_monospace] tracking-[0.1em] border border-[#d3a971]/30 px-2 py-0.5 rounded">CALENDAR</span>
          </div>
          <div className="bg-[#141414]/30 rounded-[24px] border border-white/[0.03] p-5">
            <ActivityCalendar
              workouts={filtered}
              range={timeRange}
              intensityLowThreshold={intensityLowThreshold}
              intensityHighThreshold={intensityHighThreshold}
            />
            <div className="mt-4 pt-3 border-t border-white/[0.03] text-center">
              <span className="text-[10px] text-white/45 font-['JetBrains_Mono',_monospace] tracking-[0.08em]">
                强度分级：低 &lt; {intensityLowThreshold.toLocaleString()} / 中 &lt; {intensityHighThreshold.toLocaleString()} / 高 ≥ {intensityHighThreshold.toLocaleString()}
              </span>
            </div>
            {filtered.length === 0 && (
              <div className="mt-4 text-center">
                <span className="text-[12px] text-white/40 font-['Noto_Serif_SC',_serif]">
                  暂无训练日历数据，完成训练后会在日历中高亮显示。
                </span>
              </div>
            )}
          </div>
        </motion.section>

        {/* Heatmap Placeholder */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/80">肌群分布</h3>
            <span className="text-[9px] text-[#d3a971] font-['JetBrains_Mono',_monospace] tracking-[0.1em]">FOCUS</span>
          </div>
          
          <div className="p-5 rounded-[20px] bg-[#141414]/50 border border-white/[0.03]">
            <div className="space-y-4">
              {data.muscles.map((item: any, i: number) => (
                <div key={`${item.name}-${timeRange}`}>
                  <div className="flex justify-between text-[11px] font-['JetBrains_Mono',_monospace] text-white/60 mb-2">
                    <span>{item.name}</span>
                    <span className="text-[#d3a971]">{item.percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: item.width }}
                      transition={{ delay: 0.1 + i * 0.1, duration: 0.6 }}
                      className={cn(
                        "h-full rounded-full",
                        item.percent > 20 ? "bg-[#d3a971] shadow-[0_0_10px_#d3a971]" : "bg-white/20"
                      )}
                    />
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center pt-2">
                  <span className="text-[12px] text-white/40 font-['Noto_Serif_SC',_serif]">
                    暂无肌群分布数据，记录训练后将自动统计各肌群占比。
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* PR Milestones */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/80">PR里程碑</h3>
            <span className="text-[9px] text-white/40 font-['JetBrains_Mono',_monospace] tracking-[0.1em]">RECORDS</span>
          </div>
          
          <div className="space-y-3">
            {[...filtered]
              .sort((a, b) => (Number(b.totalVolume) || 0) - (Number(a.totalVolume) || 0))
              .slice(0, 2)
              .map((w, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-[16px] bg-gradient-to-r from-[#141414] to-transparent border border-white/[0.03] group hover:border-[#d3a971]/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#d3a971]/10 border border-[#d3a971]/20 flex items-center justify-center text-[#d3a971]">
                    <span className="text-[16px] font-['Noto_Serif_SC',_serif]">🏆</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90 mb-1">{w.planTitle || '自由训练'}</span>
                    <span className="text-[13px] font-['JetBrains_Mono',_monospace] text-[#d3a971]">{(Number(w.totalVolume) || 0).toLocaleString()}kg</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[9px] text-[#d3a971]/50 font-['JetBrains_Mono',_monospace] border border-[#d3a971]/20 px-1.5 py-0.5 rounded bg-[#d3a971]/5">NEW</span>
                  <span className="text-[10px] text-white/30 font-['JetBrains_Mono',_monospace] tracking-wider">{new Date(w.date).toLocaleDateString('zh-CN') || '-'}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-4 rounded-[16px] bg-[#141414]/50 border border-white/[0.03] text-center">
                <span className="text-[12px] text-white/40 font-['Noto_Serif_SC',_serif]">
                  暂无训练记录，完成一次训练后会自动生成 PR 里程碑。
                </span>
              </div>
            )}
          </div>
        </motion.section>
      </main>
    </div>
  );
}