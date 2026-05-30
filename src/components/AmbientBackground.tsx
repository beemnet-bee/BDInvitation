import React, { useMemo } from "react";
import { motion } from "motion/react";
import { CardThemeType } from "../types";

interface AmbientBackgroundProps {
  theme: CardThemeType;
}

interface AnimatedNode {
  id: number;
  type: "orb" | "cross" | "ring" | "star";
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  size: number;
  duration: number;
  delay: number;
  rangeX: number;
  rangeY: number;
}

export default function AmbientBackground({ theme }: AmbientBackgroundProps) {
  // Generate stable nodes on mount or when theme changes (useMemo for stability)
  const nodes = useMemo(() => {
    const total = 18;
    const items: AnimatedNode[] = [];
    const types: ("orb" | "cross" | "ring" | "star")[] = ["orb", "cross", "ring", "star"];

    for (let i = 0; i < total; i++) {
      items.push({
        id: i,
        type: types[i % types.length],
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 15 + Math.random() * 45,
        duration: 25 + Math.random() * 25, // slow, ambient
        delay: Math.random() * -30, // start immediately with stagger
        rangeX: 30 + Math.random() * 60,
        rangeY: 30 + Math.random() * 60,
      });
    }
    return items;
  }, []);

  // Theme aesthetic settings matching chosen design
  const themeAccentColors = {
    swiss: "text-rose-500/10 shadow-rose-500/5",
    acid: "text-lime-400/12 shadow-lime-400/10",
    brutalist: "text-stone-950/5 shadow-none",
    sunset: "text-amber-500/10 shadow-rose-500/5",
    aurora: "text-cyan-400/10 shadow-cyan-400/10"
  };

  const orbThemes = {
    swiss: "bg-rose-500/5 blur-2xl",
    acid: "bg-lime-400/4 blur-3xl",
    brutalist: "bg-stone-300/10 blur-xl",
    sunset: "bg-rose-500/6 blur-3xl",
    aurora: "bg-emerald-500/5 blur-2xl"
  };

  const colorClass = themeAccentColors[theme] || themeAccentColors.swiss;
  const orbClass = orbThemes[theme] || orbThemes.swiss;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Dynamic blurred core background glow orbs */}
      <motion.div
        animate={{
          x: ["-10%", "10%", "-5%"],
          y: ["-5%", "15%", "-10%"],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full ${orbClass}`}
      />
      
      <motion.div
        animate={{
          x: ["10%", "-15%", "5%"],
          y: ["15%", "-5%", "10%"],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute bottom-1/4 right-1/4 w-[45vw] h-[45vw] rounded-full ${orbClass}`}
      />

      {/* Floating vector wireframes & elements */}
      {nodes.map((node) => {
        const xPercent = `${node.x}%`;
        const yPercent = `${node.y}%`;

        // Create fluid smooth floating loop keyframes
        const animateConfig = {
          x: [0, node.rangeX, -node.rangeX, 0],
          y: [0, node.rangeY, -node.rangeY, 0],
          rotate: [0, 180, 360],
          opacity: [0.15, 0.45, 0.15],
        };

        return (
          <motion.div
            key={node.id}
            initial={{ x: 0, y: 0, opacity: 0.15 }}
            animate={animateConfig}
            transition={{
              duration: node.duration,
              delay: node.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              left: xPercent,
              top: yPercent,
              width: node.size,
              height: node.size,
            }}
            className={`flex items-center justify-center transition-colors duration-500 ${colorClass}`}
          >
            {node.type === "orb" && (
              <div 
                className="w-full h-full rounded-full border border-current opacity-20"
                style={{ filter: theme === "brutalist" ? "none" : "drop-shadow(0 0 1px currentColor)" }}
              />
            )}

            {node.type === "cross" && (
              <svg className="w-full h-full stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="1.2">
                <line x1="12" y1="4" x2="12" y2="20" />
                <line x1="4" y1="12" x2="20" y2="12" />
              </svg>
            )}

            {node.type === "ring" && (
              <svg className="w-full h-full stroke-current opacity-30" viewBox="0 0 24 24" fill="none" strokeWidth="1">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" strokeDasharray="2 2" />
              </svg>
            )}

            {node.type === "star" && (
              <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                <path d="M12,2L14.7,8.6L21.8,9.2L16.4,13.9L18.1,20.9L12,17.2L5.9,20.9L7.6,13.9L2.2,9.2L9.3,8.6L12,2Z" className="opacity-20" />
              </svg>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
