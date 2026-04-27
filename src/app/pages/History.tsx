import { motion } from 'motion/react';
import { Search, SlidersHorizontal, Activity } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router';
import { useMemo, useState } from 'react';
import { Chart } from '../components/Chart';
import { type OutletContextType } from '../Root';

export function History() {
  const navigate = useNavigate();
  const { completedWorkouts = [] } = useOutletContext<OutletContextType>();
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'volumeDesc' | 'volumeAsc'>('latest');

  const dynamicHistory = completedWorkouts.map((w) => {
    const d = new Date(w.date);
    const h = Math.floor(w.timeSpent / 3600);
    const m = Math.floor((w.timeSpent % 3600) / 60);
    const durStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
    
    return {
      id: w.id,
      title: w.planTitle || "自由训练",
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase(),
      dateRaw: w.date,
      dur: durStr,
      vol: w.totalVolume.toLocaleString(),
      volNum: Number(w.totalVolume) || 0,
      icon: Activity
    };
  });

  const combinedHistory = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    let rows = [...dynamicHistory];
    if (keyword) {
      rows = rows.filter((item) => {
        return (
          item.title.toLowerCase().includes(keyword) ||
          item.date.toLowerCase().includes(keyword)
        );
      });
    }
    rows.sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.dateRaw).getTime() - new Date(a.dateRaw).getTime();
      if (sortBy === 'oldest') return new Date(a.dateRaw).getTime() - new Date(b.dateRaw).getTime();
      if (sortBy === 'volumeDesc') return b.volNum - a.volNum;
      return a.volNum - b.volNum;
    });
    return rows;
  }, [dynamicHistory, searchText, sortBy]);

  const totalVol = combinedHistory.reduce((acc, curr) => acc + parseInt(curr.vol.replace(/,/g, '')), 0);
  const totalSessions = combinedHistory.length;
  const dynamicHours = completedWorkouts.reduce((acc, w) => acc + w.timeSpent / 3600, 0);
  const totalHours = Math.floor(dynamicHours);

  return (
    <div className="flex flex-col h-full relative">
      <header className="pt-12 px-6 pb-4 relative z-20 flex flex-col backdrop-blur-xl bg-[#080808]/80 border-b border-white/[0.03]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.2em] mb-1">
              RECORDS
            </span>
            <h1 className="text-[20px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90">
              训练历史
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowSearch((v) => !v);
                if (showFilters) setShowFilters(false);
              }}
              className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              <Search size={16} />
            </button>
            <button
              onClick={() => {
                setShowFilters((v) => !v);
                if (showSearch) setShowSearch(false);
              }}
              className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>

        {showSearch && (
          <div className="mb-3">
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索训练标题或日期，例如 胸部 / APR 26"
              className="w-full h-10 rounded-xl bg-[#141414]/70 border border-white/[0.08] px-3 text-[12px] text-white placeholder-white/35 focus:outline-none focus:border-[#d3a971]/40"
            />
          </div>
        )}

        {showFilters && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            {[
              { id: 'latest', label: '按时间：最新' },
              { id: 'oldest', label: '按时间：最早' },
              { id: 'volumeDesc', label: '按容量：高到低' },
              { id: 'volumeAsc', label: '按容量：低到高' },
            ].map((opt) => {
              const active = sortBy === (opt.id as typeof sortBy);
              return (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id as typeof sortBy)}
                  className={`h-9 rounded-lg text-[11px] transition-colors ${
                    active
                      ? 'bg-[#d3a971] text-black font-semibold'
                      : 'bg-[#141414]/70 border border-white/[0.08] text-white/65 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Stats Overview */}
        <div 
          onClick={() => navigate('/analytics')}
          className="flex justify-between items-center bg-[#141414]/50 border border-white/[0.03] rounded-[16px] p-4 mt-2 hover:bg-[#141414]/80 hover:border-white/10 cursor-pointer transition-all group"
        >
          <div className="flex flex-col group-hover:scale-105 transition-transform origin-left">
            <span className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace] uppercase tracking-widest mb-1 group-hover:text-[#d3a971]/50 transition-colors">TOTAL VOL</span>
            <span className="text-[16px] font-['JetBrains_Mono',_monospace] text-[#d3a971] tracking-wider">{totalVol.toLocaleString()}<span className="text-[10px] text-[#d3a971]/50 ml-1">KG</span></span>
          </div>
          <div className="w-[1px] h-8 bg-white/[0.05] group-hover:bg-[#d3a971]/20 transition-colors" />
          <div className="flex flex-col items-center group-hover:scale-105 transition-transform">
            <span className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace] uppercase tracking-widest mb-1 group-hover:text-[#d3a971]/50 transition-colors">SESSIONS</span>
            <span className="text-[16px] font-['JetBrains_Mono',_monospace] text-white tracking-wider">{totalSessions}</span>
          </div>
          <div className="w-[1px] h-8 bg-white/[0.05] group-hover:bg-[#d3a971]/20 transition-colors" />
          <div className="flex flex-col items-end group-hover:scale-105 transition-transform origin-right">
            <span className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace] uppercase tracking-widest mb-1 group-hover:text-[#d3a971]/50 transition-colors">TIME</span>
            <span className="text-[16px] font-['JetBrains_Mono',_monospace] text-white tracking-wider">{totalHours}<span className="text-[10px] text-white/40 ml-1">H</span></span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide px-6 pt-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Chart Wrapper for history */}
          <div 
            onClick={() => navigate('/analytics')}
            className="bg-[#0a0a0a] border border-white/[0.03] rounded-[20px] p-4 -mx-2 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative cursor-pointer hover:border-[#d3a971]/20 hover:bg-[#141414]/80 transition-all group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#d3a971]/[0.02] to-transparent rounded-[20px] pointer-events-none group-hover:from-[#d3a971]/[0.08] transition-colors" />
            <Chart workouts={completedWorkouts} />
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#d3a971]/50 text-[10px] font-['JetBrains_Mono',_monospace] tracking-widest">
              VIEW DETAILS &rarr;
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-[12px] font-['JetBrains_Mono',_monospace] tracking-[0.2em] text-white/40 uppercase px-2 mb-4">RECENT</h3>
            
            {combinedHistory.map((log, i) => (
              <div key={i} onClick={() => navigate(`/history/${log.id}`)} className="p-4 rounded-[16px] bg-[#141414]/30 border border-white/[0.02] flex flex-col hover:bg-[#141414]/60 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[14px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90 group-hover:text-white transition-colors">{log.title}</span>
                    <span className="text-[10px] text-[#d3a971]/60 font-['JetBrains_Mono',_monospace] tracking-[0.1em]">{log.date}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#d3a971]/80 border border-[#d3a971]/10">
                    <log.icon size={14} />
                  </div>
                </div>
                
                <div className="flex items-center gap-6 pt-3 border-t border-white/[0.03]">
                  <div className="flex items-center gap-2 text-white/40 font-['JetBrains_Mono',_monospace] text-[10px] tracking-widest">
                    <span className="uppercase text-white/20">VOL</span>
                    <span className="text-white/80">{log.vol} KG</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/40 font-['JetBrains_Mono',_monospace] text-[10px] tracking-widest">
                    <span className="uppercase text-white/20">TIME</span>
                    <span className="text-white/80">{log.dur}</span>
                  </div>
                </div>
              </div>
            ))}
            {combinedHistory.length === 0 && (
              <div className="p-6 rounded-[16px] bg-[#141414]/30 border border-white/[0.05] text-[12px] text-white/40 text-center">
                暂无匹配记录，请更换搜索词或筛选条件
              </div>
            )}
          </div>

        </motion.div>
      </main>
    </div>
  );
}
