import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';
import { useId } from 'react';
import { type CompletedWorkout } from '../types';

export function Chart({ workouts = [] }: { workouts?: CompletedWorkout[] }) {
  const chartId = useId().replace(/:/g, '');
  const colorId = `colorVolume-${chartId}`;
  const lineId = `lineGradient-${chartId}`;

  // Build a fixed 7-day time series (today and previous 6 days)
  const toDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const volumeByDay = new Map<string, number>();
  for (const w of workouts) {
    const d = new Date(w.date);
    const key = toDateKey(d);
    volumeByDay.set(key, (volumeByDay.get(key) ?? 0) + (Number(w.totalVolume) || 0));
  }
  const today = new Date();
  const data = Array.from({ length: 7 }).map((_, index) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - index));
    const key = toDateKey(d);
    return {
      date: `${`${d.getMonth() + 1}`.padStart(2, '0')}.${`${d.getDate()}`.padStart(2, '0')}`,
      volume: volumeByDay.get(key) ?? 0,
      fullDate: d.toLocaleDateString(),
    };
  });

  return (
    <div className="h-[200px] w-full mt-4 mb-6 relative group">
      <div className="absolute top-2 left-5 text-[10px] text-[#d3a971]/80 font-['JetBrains_Mono',_monospace] tracking-[0.2em] z-10 flex items-center gap-2 mix-blend-plus-lighter">
        <div className="w-1.5 h-1.5 rounded-full bg-[#d3a971] shadow-[0_0_8px_#d3a971]" />
        VOL. TREND 力量趋势
      </div>
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <AreaChart accessibilityLayer={false} data={data} margin={{ top: 40, right: 0, left: 0, bottom: 0 }}>
          <defs key="defs-layer">
            <linearGradient key={`grad-${colorId}`} id={colorId} x1="0" y1="0" x2="0" y2="1">
              <stop key="stop-c1" offset="0%" stopColor="#d3a971" stopOpacity={0.3}/>
              <stop key="stop-c2" offset="80%" stopColor="#d3a971" stopOpacity={0}/>
            </linearGradient>
            <linearGradient key={`grad-${lineId}`} id={lineId} x1="0" y1="0" x2="1" y2="0">
              <stop key="stop-l1" offset="0%" stopColor="#8b6f4e" stopOpacity={0.1}/>
              <stop key="stop-l2" offset="50%" stopColor="#d3a971" stopOpacity={0.8}/>
              <stop key="stop-l3" offset="100%" stopColor="#8b6f4e" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid key="grid-layer" strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
          <YAxis key="y-axis" hide domain={[0, 'auto']} />
          <XAxis 
            key="x-axis"
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} 
            dy={5}
          />
          <Tooltip 
            key="tooltip-layer"
            contentStyle={{ 
              backgroundColor: 'rgba(10,10,10,0.6)', 
              borderColor: 'rgba(211,169,113,0.1)',
              borderRadius: '8px',
              fontFamily: 'JetBrains Mono, monospace',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
              color: '#d3a971',
              padding: '8px 12px'
            }}
            itemStyle={{ color: '#d3a971', fontSize: '14px', fontWeight: 600, padding: 0 }}
            labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginBottom: '4px' }}
            cursor={{ stroke: 'rgba(211,169,113,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area 
            key="area-layer"
            type="monotone" 
            dataKey="volume" 
            stroke={`url(#${lineId})`} 
            strokeWidth={1.5}
            fillOpacity={1} 
            fill={`url(#${colorId})`} 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}