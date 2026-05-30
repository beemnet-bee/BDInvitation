import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Calendar, Share2, Clipboard, MapPin, 
  Clock, Check, Heart, HelpCircle, CheckSquare
} from "lucide-react";
import { CardConfig, CardThemeType } from "./types";
import GreetingCardViewer from "./components/GreetingCardViewer";

// Pristine Common Invitation Message for everyone
const INVITATION_MESSAGE = `✦ NATHNAEL AYZOHIBEL // JUNE 7 BASH COORDINATES ✦

Date: Sunday, June 7th, 2026
Location: The Neon Lounge // Latitude 45°N 76°W
Target Frequency: High Resonance Loops

"You are cordially invited to celebrate the successful compilation of another milestone orbit. Plan for extreme throughput of delicious pastries, intensive karaoke, and retro chiptune synthesizers. 

Extinguish your firewalls and synchronize. See you at the coordinates."`;

export default function App() {
  const [theme, setTheme] = useState<CardThemeType>("swiss");
  const [hasRSVPed, setHasRSVPed] = useState<boolean>(() => {
    return localStorage.getItem("nathnael_bash_rsvp") === "true";
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [rsvpCount, setRsvpCount] = useState<number>(() => {
    // Generate a beautiful consistent number of confirmed friends
    const savedCount = localStorage.getItem("nathnael_bash_rsvp_count");
    if (savedCount) return parseInt(savedCount, 10);
    const initial = 14 + Math.floor(Math.random() * 8);
    localStorage.setItem("nathnael_bash_rsvp_count", initial.toString());
    return initial;
  });

  // Load theme from URL if present to make shared links preserve the aesthetics
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedTheme = params.get("style") as CardThemeType;
    if (sharedTheme && ["swiss", "acid", "brutalist", "sunset", "aurora"].includes(sharedTheme)) {
      setTheme(sharedTheme);
    }
  }, []);

  const handleRSVP = () => {
    if (!hasRSVPed) {
      setHasRSVPed(true);
      setRsvpCount(prev => prev + 1);
      localStorage.setItem("nathnael_bash_rsvp", "true");
      localStorage.setItem("nathnael_bash_rsvp_count", (rsvpCount + 1).toString());
    } else {
      setHasRSVPed(false);
      setRsvpCount(prev => prev - 1);
      localStorage.setItem("nathnael_bash_rsvp", "false");
      localStorage.setItem("nathnael_bash_rsvp_count", (rsvpCount - 1).toString());
    }
  };

  const handleCopyLink = () => {
    // Build direct link with selected visual style theme
    const shareUrl = `${window.location.origin}/?style=${theme}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const downloadICSFile = () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Nathnael June 7th Celebration//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:nathnael-celebration-bash-2026@june7",
      "DTSTAMP:20260529T164900Z",
      "DTSTART:20260607T190000",
      "DTEND:20260608T020000",
      "SUMMARY:Nathnael's June 7th Celebration! ✦",
      "DESCRIPTION:You are cordially invited to celebrate the successful compilation of another milestone orbit! Plan for extreme throughput of delicious pastries\\, intensive karaoke\\, and retro chiptune synthesizers.",
      "LOCATION:The Neon Lounge\\, Boba City Mall\\, Sector 4",
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "nathnael_june_7_celebration.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentConfig: CardConfig = {
    id: "nathnael-common-invitation",
    senderName: "Meba D. GOAT",
    recipientName: "Friends & Crew",
    birthdayDate: "June 7",
    theme,
    message: INVITATION_MESSAGE,
    acousticMode: true
  };

  // Modern abstract class color accents for outer page matching the chosen card style
  const bodyStyles = {
    swiss: "from-stone-950 via-slate-950 to-stone-900 border-rose-500/20 text-stone-100",
    acid: "from-stone-950 via-neutral-950 to-neutral-900 border-lime-400/20 text-neutral-100",
    brutalist: "from-stone-100 via-stone-50 to-stone-200 border-black text-stone-900",
    sunset: "from-[#0a0510] via-[#10031a] to-[#120024] border-rose-500/10 text-amber-50/90",
    aurora: "from-[#020512] via-slate-950 to-[#031518] border-emerald-500/10 text-indigo-100"
  }[theme];

  const dotGridPattern = {
    swiss: "bg-[radial-gradient(rgba(225,29,72,0.06)_1px,transparent_1px)]",
    acid: "bg-[radial-gradient(rgba(163,230,53,0.06)_1px,transparent_1px)]",
    brutalist: "bg-[radial-gradient(rgba(0,0,0,0.08)_1px,transparent_1px)]",
    sunset: "bg-[radial-gradient(rgba(244,63,94,0.05)_1px,transparent_1px)]",
    aurora: "bg-[radial-gradient(rgba(34,211,238,0.05)_1px,transparent_1px)]"
  }[theme];

  return (
    <div className={`min-h-screen relative flex flex-col antialiased transition-colors duration-700 select-none pb-12 overflow-x-hidden bg-gradient-to-b ${bodyStyles}`}>
      
      {/* Decorative vector status line */}
      <div className={`h-[3px] w-full transition-colors duration-700 ${
        theme === "swiss" ? "bg-rose-600" :
        theme === "acid" ? "bg-lime-400" :
        theme === "brutalist" ? "bg-black" :
        theme === "sunset" ? "bg-gradient-to-r from-amber-400 to-rose-500" :
        "bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500"
      }`} />

      {/* Cyber-abstract background grid */}
      <div className={`absolute inset-0 pointer-events-none ${dotGridPattern} [background-size:20px_20px]`} />

      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`border-b backdrop-blur-md sticky top-0 z-30 transition-colors duration-500 ${
          theme === "brutalist" ? "border-black bg-stone-100/90" : "border-stone-900 bg-stone-950/50"
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className={`w-8 h-8 rounded-none border-2 flex items-center justify-center transition-all ${
                theme === "brutalist" ? "border-black" :
                theme === "swiss" ? "border-rose-500" :
                theme === "acid" ? "border-lime-400" :
                theme === "sunset" ? "border-amber-400" : "border-cyan-400"
              }`}
            >
              <span className="text-xs font-mono font-bold">07</span>
            </motion.div>
            <div>
              <h1 className="text-base font-black tracking-widest uppercase flex items-center gap-2">
                JUNE 07 <span className={`text-[9px] border px-2 py-0.5 font-bold uppercase tracking-wider ${
                  theme === "brutalist" ? "border-black bg-black text-white" :
                  theme === "swiss" ? "border-rose-500/30 text-rose-400" :
                  theme === "acid" ? "border-lime-400/35 text-lime-400" :
                  theme === "sunset" ? "border-rose-500/30 text-rose-400" : "border-cyan-500/30 text-cyan-400"
                }`}>Invitation Terminal</span>
              </h1>
              <p className="text-[9px] font-mono opacity-60 tracking-wider">Common Interactive Portal • Nathnael's Milestone Celebration</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyLink}
              className={`flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase border transition-all ${
                theme === "brutalist" 
                  ? "bg-black text-white border-black hover:bg-stone-800" 
                  : "bg-stone-900/60 border-stone-800 hover:border-stone-600 text-stone-200"
              }`}
            >
              <Share2 size={11} className={theme === "acid" ? "text-lime-400" : "text-rose-500"} />
              {copiedLink ? "Link Copied" : "Copy Shared Route"}
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-10 items-center justify-center z-10">
        
        {/* HERO INTRO */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="text-center max-w-2xl flex flex-col gap-3"
        >
          <div className="flex items-center justify-center gap-1.5">
            <span className={`text-[10px] font-mono tracking-[0.3em] uppercase block px-3 py-1 border rounded-full ${
              theme === "brutalist" ? "bg-black text-white border-black" :
              theme === "acid" ? "bg-lime-400/10 text-lime-400 border-lime-400/20" :
              theme === "swiss" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
              theme === "sunset" ? "bg-amber-400/10 text-amber-400 border-amber-400/20" :
              "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
            }`}>
              SYSTEM STATUS // 100% ONLINE
            </span>
          </div>
          <h2 className={`text-3xl md:text-5xl font-black font-display uppercase tracking-tight ${
            theme === "brutalist" ? "text-black" : "text-white"
          }`}>
            The Ultimate Celebration
          </h2>
          <p className={`text-xs md:text-sm font-sans font-light leading-relaxed max-w-xl mx-auto ${
            theme === "brutalist" ? "text-stone-700" : "text-stone-300"
          }`}>
            We are gathering on Sunday, June 7th to honor Nathnael Ayzohibel. No signup or credentials needed. 
            Open the envelope below to interact with the soundboard, extinguish the flame, and tap moving vectors to rack up points!
          </p>
        </motion.div>

        {/* STYLE SWITCHER REGION */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className={`p-4 md:p-5 border transition-all flex flex-col items-center gap-4 w-full max-w-lg ${
            theme === "brutalist" ? "bg-stone-50 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]" : "bg-stone-900/30 border-stone-800"
          }`}
        >
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono uppercase tracking-[0.25em] opacity-50 mb-1.5 block">
              Toggle Poster Aesthetic Theme
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { id: "swiss", label: "Swiss Grid" },
                { id: "acid", label: "Acid Poison" },
                { id: "brutalist", label: "Raw Brutalist" },
                { id: "sunset", label: "Late Sunset" },
                { id: "aurora", label: "Cosmic Aurora" }
              ].map((t) => (
                <motion.button
                  whileHover={{ scale: 1.08, y: -2, transition: { type: "spring", stiffness: 400, damping: 10 } }}
                  whileTap={{ scale: 0.94 }}
                  key={t.id}
                  onClick={() => setTheme(t.id as CardThemeType)}
                  className={`px-3 py-1.5 font-mono uppercase text-[10px] tracking-wider border transition-all cursor-pointer ${
                    theme === t.id 
                      ? "bg-stone-100 text-stone-950 font-extrabold border-stone-100" 
                      : theme === "brutalist"
                        ? "bg-white border-stone-300 text-stone-600 hover:text-black hover:border-black"
                        : "bg-black/40 border-stone-850 text-stone-500 hover:text-stone-200"
                  }`}
                >
                  {t.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* STANDALONE IMMERSIVE COMMON CARD VIEWER */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          className="w-full relative"
        >
          <GreetingCardViewer config={currentConfig} />
        </motion.div>

        {/* LOGISTICS & RSVP PANEL */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch mt-6">
          
          {/* VENUE SPECS */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ 
              y: -6, 
              boxShadow: theme === "brutalist" 
                ? "10px 10px 0px 0px rgba(0,0,0,1)" 
                : theme === "acid"
                  ? "0 15px 30px rgba(163,230,53,0.1)"
                  : theme === "swiss"
                    ? "0 15px 30px rgba(225,29,72,0.1)"
                    : theme === "sunset"
                      ? "0 15px 30px rgba(244,63,94,0.15)"
                      : "0 15px 30px rgba(34,211,238,0.15)",
              transition: { type: "spring", stiffness: 300, damping: 20 }
            }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            className={`md:col-span-7 p-6 border flex flex-col justify-between gap-6 transition-colors duration-500 ${
              theme === "brutalist" ? "bg-white border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] text-black" : "bg-stone-900/40 border-stone-900"
            }`}
          >
            <div>
              <span className="text-[9px] font-mono uppercase tracking-widest opacity-50 block mb-2">Coordination specs // location</span>
              <h3 className="text-lg font-bold uppercase tracking-wider mb-2">The Golden Lounge</h3>
              <p className="text-xs leading-relaxed font-sans font-light opacity-80 mb-4">
                Nathnael's celebration operations are located at the Neon Arcade Lounge (and Karaoke Center). 
                Please keep coordinates stabilized. standard beverages (boba, fruit cocktails) are provided.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-t border-current/15 pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className={theme === "acid" ? "text-lime-400" : "text-rose-500"} />
                  <span className="text-xs font-mono font-medium">Boba City Mall, Sector 4</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className={theme === "acid" ? "text-lime-400" : "text-rose-500"} />
                  <span className="text-xs font-mono font-medium">19:00 Hours Forward</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={downloadICSFile}
                className={`flex items-center justify-center gap-2 px-3 py-1.5 font-mono text-[10px] font-bold tracking-wider uppercase border transition-all cursor-pointer ${
                  theme === "brutalist"
                    ? "bg-black text-white border-black hover:bg-stone-900"
                    : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-stone-200"
                }`}
                title="Download standard iCalendar reference file for Google, Apple, or Outlook"
                id="btn-sync-calendar"
              >
                <Calendar size={12} className={theme === "acid" ? "text-lime-400" : "text-rose-500"} />
                Sync to Calendar
              </motion.button>
            </div>
          </motion.div>

          {/* ACTIVE RSVP BOX */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ 
              y: -6, 
              boxShadow: theme === "brutalist" 
                ? "10px 10px 0px 0px rgba(0,0,0,1)" 
                : theme === "acid"
                  ? "0 15px 30px rgba(163,230,53,0.1)"
                  : theme === "swiss"
                    ? "0 15px 30px rgba(225,29,72,0.1)"
                    : theme === "sunset"
                      ? "0 15px 30px rgba(244,63,94,0.15)"
                      : "0 15px 30px rgba(34,211,238,0.15)",
              transition: { type: "spring", stiffness: 300, damping: 20 }
            }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            className={`md:col-span-5 p-6 border flex flex-col justify-between items-center text-center gap-6 transition-colors duration-500 ${
              theme === "brutalist" ? "bg-white border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] text-black" : "bg-stone-950/40 border-stone-900"
            }`}
          >
            <div>
              <span className="text-[9px] font-mono uppercase tracking-widest opacity-50 block mb-1">Confirm Presence</span>
              <h3 className="text-lg font-bold uppercase tracking-wide">RSVP Registry</h3>
              <p className="text-xs leading-relaxed font-sans font-light opacity-85 mt-2">
                Are you joining Nathnael on Sunday, June 7th? Lock in your coordinates.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 w-full">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRSVP}
                className={`w-full py-3 px-6 text-xs text-center font-mono font-black uppercase tracking-widest transition-all cursor-pointer ${
                  hasRSVPed
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : theme === "brutalist"
                      ? "bg-black text-white hover:bg-stone-800"
                      : theme === "acid"
                        ? "bg-lime-400 text-black hover:bg-lime-300"
                        : theme === "swiss"
                          ? "bg-rose-600 text-white hover:bg-rose-500"
                          : "bg-stone-100 text-stone-950 hover:bg-white"
                }`}
              >
                {hasRSVPed ? "✓ Attending Confirmed" : "✦ RSVP Attendance ✦"}
              </motion.button>

              <div className="flex items-center gap-1.5 text-[10px] font-mono opacity-60">
                <Heart size={10} className="text-rose-500 fill-rose-500" />
                <span>{rsvpCount} friends confirmed so far</span>
              </div>
            </div>
          </motion.div>

        </div>

      </main>

      <footer className="mt-16 text-center text-[10px] font-mono tracking-[0.25em] uppercase opacity-40 select-none pointer-events-none">
        <p>© 2026 NATHNAEL MEMBERS_ONLY BASH // SECURITY COORDINATE SECURED</p>
      </footer>

    </div>
  );
}
