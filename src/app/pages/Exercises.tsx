import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronLeft, Filter, Dumbbell, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '../utils';
import { exerciseLibraryData } from '../data/exercises';

const MUSCLE_CATEGORIES = ["全部", "胸部", "背部", "腿部", "肩部", "手臂", "核心", "全身", "收藏"];
const TYPES = ["全部", "力量", "有氧", "静力", "拉伸"];
const EQUIPMENT = ["全部", "杠铃", "哑铃", "绳索", "固定器械", "自重"];
const DIFFICULTIES = ["全部", "初级 (1-2)", "中级 (3-4)", "高级 (5)"];

export function Exercises() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Advanced filters
  const [filterType, setFilterType] = useState("全部");
  const [filterEquipment, setFilterEquipment] = useState("全部");
  const [filterDifficulty, setFilterDifficulty] = useState("全部");

  useEffect(() => {
    const saved = localStorage.getItem('workout_favorites');
    if (saved) {
      try { setFavorites(JSON.parse(saved)); } catch(e) {}
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavs = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('workout_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const filteredExercises = useMemo(() => {
    return exerciseLibraryData.filter(ex => {
      // 1. Category / Muscle
      if (activeCategory === "收藏") {
        if (!favorites.includes(ex.id)) return false;
      } else if (activeCategory !== "全部" && ex.muscle !== activeCategory) {
        return false;
      }
      
      // 2. Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = ex.name.toLowerCase().includes(q);
        const matchesEn = ex.en.toLowerCase().includes(q);
        const matchesPinyin = ex.pinyin.toLowerCase().includes(q);
        if (!matchesName && !matchesEn && !matchesPinyin) return false;
      }

      // 3. Advanced Filters
      if (filterType !== "全部" && ex.type !== filterType) return false;
      if (filterEquipment !== "全部" && ex.equipment !== filterEquipment) return false;
      
      if (filterDifficulty !== "全部") {
        if (filterDifficulty === "初级 (1-2)" && ex.difficulty > 2) return false;
        if (filterDifficulty === "中级 (3-4)" && (ex.difficulty < 3 || ex.difficulty > 4)) return false;
        if (filterDifficulty === "高级 (5)" && ex.difficulty < 5) return false;
      }

      return true;
    });
  }, [activeCategory, searchQuery, filterType, filterEquipment, filterDifficulty, favorites]);

  return (
    <div className="flex flex-col h-full relative bg-[#080808]">
      <header className="pt-12 px-6 pb-4 relative z-30 flex flex-col border-b border-white/[0.03] bg-[#0a0a0a]">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.2em] mb-1">
              EXERCISE LIBRARY
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90">
                动作库
              </h1>
              <span className="text-[10px] text-white/30 font-['JetBrains_Mono',_monospace] bg-white/5 px-2 py-0.5 rounded-full">
                {exerciseLibraryData.length}+ DATA
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={16} className="text-white/30" />
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索动作 (支持拼音首字母如 'glwt')"
              className="w-full h-12 bg-[#141414] border border-white/[0.05] rounded-[16px] pl-12 pr-4 text-[13px] text-white placeholder-white/30 outline-none focus:border-[#d3a971]/50 focus:bg-[#1a1a1a] transition-all"
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "w-12 h-12 rounded-[16px] border flex items-center justify-center transition-all",
              isFilterOpen || filterType !== "全部" || filterEquipment !== "全部" || filterDifficulty !== "全部"
                ? "bg-[#d3a971]/10 border-[#d3a971]/30 text-[#d3a971]"
                : "bg-[#141414] border-white/[0.05] text-white/50 hover:text-[#d3a971]"
            )}
          >
            <Filter size={18} />
          </button>
        </div>
      </header>

      {/* Expanded Filter Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#0a0a0a] border-b border-white/[0.03] z-20 relative"
          >
            <div className="px-6 py-5 space-y-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[12px] font-['Noto_Serif_SC',_serif] tracking-widest text-[#d3a971]">多维度筛选</span>
                <button 
                  onClick={() => {
                    setFilterType("全部");
                    setFilterEquipment("全部");
                    setFilterDifficulty("全部");
                  }}
                  className="text-[10px] text-white/30 hover:text-white/60 font-sans tracking-wider"
                >
                  重置筛选
                </button>
              </div>

              {/* Type Filter */}
              <div>
                <label className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace] uppercase tracking-wider mb-2 block">Type 类型</label>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map(t => (
                    <button key={t} onClick={() => setFilterType(t)}
                      className={cn("px-3 py-1.5 rounded-full text-[11px] tracking-wider transition-colors", filterType === t ? "bg-[#d3a971] text-black font-bold" : "bg-white/5 text-white/60 hover:bg-white/10")}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment Filter */}
              <div>
                <label className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace] uppercase tracking-wider mb-2 block">Equipment 器械</label>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT.map(eq => (
                    <button key={eq} onClick={() => setFilterEquipment(eq)}
                      className={cn("px-3 py-1.5 rounded-full text-[11px] tracking-wider transition-colors", filterEquipment === eq ? "bg-[#d3a971] text-black font-bold" : "bg-white/5 text-white/60 hover:bg-white/10")}
                    >
                      {eq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="text-[10px] text-white/40 font-['JetBrains_Mono',_monospace] uppercase tracking-wider mb-2 block">Difficulty 难度</label>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTIES.map(d => (
                    <button key={d} onClick={() => setFilterDifficulty(d)}
                      className={cn("px-3 py-1.5 rounded-full text-[11px] tracking-wider transition-colors", filterDifficulty === d ? "bg-[#d3a971] text-black font-bold" : "bg-white/5 text-white/60 hover:bg-white/10")}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="w-[80px] flex-none overflow-y-auto scrollbar-hide border-r border-white/[0.02] bg-[#0a0a0a] z-10">
          <div className="flex flex-col py-2">
            {MUSCLE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "w-full py-5 text-[14px] tracking-widest transition-all duration-300 relative flex flex-col items-center justify-center gap-1.5",
                  activeCategory === cat 
                    ? "text-[#d3a971] font-['Noto_Serif_SC',_serif] bg-[#d3a971]/5" 
                    : "text-white/40 hover:text-white/60 hover:bg-white/5 font-sans"
                )}
              >
                {cat === "收藏" && <Star size={14} className={activeCategory === cat ? "fill-[#d3a971]" : ""} />}
                {cat}
                {activeCategory === cat && (
                  <motion.div 
                    layoutId="activeCategory"
                    className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#d3a971] shadow-[0_0_10px_#d3a971]" 
                  />
                )}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto pb-8 scrollbar-hide px-6 pt-6">
          <div className="flex justify-between items-end mb-4">
            <span className="text-[12px] text-white/40 font-['JetBrains_Mono',_monospace] tracking-wider">
              FOUND <span className="text-[#d3a971]">{filteredExercises.length}</span> EXERCISES
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredExercises.map((exercise, idx) => {
            const isFav = favorites.includes(exercise.id);
            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => navigate(`/exercises/${exercise.id}`, { state: { exercise } })}
                className="flex items-center p-4 rounded-[16px] bg-[#141414]/50 border border-white/[0.03] hover:border-[#d3a971]/30 hover:bg-[#1a1a1a] cursor-pointer transition-all group relative overflow-hidden"
              >
                <div className="w-14 h-14 rounded-[12px] bg-gradient-to-br from-white/[0.08] to-transparent border border-white/[0.05] flex items-center justify-center text-[#d3a971] mr-4 group-hover:scale-105 transition-transform overflow-hidden relative shrink-0">
                  {exercise.image ? (
                    <img src={exercise.image} alt={exercise.name} className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-500" />
                  ) : (
                    <Dumbbell size={20} strokeWidth={1.5} />
                  )}
                  {exercise.has3D && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center backdrop-blur-md">
                      <span className="text-[7px] text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase tracking-wider block py-0.5">3D</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col pr-8">
                  <h3 className="text-[16px] font-['Noto_Serif_SC',_serif] tracking-wider text-white/90 group-hover:text-[#d3a971] transition-colors mb-0.5">
                    {exercise.name}
                  </h3>
                  <span className="text-[10px] text-white/30 font-['JetBrains_Mono',_monospace] uppercase tracking-[0.1em] line-clamp-1 mb-2">
                    {exercise.en}
                  </span>
                  
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-white/5 text-white/50 text-[9px] font-['JetBrains_Mono',_monospace]">
                      {exercise.muscle}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-white/5 text-white/50 text-[9px] font-['JetBrains_Mono',_monospace]">
                      {exercise.type}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-white/5 text-white/50 text-[9px] font-['JetBrains_Mono',_monospace]">
                      {exercise.equipment}
                    </span>
                  </div>
                </div>

                <div className="absolute right-4 top-4 flex flex-col items-end gap-3">
                  <button 
                    onClick={(e) => toggleFavorite(e, exercise.id)}
                    className="p-1 -mr-1 -mt-1 text-white/20 hover:text-[#d3a971] transition-colors"
                  >
                    <Star size={16} className={isFav ? "fill-[#d3a971] text-[#d3a971]" : ""} />
                  </button>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-1 h-1 rounded-full",
                          i < exercise.difficulty ? "bg-[#d3a971]/60" : "bg-white/10"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {filteredExercises.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-white/30">
              <Dumbbell size={32} className="mb-4 opacity-50" strokeWidth={1} />
              <p className="text-[14px] font-sans tracking-wider">未找到匹配的动作</p>
              <p className="text-[12px] mt-1 opacity-60">请尝试更换关键词或减少筛选条件</p>
            </div>
          )}
        </div>
        </main>
      </div>
    </div>
  );
}