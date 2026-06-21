import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Tv, Play, Sparkles } from "lucide-react";

interface SplashLogoProps {
  onComplete: () => void;
}

export default function SplashLogo({ onComplete }: SplashLogoProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 600); // Allow exit transition to complete
    }, 2800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="splash-container"
          className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50 overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -40, filter: "blur(10px)" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Ambient background particles */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-violet-600 to-pink-500 rounded-full blur-3xl" />
          </div>

          <div className="flex flex-col items-center justify-center relative z-10 px-6 max-w-sm text-center">
            {/* Pulsing Animated Branding Logo */}
            <motion.div
              id="splash-logo-box"
              className="relative w-28 h-28 bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.3)]"
              initial={{ scale: 0.4, rotate: -45, opacity: 0 }}
              animate={{ 
                scale: [0.4, 1.1, 1], 
                rotate: [0, 10, 0], 
                opacity: 1 
              }}
              transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {/* Inner ring pulse */}
              <motion.div
                className="absolute inset--2 border border-cyan-400 rounded-3xl opacity-40"
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />

              <Tv className="w-14 h-14 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]" />
              <motion.div
                className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-md"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Sparkles className="w-2.5 h-2.5" />
                Live
              </motion.div>
            </motion.div>

            {/* Application Title Animation */}
            <motion.div
              id="splash-title-text"
              className="mt-8 space-y-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <h1 className="text-4xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 uppercase font-sans">
                All Live
              </h1>
              <p className="text-xs text-slate-400 font-medium tracking-widest uppercase flex items-center justify-center gap-1">
                <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                Premium Live Video Portal
              </p>
            </motion.div>

            {/* Bottom loading indicator */}
            <div className="absolute bottom-[-140px] w-48 space-y-2">
              <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 current to-violet-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.2, ease: "easeInOut" }}
                />
              </div>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-center animate-pulse">
                লোড হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
