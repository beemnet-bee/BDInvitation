import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Volume2, VolumeX, Star, ArrowLeft, 
  Sparkles, ShieldCheck, MailOpen, Compass, Award, Quote
} from "lucide-react";
import { CardConfig } from "../types";
import { 
  playPopSound, playCozySpark, playCelebrationBurst, 
  playInvitationTheme, startAmbientBackground, stopAmbientBackground 
} from "../utils/audio";

interface GreetingCardViewerProps {
  config: CardConfig;
  onBack?: () => void;
}

interface InteractiveArtShape {
  id: number;
  type: "circle" | "square" | "triangle" | "cross";
  x: number; // percentage width
  delay: number;
  speed: number;
  scale: number;
  color: string;
  word: string;
}

interface ParticleEmitter {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  destX: number;
  destY: number;
  size: number;
  color: string;
  shape: "circle" | "square" | "triangle" | "ring";
  rotation: number;
  delay: number;
  duration: number;
}



interface EnvelopeSparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const portalVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 18,
      staggerChildren: 0.22,
      delayChildren: 0.18
    }
  }
};

export default function GreetingCardViewer({ config, onBack }: GreetingCardViewerProps) {
  const [cardState, setCardState] = useState<"envelope" | "cover" | "opened">("envelope");
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [artShapes, setArtShapes] = useState<InteractiveArtShape[]>([]);
  const [explosions, setExplosions] = useState<ParticleEmitter[]>([]);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const [envelopeSparkles, setEnvelopeSparkles] = useState<EnvelopeSparkle[]>([]);
  const [score, setScore] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const lastSparkleTime = useRef(0);

  const triggerShake = () => {
    setIsShaking(false);
    setTimeout(() => {
      setIsShaking(true);
    }, 16);
  };

  useEffect(() => {
    if (isShaking) {
      const timer = setTimeout(() => setIsShaking(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isShaking]);

  const cardStateRef = useRef(cardState);

  // Keep a reference of cardState to avoid stale closures in timeouts
  useEffect(() => {
    cardStateRef.current = cardState;
  }, [cardState]);

  // Initialize interactive modernist shapes
  useEffect(() => {
    if (cardState === "opened") {
      const words = ["JOY ✦", "WISH ✧", "NATHNAEL ★", "JUNE 7", "MUSIC 🎵", "DRINK 🍸", "DANCE 🕺", "FUTURE 🚀"];
      const shapeTypes: ("circle" | "square" | "triangle" | "cross")[] = ["circle", "square", "triangle", "cross"];
      
      const newShapes = Array.from({ length: 12 }).map((_, i) => ({
        id: Date.now() + i,
        type: shapeTypes[i % shapeTypes.length],
        x: 15 + Math.random() * 70,
        delay: Math.random() * 3,
        speed: 7 + Math.random() * 5,
        scale: 0.8 + Math.random() * 0.5,
        color: i % 2 === 0 ? "text-pink-500" : "text-cyan-400",
        word: words[i % words.length]
      }));
      setArtShapes(newShapes);
    }
  }, [cardState]);



  // Audio synths loop connection
  useEffect(() => {
    if (cardState === "opened" && isPlayingMusic) {
      startAmbientBackground(config.theme);
    } else {
      stopAmbientBackground();
    }
    return () => stopAmbientBackground();
  }, [cardState, isPlayingMusic, config.theme]);

  const toggleMusic = () => {
    if (!isPlayingMusic) {
      setIsPlayingMusic(true);
      if (cardState === "opened") {
        playInvitationTheme();
      }
    } else {
      setIsPlayingMusic(false);
      stopAmbientBackground();
    }
  };

  const handleEnvelopeMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastSparkleTime.current < 30) return;
    lastSparkleTime.current = now;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const themeColors: Record<string, string[]> = {
      swiss: ["#fda4af", "#f43f5e", "#ffffff", "#ffe4e6"],
      acid: ["#bef264", "#a3e635", "#ffffff", "#ecfccb"],
      brutalist: ["#ffffff", "#ef4444", "#3b82f6", "#f59e0b", "#10b981"],
      sunset: ["#fde047", "#f97316", "#f43f5e", "#ffedd5"],
      aurora: ["#22d3ee", "#34d399", "#818cf8", "#ccfbf1"]
    };
    const colors = themeColors[config.theme] || ["#fda4af", "#f43f5e", "#ffffff"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newSparkle: EnvelopeSparkle = {
      id: Math.random() + now,
      x,
      y,
      size: 6 + Math.random() * 8,
      color: randomColor,
      rotation: Math.random() * 360,
    };

    setEnvelopeSparkles(prev => [...prev.slice(-40), newSparkle]);

    setTimeout(() => {
      setEnvelopeSparkles(prev => prev.filter(s => s.id !== newSparkle.id));
    }, 850);
  };

  const handleOpenEnvelope = () => {
    setCardState("cover");
    setIsPlayingMusic(true);
    playCozySpark();
  };

  const handleFlipCardOpen = () => {
    setCardState("opened");
    playInvitationTheme();
    playCelebrationBurst();
    triggerConfettiExplosion();
  };

  // Modern abstract vector pop trigger
  const handleShapePop = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    playPopSound();
    setScore(prev => prev + 10);

    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (parentRect) {
      const x = e.clientX - parentRect.left;
      const y = e.clientY - parentRect.top;
      
      setExplosions(prev => [...prev, { id, x, y, color: config.theme === "acid" ? "#a3e635" : "#f43f5e" }]);
      setTimeout(() => {
        setExplosions(prev => prev.filter(exp => exp.id !== id));
      }, 1000);
    }

    setArtShapes(prev => prev.filter(s => s.id !== id));
  };



  const triggerConfettiExplosion = () => {
    const themeColors = {
      swiss: ["#e11d48", "#f43f5e", "#fda4af", "#ffffff", "#f43f5e", "#ec4899"],
      acid: ["#a3e635", "#84cc16", "#bef264", "#06b6d4", "#22c55e", "#10b981"],
      brutalist: ["#000000", "#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"],
      sunset: ["#f59e0b", "#f97316", "#ef4444", "#ec4899", "#8b5cf6", "#a855f7"],
      aurora: ["#22d3ee", "#34d399", "#6366f1", "#a7f3d0", "#06b6d4", "#4f46e5"]
    };
    const colors = themeColors[config.theme] || ["#f43f5e", "#a3e635", "#3b82f6", "#eab308", "#a855f7"];
    const shapes: ("circle" | "square" | "triangle" | "ring")[] = ["circle", "square", "triangle", "ring"];

    const newConfetti: ConfettiParticle[] = Array.from({ length: 85 }).map((_, i) => {
      const angleDeg = -35 - Math.random() * 110; 
      const angleRad = (angleDeg * Math.PI) / 180;
      const distance = 100 + Math.random() * 210;

      return {
        id: Date.now() + i + Math.random(),
        x: 50, 
        y: 78, 
        destX: Math.cos(angleRad) * distance,
        destY: Math.sin(angleRad) * distance,
        size: 5 + Math.random() * 8,
        color: colors[i % colors.length],
        shape: shapes[i % shapes.length],
        rotation: (Math.random() - 0.5) * 1080,
        delay: Math.random() * 0.18,
        duration: 1.8 + Math.random() * 1.5
      };
    });

    setConfetti(prev => [...prev, ...newConfetti]);

    setTimeout(() => {
      setConfetti(prev => prev.filter(p => !newConfetti.some(nc => nc.id === p.id)));
    }, 4500);
  };



  // Theme styling definitions for modern "out of the ordinary" art boards
  const themeStyles = {
    brutalist: {
      bg: "bg-stone-50 text-stone-900 border-4 border-black font-mono",
      badge: "bg-black text-white px-3 py-1 font-mono font-extrabold uppercase text-[10px] tracking-widest",
      borderAccent: "border-4 border-black",
      cardCover: "bg-stone-100 text-stone-900 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-mono",
      cardInside: "bg-stone-50 border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] font-mono",
      coverTitle: "text-5xl font-black font-display uppercase tracking-tight leading-none text-black",
      primaryButton: "bg-black text-white hover:bg-stone-800 py-3 text-xs uppercase tracking-widest font-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono",
      secondaryButton: "bg-white border-2 border-black hover:bg-stone-100 text-stone-900 text-xs font-bold py-2 px-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-mono",
      canvasDecoration: "absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] opacity-10",
      accentTextColor: "text-black underline font-black font-display",
      messagePaper: "bg-white border-2 border-black p-6 rounded-none relative shadow-[4px_4px_0px_rgba(0,0,0,0.15)] font-mono",
      candleStick: "bg-black rounded-none border border-black",
      candleFlame: "w-2.5 h-6 bg-black rounded-none"
    },
    acid: {
      bg: "bg-neutral-950 text-neutral-100 font-sans border border-lime-500/20",
      badge: "bg-lime-400 text-black px-2.5 pb-1 pt-1.5 rounded-sm font-mono font-black text-[9px] tracking-widest",
      borderAccent: "border border-lime-400/40",
      cardCover: "bg-neutral-900 border border-lime-400 p-8 shadow-[0_0_30px_rgba(163,230,53,0.15)] font-sans",
      cardInside: "bg-zinc-950 border border-lime-400 p-6 shadow-[0_0_50px_rgba(163,230,53,0.08)] font-sans",
      coverTitle: "text-5xl font-black font-display text-lime-400 uppercase tracking-tighter leading-none italic",
      primaryButton: "bg-lime-400 text-black hover:bg-lime-300 py-3 text-xs rounded-sm uppercase tracking-wider font-extrabold transition-all font-mono",
      secondaryButton: "bg-neutral-900 border border-lime-500/30 text-lime-400 hover:bg-neutral-800 text-xs font-bold py-2 px-4 rounded-sm font-mono",
      canvasDecoration: "absolute inset-0 bg-gradient-to-tr from-lime-950/20 via-neutral-950 to-emerald-950/10",
      accentTextColor: "text-lime-300 font-bold font-display tracking-tight",
      messagePaper: "bg-zinc-900/80 border border-lime-500/20 p-6 rounded-lg backdrop-blur-md font-sans leading-relaxed text-zinc-100",
      candleStick: "bg-neutral-800 border-l border-lime-400",
      candleFlame: "w-1 h-8 bg-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.8)]"
    },
    swiss: {
      bg: "bg-slate-900 text-stone-100 font-sans border border-rose-500/20",
      badge: "bg-rose-600 text-white px-3 py-1 font-mono font-bold tracking-widest text-[10px] uppercase",
      borderAccent: "border border-rose-500",
      cardCover: "bg-rose-600 text-white p-8 border-none shadow-2xl relative font-sans",
      cardInside: "bg-stone-900 border-t-8 border-rose-600 p-8 shadow-xl font-sans",
      coverTitle: "text-4xl font-extrabold font-display uppercase tracking-widest text-white leading-tight",
      primaryButton: "bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 text-xs tracking-wider uppercase transition-all shadow-md font-mono",
      secondaryButton: "bg-stone-800 border border-rose-500/20 text-stone-100 hover:bg-stone-700 text-xs font-semibold py-2 px-4 font-mono",
      canvasDecoration: "absolute inset-x-0 top-0 h-44 bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,0.15),transparent_70%)]",
      accentTextColor: "text-rose-500 font-bold font-display",
      messagePaper: "bg-stone-950 p-6 border-l-4 border-rose-600 font-sans leading-relaxed text-stone-300",
      candleStick: "bg-stone-700",
      candleFlame: "w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_#e11d48]"
    },
    sunset: {
      bg: "bg-[#0f0a14] text-amber-50/90 font-sans border border-orange-500/10",
      badge: "bg-gradient-to-r from-amber-400 to-rose-500 text-stone-950 font-mono px-3 py-0.5 rounded-full text-[9px] uppercase font-bold",
      borderAccent: "border border-rose-400/30",
      cardCover: "bg-gradient-to-tr from-amber-950/80 via-purple-950/90 to-[#1e053a] border border-orange-500/25 p-8 rounded-3xl shadow-[0_10px_40px_rgba(244,63,94,0.1)] font-sans",
      cardInside: "bg-[#180e22] border border-rose-500/20 p-8 rounded-3xl shadow-inner font-sans",
      coverTitle: "text-4xl font-display tracking-normal text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-300 to-purple-200 italic font-bold leading-normal",
      primaryButton: "bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-450 text-stone-950 font-bold py-3 text-xs rounded-full uppercase tracking-widest shadow-md transition-all font-mono",
      secondaryButton: "bg-[#251333] border border-rose-500/20 text-amber-200 hover:bg-[#341b47] text-xs font-semibold py-2 px-4 rounded-full font-mono",
      canvasDecoration: "absolute inset-0 bg-gradient-to-b from-[#2e0b3e]/30 via-transparent to-transparent pointer-events-none",
      accentTextColor: "text-amber-300 font-bold font-display",
      messagePaper: "bg-gradient-to-b from-stone-950 to-[#180a25] border border-rose-500/10 p-6 rounded-2xl text-amber-100/90 font-light font-sans",
      candleStick: "bg-gradient-to-b from-orange-400 to-rose-500 rounded-full",
      candleFlame: "w-2 h-4 bg-amber-300 rounded-full animate-pulse shadow-[0_0_15px_#f59e0b]"
    },
    aurora: {
      bg: "bg-slate-950 text-indigo-100 font-sans border border-indigo-500/10",
      badge: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3 py-0.5 rounded-full text-[10px] uppercase font-mono tracking-widest",
      borderAccent: "border border-indigo-500/30",
      cardCover: "bg-gradient-to-br from-indigo-950 via-slate-950 to-[#0c1f24] border border-emerald-500/20 p-8 rounded-2xl shadow-xl font-sans",
      cardInside: "bg-[#04081c] border border-indigo-500/30 p-8 rounded-2xl shadow-lg font-sans",
      coverTitle: "text-4xl font-display font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-300 to-indigo-300 leading-normal",
      primaryButton: "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold py-3 text-xs rounded-xl uppercase tracking-wider transition-all font-mono",
      secondaryButton: "bg-[#0b1330] border border-indigo-500/30 text-indigo-300 hover:bg-[#162252] text-xs font-semibold py-2 px-4 rounded-xl font-mono",
      canvasDecoration: "absolute inset-0 pointer-events-none overflow-hidden origin-top opacity-50",
      accentTextColor: "text-emerald-300 font-mono",
      messagePaper: "bg-slate-950/70 border border-emerald-500/10 p-6 rounded-xl text-indigo-200/90 font-sans",
      candleStick: "bg-cyan-900 border-t border-cyan-400",
      candleFlame: "w-1.5 h-6 bg-cyan-300 rounded-t-full shadow-[0_0_10px_rgba(34,211,238,0.78)]"
    }
  };

  const currentTheme = config.theme;
  const style = themeStyles[currentTheme] || themeStyles.swiss;



  return (
    <motion.div
      animate={isShaking ? {
        x: [0, -4, 4, -4, 4, -2, 2, 0],
        y: [0, 2, -2, 2, -2, 1, -1, 0]
      } : { x: 0, y: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={`relative min-h-[640px] w-full max-w-4xl mx-auto rounded-3xl p-4 md:p-8 flex flex-col justify-between overflow-hidden transition-all duration-700 select-none ${style.bg} ${style.borderAccent}`}
    >
      
      {/* Absolute graphic background textures dependent on design style */}
      <div className={style.canvasDecoration}>
        {currentTheme === "aurora" && (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000 -ml-12"></div>
          </div>
        )}
      </div>

      {/* Modern minimal top bar */}
      <div className="flex justify-between items-center z-20 mb-6 pb-4 border-b border-inherit pointer-events-auto">
        {onBack ? (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold tracking-tight uppercase hover:bg-white/5 border rounded-lg transition-all border-inherit animate-fade"
            id="btn-viewer-back"
          >
            <ArrowLeft size={13} />
            {"< Back {" + config.senderName.toUpperCase().slice(0, 8) + "}"}
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 text-xs font-mono text-stone-400 select-none tracking-widest uppercase">
            <span>✦ Invitation 07-June</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className={`${style.badge}`}>
            {currentTheme} art frame
          </span>

          <button
            onClick={toggleMusic}
            className={`p-2 rounded-full border border-inherit transition-all duration-300 ${isPlayingMusic ? "bg-white text-slate-900 scale-105" : "opacity-55"}`}
            title="Toggle Synthesizer Track"
            id="btn-viewer-mute"
          >
            {isPlayingMusic ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      {/* Main interaction workspace */}
      <div className="flex-1 flex flex-col justify-center items-center z-10 py-6 max-w-lg mx-auto w-full relative">
        <AnimatePresence mode="wait">
          
          {/* STATE 1: ENVELOPE SECTOR (Ultra avant-garde digital seal) */}
          {cardState === "envelope" && (
            <motion.div
              key="envelope"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ y: -60, opacity: 0, scale: 0.94 }}
              whileHover={{ 
                scale: 1.03, 
                y: -6,
                boxShadow: currentTheme === "brutalist" 
                  ? "8px 8px 0px 0px rgba(0,0,0,1)" 
                  : currentTheme === "acid"
                    ? "0 0 40px rgba(163,230,53,0.35)"
                    : currentTheme === "swiss"
                      ? "0 0 40px rgba(225,29,72,0.35)"
                      : currentTheme === "sunset"
                        ? "0 0 40px rgba(244,63,94,0.4)"
                        : "0 0 40px rgba(34,211,238,0.4)",
                transition: { type: "spring", stiffness: 400, damping: 16 }
              }}
              className="w-full max-w-[390px] aspect-[1/1] relative flex flex-col justify-center items-center rounded-none cursor-pointer border-2 border-inherit text-inherit overflow-hidden group p-8"
              onClick={handleOpenEnvelope}
              onMouseMove={handleEnvelopeMouseMove}
              id="invitation-envelope"
            >
              {/* Star trail / sparkly mouse trail */}
              {envelopeSparkles.map((sp) => (
                <motion.div
                  key={sp.id}
                  className="absolute pointer-events-none select-none z-20 flex items-center justify-center font-bold"
                  style={{
                    left: sp.x,
                    top: sp.y,
                    x: "-50%",
                    y: "-50%",
                    color: sp.color,
                    fontSize: `${sp.size}px`,
                  }}
                  initial={{ scale: 0, opacity: 0, rotate: sp.rotation }}
                  animate={{
                    scale: [0, 1.3, 0.4],
                    opacity: [0, 0.9, 0],
                    y: [0, -15, -30],
                    x: [0, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 30]
                  }}
                  transition={{
                    duration: 0.8,
                    ease: "easeOut"
                  }}
                >
                  {Math.random() > 0.5 ? "✦" : "✧"}
                </motion.div>
              ))}

              {/* Modern geometric lines cross-hair */}
              <div className="absolute inset-0 border border-dashed border-inherit m-3 opacity-20 pointer-events-none"></div>
              
              <div className="z-10 text-center flex flex-col items-center gap-6">
                
                {/* Modernistic digital code symbol */}
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-inherit flex items-center justify-center relative animate-spin duration-[20000ms]">
                  <div className="w-10 h-10 rounded-full border border-inherit flex items-center justify-center text-xs font-mono font-bold">
                    07
                  </div>
                </div>

                <div className="px-2">
                  <div className="font-mono text-[9px] uppercase tracking-[0.25em] opacity-65">
                    June 7 Invitation Spec
                  </div>
                  <h3 className="font-serif italic font-semibold text-2xl mt-1 tracking-wide">
                    {config.senderName}'s Greeting card
                  </h3>
                  <p className="text-[10px] font-mono mt-3 opacity-50 uppercase tracking-widest">
                    Click interface grid to initialize
                  </p>
                </div>
              </div>

              {/* Top and corner cross marks */}
              <div className="absolute top-2 left-2 font-mono text-[10px] opacity-40">+</div>
              <div className="absolute top-2 right-2 font-mono text-[10px] opacity-40">+</div>
              <div className="absolute bottom-2 left-2 font-mono text-[10px] opacity-40">+</div>
              <div className="absolute bottom-2 right-2 font-mono text-[10px] opacity-40">+</div>
            </motion.div>
          )}

          {/* STATE 2: THE CARD COVER (Modern poster art block) */}
          {cardState === "cover" && (
            <motion.div
              key="cover"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              whileHover={{ 
                scale: 1.02,
                y: -4,
                boxShadow: currentTheme === "brutalist" 
                  ? "12px 12px 0px 0px rgba(0,0,0,1)" 
                  : currentTheme === "acid"
                    ? "0 0 50px rgba(163,230,53,0.25)"
                    : currentTheme === "swiss"
                      ? "0 0 50px rgba(225,29,72,0.25)"
                      : currentTheme === "sunset"
                        ? "0 0 50px rgba(244,63,94,0.3)"
                        : "0 0 50px rgba(34,211,238,0.3)",
                transition: { duration: 0.3 }
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`w-full max-w-[370px] aspect-[1/1.3] flex flex-col justify-between items-center relative select-none ${style.cardCover}`}
              id="card-cover-container"
            >
              <div className="w-full flex justify-between items-start">
                <span className="text-[10px] font-mono tracking-widest opacity-60 uppercase">
                  SYSTEM: 07-06 // ACTIVE
                </span>
                <span className="text-[10px] font-mono opacity-60">
                  © 2026
                </span>
              </div>

              <div className="w-full text-left my-8">
                <span className="text-sm block font-mono uppercase tracking-widest text-[#f43f5e] mb-1 font-bold">
                  INVITATION INBOUND
                </span>
                <h2 className={`${style.coverTitle}`}>
                  You Are Invited, <br />
                  <span className="font-black tracking-tighter not-italic text-white">
                    {config.recipientName.toUpperCase()}
                  </span>
                </h2>
              </div>

              <div className="w-full flex flex-col gap-4 font-sans">
                <p className="text-[10px] font-mono italic opacity-50">
                  Secured by guest {config.senderName}
                </p>
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleFlipCardOpen}
                  className={`w-full py-3 text-xs font-bold uppercase tracking-widest transition-all ${style.primaryButton}`}
                  id="btn-cover-flip-open"
                >
                  Enter Art Space
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STATE 3: FULL SCREEN GRAPHIC PORTAL */}
          {cardState === "opened" && (
            <motion.div
              key="opened"
              variants={portalVariants}
              initial="hidden"
              animate="visible"
              className={`w-full relative ${style.cardInside} overflow-hidden pointer-events-auto shadow-2xl`}
              id="card-inside-portal"
            >
              {/* Dynamic kinetic abstract background shape controller */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {artShapes.map((s) => (
                  <motion.div
                    key={s.id}
                    onClick={(e) => handleShapePop(s.id, e)}
                    className={`absolute z-10 font-bold select-none cursor-pointer flex flex-col items-center justify-center pointer-events-auto ${s.color}`}
                    style={{
                      left: `${s.x}%`,
                      top: `20%`
                    }}
                    initial={{ y: "450px", rotate: 0 }}
                    animate={{ y: "-120px", rotate: 360 }}
                    transition={{
                      duration: s.speed,
                      delay: s.delay,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    whileHover={{ 
                      scale: s.scale * 1.4, 
                      rotate: [0, -15, 15, 0],
                      cursor: "crosshair",
                      filter: "drop-shadow(0 0 8px currentColor)",
                      transition: { duration: 0.25 }
                    }}
                  >
                    {/* Modernist wireframe shape rendering */}
                    {s.type === "circle" && <div className="w-8 h-8 rounded-full border-2 border-current"></div>}
                    {s.type === "square" && <div className="w-8 h-8 border-2 border-current rotate-45"></div>}
                    {s.type === "triangle" && (
                      <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[28px] border-b-current"></div>
                    )}
                    {s.type === "cross" && <span className="text-2xl tracking-normal font-sans font-thin">+</span>}
                    
                    <span className="text-[8px] font-mono tracking-widest uppercase mt-1 text-slate-100/90 drop-shadow-md">
                      {s.word}
                    </span>
                  </motion.div>
                ))}

                {/* Cyberpunk modern pop explosion indicator coordinates */}
                {explosions.map((ep) => (
                  <div
                    key={ep.id}
                    className="absolute z-20 pointer-events-none"
                    style={{ left: ep.x, top: ep.y }}
                  >
                    {Array.from({ length: 8 }).map((_, spIndex) => {
                      const ang = (spIndex * 360) / 8;
                      const rad = (ang * Math.PI) / 180;
                      return (
                        <motion.div
                           key={spIndex}
                           className="absolute w-1 h-3 bg-current"
                           style={{ color: ep.color }}
                           initial={{ x: 0, y: 0, opacity: 1, rotate: ang }}
                           animate={{
                             x: Math.cos(rad) * 45,
                             y: Math.sin(rad) * 45,
                             opacity: 0,
                             scaleY: 0
                           }}
                           transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      );
                    })}
                  </div>
                ))}

                {/* Modern Framer Motion Confetti Explosions */}
                <AnimatePresence>
                  {confetti.map((c) => (
                    <motion.div
                      key={c.id}
                      className="absolute pointer-events-none select-none z-30"
                      style={{
                        left: `${c.x}%`,
                        top: `${c.y}%`,
                        borderColor: c.color,
                        borderWidth: c.shape === "ring" ? (c.size < 8 ? 1.5 : 2.5) : 0,
                        borderRadius: c.shape === "circle" || c.shape === "ring" ? "50%" : "0%",
                        width: c.shape === "triangle" ? 0 : c.size,
                        height: c.shape === "triangle" ? 0 : c.size,
                        borderStyle: c.shape === "ring" ? "solid" : "none",
                        ...(c.shape === "triangle" ? {
                          borderLeft: `${c.size / 2}px solid transparent`,
                          borderRight: `${c.size / 2}px solid transparent`,
                          borderBottom: `${c.size}px solid ${c.color}`,
                          backgroundColor: "transparent",
                          borderRadius: "0%"
                        } : {
                          backgroundColor: c.shape !== "ring" ? c.color : "transparent"
                        }),
                        transformOrigin: "center"
                      }}
                      initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 0 }}
                      animate={{
                        x: c.destX,
                        y: [0, c.destY * 0.9, c.destY, c.destY + 160],
                        scale: [0, 1.4, 1, 0.6],
                        rotate: c.rotation,
                        opacity: [0, 1, 1, 0]
                      }}
                      transition={{
                        duration: c.duration,
                        ease: [0.15, 0.85, 0.45, 1],
                        delay: c.delay
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Main Inside Card Column Core Blocks with Staggered Elements */}
              <div className="relative z-10 flex flex-col gap-6 text-left">
                
                {/* Minimalist Top Metadata Row */}
                <motion.div variants={itemVariants} className="flex justify-between items-end border-b border-inherit pb-3">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest opacity-50 block">
                      Target Friend
                    </span>
                    <h3 className="text-xl font-bold tracking-tight">
                      To: <span className={style.accentTextColor}>{config.recipientName}</span>
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[9px] uppercase opacity-50 block">Origin sender</span>
                    <strong className="text-sm font-bold">{config.senderName}</strong>
                  </div>
                </motion.div>

                {/* SCROLL NOTE (Asymmetric Modern Quote Block) */}
                <motion.div variants={itemVariants} className={style.messagePaper}>
                  <div className="absolute top-2 right-2 text-rose-500/10 pointer-events-none">
                    <Quote size={40} />
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed tracking-wide font-medium">
                    {config.message}
                  </p>
                </motion.div>

                {/* INTERACTIVE HOW-TO FEEDBACK ZONE */}
                <motion.div 
                  variants={itemVariants} 
                  className="p-3 border border-dashed border-current/20 rounded-xl flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
                    <Sparkles size={15} className="animate-pulse" />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest block font-bold opacity-80">
                      Celebration Active Spec
                    </span>
                    <span className="text-[10px] opacity-60">
                      Tap moving drift shapes to pop soundwaves & collect points on the terminal!
                    </span>
                  </div>
                </motion.div>

                {/* Score bar */}
                <motion.div variants={itemVariants} className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest opacity-60 border-t border-inherit pt-3">
                  <span>Score: <strong className="text-rose-500 font-bold">{score} pts</strong></span>
                  <span>June 7 Countdown Spotlight</span>
                </motion.div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Avant-garde coordinate marks in footer */}
      <div className="text-[9px] font-mono opacity-50 mt-6 pt-4 border-t border-inherit flex flex-col sm:flex-row justify-between items-center gap-2 select-none pointer-events-none uppercase">
        <span>Coordinate frame: 45°N 76°W // NATHNAEL_PARTY_SHUTTLE</span>
        <span>Secured system channel June 7th 2026</span>
      </div>

    </motion.div>
  );
}
