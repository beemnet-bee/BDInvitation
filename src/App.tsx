import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Calendar, Share2, MapPin, 
  Clock, Check, Heart, User, Music, MessageSquare, 
  Info, Leaf, Gift, Smile, ArrowRight, Volume2, VolumeX, Mail
} from "lucide-react";
import { CardThemeType } from "./types";
import AmbientBackground from "./components/AmbientBackground";
import { 
  playPopSound, playCozySpark, playCelebrationBurst, 
  playInvitationTheme, startAmbientBackground, stopAmbientBackground 
} from "./utils/audio";

// Elegant preset RSVP records to populate the initial Meadow Guestboard
const INITIAL_GUESTS = [
  { name: "Meba D. GOAT 👑", attending: true, song: "Retro Synth Odyssey", note: "Welcome family! Prepare your voice for extreme picnic karaoke loops ! 🎤✨", date: "May 30, 2026" }
];

export default function App() {
  const [theme, setTheme] = useState<CardThemeType>("swiss");
  const [isEnvelopeOpened, setIsEnvelopeOpened] = useState<boolean>(() => {
    return localStorage.getItem("picnic_envelope_opened") === "true";
  });
  const [activeTab, setActiveTab] = useState<"home" | "details" | "vibes" | "gifts" | "rsvp">("home");
  const [copiedLink, setCopiedLink] = useState(false);
  const [rsvpList, setRsvpList] = useState<any[]>(() => {
    const saved = localStorage.getItem("picnic_rsvp_list");
    return saved ? JSON.parse(saved) : INITIAL_GUESTS;
  });

  const [formName, setFormName] = useState("");
  const [formAttending, setFormAttending] = useState<boolean>(true);
  const [formSong, setFormSong] = useState("");
  const [formNote, setFormNote] = useState("");

  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [lastSubmittedGuest, setLastSubmittedGuest] = useState<any>(null);

  // Fetch alive RSVPs on load
  useEffect(() => {
    fetch("/api/rsvp")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRsvpList(data);
          localStorage.setItem("picnic_rsvp_list", JSON.stringify(data));
        }
      })
      .catch(err => {
        console.error("Backend RSVP load error, fallback to local storage:", err);
      });
  }, []);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  // Calculate countdown to June 7, 2026 15:00:00 (3 PM)
  useEffect(() => {
    const targetDate = new Date("June 7, 2026 15:00:00").getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft(prev => ({ ...prev, isPast: true }));
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s, isPast: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync background music loops are connected when envelope is opened and music is toggled-on
  useEffect(() => {
    if (isEnvelopeOpened && isPlayingMusic) {
      startAmbientBackground(theme);
    } else {
      stopAmbientBackground();
    }
    return () => stopAmbientBackground();
  }, [isEnvelopeOpened, isPlayingMusic, theme]);

  // Load configuration style parameters from URL search
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedTheme = params.get("style") as CardThemeType;
    if (sharedTheme && ["swiss", "acid", "brutalist", "sunset", "aurora"].includes(sharedTheme)) {
      setTheme(sharedTheme);
    }
  }, []);

  const handleOpenEnvelope = () => {
    setIsEnvelopeOpened(true);
    localStorage.setItem("picnic_envelope_opened", "true");
    setIsPlayingMusic(true);
    playCozySpark();
    setTimeout(() => {
      playInvitationTheme();
      playCelebrationBurst();
    }, 450);
  };

  const handleResetEnvelope = () => {
    setIsEnvelopeOpened(false);
    localStorage.removeItem("picnic_envelope_opened");
    setIsPlayingMusic(false);
    stopAmbientBackground();
  };

  const toggleMusic = () => {
    if (!isPlayingMusic) {
      setIsPlayingMusic(true);
      playInvitationTheme();
    } else {
      setIsPlayingMusic(false);
      stopAmbientBackground();
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/?style=${theme}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    playCozySpark();
    setTimeout(() => setCopiedLink(false), 2400);
  };

  // Trigger synthesized audio tones for the "Retro backyard Synth" sandbox in vibes page
  const playSynthesizedTone = (type: "bird" | "spark" | "breeze" | "bubble") => {
    if (type === "bird") {
      // Gentle sweet chirping
      playPopSound();
    } else if (type === "spark") {
      playCozySpark();
    } else if (type === "breeze") {
      playInvitationTheme();
    } else {
      playCelebrationBurst();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload = {
      name: formName.trim(),
      attending: formAttending,
      song: formSong.trim() || "Surprise Nati Vibes!",
      note: formNote.trim() || "Sending best wishes on your 20th! 🤍"
    };

    // 1. Submit to our Server Database (updates for anyone visiting the website!)
    fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setRsvpList(resData.list);
          localStorage.setItem("picnic_rsvp_list", JSON.stringify(resData.list));
        } else {
          // If server fails, fallback to local memory
          const fallbackEntry = { ...payload, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) };
          setRsvpList([fallbackEntry, ...rsvpList]);
        }
      })
      .catch(err => {
        console.error("Failed to post RSVP to server API:", err);
        // Fallback locally
        const fallbackEntry = { ...payload, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) };
        setRsvpList([fallbackEntry, ...rsvpList]);
      });

    // Clear form fields
    setFormName("");
    setFormSong("");
    setFormNote("");

    // Save submission facts
    setLastSubmittedGuest(payload);
    setSubmissionSuccess(true);

    // Fancy celebration visual sound cues
    playCelebrationBurst();
  };

  const downloadICSFile = () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Nati 20th Birthday Picnic Celebration//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:nati-celebration-picnic-2026@june7",
      "DTSTAMP:20260530T000000Z",
      "DTSTART:20260607T150000",
      "DTEND:20260607T200000",
      "SUMMARY:Nati's 20th Birthday Picnic Celebration! 🌿🤍",
      "DESCRIPTION:Prepare yourself for Nati's spectacular 20th birthday picnic party, where we'll soak up the sun and enjoy great company. Bring game controllers, cute coordinates, and retro chiptune vibes.",
      "LOCATION:To be determined\\, Addis Ababa",
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "nati_birthday_picnic_celebration.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playCozySpark();
  };

  // Dynamic Theme Aesthetics configs matching the beautiful color scheme requested
  const themeStyles = {
    swiss: { // Cream Periwinkle Breeze (Default matching image closely)
      bodyBg: "bg-[#fbf9f3]",
      accent: "text-[#7c95e4]",
      accentBg: "bg-[#7c95e4]/10",
      accentBorder: "border-[#7c95e4]/20",
      accentBadge: "bg-[#7c95e4] text-[#fbf9f3]",
      secondaryAccent: "text-[#90a98c]",
      secondaryAccentBg: "bg-[#90a98c]/12",
      headingText: "text-[#3a4245]",
      bodyText: "text-[#5k6368]",
      cardShadow: "shadow-[0_12px_45px_rgba(124,149,228,0.1)]",
      buttonPrimary: "bg-[#7c95e4] hover:bg-[#687ecb] text-white shadow-[#7c95e4]/30",
    },
    acid: { // Sage Garden Meadow (Deep natural fresh meadow look)
      bodyBg: "bg-[#fcfbf7]",
      accent: "text-[#90a98c]",
      accentBg: "bg-[#90a98c]/12",
      accentBorder: "border-[#90a98c]/25",
      accentBadge: "bg-[#90a98c] text-white",
      secondaryAccent: "text-[#7c95e4]",
      secondaryAccentBg: "bg-[#7c95e4]/12",
      headingText: "text-[#2a3530]",
      bodyText: "text-[#5e6662]",
      cardShadow: "shadow-[0_12px_45px_rgba(144,169,140,0.12)]",
      buttonPrimary: "bg-[#90a98c] hover:bg-[#7e977a] text-white shadow-[#90a98c]/30",
    },
    sunset: { // Blossom Rose Petal (Warm romantic bouquet style)
      bodyBg: "bg-[#fcf9f5]",
      accent: "text-[#e6a5b8]",
      accentBg: "bg-[#e6a5b8]/15",
      accentBorder: "border-[#e6a5b8]/30",
      accentBadge: "bg-[#e6a5b8] text-white",
      secondaryAccent: "text-[#90a98c]",
      secondaryAccentBg: "bg-[#90a98c]/12",
      headingText: "text-[#423a3d]",
      bodyText: "text-[#665e61]",
      cardShadow: "shadow-[0_12px_45px_rgba(230,165,184,0.15)]",
      buttonPrimary: "bg-[#e6a5b8] hover:bg-[#da93a7] text-white shadow-[#e6a5b8]/30",
    },
    aurora: { // Twilight Starry Campfire (Magical cozy dark background setting)
      bodyBg: "bg-[#1f242d]",
      accent: "text-[#9eb1f0]",
      accentBg: "bg-[#9eb1f0]/15",
      accentBorder: "border-[#9eb1f0]/20",
      accentBadge: "bg-[#9eb1f0] text-stone-950",
      secondaryAccent: "text-[#a5c3a1]",
      secondaryAccentBg: "bg-[#a5c3a1]/15",
      headingText: "text-stone-100",
      bodyText: "text-stone-300",
      cardShadow: "shadow-[0_12px_45px_rgba(0,0,0,0.3)]",
      buttonPrimary: "bg-[#9eb1f0] hover:bg-[#8da3e5] text-stone-950 shadow-[#9eb1f0]/25",
    },
    brutalist: { // Stark Minimalist Paper
      bodyBg: "bg-white",
      accent: "text-stone-950",
      accentBg: "bg-stone-100",
      accentBorder: "border-stone-900",
      accentBadge: "bg-stone-950 text-white",
      secondaryAccent: "text-stone-600",
      secondaryAccentBg: "bg-stone-100",
      headingText: "text-stone-950",
      bodyText: "text-stone-750",
      cardShadow: "shadow-[6px_6px_0px_rgba(0,0,0,1)]",
      buttonPrimary: "bg-stone-950 hover:bg-stone-800 text-white shadow-none border border-stone-950",
    }
  }[theme];

  const totalAttending = rsvpList.filter(r => r.attending).length;

  return (
    <div className={`min-h-screen relative flex flex-col antialiased transition-colors duration-700 select-none pb-12 overflow-x-hidden ${themeStyles.bodyBg} ${themeStyles.bodyText}`}>
      
      {/* Decorative vector top boundary line */}
      <div className={`h-[4px] w-full transition-colors duration-700 ${
        theme === "swiss" ? "bg-[#7c95e4]" :
        theme === "acid" ? "bg-[#90a98c]" :
        theme === "sunset" ? "bg-[#e6a5b8]" :
        theme === "aurora" ? "bg-gradient-to-r from-[#9eb1f0] to-[#e6a5b8]" : "bg-stone-950"
      }`} />

      {/* Cyber-abstract background dots */}
      <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none opacity-[0.25] bg-[radial-gradient(rgba(124,149,228,0.15)_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Dynamic Ambient Background Elements */}
      <AmbientBackground theme={theme} />

      {/* RUSTIC FLOWER/LEAF FRAME ELEMENTS IN THE CORNERS DEPICTING THE INVITE POSTER */}
      <div className="absolute top-0 right-0 w-[180px] h-[180px] sm:w-[280px] sm:h-[280px] pointer-events-none opacity-40 md:opacity-55 z-0 select-none">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="85" cy="15" r="14" fill={theme === "brutalist" ? "#000000" : "#e6a5b8"} opacity="0.45" />
          <path d="M55,0 C68,18 78,12 100,22 M72,0 C77,14 86,6 100,10" stroke={theme === "acid" ? "#90a98c" : "currentColor"} strokeWidth="1.6" fill="none" className="text-[#90a98c] opacity-80" />
          <circle cx="94" cy="38" r="4.5" fill="#7c95e4" opacity="0.6" />
          <circle cx="68" cy="14" r="3.5" fill="#7c95e4" opacity="0.4" />
          <path d="M90 5 C85 8, 80 12, 75 22" stroke="#e6a5b8" strokeWidth="1.2" fill="none" />
        </svg>
      </div>

      <div className="absolute bottom-0 left-0 w-[180px] h-[180px] sm:w-[280px] sm:h-[280px] pointer-events-none opacity-40 md:opacity-55 z-0 select-none">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M0,85 C18,80 14,88 38,100 M0,66 C14,75 5,82 24,100" stroke={theme === "acid" ? "#90a98c" : "currentColor"} strokeWidth="1.6" fill="none" className="text-[#90a98c] opacity-80" />
          <rect x="-10" y="80" width="35" height="35" fill="#7c95e4" opacity="0.22" transform="rotate(12)" />
          <circle cx="16" cy="68" r="5" fill="#e6a5b8" opacity="0.5" />
          <circle cx="38" cy="85" r="3" fill="#90a98c" opacity="0.6" />
        </svg>
      </div>

      <AnimatePresence mode="wait">
        {!isEnvelopeOpened ? (
          /* --- STATE 1: ELEGANT ENVELOPE ENTRANCE --- */
          <motion.div 
            key="envelope-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, y: -40 }}
            transition={{ type: "spring", stiffness: 90, damping: 15 }}
            className="flex-1 flex flex-col items-center justify-center min-h-[92vh] px-4 py-8 z-10"
            id="picnic-sealed-envelope"
          >
            <div className="max-w-md w-full flex flex-col items-center text-center gap-6">
              <span className={`text-[11px] font-mono tracking-[0.3em] font-medium uppercase px-3.5 py-1 rounded-full ${themeStyles.accentBg} ${themeStyles.accent}`}>
                ✧ Secret Coordinate Invite ✧
              </span>

              {/* Extraordinary Interactive 3D/Tactile Slide Envelope */}
              <motion.div
                whileHover="hover"
                initial="idle"
                animate="idle"
                className="w-full aspect-[4/3] relative rounded-[32px] overflow-hidden p-8 flex flex-col justify-between cursor-pointer focus:outline-none select-none"
                onClick={handleOpenEnvelope}
                style={{
                  perspective: 1000
                }}
              >
                {/* Envelope Base and Back Plate */}
                <div className={`absolute inset-0 rounded-[32px] transition-colors duration-500 border ${
                  theme === "brutalist" 
                    ? "bg-white border-black text-black" 
                    : "bg-[#f5ebd6] border-[#decba4]"
                } shadow-sm -z-20`} />

                {/* Tactical Peeking Invite Letter that glides UP on hover */}
                <motion.div
                  variants={{
                    hover: { y: -42, rotate: -1.5, scale: 1.03 },
                    idle: { y: 0, rotate: 0, scale: 1 }
                  }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  className="absolute inset-x-6 top-10 bottom-6 bg-white rounded-2xl border border-stone-200/90 p-5 flex flex-col justify-between -z-10 shadow-[0_8px_16px_rgba(0,0,0,0.03)] text-left"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-mono uppercase tracking-widest text-stone-400">Meadow Registry • Class 2026</span>
                    <Sparkles size={11} className={`${themeStyles.accent} animate-pulse`} />
                  </div>
                  
                  <div className="my-auto py-1">
                    <div className="font-cursive text-sm text-[#e6a5b8] mb-0.5">Let's Celebrate</div>
                    <h4 className="font-serif font-black text-[#3a4245] text-lg leading-none tracking-tight">NATI IS TURNING 20</h4>
                    <p className="text-[9px] font-mono text-stone-450 mt-1 uppercase tracking-wider">🌿 June 7, Addis Ababa 🌿</p>
                  </div>

                  <div className="border-t border-dashed border-stone-150 pt-2 flex justify-between items-center text-[9px] text-stone-400 font-mono uppercase tracking-wider">
                    <span>Unlock Portal</span>
                    <span className="text-[#7c95e4] animate-bounce">▲</span>
                  </div>
                </motion.div>

                {/* Envelope Front Left & Right pocket fold mockups */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-[#fdfaf5] border-t border-stone-200/50 rounded-b-[32px] -z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.01)] [clip-path:polygon(0_100%,0_0,50%_45%,100%_0%,100%_100%)]" />

                {/* Triangular top fold flap cutout */}
                <motion.div 
                  variants={{
                    hover: { rotateX: 30, y: -5, originY: 0 },
                    idle: { rotateX: 0, y: 0, originY: 0 }
                  }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-x-0 top-0 h-1/2 border-b border-stone-200/40 bg-[#faf6ee] rounded-t-[32px] -z-10 shadow-[0_4px_8px_rgba(0,0,0,0.02)] [clip-path:polygon(0_0,50%_75%,100%_0)]" 
                />

                {/* Especially For Tag on Front Cover */}
                <div className="text-center mt-[12%] z-20 pointer-events-none select-none">
                  <p className="font-cursive text-lg text-amber-900/40">Open Invitation</p>
                  <h2 className="font-serif text-2xl font-black text-stone-850 tracking-tight leading-none mt-1">Friends & Crew</h2>
                  <div className="w-10 h-[1.5px] bg-[#7c95e4]/30 mx-auto mt-2.5" />
                </div>

                {/* Wax Stamp Seal Trigger */}
                <div className="flex justify-center items-center z-20">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="w-14 h-14 rounded-full bg-[#faf6ee] border-2 border-dashed border-[#90a98c] flex items-center justify-center text-rose-400 shadow-[0_4px_12px_rgba(144,169,140,0.12)] group-hover:scale-105 transition-transform"
                  >
                    <Leaf size={22} className="text-[#90a98c] group-hover:rotate-12 transition-transform" />
                  </motion.div>
                </div>

                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-900/50 mt-1 z-20">
                  Click to Break Seal & Open
                </p>
              </motion.div>

              <div className="flex flex-col gap-2 mt-4 text-center">
                <h3 className={`text-2xl font-serif text-[#3a4245] ${themeStyles.headingText}`}>Nati's 20th Birthday Picnic</h3>
                <p className="text-xs text-stone-500 max-w-sm">
                  Broken seals will unlock coordinates, interactive vibes menu list, and picnic guestboards. Created with care by Meba D. GOAT.
                </p>
              </div>

              {/* Theme Selector right on envelope landing page */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {[
                  { id: "swiss", label: "🌸 Periwinkle" },
                  { id: "acid", label: "🌿 SageMeadow" },
                  { id: "sunset", label: "🤍 PastelRose" },
                  { id: "aurora", label: "✨ Twilight Star" },
                  { id: "brutalist", label: "🔳 Paper" }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as CardThemeType)}
                    className={`text-[10px] uppercase font-mono tracking-wider px-2.5 py-1 border rounded-full transition-all cursor-pointer ${
                      theme === t.id 
                        ? `${themeStyles.accentBadge} font-bold border-transparent` 
                        : "bg-white/60 border-stone-200 text-stone-600 hover:bg-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* --- STATE 2: FULLY UNLOCKED INTERACTIVE PORTAL --- */
          <motion.div 
            key="portal-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-grow flex flex-col z-10"
            id="picnic-dashboard-portal"
          >
            {/* STICKY ACCENT HEADERS */}
            <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 border-b border-stone-200/50 py-4 transition-colors duration-500">
              <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ rotate: [0, -12, 12, 0] }}
                    className="w-10 h-10 rounded-full bg-[#fbf9f3] border border-[#7c95e4]/30 shadow-sm flex items-center justify-center cursor-pointer"
                    onClick={handleResetEnvelope}
                    title="Return to envelope seal page"
                  >
                    <Mail size={16} className="text-[#7c95e4]" />
                  </motion.div>
                  <div>
                    <h1 className={`text-lg font-serif tracking-tight font-black flex items-center gap-1.5 ${themeStyles.headingText}`}>
                      🌿 Nati's Picnic Space <span className="text-xs font-cursive text-[#7c95e4]">20th Celebration</span>
                    </h1>
                    <p className="text-[9px] font-mono tracking-wider uppercase opacity-60">
                      Coordinate terminal • Host: Meba D. GOAT
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Acoustic Theme play controller with real-time CSS equalizer */}
                  <div className="flex items-center gap-1.5 p-1 border border-stone-200/50 rounded-full bg-white/95 shadow-sm shrink-0">
                    {isPlayingMusic && (
                      <div className="flex gap-0.5 items-end px-2.5 h-3">
                        {[0.6, 0.4, 0.9, 0.5, 0.7, 0.3, 0.8].map((speed, key) => (
                          <motion.span
                            key={key}
                            animate={{
                              height: ["3px", "13px", "3px"]
                            }}
                            transition={{
                              duration: speed + 0.3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="w-0.5 bg-[#e6a5b8]"
                            style={{ borderRadius: "1px" }}
                          />
                        ))}
                      </div>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={toggleMusic}
                      className="py-1 px-3 rounded-full transition-all flex items-center gap-1.5 text-stone-600 font-mono text-[9px] uppercase tracking-widest bg-white border border-stone-150/80 hover:bg-stone-50/50 cursor-pointer"
                      title="Toggle synthesized garden melodies"
                    >
                      {isPlayingMusic ? (
                        <>
                          <Volume2 size={11} className="text-[#e6a5b8]" />
                          <span className="hidden sm:inline">Active</span>
                        </>
                      ) : (
                        <>
                          <VolumeX size={11} className="text-stone-400" />
                          <span className="hidden sm:inline">Mute</span>
                        </>
                      )}
                    </motion.button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[9px] font-bold tracking-widest uppercase bg-white border border-stone-200 hover:border-[#7c95e4]/50 shadow-sm transition-all text-stone-650 cursor-pointer"
                  >
                    <Share2 size={11} className="text-[#7c95e4]" />
                    {copiedLink ? "Copied!" : "Share Link"}
                  </motion.button>
                </div>
              </div>
            </header>

            <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col gap-8 justify-start">
              
              {/* BRANDING HERO */}
              <div className="text-center py-4 flex flex-col gap-3">
                <p className="font-cursive text-2xl text-[#7c95e4] italic">You are invited to</p>
                <h2 className="text-4xl sm:text-6xl font-black font-serif leading-none tracking-tight text-[#3a4245]">
                  NATI,S Birthday <span className="text-[#90a98c] font-cursive italic font-light font-sans text-3xl sm:text-5xl block sm:inline">picnic</span>
                </h2>
                
                <div className="flex justify-center mt-2.5">
                  <div className={`border-2 border-stone-850 px-8 py-2.5 rounded-full font-serif text-base sm:text-lg font-bold bg-white tracking-widest ${themeStyles.cardShadow}`}>
                    7 JUNE / 2026
                  </div>
                </div>
              </div>

              {/* NAVIGATION TABS ENGINE */}
              <div className="flex justify-center overflow-x-auto pb-2 scrollbar-none" id="picnic-navigation-bar">
                <nav className="flex gap-2 p-1.5 bg-white/60 backdrop-blur-sm border border-stone-200/50 rounded-full shadow-sm max-w-full">
                  {[
                    { id: "home", label: "Home 🌿" },
                    { id: "details", label: "Details 📍" },
                    { id: "vibes", label: "Vibes ✨" },
                    { id: "gifts", label: "Gifts 🤍" },
                    { id: "rsvp", label: "RSVP 💌" }
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          playCozySpark();
                        }}
                        className={`relative px-4 sm:px-6 py-2 rounded-full font-sans text-xs sm:text-sm font-medium whitespace-nowrap transition-colors duration-350 cursor-pointer focus:outline-none ${
                          isActive 
                            ? "text-white font-black" 
                            : "text-stone-600 hover:text-stone-850"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="slidingTabIndicator"
                            className={`absolute inset-0 -z-10 rounded-full shadow-sm ${
                              theme === "swiss" ? "bg-[#7c95e4]" :
                              theme === "acid" ? "bg-[#90a98c]" :
                              theme === "sunset" ? "bg-[#e6a5b8]" :
                              theme === "aurora" ? "bg-[#9eb1f0]" : "bg-stone-950"
                            }`}
                            transition={{ type: "spring", stiffness: 350, damping: 28 }}
                          />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* ACTIVE PAGE SWITCHER CONTAINER */}
              <div className="relative" id="picnic-tab-panel">
                <AnimatePresence mode="wait">
                  {/* --- TAB 1: HOME PANEL --- */}
                  {activeTab === "home" && (
                    <motion.div
                      key="home-panel"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className={`glass-card rounded-[32px] border bg-white/80 p-6 sm:p-10 text-center flex flex-col gap-6 ${themeStyles.cardShadow}`}
                    >
                      <div className="text-[#90a98c] mx-auto opacity-70">
                        <Leaf size={32} className="animate-bounce" />
                      </div>
                      <p className="font-sans font-light leading-relaxed text-sm sm:text-base max-w-xl mx-auto text-stone-600">
                        Prepare yourself for Nati's spectacular 20th birthday picnic party, where we'll soak up the sun and enjoy great company. No credentials or login needed. Walk right into the meadow!
                      </p>

                      <div className="flex justify-center mt-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setActiveTab("rsvp");
                            playCozySpark();
                          }}
                          className={`px-8 py-3.5 rounded-full font-serif font-bold text-sm tracking-wide transition-all cursor-pointer ${themeStyles.buttonPrimary}`}
                        >
                          RSVP Here 💌
                        </motion.button>
                      </div>

                      {/* STATELY COUNTDOWN TIMER CARDS */}
                      <div className="mt-8">
                        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-stone-400 mb-4">
                          Countdown to Meadow Rendezvous
                        </p>
                        
                        <div className="flex justify-center gap-2 sm:gap-4 max-w-md mx-auto">
                          {[
                            { value: timeLeft.days, label: "Days" },
                            { value: timeLeft.hours, label: "Hrs" },
                            { value: timeLeft.minutes, label: "Mins" },
                            { value: timeLeft.seconds, label: "Secs" }
                          ].map((b, i) => (
                            <div key={i} className="flex-1 bg-white border border-stone-200/60 p-3 sm:p-4 rounded-2xl shadow-sm text-center">
                              <span className="font-serif text-xl sm:text-3.5xl font-bold block text-[#7c95e4] leading-none mb-1">
                                {String(b.value).padStart(2, '0')}
                              </span>
                              <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400">
                                {b.label}
                              </span>
                            </div>
                          ))}
                        </div>

                        {timeLeft.isPast && (
                          <p className="text-sm font-cursive text-[#90a98c] mt-4 font-bold">
                            It's Nati's Picnic Day! Let's get together! 🎉
                          </p>
                        )}
                        
                        <div className="flex justify-center items-center gap-1.5 mt-8 text-xs font-mono text-stone-400">
                          <Heart size={12} className="text-rose-400 fill-rose-400 animate-pulse" />
                          <span>Secure RSVP Registry Active</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* --- TAB 2: DETAILS PANEL --- */}
                  {activeTab === "details" && (
                    <motion.div
                      key="details-panel"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className={`glass-card rounded-[32px] border bg-white/80 p-6 sm:p-10 ${themeStyles.cardShadow}`}
                    >
                      <div className="text-center mb-8">
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#3a4245]">The Setup Info</h2>
                        <p className="text-xs text-stone-400 mt-1 uppercase tracking-widest font-mono">When & Where we assemble</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                        {[
                          { icon: <MapPin size={18} className="text-[#7c95e4]" />, title: "Location", desc: "To be determined, Addis Ababa" },
                          { icon: <Calendar size={18} className="text-[#7c95e4]" />, title: "Date", desc: "Sunday, June 7, 2026" },
                          { icon: <Clock size={18} className="text-[#7c95e4]" />, title: "Start Time", desc: "3:00 PM – Sunset" },
                          { icon: <Gift size={18} className="text-[#7c95e4]" />, title: "Dress Code", desc: "Keep it cute & comfortable." }
                        ].map((d, index) => (
                          <div key={index} className="flex gap-4 items-start p-4 bg-white/90 border border-stone-150/50 rounded-2xl">
                            <div className="p-3 bg-stone-50 border border-stone-100 rounded-full flex-shrink-0">
                              {d.icon}
                            </div>
                            <div>
                              <h4 className="font-serif font-bold text-[#3a4245] text-sm sm:text-base leading-tight">
                                {d.title}
                              </h4>
                              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                                {d.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Extraordinary interactive GPS landscape illustration mockup */}
                      <div className="mt-8 p-6 rounded-3xl border border-stone-200/60 bg-white/95 relative overflow-hidden shadow-sm flex flex-col md:flex-row items-center gap-6 text-left">
                        {/* Interactive mini vector meadow schematic */}
                        <div className="w-full md:w-2/5 aspect-square max-w-[180px] rounded-2xl bg-stone-50 border border-stone-150/80 relative flex items-center justify-center overflow-hidden shrink-0 group">
                          {/* Radial schematic grid lines */}
                          <div className="absolute inset-0 bg-[radial-gradient(#7c95e4_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
                          <div className="absolute w-28 h-28 rounded-full border border-dashed border-[#7c95e4]/20 animate-spin" style={{ animationDuration: "25s" }} />
                          <div className="absolute w-16 h-16 rounded-full border border-[#90a98c]/30 animate-pulse" />
                          
                          {/* Compass Rose rotating on hover */}
                          <motion.div 
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                            className="absolute bottom-2 right-2 text-stone-300 opacity-60"
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="stroke-current">
                              <circle cx="12" cy="12" r="9" strokeWidth="1" />
                              <path d="M12 3 L12 21 M3 12 L21 12" strokeWidth="1" />
                            </svg>
                          </motion.div>

                          {/* Pulsing GPS Meadow PIN with elegant ring circles */}
                          <div className="relative z-10 flex flex-col items-center gap-1">
                            <motion.div
                              animate={{ y: [0, -6, 0] }}
                              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                              className="text-[#7c95e4] drop-shadow-[0_4px_10px_rgba(124,149,228,0.3)]"
                            >
                              <MapPin size={34} className="fill-[#7c95e4]/10" />
                            </motion.div>
                            <span className="text-[8px] font-mono uppercase bg-[#7c95e4] text-white px-1.5 py-0.5 rounded-full tracking-widest leading-none font-bold">NATI PIN</span>
                          </div>

                          {/* Interactive status label */}
                          <div className="absolute top-2 left-2 text-[8px] font-mono uppercase tracking-wider text-stone-400 bg-white/80 border border-stone-100 rounded px-1.5 py-0.5">
                            Meadow Radar • Live
                          </div>
                        </div>

                        {/* Description content */}
                        <div className="flex-1 flex flex-col justify-start gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#90a98c] font-bold">Coordinates Incoming</span>
                          </div>
                          
                          <h4 className="font-serif font-black text-[#3a4245] text-lg leading-tight">GPS Meadow Drop-Pin Placement</h4>
                          
                          <p className="text-stone-500 text-xs font-sans font-light leading-relaxed">
                            For security and privacy, the exact pin location within Addis Ababa will be broadcasted live through this coordinate terminal 24 hours prior to Sunday afternoon start.
                          </p>

                          <div className="flex flex-wrap items-center gap-3.5 mt-2 pt-2 border-t border-stone-100">
                            <div className="text-left">
                              <span className="block text-[8px] font-mono uppercase tracking-wider text-stone-400">Target Region</span>
                              <span className="text-xs font-serif font-bold text-stone-700">Addis Ababa, Ethiopia</span>
                            </div>
                            <div className="h-6 w-[1px] bg-stone-150"></div>
                            <div className="text-left">
                              <span className="block text-[8px] font-mono uppercase tracking-wider text-stone-400">Precision Location</span>
                              <span className="text-xs font-mono font-medium text-stone-700">9.0300° N, 38.7400° E</span>
                            </div>
                          </div>

                          <div className="mt-2.5">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={downloadICSFile}
                              className={`py-2 px-4 rounded-xl text-[10px] font-mono uppercase font-black tracking-widest transition-all inline-flex items-center gap-2 cursor-pointer ${themeStyles.buttonPrimary}`}
                            >
                              <Calendar size={12} /> Sync Standard Calendar Invite (.ics)
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* --- TAB 3: VIBES MENU & ACTIVITIES --- */}
                  {activeTab === "vibes" && (
                    <motion.div
                      key="vibes-panel"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className={`glass-card rounded-[32px] border bg-white/80 p-6 sm:p-10 ${themeStyles.cardShadow}`}
                    >
                      <div className="text-center mb-6">
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#3a4245]">What's on the Menu</h2>
                        <p className="text-xs text-stone-400 mt-1 uppercase tracking-widest font-mono">Tasty picnic nibbles & refreshments</p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        {[
                          { emoji: "🍩", label: "Cupcakes & Cookies" },
                          { emoji: "🍓", label: "Fresh Fruits" },
                          { emoji: "🥤", label: "Refreshing Drinks" },
                          { emoji: "🎶", label: "Sunset Tunes" }
                        ].map((item, index) => (
                          <motion.div 
                            key={index}
                            whileHover={{ y: -4, borderColor: "#7c95e4" }}
                            className="bg-white border border-stone-200/50 p-4 rounded-2xl text-center flex flex-col items-center gap-2 card-emoji-item"
                          >
                            <span className="text-2.5xl block">{item.emoji}</span>
                            <p className="text-xs font-semibold text-stone-600 font-sans">{item.label}</p>
                          </motion.div>
                        ))}
                      </div>

                      <div className="text-center mb-6 mt-8">
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#3a4245]">The Activities</h2>
                        <p className="text-xs text-stone-400 mt-1 cursor-crosshair uppercase tracking-widest font-mono">Unwinding and playing game loops together</p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { emoji: "🃏", label: "Uno / Cards" },
                          { emoji: "🤫", label: "Mafia" },
                          { emoji: "🎵", label: "Music Games" },
                          { emoji: "📸", label: "Photo Moments" }
                        ].map((item, index) => (
                          <motion.div 
                            key={index}
                            whileHover={{ y: -4, borderColor: "#90a98c" }}
                            className="bg-white border border-stone-200/50 p-4 rounded-2xl text-center flex flex-col items-center gap-2 card-emoji-item"
                          >
                            <span className="text-2.5xl block">{item.emoji}</span>
                            <p className="text-xs font-semibold text-stone-600 font-sans">{item.label}</p>
                          </motion.div>
                        ))}
                      </div>

                      {/* RETRO PICNIC SYNTHESIZER TO PLAY MELODIC SOUNDS ACTIVE */}
                      <div className="mt-10 border-t border-stone-200/50 pt-8" id="backyard-acoustic-synth">
                        <div className="text-center mb-4">
                          <h4 className="font-serif font-bold text-[#3a4245] text-sm">🎹 Meadow Interactive Retro Synthesizer 🎹</h4>
                          <p className="text-xs text-stone-400 max-w-md mx-auto mt-1">
                            Click any button to trigger live synthesized rustic sounds via the Web Audio API synthesizer.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
                          {[
                            { label: "🐦 Nature Chime", id: "bird" },
                            { label: "🔥 Cozy Spark", id: "spark" },
                            { label: "🍃 Synther Breeze", id: "breeze" },
                            { label: "🎉 Popper Burst", id: "bubble" }
                          ].map((b) => (
                            <button
                              key={b.id}
                              onClick={() => {
                                playSynthesizedTone(b.id as any);
                              }}
                              className="px-3.5 py-1.5 bg-stone-50 duration-200 hover:bg-[#7c95e4]/10 hover:text-[#7c95e4] active:scale-95 border border-stone-150 rounded-xl text-xs font-mono select-none"
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>

                    </motion.div>
                  )}

                  {/* --- TAB 4: GIFTS IDEAS --- */}
                  {activeTab === "gifts" && (
                    <motion.div
                      key="gifts-panel"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className={`glass-card rounded-[32px] border bg-white/80 p-6 sm:p-10 ${themeStyles.cardShadow}`}
                    >
                      <div className="text-center mb-8">
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#3a4245]">Small Note 🤍</h2>
                        <p className="text-xs text-stone-400 mt-1 uppercase tracking-widest font-mono">Thoughtful Birthday gesture hints</p>
                      </div>

                      <div className="max-w-md mx-auto text-left flex flex-col gap-4">
                        <p className="text-sm font-sans text-stone-600 mb-2 font-medium">
                          Want to bring Nati something special for his 20th? Here are some simple ideas to help you:
                        </p>
                        
                        <div className="flex flex-col gap-3">
                          {[
                            "Snacks or drinks we can consume and enjoy at the park",
                            "Something sweet, meaningful, or anime-related",
                            "Small fashion accessories especially watches or personal keepsakes"
                          ].map((idea, idx) => (
                            <div key={idx} className="flex gap-3 items-center">
                              <span className="text-[#e6a5b8]">🌸</span>
                              <p className="text-xs sm:text-sm text-stone-600 font-sans font-normal leading-relaxed">{idea}</p>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-stone-150/55 pt-6 mt-4 text-center">
                          <span className="font-cursive text-2.5xl text-[#7c95e4] block">
                            Your presence occupies the real gift (not really),
                          </span>
                          <span className="font-cursive text-2.5xl text-[#7c95e4] block mt-1">
                            so this is totally optional (not really) 🤍
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* --- TAB 5: RSVP FORM & GUESTBOOK REGISTRY --- */}
                  {activeTab === "rsvp" && (
                    <motion.div
                      key="rsvp-panel"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col gap-6"
                    >
                      <div className={`glass-card rounded-[32px] border bg-white/90 p-6 sm:p-10 ${themeStyles.cardShadow}`}>
                        <div className="text-center mb-6">
                          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#3a4245]">RSVP Registry</h2>
                          <p className="text-xs text-stone-400 mt-1 uppercase tracking-widest font-mono">Let us know if you can make it out to the meadow!</p>
                        </div>

                        <AnimatePresence mode="wait">
                          {submissionSuccess && lastSubmittedGuest ? (
                            <motion.div
                              key="success-card"
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.95, opacity: 0 }}
                              transition={{ type: "spring", damping: 25, stiffness: 200 }}
                              className="max-w-md mx-auto text-center flex flex-col items-center py-4 relative overflow-visible"
                            >
                              {/* Animated Check/Heart Badge with 3D explosion effect */}
                              <motion.div
                                initial={{ scale: 0, rotate: -30 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 15 }}
                                className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 relative ${themeStyles.accentBg} shadow-inner`}
                                style={{ perspective: 1200, transformStyle: "preserve-3d" }}
                              >
                                {/* 3D Particle Explosion Burst */}
                                <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ transformStyle: "preserve-3d" }}>
                                  {Array.from({ length: 48 }).map((_, i) => {
                                    const angle = (i * (360 / 48)) + (Math.random() * 20 - 10);
                                    // High-velocity realistic radial explosion speed
                                    const speed = 140 + Math.random() * 280;
                                    const rad = (angle * Math.PI) / 180;
                                    const targetX = Math.cos(rad) * speed;
                                    const targetY = Math.sin(rad) * speed - 60; // Upward breeze impact
                                    const targetZ = Math.random() * 500 - 250; // Deep spatial 3D displacement
                                    
                                    const scale = 0.5 + Math.random() * 1.4;
                                    const duration = 1.8 + Math.random() * 1.4;
                                    const delay = Math.random() * 0.1;

                                    // Meadow celebration emojis
                                    const emojis = ["🌸", "🌿", "✨", "🤍", "🎉", "🍒", "⭐", "🎈", "🍰", "🌻"];
                                    const emoji = emojis[i % emojis.length];

                                    return (
                                      <motion.div
                                        key={i}
                                        initial={{ 
                                          x: 0, 
                                          y: 0, 
                                          z: 0, 
                                          scale: 0, 
                                          opacity: 0,
                                          rotateX: 0,
                                          rotateY: 0,
                                          rotateZ: 0
                                        }}
                                        animate={{
                                          x: [0, targetX],
                                          y: [0, targetY],
                                          z: [0, targetZ],
                                          scale: [0, scale, scale, 0],
                                          opacity: [0, 1, 1, 0],
                                          rotateX: [0, Math.random() * 1080 - 540],
                                          rotateY: [0, Math.random() * 1080 - 540],
                                          rotateZ: [0, Math.random() * 720 - 360]
                                        }}
                                        transition={{
                                          duration: duration,
                                          delay: delay,
                                          ease: [0.1, 0.85, 0.25, 1] // Elite custom cubic-bezier spline for realistic physical friction & pop
                                        }}
                                        style={{
                                          position: "absolute",
                                          left: "50%",
                                          top: "50%",
                                          transform: "translate(-50%, -50%)",
                                          transformStyle: "preserve-3d"
                                        }}
                                        className="text-xl select-none filter drop-shadow-md pointer-events-none"
                                      >
                                        {emoji}
                                      </motion.div>
                                    );
                                  })}
                                </div>

                                <motion.div
                                  animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                  className="z-10"
                                >
                                  <Heart size={44} className={`${themeStyles.accent} fill-current drop-shadow-sm`} />
                                </motion.div>
                                
                                {/* Glowing Sparkles orbiting the heart badge */}
                                <motion.div
                                  animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                                  transition={{ repeat: Infinity, duration: 2 }}
                                  className="absolute -top-1 -right-1 text-amber-500 z-10"
                                >
                                  <Sparkles size={18} />
                                </motion.div>
                              </motion.div>

                              <motion.h3
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="font-serif font-black text-2xl text-[#3a4245] mb-2"
                              >
                                Awesome, {lastSubmittedGuest.name}!
                              </motion.h3>

                              <p className="text-stone-550 text-xs sm:text-sm font-sans font-light leading-relaxed mb-6">
                                Your RSVP has been saved securely to the active registry database and notified instantly to <strong className="font-medium text-[#3a4245]">Meba</strong> via Telegram Bot! 🎉
                              </p>

                              {/* Ticket Mockup illustrating selection */}
                              <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, type: "spring" }}
                                className="w-full bg-stone-50/70 border border-stone-200/50 rounded-2xl p-4 text-left mb-6 flex flex-col gap-2.5 relative overflow-hidden shadow-sm"
                              >
                                {/* Side-notched decorative ticket holes */}
                                <div className="absolute -left-2.5 top-1/2 w-5 h-5 rounded-full bg-white/95 border-r border-stone-200/50 -translate-y-1/2" />
                                <div className="absolute -right-2.5 top-1/2 w-5 h-5 rounded-full bg-white/95 border-l border-stone-200/50 -translate-y-1/2" />

                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400">RSVP Summary Voucher</span>
                                  <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                                    lastSubmittedGuest.attending ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                  }`}>
                                    {lastSubmittedGuest.attending ? "✓ Confirmed" : "Can't Attend"}
                                  </span>
                                </div>

                                <div className="border-t border-dashed border-stone-200 my-1"></div>

                                <div className="flex flex-col gap-1 text-stone-700">
                                  <span className="text-xs font-serif font-black text-[#3a4245]">{lastSubmittedGuest.name}</span>
                                  {lastSubmittedGuest.song && (
                                    <p className="text-[10px] text-stone-450 font-mono">
                                      🎵 Requested tune: <strong className="text-stone-600">{lastSubmittedGuest.song}</strong>
                                    </p>
                                  )}
                                  <p className="text-xs text-stone-500 italic mt-1 leading-normal">
                                    "{lastSubmittedGuest.note}"
                                  </p>
                                </div>
                              </motion.div>

                              {/* Action items */}
                              <div className="flex flex-col gap-3 w-full">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={downloadICSFile}
                                  className={`w-full py-3.5 rounded-xl text-xs font-semibold uppercase tracking-widest text-center cursor-pointer font-mono duration-150 flex items-center justify-center gap-2 ${themeStyles.buttonPrimary}`}
                                >
                                  <Calendar size={14} /> Add Picnic to Calendar
                                </motion.button>
                                
                                <button
                                  onClick={() => {
                                    setSubmissionSuccess(false);
                                    playCozySpark();
                                  }}
                                  className="text-[10px] font-mono uppercase tracking-widest text-stone-400 hover:text-stone-700 transition-colors mt-2 cursor-pointer"
                                >
                                  ← Submit another response
                                </button>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.form
                              key="rsvp-form"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onSubmit={handleFormSubmit}
                              className="max-w-md mx-auto flex flex-col gap-4 text-left"
                            >
                              <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 mb-1">Your Name *</label>
                                <input
                                  type="text"
                                  required
                                  value={formName}
                                  onChange={(e) => setFormName(e.target.value)}
                                  placeholder="Enter your name"
                                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#7c95e4] bg-white text-stone-850 placeholder-stone-400 text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 mb-1">Will you be attending?</label>
                                <div className="grid grid-cols-2 gap-3 mt-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => { setFormAttending(true); playCozySpark(); }}
                                    className={`py-3 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
                                      formAttending 
                                        ? "bg-[#7c95e4] text-white border-transparent" 
                                        : "bg-white border-stone-200 text-stone-600 hover:bg-[#fbf9f3]"
                                    }`}
                                  >
                                    Count me in! 🎉
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setFormAttending(false); playCozySpark(); }}
                                    className={`py-3 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
                                      !formAttending 
                                        ? "bg-rose-500 text-white border-transparent" 
                                        : "bg-white border-stone-200 text-stone-600 hover:bg-[#fbf9f3]"
                                    }`}
                                  >
                                    Can't make it 😢
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 mb-1">Song Request 🎶</label>
                                <input
                                  type="text"
                                  value={formSong}
                                  onChange={(e) => setFormSong(e.target.value)}
                                  placeholder="tunes u wanna hear."
                                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#7c95e4] bg-white text-stone-850 placeholder-stone-400 text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-500 mb-1">Funny or Sweet Message for Nati 🤍</label>
                                <textarea
                                  value={formNote}
                                  onChange={(e) => setFormNote(e.target.value)}
                                  placeholder="Leave a funny or sweet message that will be given to him..."
                                  rows={3}
                                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#7c95e4] bg-white text-stone-850 placeholder-stone-400 text-sm resize-none"
                                />
                              </div>

                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className={`w-full py-4 rounded-xl text-xs font-semibold uppercase tracking-widest text-center cursor-pointer font-mono duration-150 ${themeStyles.buttonPrimary}`}
                              >
                                Send RSVP 💌
                              </motion.button>
                            </motion.form>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* SUBTLE NOTIFICATION NOTE */}
                      <p className="text-[11px] text-stone-400 font-mono text-center tracking-wide mt-2">
                        📥 Submissions instantly notified to Meba via Telegram Bot 🔔
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </main>

            {/* DESIGN SWITCHER PANEL IN BANNER */}
            <div className="max-w-2xl mx-auto w-full px-6 text-center mt-10">
              <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-stone-450 block mb-2">
                Toggle Poster Aesthetic Theme
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { id: "swiss", label: "🌸 Periwinkle" },
                  { id: "acid", label: "🌿 Sage Meadow" },
                  { id: "sunset", label: "🤍 Blossom Rose" },
                  { id: "aurora", label: "✨ Twilight Star" },
                  { id: "brutalist", label: "🔳 Paper" }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id as CardThemeType); playCozySpark(); }}
                    className={`px-3 py-1.5 font-mono uppercase text-[9px] tracking-wider border rounded-full transition-all cursor-pointer ${
                      theme === t.id 
                        ? `${themeStyles.accentBadge} font-extrabold border-transparent` 
                        : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <footer className="mt-16 text-center text-xs text-stone-450 select-none flex flex-col gap-1 tracking-wide">
              <p>please keep this hangout private 😌✨</p>
              <p className="font-medium text-stone-500">dress cute, arrive on time, & let's celebrate Nati 🤍</p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
