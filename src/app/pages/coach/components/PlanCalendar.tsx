import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, toLocalDateKey } from '../../../utils';
import { useNavigate } from 'react-router';
import { DayPlan } from '../../../services/coachSchedule';

export function PlanCalendar({
  studentId,
  studentName,
  plans,
  trainedDates,
}: {
  studentId: string;
  studentName: string;
  plans: DayPlan[];
  trainedDates: Set<string>;
}) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of week (0-6, 0 is Sunday, let's make Monday 1)
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6; // Sunday is 6

    const daysInMonth = lastDay.getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    
    const days = [];
    for (let i = 0; i < totalCells; i++) {
      const dayOffset = i - startOffset;
      const date = new Date(year, month, dayOffset + 1);
      
      // format YYYY-MM-DD
      const dateStr = toLocalDateKey(date);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = dateStr === toLocalDateKey(new Date());
      const plan = plans.find(p => p.date === dateStr);
      const isTrained = trainedDates.has(dateStr) || plan?.status === 'completed';
      const isPlanned = !!plan && !isTrained;
      
      days.push({
        date,
        dateStr,
        dayNumber: date.getDate(),
        isCurrentMonth,
        isToday,
        hasPlan: !!plan,
        isTrained,
        isPlanned,
      });
    }
    return days;
  }, [currentDate, plans, trainedDates]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (dateStr: string) => {
    navigate(`/coach/student/${studentId}/plan/${dateStr}`, {
      state: { studentName }
    });
  };

  const monthName = currentDate.toLocaleString('zh-CN', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-[#141414] rounded-[24px] border border-white/[0.05] p-5">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[16px] font-['Noto_Serif_SC',_serif] tracking-widest text-white/90">{monthName}</h2>
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.05] text-white/40 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={handleNextMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.05] text-white/40 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center mb-4">
        {['一', '二', '三', '四', '五', '六', '日'].map(d => (
          <span key={d} className="text-[10px] font-['JetBrains_Mono',_monospace] text-white/30 tracking-widest uppercase">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-2 gap-x-2">
        {calendarDays.map((day, i) => (
          <button
            key={i}
            onClick={() => day.isCurrentMonth && handleDateClick(day.dateStr)}
            disabled={!day.isCurrentMonth}
            className={cn(
              "aspect-square rounded-full flex flex-col items-center justify-center relative transition-all duration-300",
              day.isCurrentMonth ? "hover:bg-white/[0.05]" : "opacity-20",
              day.isToday && !day.hasPlan && "border border-[#d3a971]/30",
              day.isTrained && "bg-[#d3a971]/10 text-[#d3a971]",
              day.isPlanned && "bg-white/10 text-white"
            )}
          >
            <span className={cn(
              "text-[14px] font-['JetBrains_Mono',_monospace]",
              day.isCurrentMonth ? (day.isTrained ? "text-[#d3a971]" : "text-white/80") : "text-white/20"
            )}>
              {day.dayNumber}
            </span>
            {(day.isTrained || day.isPlanned) && (
              <span className={cn(
                "absolute bottom-1 w-1 h-1 rounded-full",
                day.isTrained ? "bg-[#d3a971]" : "bg-white"
              )} />
            )}
          </button>
        ))}
      </div>
      
      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/[0.05] text-[10px] text-white/40 font-['JetBrains_Mono',_monospace] tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d3a971]"></span> 已训练
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span> 已排期
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full border border-[#d3a971]/30 flex items-center justify-center"></span> 今日
        </div>
      </div>
    </div>
  );
}