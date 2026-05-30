import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Calendar, Share2, MapPin, 
  Clock, Check, Heart, User, Music, MessageSquare, 
  Info, Leaf, Gift, Smile, ArrowRight, Volume2, VolumeX, Mail,
  Disc, Compass, Layers, Music4, Star, ChevronRight, CornerDownRight
} from "lucide-react";
import { CardThemeType } from "./types";
import AmbientBackground from "./components/AmbientBackground";
import { 
  playPopSound, playCozySpark, playCelebrationBurst, 
  playInvitationTheme, startAmbientBackground, stopAmbientBackground 
} from "./utils/audio";

// Initial standard preset guests to keep the meadow wall beautiful and rich
const INITIAL_GUESTS = [
  { name: "Meba D. GOAT 👑", attending: true, song: "Retro Synth Odyssey", note: "Welcome family! Prepare your voice for extreme picnic karaoke loops ! 🎤✨", date: "May 30, 2026" },
  { name: "Nati (Birthday Boy) 🎉", attending: true, song: "Sweet Garden Melodies", note: "Excited to turn 20 with the best crew. Bring your cards and cards games! 🃏🌿", date: "May 30, 2026" }
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

  // Envelope tilt physics coordinates
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const envelopeRef = useRef<HTMLDivElement>(null);

  // Live ticking Clock to track Addis Ababa standard time
  const [addisTime, setAddisTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      // Addis Ababa is UTC+3
      const d = new Date();
      const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      const addisDate = new Date(utc + (3600000 * 3));
      
      const hours = String(addisDate.getHours()).padStart(2, '0');
      const minutes = String(addisDate.getMinutes()).padStart(2, '0');
      const seconds = String(addisDate.getSeconds()).padStart(2, '0');
      setAddisTime(`${hours}:${minutes}:${seconds} EAT`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch alive RSVPs on load
  useEffect(() => {
    fetch("/api/rsvp")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
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

  // Calculate countdown to Sunday, June 7, 2026 15:00:00 (3 PM)
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
    setTilt({ x: 0, y: 0 });
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

  // Synthesizer Key Note player
  const playSynthesizerNode = (freq: number) => {
    playCozySpark();
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = theme === "brutalist" ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch (err) {}
  };

  const playSynthesizedTone = (type: "bird" | "spark" | "breeze" | "bubble") => {
    if (type === "bird") {
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
      song: formSong.trim() || "Let's Groove!",
      note: formNote.trim() || "Can't wait to hang out! 🤍",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };

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
          setRsvpList([payload, ...rsvpList]);
        }
      })
      .catch(err => {
        console.error("Failed to post RSVP to server API:", err);
        setRsvpList([payload, ...rsvpList]);
      });

    setFormName("");
    setFormSong("");
    setFormNote("");

    setLastSubmittedGuest(payload);
    setSubmissionSuccess(true);
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

  // Luxury, ultra-polished palette setups representing beautiful, distinctive branding styles
  const themeStyles = {
    swiss: { // Ivory Oak & Periwinkle (Premium Minimalist Nature)
      bgGradient: "from-[#FDFBF7] via-[#F4F6FB] to-[#ECEFF7]",
      panelBg: "bg-white/95 border-stone-200/80 shadow-[0_20px_60px_rgba(124,149,228,0.06)]",
      accent: "text-[#7C95E4]",
      accentBg: "bg-[#7C95E4]/10",
      accentBorder: "border-[#7C95E4]/30",
      accentBadge: "bg-[#7C95E4] text-white",
      guestCardBg: "bg-[#F7F9FD] border-stone-200/60 shadow-sm",
      headingText: "text-[#2B2F38] font-serif",
      secondaryAccent: "text-[#90A98C]",
      buttonPrimary: "bg-[#7C95E4] hover:bg-[#687FCB] text-white shadow-lg shadow-[#7C95E4]/35",
      pulseColor: "bg-[#7C95E4]/25",
      accentRing: "ring-[#7C95E4]/30",
      brandTitle: "text-[#2B3554]",
      ambientStyle: "swiss"
    },
    acid: { // Sage Garden Canopy (Bespoke Eco-Gourmet)
      bgGradient: "from-[#F3F6F2] via-[#EAEFE8] to-[#DFEDE4]",
      panelBg: "bg-white/95 border-emerald-900/10 shadow-[0_20px_60px_rgba(74,107,83,0.06)]",
      accent: "text-[#4A6B53]",
      accentBg: "bg-[#4A6B53]/10",
      accentBorder: "border-[#4A6B53]/30",
      accentBadge: "bg-[#4A6B53] text-white",
      guestCardBg: "bg-[#F3F7F2] border-emerald-950/5 shadow-sm",
      headingText: "text-[#243328] font-serif",
      secondaryAccent: "text-[#7C95E4]",
      buttonPrimary: "bg-[#4A6B53] hover:bg-[#3D5643] text-white shadow-lg shadow-[#4A6B53]/35",
      pulseColor: "bg-[#4A6B53]/25",
      accentRing: "ring-[#4A6B53]/30",
      brandTitle: "text-[#1B291F]",
      ambientStyle: "acid"
    },
    sunset: { // Rose Petal Champagne (Warm Sun-kissed Glow)
      bgGradient: "from-[#FAF6F3] via-[#FAF0EB] to-[#F2E5DC]",
      panelBg: "bg-white/95 border-peach-200 shadow-[0_20px_60px_rgba(217,136,157,0.06)]",
      accent: "text-[#D9889D]",
      accentBg: "bg-[#D9889D]/12",
      accentBorder: "border-[#D9889D]/30",
      accentBadge: "bg-[#D9889D] text-white",
      guestCardBg: "bg-[#FAF5F2] border-[#D9889D]/15 shadow-sm",
      headingText: "text-[#3D2C2F] font-serif",
      secondaryAccent: "text-[#4A6B53]",
      buttonPrimary: "bg-[#D9889D] hover:bg-[#C97188] text-white shadow-lg shadow-[#D9889D]/35",
      pulseColor: "bg-[#D9889D]/25",
      accentRing: "ring-[#D9889D]/30",
      brandTitle: "text-[#44272D]",
      ambientStyle: "sunset"
    },
    aurora: { // Midnight Nebulous Space (Ethereal Cosmic Twilight)
      bgGradient: "from-[#0E1118] via-[#141A29] to-[#1C2336]",
      panelBg: "bg-[#182033]/90 border-[#8FA3E6]/15 shadow-[0_30px_70px_rgba(0,0,0,0.45)] text-stone-100",
      accent: "text-[#8FA3E6]",
      accentBg: "bg-[#8FA3E6]/15",
      accentBorder: "border-[#8FA3E6]/30",
      accentBadge: "bg-[#8FA3E6] text-[#0A0D14]",
      guestCardBg: "bg-[#1B253D]/80 border-[#8FA3E6]/10 shadow-lg text-stone-200",
      headingText: "text-[#EBF0FC] font-serif",
      secondaryAccent: "text-[#A3E6B2]",
      buttonPrimary: "bg-[#8FA3E6] hover:bg-[#798ED1] text-[#0A0D14] shadow-lg shadow-[#8FA3E6]/25",
      pulseColor: "bg-[#8FA3E6]/30",
      accentRing: "ring-[#8FA3E6]/40",
      brandTitle: "text-[#C6D2F7]",
      ambientStyle: "aurora"
    },
    brutalist: { // Stark Helvetic Poster (Bold Swiss Editorial)
      bgGradient: "from-[#F5F5F5] via-[#E8E8E8] to-[#D0D0D0]",
      panelBg: "bg-white border-4 border-black shadow-[10px_10px_0px_rgba(0,0,0,1)] text-black",
      accent: "text-black",
      accentBg: "bg-stone-100",
      accentBorder: "border-2 border-black",
      accentBadge: "bg-black text-white",
      guestCardBg: "bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]",
      headingText: "text-black font-sans font-black tracking-tighter uppercase",
      secondaryAccent: "text-stone-650",
      buttonPrimary: "bg-black hover:bg-stone-800 text-white border-2 border-black font-bold shadow-none",
      pulseColor: "bg-black/20",
      accentRing: "ring-black/50",
      brandTitle: "text-black",
      ambientStyle: "brutalist"
    }
  }[theme];

  const totalAttending = rsvpList.filter(r => r.attending).length;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!envelopeRef.current) return;
    const rect = envelopeRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({ x: x * 0.08, y: y * 0.08 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div className={`min-h-screen relative flex flex-col antialiased transition-all duration-700 ease-out select-none pb-20 overflow-x-hidden bg-gradient-to-br ${themeStyles.bgGradient}`}>
      
      {/* Precision Decorative Grid Layout lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.22] bg-[radial-gradient(rgba(124,149,228,0.25)_1px,transparent_1px)] [background-size:20px_20px] z-0" />
      
      {/* Top Graphic Border line */}
      <div className={`h-[5px] w-full transition-colors duration-500 z-50 fixed top-0 left-0 ${
        theme === "swiss" ? "bg-[#7C95E4]" :
        theme === "acid" ? "bg-[#4A6B53]" :
        theme === "sunset" ? "bg-[#D9889D]" :
        theme === "aurora" ? "bg-gradient-to-r from-[#8FA3E6] to-[#A3E6B2]" : "bg-black"
      }`} />

      {/* Stable Beautiful Particle Flow elements */}
      <AmbientBackground theme={theme} />

      {/* Decorative luxury corners */}
      <div className="absolute top-10 right-10 w-44 h-44 opacity-25 pointer-events-none z-0">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current text-[#90A98C]">
          <path d="M0,80 Q20,80 50,50 T100,20" strokeWidth="1.5" />
          <path d="M20,100 Q40,40 100,0" strokeWidth="0.8" strokeDasharray="3 3" />
          <circle cx="85" cy="15" r="4" className="fill-[#7C95E4]/40" />
        </svg>
      </div>
      <div className="absolute bottom-10 left-10 w-44 h-44 opacity-20 pointer-events-none z-0">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current text-[#7C95E4]">
          <path d="M0,0 Q60,40 100,100" strokeWidth="1.2" />
          <circle cx="35" cy="65" r="3" className="fill-[#90A98C]/30" />
        </svg>
      </div>

      <AnimatePresence mode="wait">
        {!isEnvelopeOpened ? (
          /* --- ENVELOPE SEALED ENTRANCE (PHYSICAL ARCHITECTURE RESTING ON WORKSPACE) --- */
          <motion.div
            key="sealed-envelope-scene"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -50 }}
            transition={{ type: "spring", stiffness: 85, damping: 14 }}
            className="flex-1 flex flex-col items-center justify-center pt-16 px-4 z-10"
          >
            <div className="max-w-xl w-full flex flex-col items-center placeholder-stone-400 gap-8">
              
              {/* Little Floating Banner */}
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold tracking-[0.3em] uppercase py-1.5 px-4 rounded-full border ${themeStyles.accentBorder} ${themeStyles.accentBg} ${themeStyles.accent}`}>
                  ✦ MEADOW PORTAL CHANNELS ACTIVE ✦
                </span>
              </div>

              {/* Advanced Interactive 3D Card Envelope */}
              <div
                style={{ perspective: 1500 }}
                className="w-full aspect-[4/3] flex items-center justify-center relative select-none"
              >
                <motion.div
                  ref={envelopeRef}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    rotateX: tilt.y,
                    rotateY: -tilt.x,
                    transformStyle: "preserve-3d"
                  }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  onClick={handleOpenEnvelope}
                  className={`w-full h-full rounded-[38px] cursor-pointer relative overflow-visible flex flex-col justify-between p-8 border shadow-[0_30px_70px_rgba(0,0,0,0.08)] bg-[#FBF9F4] border-stone-200`}
                >
                  {/* Left Pocket flap */}
                  <div className="absolute inset-y-0 left-0 w-1/2 bg-[#FCFAF6] border-r border-stone-200/40 rounded-l-[38px] [clip-path:polygon(0_0,100%_50%,0_100%)] z-10 shadow-sm pointer-events-none" />
                  
                  {/* Right Pocket flap */}
                  <div className="absolute inset-y-0 right-0 w-1/2 bg-[#FCFAF6] border-l border-stone-200/40 rounded-r-[38px] [clip-path:polygon(100%_0,0_50%,100%_100%)] z-10 shadow-sm pointer-events-none" />

                  {/* Peeking Parchment Invitation Letter (Glides UP smoothly on hover) */}
                  <motion.div
                    className="absolute inset-x-8 top-10 bottom-6 bg-white rounded-3xl border border-stone-200/80 p-6 flex flex-col justify-between -z-10 shadow-[0_15px_30px_rgba(0,0,0,0.03)]"
                    animate={{
                      y: tilt.x !== 0 ? -48 : 0,
                      rotateZ: tilt.x !== 0 ? -1 : 0,
                      scale: tilt.x !== 0 ? 1.02 : 1
                    }}
                    transition={{ type: "spring", stiffness: 240, damping: 18 }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] font-mono tracking-widest text-stone-400">ADDIS MEADOW CLASS • LEVEL 20</span>
                      <Sparkles size={11} className={`${themeStyles.accent} animate-pulse`} />
                    </div>

                    <div className="my-auto text-left">
                      <span className="font-cursive text-sm text-[#D9889D] block">Let's Celebrate</span>
                      <h4 className="font-serif font-black text-[#2B2F38] text-xl leading-none tracking-tight mt-0.5">NATI'S 20TH BIRTHDAY</h4>
                      <p className="text-[10px] font-mono text-stone-500 mt-1.5 uppercase tracking-widest">🌿 June 7 • Addis Ababa 🌿</p>
                    </div>

                    <div className="border-t border-dashed border-stone-150 pt-3 flex justify-between items-center text-[9px] text-stone-400 font-mono tracking-widest uppercase">
                      <span>Click To Open</span>
                      <span className={`text-[#7C95E4] animate-bounce`}>▲</span>
                    </div>
                  </motion.div>

                  {/* Lower Envelope overlap base */}
                  <div className="absolute inset-x-0 bottom-0 h-3/5 bg-[#FAF6EE] border-t border-stone-200/30 rounded-b-[38px] shadow-[0_-8px_20px_rgba(0,0,0,0.01)] [clip-path:polygon(0_100%,0_0,50%_45%,100%_0,100%_100%)] z-10 pointer-events-none" />

                  {/* Top triangular sealed flap */}
                  <div className="absolute inset-x-0 top-0 h-[48%] bg-[#FCFAF5] rounded-t-[38px] shadow-[0_6px_10px_rgba(0,0,0,0.01)] [clip-path:polygon(0_0,50%_72%,100%_0)] border-b border-stone-250 z-10 pointer-events-none" />

                  {/* Envelope Front Cover Tag */}
                  <div className="text-center mt-[12%] z-20 pointer-events-none select-none">
                    <p className="font-cursive text-lg text-stone-400">Open Invitation</p>
                    <h2 className="font-serif text-2xl font-black text-[#2B2F38] tracking-tight leading-none mt-1">Friends & Crew</h2>
                    <div className="w-12 h-[2px] bg-[#7C95E4]/40 mx-auto mt-3.5" />
                  </div>

                  {/* Immersive Wax Seal Stamp Badge */}
                  <div className="flex justify-center items-center z-20">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 rounded-full bg-[#FAF5EE] border-2 border-dashed border-[#90A98C] flex items-center justify-center shadow-[0_6px_20px_rgba(144,169,140,0.18)]"
                    >
                      <Leaf size={24} className="text-[#90A98C]" />
                    </motion.div>
                  </div>

                  <p className="text-[10px] font-mono tracking-[0.25em] uppercase text-stone-400 mb-1 z-20 pointer-events-none">
                    Tap Envelope To Break Seal
                  </p>
                </motion.div>
              </div>

              {/* Time Countdown Badge under envelope */}
              <div className="w-full flex flex-col items-center mt-3 text-center">
                <p className="text-[10px] font-mono tracking-widest text-[#90A98C] font-semibold uppercase mb-3">
                  ⏰ TIMING COUNTDOWN TO MEADOW GATHERING
                </p>
                
                <div className="flex gap-3 justify-center w-full max-w-sm">
                  {[
                    { value: timeLeft.days, label: "Days" },
                    { value: timeLeft.hours, label: "Hours" },
                    { value: timeLeft.minutes, label: "Mins" },
                    { value: timeLeft.seconds, label: "Secs" }
                  ].map((b, idx) => (
                    <div key={idx} className="flex-1 bg-white/70 border border-stone-200/50 p-2.5 rounded-2xl shadow-sm">
                      <span className="font-serif text-lg font-black block text-[#7C95E4] leading-none mb-0.5">
                        {String(b.value).padStart(2, '0')}
                      </span>
                      <span className="text-[8px] font-mono uppercase text-stone-400">
                        {b.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Theme Swapping on Landing Zone */}
              <div className="mt-4 flex flex-col items-center">
                <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest mb-2.5">Select Poster Vibe:</span>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {[
                    { id: "swiss", label: "🌸 Periwinkle" },
                    { id: "acid", label: "🌿 Sage Garden" },
                    { id: "sunset", label: "🤍 Rose Champagne" },
                    { id: "aurora", label: "✨ Twilight Star" },
                    { id: "brutalist", label: "🔳 Stark Swiss" }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as CardThemeType)}
                      className={`text-[9px] uppercase font-mono tracking-widest px-3 py-1.5 border rounded-full transition-all cursor-pointer ${
                        theme === t.id 
                          ? `${themeStyles.accentBadge} font-bold border-transparent` 
                          : "bg-white/70 border-stone-200 text-stone-600 hover:bg-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        ) : (
          /* --- FULL PORTAL INTERACTIVE MOUNT (ASSET-SKEWED BENTO GRID DESIGN) --- */
          <motion.div
            key="portal-dashboard-scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-grow flex flex-col z-10"
          >
            
            {/* STICKY AUDIO-DECK HEADERS */}
            <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 border-b border-stone-200/40 py-3 transition-all">
              <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05, rotate: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleResetEnvelope}
                    className="w-10 h-10 rounded-full border border-stone-200 bg-white shadow-sm flex items-center justify-center cursor-pointer text-stone-500 hover:text-stone-800"
                    title="Pack & Reseal Invitation Envelope"
                  >
                    <Mail size={16} />
                  </motion.button>
                  
                  <div className="text-left">
                    <h2 className={`text-base font-serif font-extrabold tracking-tight ${themeStyles.brandTitle}`}>
                      NATI'S MEADOW INVITE
                    </h2>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-[#90A98C] font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Addis coordinate link • Class 20
                    </p>
                  </div>
                </div>

                {/* Live Addis Time Badge */}
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 border border-stone-200/60 rounded-full bg-white text-[9px] font-mono text-stone-500">
                  <Clock size={10} className="text-[#90A98C] animate-spin" style={{ animationDuration: "14s" }} />
                  <span>ADDIS ABABA: {addisTime}</span>
                </div>

                {/* Mini Media Deck & Sharing Actions */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 p-1 border border-stone-200/50 rounded-full bg-white/95 shadow-inner shrink-0">
                    <div className="flex gap-0.5 items-end px-2.5 h-3 overflow-hidden">
                      {isPlayingMusic ? (
                        [0.6, 0.4, 0.9, 0.5, 0.7, 0.3, 0.8].map((speed, key) => (
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
                            className="w-0.5 bg-[#D9889D]"
                            style={{ borderRadius: "1px" }}
                          />
                        ))
                      ) : (
                        <div className="w-8 h-[2px] bg-stone-300 rounded" />
                      )}
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleMusic}
                      className="py-1 px-3.5 rounded-full transition-all flex items-center gap-1.5 text-stone-600 font-mono text-[9px] uppercase tracking-widest bg-white border border-stone-150/80 hover:bg-stone-50 cursor-pointer"
                    >
                      {isPlayingMusic ? (
                        <>
                          <Volume2 size={11} className="text-[#D9889D]" />
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
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-[9px] font-bold tracking-widest uppercase bg-white border border-stone-200 hover:border-[#7C95E4] shadow-sm text-stone-650 cursor-pointer"
                  >
                    <Share2 size={11} className="text-[#7C95E4]" />
                    {copiedLink ? "COPIED" : "SHARE LINK"}
                  </motion.button>
                </div>

              </div>
            </header>

            <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col gap-8 justify-start">
              
              {/* BRAND HERO POSTER BANNER */}
              <div className="text-center py-4 flex flex-col gap-3 relative overflow-hidden">
                <span className="font-cursive text-2xl text-[#7C95E4] block select-none">You are cordially invited to</span>
                <h1 className={`text-4xl sm:text-7xl font-sans tracking-tight font-black leading-none uppercase ${themeStyles.headingText}`}>
                  NATI'S <span className="font-cursive italic font-light text-3xl sm:text-6xl text-[#90A98C] normal-case">Picnic</span> BIRTHDAY
                </h1>
                <div className="flex justify-center mt-2.5">
                  <div className={`border-2 border-stone-850 px-8 py-2.5 rounded-full font-sans font-black text-xs sm:text-sm tracking-[0.2em] bg-white text-stone-850 shadow-sm uppercase ${themeStyles.accentRing} ring-4`}>
                    🌿 Sunday, 7 June 2026 • 3:00 PM – Sunset
                  </div>
                </div>
              </div>

              {/* BENTO BOX CONTAINER COLLAGE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* HERO STATS POSTER COLUMN (LEFT) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  
                  {/* MAIN POSTER BADGE CARD */}
                  <div className={`glass-card p-6 rounded-[32px] border flex flex-col gap-6 relative overflow-hidden ${themeStyles.panelBg}`}>
                    <div className="absolute top-2 right-2 text-[#D9889D]/25 pointer-events-none select-none">
                      <Leaf size={140} className="rotate-12" />
                    </div>

                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-mono tracking-widest uppercase text-stone-400">Meadow RSVP Statistics</span>
                      <Sparkles size={14} className={`${themeStyles.accent} animate-pulse`} />
                    </div>

                    {/* Circular RSVP Gauge Indicator */}
                    <div className="flex items-center gap-5 mt-2 bg-stone-50/50 p-4 border border-stone-200/40 rounded-2xl">
                      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="32" cy="32" r="28" stroke="#E2E8F0" strokeWidth="6" fill="transparent" />
                          <circle cx="32" cy="32" r="28" stroke={theme === "brutalist" ? "black" : "#7C95E4"} strokeWidth="6" strokeDasharray="175" strokeDashoffset={175 - (175 * Math.min(totalAttending, 20)) / 20} fill="transparent" strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-xs font-mono font-black">{totalAttending}/20</span>
                      </div>
                      
                      <div className="text-left">
                        <p className="text-stone-400 text-[10px] font-mono uppercase tracking-widest">Attending Status</p>
                        <h4 className="font-serif font-bold text-sm text-[#2B2F38] mt-0.5">Invitees confirmed presence</h4>
                        <span className="text-xs text-[#90A98C] block italic mt-0.5">More spaces opening up soon!</span>
                      </div>
                    </div>

                    {/* Quick Info Specs */}
                    <div className="border-t border-dashed border-stone-200/60 pt-4 flex flex-col gap-3 text-left">
                      <div className="flex items-center gap-3">
                        <MapPin size={16} className={`${themeStyles.accent}`} />
                        <div>
                          <span className="block text-[8px] font-mono uppercase text-stone-400">Meadow Landmark Location</span>
                          <span className="text-xs font-bold text-stone-700">Addis Ababa, Ethiopia</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className={`${themeStyles.accent}`} />
                        <div>
                          <span className="block text-[8px] font-mono uppercase text-stone-400">Calendar Reference Date</span>
                          <span className="text-xs font-bold text-stone-700">Sunday afternoon, June 7, 2026</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Clock size={16} className={`${themeStyles.accent}`} />
                        <div>
                          <span className="block text-[8px] font-mono uppercase text-stone-400">Event Interval</span>
                          <span className="text-xs font-bold text-stone-700">3:00 PM – Sundown Melodies</span>
                        </div>
                      </div>
                    </div>

                    {/* Elegant custom advice badge */}
                    <div className={`p-4 rounded-2xl border ${themeStyles.accentBorder} ${themeStyles.accentBg} text-left`}>
                      <span className="text-[9px] font-mono uppercase font-black block text-stone-800 mb-1">🌿 GUEST ADVICE</span>
                      <p className="text-stone-550 font-sans text-xs leading-relaxed font-light">
                        "Arrive early to grab cozy seating. We have picnic blankets, drinks, guitar blocks, and vintage cards ready. Do not bring strict formalities — dress soft and look cute!" — Meba D. GOAT
                      </p>
                    </div>

                  </div>

                  {/* MINI POSTER WITH STABLE TICKER */}
                  <div className={`p-5 rounded-[28px] text-center border bg-white/50 text-stone-600 flex justify-between items-center ${themeStyles.accentBorder}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${themeStyles.accentBg} flex items-center justify-center`}>
                        <Compass className={`${themeStyles.accent} animate-spin`} size={15} style={{ animationDuration: "10s" }} />
                      </div>
                      <div className="text-left">
                        <span className="block text-[8px] font-mono uppercase text-stone-400">MEADOW ACCREDITED</span>
                        <span className="text-xs font-serif font-black text-stone-750">20th Picnic Circle</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono uppercase tracking-widest bg-stone-100 text-stone-500 px-2.5 py-1 rounded-full border border-stone-200">
                      SECURE PORTAL
                    </span>
                  </div>

                </div>

                {/* THE PORTAL SLIDE SCREEN & DECK SWITCHER COLUMN (RIGHT) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  
                  {/* NAVIGATION TABS DECK */}
                  <div className="flex overflow-x-auto pb-1 scrollbar-none">
                    <nav className="flex gap-2 p-1.5 bg-white/70 border border-stone-200/50 rounded-full shadow-sm max-w-full">
                      {[
                        { id: "home", label: "Home 🌿" },
                        { id: "details", label: "Coordinates 📍" },
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
                            className={`relative px-4 sm:px-6 py-2.5 rounded-full font-sans text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer focus:outline-none ${
                              isActive 
                                ? "text-white font-black" 
                                : "text-stone-600 hover:text-stone-850"
                            }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="slidingsTabIndicator"
                                className={`absolute inset-0 -z-10 rounded-full shadow-sm ${
                                  theme === "swiss" ? "bg-[#7C95E4]" :
                                  theme === "acid" ? "bg-[#4A6B53]" :
                                  theme === "sunset" ? "bg-[#D9889D]" :
                                  theme === "aurora" ? "bg-[#8FA3E6]" : "bg-black"
                                }`}
                                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                              />
                            )}
                            <span className="relative z-10">{tab.label}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  {/* ACTIVE TAB SCREEN PANEL */}
                  <div className="w-full">
                    <AnimatePresence mode="wait">
                      
                      {/* --- TAB PANEL: HOME --- */}
                      {activeTab === "home" && (
                        <motion.div
                          key="home-panel-view"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.25 }}
                          className={`glass-card p-6 sm:p-10 rounded-[32px] border text-center flex flex-col gap-6 ${themeStyles.panelBg}`}
                        >
                          <div className={`text-[#90A98C] mx-auto p-4 rounded-full ${themeStyles.accentBg}`}>
                            <Leaf size={32} className="animate-bounce" />
                          </div>
                          
                          <p className="font-sans font-light leading-relaxed text-sm sm:text-base max-w-xl mx-auto text-stone-550">
                            Hello friends and loved ones! Nati is crossing the bridge into 20! We are gathering for a beautiful, organic cozy outdoor afternoon picnic celebration in Addis Ababa. There are no mandatory templates, signups, or heavy guidelines — simply come as you are to enjoy fine garden sandwiches, music notes, games, and wonderful sunset chat loops!
                          </p>

                          <div className="flex justify-center mt-2.5">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setActiveTab("rsvp");
                                playCozySpark();
                              }}
                              className={`px-8 py-4 rounded-full font-serif font-black text-sm tracking-wide transition-all cursor-pointer ${themeStyles.buttonPrimary}`}
                            >
                              Register RSVP Invite 💌
                            </motion.button>
                          </div>

                          <div className="border-t border-dashed border-stone-200/60 pt-6 mt-4 flex items-center justify-center gap-1.5 text-xs text-stone-400">
                            <Heart size={13} className="text-rose-500 fill-rose-500 animate-pulse" />
                            <span>Meadow Database Live Configured</span>
                          </div>
                        </motion.div>
                      )}

                      {/* --- TAB PANEL: DETAILS & RADOR SCHEMATIC --- */}
                      {activeTab === "details" && (
                        <motion.div
                          key="details-panel-view"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.25 }}
                          className={`glass-card p-6 sm:p-10 rounded-[32px] border ${themeStyles.panelBg}`}
                        >
                          <div className="text-left mb-6">
                            <h3 className="text-xl sm:text-2xl font-serif font-black">Meadow Location Coordinates</h3>
                            <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase mt-0.5">GPS RADAR SYSTEM ACTIVE</p>
                          </div>

                          {/* Beautiful Interactive Radar Schematic Component */}
                          <div className="p-6 rounded-3xl border border-stone-200 bg-[#F9F6F1] relative overflow-hidden text-left flex flex-col md:flex-row items-center gap-6">
                            
                            {/* Spinning Radar vector canvas */}
                            <div className="w-[170px] aspect-square rounded-full border border-stone-200 bg-black/5 relative overflow-hidden flex items-center justify-center shrink-0">
                              {/* Radial sweep glow grid */}
                              <div className="absolute inset-0 bg-[radial-gradient(#7C95E4_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-15" />
                              <div className="absolute w-32 h-32 rounded-full border border-dashed border-[#7C95E4]/25 animate-spin" style={{ animationDuration: "18s" }} />
                              <div className="absolute w-20 h-20 rounded-full border border-[#90A98C]/30 animate-pulse" />
                              
                              <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ repeat: Infinity, duration: 4.5, ease: "linear" }}
                                style={{ transformOrigin: "center" }}
                                className="absolute inset-0 border-r-2 border-dashed border-[#7C95E4]/40 z-0"
                              />

                              {/* Pinging GPS pinpoint coordinate badge */}
                              <div className="relative z-10 flex flex-col items-center gap-1">
                                <motion.div
                                  animate={{ y: [0, -6, 0] }}
                                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                  className="text-[#7C95E4] drop-shadow-lg"
                                >
                                  <MapPin size={34} className="fill-[#7C95E4]/20 text-[#7C95E4]" />
                                </motion.div>
                                <span className="text-[8px] font-mono font-bold bg-[#7C95E4] text-white px-2 py-0.5 rounded-full uppercase leading-none">MEADOW PIN</span>
                              </div>

                              <div className="absolute top-2 left-2 text-[7px] font-mono uppercase bg-white/90 border border-stone-150 px-1.5 py-0.5 rounded">
                                Radar Live • 2026
                              </div>
                            </div>

                            {/* Coordinate spec data */}
                            <div className="flex-1 text-left flex flex-col gap-3">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-mono tracking-widest text-[#90A98C] font-black uppercase">Pins Broadcast Incoming</span>
                              </div>

                              <h4 className="font-serif font-black text-lg text-stone-800 leading-tight">Addis Ababa Secret Area Garden</h4>
                              
                              <p className="text-xs text-stone-500 leading-relaxed font-sans font-light">
                                For maximum comfort and neat safety, the active meadow GPS coordinates inside Addis Ababa will be shared live here 24 hours before early Sunday kick-off.
                              </p>

                              <div className="border-t border-stone-200/60 pt-3 flex flex-wrap items-center gap-4">
                                <div>
                                  <span className="block text-[8px] font-mono uppercase text-stone-400">Zone Area</span>
                                  <span className="text-xs font-bold text-stone-700">Addis Ababa, Ethiopia</span>
                                </div>
                                <div className="h-6 w-[1.5px] bg-stone-200"></div>
                                <div>
                                  <span className="block text-[8px] font-mono uppercase text-stone-400 font-medium">Precision Grid</span>
                                  <span className="text-xs font-mono font-bold text-stone-700">9.0300° N, 38.7400° E</span>
                                </div>
                              </div>

                              <div className="mt-2 text-left">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={downloadICSFile}
                                  className={`py-2.5 px-5 rounded-xl text-[10px] font-mono uppercase font-black tracking-widest transition-all inline-flex items-center gap-2 cursor-pointer ${themeStyles.buttonPrimary}`}
                                >
                                  <Calendar size={12} /> Sync Calendar File (.ics)
                                </motion.button>
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      )}

                      {/* --- TAB PANEL: VIBES & MUSIC KEYS --- */}
                      {activeTab === "vibes" && (
                        <motion.div
                          key="vibes-panel-view"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.25 }}
                          className={`glass-card p-6 sm:p-10 rounded-[32px] border ${themeStyles.panelBg}`}
                        >
                          {/* Delicacies section */}
                          <div className="text-left mb-6">
                            <h3 className="text-xl sm:text-2xl font-serif font-black">Picnic Nibble Feasts</h3>
                            <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase mt-0.5 font-bold">MEADOW REFRESHMENTS MENU</p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            {[
                              { emoji: "🍩", label: "Gourmet Cupcakes", notes: "Frosted Sweetness" },
                              { emoji: "🍓", label: "Fresh Berries", notes: "Sun-ripened organic" },
                              { emoji: "🥤", label: "Fruity Coolers", notes: "Freshly squeezed mint" },
                              { emoji: "🥪", label: "Meadow Sliders", notes: "Sandwich blocks" }
                            ].map((food, idx) => (
                              <div key={idx} className="bg-[#FAF8F5] border border-stone-200 p-4 rounded-2xl flex flex-col items-center gap-1.5 shadow-sm hover:translate-y-[-2px] transition-transform">
                                <span className="text-3xl">{food.emoji}</span>
                                <h5 className="text-xs font-bold text-stone-700">{food.label}</h5>
                                <span className="text-[9px] font-sans font-light text-stone-400 leading-none">{food.notes}</span>
                              </div>
                            ))}
                          </div>

                          {/* Activities section */}
                          <div className="text-left mb-6 mt-8">
                            <h3 className="text-xl sm:text-2xl font-serif font-black">Under the Sun Activities</h3>
                            <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase mt-0.5 font-bold">GAME LOOPS & FUN DECK</p>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                            {[
                              { emoji: "🃏", label: "Card game loops", notes: "Uno & Cards" },
                              { emoji: "🤫", label: "Garden Mafia", notes: "Social logic deduction" },
                              { emoji: "🎙️", label: "Karaoke tunes", notes: "Picnic mic" },
                              { emoji: "📸", label: "Polaroid frames", notes: "Cozy memories" }
                            ].map((act, idx) => (
                              <div key={idx} className="bg-[#FAF8F5] border border-stone-200 p-4 rounded-2xl flex flex-col items-center gap-1.5 shadow-sm hover:translate-y-[-2px] transition-transform">
                                <span className="text-3xl">{act.emoji}</span>
                                <h5 className="text-xs font-bold text-stone-700">{act.label}</h5>
                                <span className="text-[9px] font-sans font-light text-stone-400 leading-none">{act.notes}</span>
                              </div>
                            ))}
                          </div>

                          {/* Realistic Interactive Synthesizer Keyboard */}
                          <div className="border-t border-dashed border-stone-200 mt-8 pt-8">
                            <div className="text-center mb-5">
                              <h4 className="font-serif font-black text-sm">🎹 Meadow Interactive Retro Synthesizer 🎹</h4>
                              <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1">
                                Play pure synthesized garden melodies using standard Web Audio frequency blocks.
                              </p>
                            </div>

                            {/* Beautiful visualizer oscillator lines */}
                            <div className="w-full h-12 bg-stone-900 rounded-2xl mb-5 flex items-end justify-between px-6 py-2 overflow-hidden border border-stone-800 relative shadow-inner">
                              <span className="absolute top-1 right-2 text-[7px] font-mono text-emerald-400 uppercase tracking-widest animate-pulse">Frequency Oscillator Channel • Active</span>
                              {Array.from({ length: 24 }).map((_, idx) => (
                                <motion.div
                                  key={idx}
                                  animate={{
                                    height: [
                                      "8px", 
                                      `${15 + Math.random() * 24}px`, 
                                      `${5 + Math.random() * 10}px`, 
                                      "8px"
                                    ]
                                  }}
                                  transition={{
                                    duration: 1 + Math.random(),
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                  className="w-[3px] bg-emerald-400/80 rounded-full"
                                />
                              ))}
                            </div>

                            {/* Audio Synth keys */}
                            <div className="flex justify-center items-stretch gap-1.5 max-w-md mx-auto h-24 bg-stone-950 p-2.5 rounded-3xl border border-stone-800 relative z-10 shadow-sm shadow-[#7C95E4]/5">
                              {[
                                { noteName: "C5", freq: 523.25, badge: "C" },
                                { noteName: "D5", freq: 587.33, badge: "D" },
                                { noteName: "E5", freq: 659.25, badge: "E" },
                                { noteName: "F5", freq: 698.46, badge: "F" },
                                { noteName: "G5", freq: 783.99, badge: "G" },
                                { noteName: "A5", freq: 880.00, badge: "A" },
                                { noteName: "B5", freq: 987.77, badge: "B" },
                                { noteName: "C6", freq: 1046.50, badge: "C'" }
                              ].map((keyItem, index) => (
                                <button
                                  key={index}
                                  onClick={() => playSynthesizerNode(keyItem.freq)}
                                  className="flex-1 bg-white hover:bg-stone-100 active:bg-stone-200 transition-colors border border-stone-200 rounded-lg flex flex-col justify-end items-center pb-2 cursor-pointer shadow-sm relative active:translate-y-[4px] active:shadow-none"
                                >
                                  <span className="text-[7px] font-mono font-bold text-stone-400 mb-0.5">{keyItem.noteName}</span>
                                  <span className="text-[10px] font-mono font-black text-stone-700 leading-none">{keyItem.badge}</span>
                                </button>
                              ))}
                            </div>

                            {/* Sound fx soundboard row */}
                            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-md mx-auto">
                              {[
                                { id: "bird", label: "🐦 Sweet Pop" },
                                { id: "spark", label: "🔥 Cozy Spark" },
                                { id: "breeze", label: "🍃 Synther Breeze" },
                                { id: "bubble", label: "🎉 Popper Burst" }
                              ].map((b) => (
                                <button
                                  key={b.id}
                                  onClick={() => playSynthesizedTone(b.id as any)}
                                  className="px-4 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 active:scale-95 transition-all rounded-xl text-xs font-mono font-semibold text-stone-600 cursor-pointer"
                                >
                                  {b.label}
                                </button>
                              ))}
                            </div>

                          </div>
                        </motion.div>
                      )}

                      {/* --- TAB PANEL: GIFTS --- */}
                      {activeTab === "gifts" && (
                        <motion.div
                          key="gifts-panel-view"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.25 }}
                          className={`glass-card p-6 sm:p-10 rounded-[32px] border ${themeStyles.panelBg}`}
                        >
                          <div className="text-left mb-6">
                            <h3 className="text-xl sm:text-2xl font-serif font-black">Birthday Gestures Guide</h3>
                            <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase mt-0.5 font-bold">THOUGHTFUL IDEAS</p>
                          </div>

                          <div className="max-w-xl text-left flex flex-col gap-4">
                            <p className="text-xs sm:text-sm font-sans text-stone-500 leading-relaxed font-light">
                              Your cheerful presence and wide laughs occupy the absolute best birthday gift Nati could request! However, if you are feeling very generous and want to bring a little birthday package, here are some nice directions suited especially for his taste:
                            </p>

                            <div className="flex flex-col gap-3.5 mt-2 bg-stone-50 p-5 rounded-2xl border border-stone-200/60 shadow-inner">
                              {[
                                { tag: "🍪 FEAST", label: "Sweets, chips, or sparkling garden juices for the park afternoon tables." },
                                { tag: "📺 ANIME", label: "Any little keepsakes, prints, stickers, or books related to manga & beautiful anime vibes." },
                                { tag: "⌚ WRIST", label: "Fashion accessories, wristwatches, or customized coordinate gear suited for daily loops." }
                              ].map((item, idx) => (
                                <div key={idx} className="flex gap-3.5 items-start">
                                  <span className="text-[9px] font-mono uppercase bg-amber-100 text-amber-800 border-amber-200 border px-1.5 py-0.5 rounded-md shrink-0 block font-bold tracking-wider leading-none">{item.tag}</span>
                                  <p className="text-xs sm:text-sm text-stone-600 font-sans leading-snug">{item.label}</p>
                                </div>
                              ))}
                            </div>

                            <div className="border-t border-stone-200/60 pt-6 text-center mt-3">
                              <span className="font-cursive text-2xl text-[#7C95E4] block italic leading-none">
                                Purely optional sweet gestures 🤍
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* --- TAB PANEL: RSVP --- */}
                      {activeTab === "rsvp" && (
                        <motion.div
                          key="rsvp-panel-view"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.25 }}
                          className="flex flex-col gap-6"
                        >
                          <div className={`glass-card p-6 sm:p-10 rounded-[32px] border ${themeStyles.panelBg}`}>
                            <div className="text-center mb-6">
                              <h3 className="text-xl sm:text-2xl font-serif font-black">Join Nati's Picnic</h3>
                              <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase mt-0.5">ESTABLISH MEADOW REGISTRY</p>
                            </div>

                            <AnimatePresence mode="wait">
                              {submissionSuccess && lastSubmittedGuest ? (
                                <motion.div
                                  key="success-card-view"
                                  initial={{ scale: 0.95, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.95, opacity: 0 }}
                                  className="max-w-md mx-auto text-center flex flex-col items-center py-4 relative"
                                >
                                  {/* Spectacular Exploding Particles Emitter */}
                                  <div className="absolute inset-0 pointer-events-none overflow-visible z-20">
                                    {Array.from({ length: 48 }).map((_, i) => {
                                      const angle = (i * (360 / 48)) + (Math.random() * 20 - 10);
                                      const speed = 120 + Math.random() * 240;
                                      const rad = (angle * Math.PI) / 180;
                                      const targetX = Math.cos(rad) * speed;
                                      const targetY = Math.sin(rad) * speed - 50;
                                      const targetZ = Math.random() * 400 - 200;
                                      
                                      const scale = 0.5 + Math.random() * 1.5;
                                      const duration = 1.6 + Math.random() * 1.5;
                                      const delay = Math.random() * 0.08;

                                      const emojis = ["🌸", "🌿", "✨", "🤍", "🎉", "🍒", "🎈", "🌻"];
                                      const emoji = emojis[i % emojis.length];

                                      return (
                                        <motion.div
                                          key={i}
                                          initial={{ x: 0, y: 0, z: 0, scale: 0, opacity: 0 }}
                                          animate={{
                                            x: [0, targetX],
                                            y: [0, targetY],
                                            z: [0, targetZ],
                                            scale: [0, scale, scale, 0],
                                            opacity: [0, 1, 1, 0],
                                            rotate: [0, Math.random() * 720 - 360]
                                          }}
                                          transition={{
                                            duration: duration,
                                            delay: delay,
                                            ease: [0.1, 0.88, 0.3, 1]
                                          }}
                                          style={{
                                            position: "absolute",
                                            left: "50%",
                                            top: "50%",
                                            transform: "translate(-50%, -50%)",
                                            transformStyle: "preserve-3d"
                                          }}
                                          className="text-lg pointer-events-none"
                                        >
                                          {emoji}
                                        </motion.div>
                                      );
                                    })}
                                  </div>

                                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${themeStyles.accentBg}`}>
                                    <Heart size={38} className={`${themeStyles.accent} fill-current animate-pulse`} />
                                  </div>

                                  <h4 className="font-serif font-black text-xl mb-1 text-stone-800">Awesome, {lastSubmittedGuest.name}!</h4>
                                  <p className="text-xs text-stone-500 font-sans font-light leading-relaxed mb-6">
                                    Your secure RSVP submission is saved inside Nati's meadow registry database. Meba will be notified of your entry instantly! 🌿🤍
                                  </p>

                                  {/* Custom Voucher Receipt */}
                                  <div className="w-full bg-stone-50 border border-stone-200/60 p-5 rounded-2xl text-left flex flex-col gap-2 relative overflow-hidden shadow-inner font-sans">
                                    <div className="absolute -left-3 top-1/2 w-6 h-6 rounded-full bg-white border-r border-stone-200/50 -translate-y-1/2" />
                                    <div className="absolute -right-3 top-1/2 w-6 h-6 rounded-full bg-white border-l border-stone-200/50 -translate-y-1/2" />
                                    
                                    <div className="flex justify-between items-center text-[9px] font-mono text-stone-400 uppercase tracking-widest">
                                      <span>REGISTRY INVOICE</span>
                                      <span className={`px-2.5 py-0.5 rounded-full font-bold ${lastSubmittedGuest.attending ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                                        {lastSubmittedGuest.attending ? "✓ Attending" : "Declined"}
                                      </span>
                                    </div>
                                    <div className="border-t border-dashed border-stone-200 my-1" />
                                    <div className="flex flex-col gap-1 text-stone-700 text-xs">
                                      <span className="font-bold text-stone-850">{lastSubmittedGuest.name}</span>
                                      {lastSubmittedGuest.song && (
                                        <p className="text-[10px] text-stone-400 font-mono">🎵 Requested music: {lastSubmittedGuest.song}</p>
                                      )}
                                      <p className="italic text-stone-500 mt-1">"{lastSubmittedGuest.note}"</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-3 w-full mt-6">
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={downloadICSFile}
                                      className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-center cursor-pointer font-mono duration-150 flex items-center justify-center gap-2 ${themeStyles.buttonPrimary}`}
                                    >
                                      <Calendar size={13} /> Add Picnic to Calendar
                                    </motion.button>
                                    
                                    <button
                                      onClick={() => {
                                        setSubmissionSuccess(false);
                                        playCozySpark();
                                      }}
                                      className="text-[9px] font-mono uppercase tracking-widest text-stone-400 hover:text-[#7C95E4] transition-colors mt-2 cursor-pointer"
                                    >
                                      ← Register another person
                                    </button>
                                  </div>
                                </motion.div>
                              ) : (
                                <motion.form
                                  key="rsvp-core-form"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  onSubmit={handleFormSubmit}
                                  className="max-w-md mx-auto flex flex-col gap-4 text-left"
                                >
                                  <div>
                                    <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-1">Your Name *</label>
                                    <input
                                      type="text"
                                      required
                                      value={formName}
                                      onChange={(e) => setFormName(e.target.value)}
                                      placeholder="Who is filling this invite?"
                                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#7C95E4] bg-white text-stone-850 placeholder-stone-400 text-sm shadow-sm"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-1">PICNIC ATTENDANCE</label>
                                    <div className="grid grid-cols-2 gap-3 mt-1.5 text-center">
                                      <button
                                        type="button"
                                        onClick={() => { setFormAttending(true); playCozySpark(); }}
                                        className={`py-3 rounded-xl text-xs font-bold tracking-wide cursor-pointer border transition-all ${
                                          formAttending 
                                            ? `${theme === "brutalist" ? "bg-black text-white" : "bg-[#7C95E4] text-white border-transparent"}` 
                                            : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                                        }`}
                                      >
                                        Count me in! 🌸
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => { setFormAttending(false); playCozySpark(); }}
                                        className={`py-3 rounded-xl text-xs font-bold tracking-wide cursor-pointer border transition-all ${
                                          !formAttending 
                                            ? "bg-rose-500 text-white border-transparent" 
                                            : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                                        }`}
                                      >
                                        Can't make it 😢
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-1">Karaoke or Sunset Tune Song Request</label>
                                    <input
                                      type="text"
                                      value={formSong}
                                      onChange={(e) => setFormSong(e.target.value)}
                                      placeholder="What should we play on the grass?"
                                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#7C95E4] bg-white text-stone-850 placeholder-stone-400 text-sm shadow-sm"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-1">Sweet Message for Birthday Boy</label>
                                    <textarea
                                      value={formNote}
                                      onChange={(e) => setFormNote(e.target.value)}
                                      placeholder="Leave a funny note or sweet comment..."
                                      rows={2}
                                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#7C95E4] bg-white text-stone-850 placeholder-stone-400 text-sm shadow-sm resize-none"
                                    />
                                  </div>

                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest text-center cursor-pointer font-mono duration-150 ${themeStyles.buttonPrimary}`}
                                  >
                                    Send secure RSVP 💌
                                  </motion.button>
                                </motion.form>
                              )}
                            </AnimatePresence>
                          </div>

                          <span className="text-[10px] font-mono uppercase text-stone-400 tracking-wider text-center block mt-3">
                            📥 Instant Telegram API routing is enabled to inform Meba 🔔
                          </span>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </div>

                </div>

              </div>

              {/* REAL-TIME RSVP GUESTBOOK WALL SCREEN */}
              <div className="mt-12 text-left" id="meadow-guestbook-wall">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1.5 h-6 rounded bg-[#7C95E4]" />
                  <h3 className={`text-xl font-serif font-black ${themeStyles.headingText}`}>
                    Meadow Custom Guest Wall ({rsvpList.length})
                  </h3>
                </div>

                {rsvpList.length === 0 ? (
                  <p className="text-stone-400 text-xs italic">No registrations submitted yet. Break the mold and register first!</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rsvpList.map((g, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -4, rotate: (idx % 2 === 0 ? -1 : 1) * 0.5 }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 220, damping: 20 }}
                        className={`p-6 rounded-3xl border ${themeStyles.guestCardBg} relative overflow-hidden flex flex-col justify-between aspect-[16/10]`}
                      >
                        {/* Polaroid photo mock style */}
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest leading-none">
                              Registry Member • N°{String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className={`text-[8px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full font-bold leading-none ${
                              g.attending ? "bg-emerald-100 text-emerald-800" : "bg-rose-100/50 text-rose-700"
                            }`}>
                              {g.attending ? "✓ Attending" : "Declined"}
                            </span>
                          </div>

                          <h4 className="font-serif font-black text-sm text-[#2B2F38] tracking-tight">{g.name}</h4>
                          <p className="text-xs text-stone-500 font-sans italic mt-2 leading-relaxed">
                            "{g.note}"
                          </p>
                        </div>

                        {/* Song request record badge */}
                        <div className="border-t border-dashed border-stone-200/50 pt-3 mt-3 flex justify-between items-center">
                          {g.song && (
                            <div className="flex items-center gap-2 text-[9px] font-mono text-stone-450 truncate max-w-[70%]">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                className="text-stone-400 shrink-0"
                              >
                                <Disc size={11} />
                              </motion.div>
                              <span className="truncate">Req: <strong className="text-stone-600 font-semibold">{g.song}</strong></span>
                            </div>
                          )}
                          <span className="text-[8px] font-mono text-stone-400 shrink-0 uppercase">{g.date || "June 2026"}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* POSTER FOOTER DESIGN CREDITS */}
              <div className="max-w-xl mx-auto w-full px-6 text-center mt-12 bg-white/40 border border-stone-200/50 rounded-3xl p-5 shadow-sm">
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-stone-400 block mb-2.5">
                  POSTER THEME CONFIGURATION SELECTOR
                </span>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {[
                    { id: "swiss", label: "🌸 Periwinkle" },
                    { id: "acid", label: "🌿 Sage Garden" },
                    { id: "sunset", label: "🤍 Rose champagne" },
                    { id: "aurora", label: "✨ Twilight Star" },
                    { id: "brutalist", label: "🔳 Stark Switzerland" }
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

            </main>

            <footer className="mt-16 text-center text-xs text-stone-400 select-none flex flex-col gap-1 tracking-widest font-mono uppercase pb-12">
              <p>please keep this invitation link private 😌✨</p>
              <p className="font-bold text-stone-500">DRESS CUTE • ARRIVE ON TIME • LET,S GROOVE TOGETHER 🤍</p>
            </footer>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
