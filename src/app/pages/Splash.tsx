import { useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';

export function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate auto-checking login state
    const checkAuth = setTimeout(() => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const hasOnboarded = localStorage.getItem('hasOnboarded') === 'true';
      
      if (isLoggedIn) {
        if (hasOnboarded) {
          navigate('/home');
        } else {
          navigate('/onboarding');
        }
      } else {
        navigate('/login');
      }
    }, 2000);

    return () => clearTimeout(checkAuth);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#080808] relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#d3a971]/10 blur-[100px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center z-10"
      >
        {/* Abstract Logo */}
        <div className="relative flex items-center justify-center mb-8">
          <div className="w-16 h-16 border-2 border-[#d3a971] rotate-45" />
          <div className="absolute w-16 h-16 border-2 border-white/20 -rotate-12" />
        </div>
        
        <h1 className="text-[28px] font-['Noto_Serif_SC',_serif] tracking-[0.2em] text-white/90 mb-3">
          IRON FORGE
        </h1>
        <p className="text-[12px] font-['JetBrains_Mono',_monospace] tracking-[0.3em] text-[#d3a971] uppercase">
          Progress is not linear
        </p>
      </motion.div>
    </div>
  );
}
