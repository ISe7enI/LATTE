import { useNavigate } from "react-router";
import { Check } from "lucide-react";

export function Finish() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-[#080808] text-white relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#d3a971]/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#d3a971]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="pt-12 px-6 pb-4 relative z-20 flex flex-col items-center">
        <span className="text-[10px] text-[#d3a971] font-['JetBrains_Mono',_monospace] uppercase tracking-[0.2em]">
          SESSION COMPLETED
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/[0.05] mb-8 relative">
          <div className="absolute inset-0 rounded-full border border-[#d3a971]/30 scale-[1.15] opacity-50" />
          <div className="absolute inset-0 rounded-full border border-[#d3a971]/10 scale-[1.3] opacity-30" />
          <Check size={32} className="text-[#d3a971]" strokeWidth={1.5} />
        </div>

        <div className="flex flex-col items-center space-y-4 text-center mb-16">
          <h1 className="text-4xl font-['Noto_Serif_SC',_serif] tracking-widest text-white/90 italic font-light">
            Progress is
            <br />
            not linear.
          </h1>
          <div className="w-8 h-[1px] bg-white/20 my-4" />
          <p className="text-xs font-['JetBrains_Mono',_monospace] text-white/40 tracking-widest uppercase">
            Consistency is everything
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 relative z-20">
        <button
          onClick={() => navigate('/')}
          className="w-full py-4 rounded-xl bg-[#d3a971] text-[#080808] font-['JetBrains_Mono',_monospace] text-xs font-bold tracking-[0.15em] uppercase hover:bg-white transition-colors"
        >
          RETURN TO HOME
        </button>
      </footer>
    </div>
  );
}
