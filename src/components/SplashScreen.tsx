import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Leaf, Sparkles, Heart } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isOpened, setIsOpened] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleOpen = () => {
    if (isOpened || isAnimating) return;
    setIsAnimating(true);
    setIsOpened(true);

    // After unfolding and card rising sequence, complete splash screen
    setTimeout(() => {
      onComplete();
    }, 2200);
  };

  return (
    <motion.div
      id="splash-screen-container"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF8F5] text-stone-800 px-6 font-sans overflow-hidden select-none"
    >
      {/* Decorative ambient blurred backing glow */}
      <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#90A98C]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] left-[20%] w-72 h-72 rounded-full bg-[#7C95E4]/10 blur-3xl pointer-events-none" />

      {/* Grid Pattern overlay for tech-meadow vibe matching the portal */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.14] bg-[radial-gradient(rgba(124,149,228,0.25)_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Central Visual Showcase */}
      <div className="relative text-center flex flex-col items-center gap-8 max-w-sm z-10">
        
        {/* Brand Display Header */}
        <div className="space-y-1.5 text-center">
          <motion.h4
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.35em] text-stone-400 font-bold"
          >
            ✦ Surprise 20th Picnic Portal ✦
          </motion.h4>

          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl font-serif font-semibold tracking-tight text-stone-850 mt-1"
          >
            The Meadow
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[9px] sm:text-[10px] font-mono text-amber-800 uppercase tracking-widest"
          >
            {!isOpened ? "✉ You have received a secret invitation" : "✨ Opening the meadow coordinates..."}
          </motion.p>
        </div>

        {/* 3D Envelope Component */}
        <motion.div
          id="splash-envelope"
          onClick={handleOpen}
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, type: "spring", bounce: 0.25 }}
          className="relative w-80 h-52 bg-[#EFECE6] rounded-2xl border border-stone-350/30 shadow-2xl cursor-pointer overflow-visible group"
          style={{ perspective: 1200 }}
        >
          {/* Card Inside (slides out when envelope opens) */}
          <motion.div
            initial={{ y: 0, scale: 0.96 }}
            animate={isOpened ? { y: -95, scale: 1, zIndex: 30 } : { y: 0 }}
            transition={{ delay: 0.5, duration: 0.85, ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute inset-x-4 top-4 bottom-4 bg-[#FAF8F5] rounded-xl border border-[#90A98C]/25 shadow-md p-4 flex flex-col items-center justify-center gap-1.5 z-10"
          >
            <Leaf className="w-6 h-6 text-[#90A98C] fill-[#90A98C]/5 animate-pulse" />
            <h1 className="text-lg font-serif font-black text-stone-850 text-center tracking-tight">The Surprise Picnic</h1>
            <p className="text-[8px] font-mono tracking-widest text-[#7C95E4] uppercase font-bold">Unlocking Meadow Portal</p>
          </motion.div>

          {/* Left Envelope Triangular Fold */}
          <div 
            className="absolute inset-y-0 left-0 w-1/2 bg-[#ECE8E0] rounded-l-2xl z-20 shadow-[-5px_0_15px_rgba(0,0,0,0.01)]" 
            style={{ clipPath: "polygon(0% 0%, 100% 50%, 0% 100%)" }} 
          />
               
          {/* Right Envelope Triangular Fold */}
          <div 
            className="absolute inset-y-0 right-0 w-1/2 bg-[#ECE8E0] rounded-r-2xl z-20 shadow-[5px_0_15px_rgba(0,0,0,0.01)]" 
            style={{ clipPath: "polygon(100% 0%, 100% 100%, 0% 50%)" }} 
          />

          {/* Bottom Envelope Fold */}
          <div 
            className="absolute bottom-0 inset-x-0 h-[70%] bg-[#E4DFD5] rounded-b-2xl z-20 shadow-[0_-8px_20px_rgba(0,0,0,0.02)]" 
            style={{ clipPath: "polygon(0% 100%, 50% 0%, 100% 100%)" }} 
          />

          {/* Envelope Top Flap (Rotating around top edge) */}
          <motion.div
            initial={{ rotateX: 0 }}
            animate={isOpened ? { rotateX: 180, zIndex: 5 } : { rotateX: 0, zIndex: 25 }}
            transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
            className="absolute top-0 inset-x-0 h-[52%] bg-[#DED9CE] rounded-t-2xl origin-top"
            style={{ 
              clipPath: "polygon(0% 0%, 50% 100%, 100% 0%)",
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden"
            }}
          />

          {/* Wax Seal Lock */}
          <AnimatePresence>
            {!isOpened && (
              <motion.div
                id="wax-seal"
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-tr from-[#90A98C] to-[#7EA079] border-2 border-stone-200 shadow-lg flex items-center justify-center z-40 transition-transform active:scale-95 group-hover:scale-105 duration-100"
              >
                {/* Elegant outline */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[3px] rounded-full border border-dashed border-[#FAF8F5]/30"
                />
                
                {/* Center glowing heartbeat heart icon */}
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Heart className="w-5 h-5 text-white fill-white/10" />
                </motion.div>
                
                {/* Pulsing "Open" tooltip badge */}
                <span className="absolute top-[48px] whitespace-nowrap bg-stone-900 text-stone-100 font-mono font-bold text-[8px] uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow border border-white/10 select-none animate-bounce">
                  Click to Open
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Prompt Instruction Line */}
        <motion.p
          animate={{ opacity: isOpened ? 0.4 : [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[10px] font-mono tracking-widest text-stone-400 select-none uppercase mt-2 tracking-[0.25em]"
        >
          {!isOpened ? "TAP STAMP OR ENVELOPE TO UNSEAL" : "ESTABISHING MEADOW CONNECTION..."}
        </motion.p>

        {/* Sincere footnote */}
        <div className="absolute bottom-10 left-10 right-10 whitespace-nowrap text-center select-none pointer-events-none">
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-stone-400/80">
            <span>Made with</span>
            <Heart className="w-3 h-3 text-[#D9889D] fill-[#D9889D]/10 inline" />
            <span>for Nati's Special Day</span>
          </div>
        </div>
        
      </div>
    </motion.div>
  );
}

