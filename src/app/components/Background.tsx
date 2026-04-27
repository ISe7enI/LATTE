import { motion } from 'motion/react';

export function Background() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#080808]">
      <div 
        className="absolute inset-0 z-10 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      <motion.div
        animate={{
          x: [-30, 30, -30],
          y: [-30, 30, -30],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-[10%] -left-[10%] w-[600px] h-[600px] rounded-full bg-[#d3a971]/[0.08] blur-[120px]"
      />
      <motion.div
        animate={{
          x: [30, -30, 30],
          y: [30, -30, 30],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[10%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[#8b6f4e]/[0.05] blur-[150px]"
      />
    </div>
  );
}
