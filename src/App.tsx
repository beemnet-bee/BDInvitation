import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Calendar, Share2, MapPin, 
  Clock, Check, Heart, User, Music, MessageSquare, 
  Info, Leaf, Gift, Smile, ArrowRight, Volume2, VolumeX, Mail,
  Disc, Compass, Layers, Music4, Star, ChevronRight, CornerDownRight,
  Lock, Unlock, Eye, EyeOff
} from "lucide-react";
import { CardThemeType } from "./types";
import AmbientBackground from "./components/AmbientBackground";
import { 
  playPopSound, playCozySpark, playCelebrationBurst, 
  playInvitationTheme, startAmbientBackground, stopAmbientBackground 
} from "./utils/audio";

// SECURE TELEGRAM FALLBACK CONSTANTS FOR VERCEL DOMAIN INTEGRATION
const TELEGRAM_TOKEN = "8554836962:AAG0C4kFkGbjaMHpEirFbH47M2RxZmFvp8c";
const TELEGRAM_CHAT_ID = "5970769337";

const sendTelegramNotificationClient = (entry: any) => {
  try {
    const statusIcon = entry.attending ? "✅ YES, Count me in! 🎉" : "❌ NO, Can't make it 😢";
    const messageText = 
      `🔔 *[Vercel Cloud RSVP] New RSVP Received!* 🌿🤍\n\n` +
      `👤 *Guest Name:* ${entry.name}\n` +
      `🎟️ *Attending:* ${statusIcon}\n` +
      `🎵 *Song Request:* ${entry.song}\n` +
      `💬 *Message:* "${entry.note}"\n\n` +
      `📅 *Date Sent:* ${entry.date}`;

    fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: messageText,
        parse_mode: "Markdown"
      })
    })
      .then(tgRes => {
        if (!tgRes.ok) {
          console.error("Vercel client Telegram API notification failed with status:", tgRes.status);
        } else {
          console.log("Vercel client Telegram notification routed successfully!");
        }
      })
      .catch(tgErr => {
        console.error("Client fallback Telegram delivery failed:", tgErr);
      });
  } catch (tgOuterErr) {
    console.error("Client fallback Telegram system error:", tgOuterErr);
  }
};

// Initial standard preset guests to keep the meadow wall beautiful and rich
const OFFICIAL_GUESTS_DATA = [
  { id: "barkot", display: "Barkot", emoji: "🐨" },
  { id: "beemnet", display: "Beemnet", emoji: "✨" },
  { id: "betibeb", display: "Betibeb", emoji: "🎨" },
  { id: "bini", display: "Bini", emoji: "🎸" },
  { id: "estube", display: "Estube", emoji: "🧁" },
  { id: "gebre", display: "Gebre", emoji: "🛹" },
  { id: "haild", display: "Haild", emoji: "☀️" },
  { id: "hunda", display: "Hunda", emoji: "🦁" },
  { id: "meba", display: "Meba D. GOAT", emoji: "👑" },
  { id: "ruth", display: "Ruth", emoji: "🌸" },
  { id: "sifen", display: "Sifen", emoji: "🐳" },
  { id: "tibebe", display: "Tibebe", emoji: "🍀" },
  { id: "yonas", display: "Yonas", emoji: "🕺" }
];

const INITIAL_GUESTS: any[] = [];

// Secret planning tips for surprise Nati 20th birthday picnic
const SECRET_TIPS = [
  {
    title: "Hide any Popper Confetti 🥳",
    desc: "Keep all party poppers, celebratory whistles, or biodegradable botanical confetti tucked deep inside your pockets or backpacks until the exact candle blow!"
  },
  {
    title: "The Arrival Surprise Target 🕰️",
    desc: "We want Nati to arrive first at Korea Park so we can surprise him under the large centenary trees! Please coordinate to arrive by 3:00 PM precisely (or 10-15 minutes early)."
  },
  {
    title: "Surprise Birthday Chorus 🎵",
    desc: "We're setting up a quick surprise acoustic song circle during the cake altar blow. Keep your voices clear and ready for the signal!"
  },
  {
    title: "Secret Garden Wishes 💌",
    desc: "Submit a secret message on the guest register (RSVP) tab down below of this web application! Nati won't access the list until the picnic celebration is officially in full play."
  }
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

  const [isNameDropdownOpen, setIsNameDropdownOpen] = useState(false);

  const isOfficialGuest = (name: string) => {
    const norm = name.trim().toLowerCase();
    return OFFICIAL_GUESTS_DATA.some(g => g.id === norm || g.display.toLowerCase() === norm);
  };

  const matchedSuggestions = OFFICIAL_GUESTS_DATA.filter((guest) => {
    const q = formName.trim().toLowerCase();
    if (!q) return true;
    return (
      guest.display.toLowerCase().includes(q) ||
      guest.id.toLowerCase().includes(q)
    );
  });

  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [lastSubmittedGuest, setLastSubmittedGuest] = useState<any>(null);

  // Envelope tilt physics coordinates
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const envelopeRef = useRef<HTMLDivElement>(null);

  // Live ticking Clock to track Addis Ababa standard time
  const [addisTime, setAddisTime] = useState("");

  // Target Banner interaction states
  const [isHoveredTitle, setIsHoveredTitle] = useState(false);
  const [isHoveredPill, setIsHoveredPill] = useState(false);

  // Interactive map states
  const [mapMode, setMapMode] = useState<"layout" | "gps">("layout");
  const [selectedMapZone, setSelectedMapZone] = useState<"lawn" | "cake" | "drinks" | "fruits" | "snacks">("lawn");

  // Secret planning states
  const [isSecretRevealed, setIsSecretRevealed] = useState(false);
  const [hasSwornSecret, setHasSwornSecret] = useState(false);
  const [secretSlideIndex, setSecretSlideIndex] = useState(0);
  const [secretWhisper, setSecretWhisper] = useState("");
  const [whispersList, setWhispersList] = useState<string[]>(() => {
    const saved = localStorage.getItem("picnic_secret_whispers");
    return saved ? JSON.parse(saved) : [
      "Bring some cool balloons!🎈",
      "Let's play some fast card game loops of Uno! 🃏",
    ];
  });

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

    const trimmed = formName.trim();
    const matched = OFFICIAL_GUESTS_DATA.find(g => 
      g.id === trimmed.toLowerCase() || 
      g.display.toLowerCase() === trimmed.toLowerCase()
    );

    if (!matched) {
      playPopSound();
      return;
    }

    const payload = {
      name: matched.display, // Standardized display name
      attending: formAttending,
      song: formSong.trim() || "Let's Groove!",
      note: formNote.trim() || "Can't wait to hang out! 🤍",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };

    // Auto-detect if deployed on Vercel cloud domains
    const isVercelHost = typeof window !== "undefined" && (
      window.location.hostname.includes("vercel.app") || 
      window.location.hostname.includes("vercel.dev") || 
      (!window.location.hostname.includes("localhost") && window.location.port !== "3000")
    );

    if (isVercelHost) {
      // Direct Vercel Serverless / Static Mode: process instantly on client & trigger fallback Slack/Telegram
      const updatedList = [payload, ...rsvpList];
      setRsvpList(updatedList);
      localStorage.setItem("picnic_rsvp_list", JSON.stringify(updatedList));
      sendTelegramNotificationClient(payload);
    } else {
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
            const updatedList = [payload, ...rsvpList];
            setRsvpList(updatedList);
            localStorage.setItem("picnic_rsvp_list", JSON.stringify(updatedList));
            sendTelegramNotificationClient(payload);
          }
        })
        .catch(err => {
          console.error("Failed to post RSVP to server API, dropping back to direct Telegram client dispatch:", err);
          const updatedList = [payload, ...rsvpList];
          setRsvpList(updatedList);
          localStorage.setItem("picnic_rsvp_list", JSON.stringify(updatedList));
          sendTelegramNotificationClient(payload);
        });
    }

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
              <div 
                onMouseEnter={() => setIsHoveredTitle(true)}
                onMouseLeave={() => setIsHoveredTitle(false)}
                className="relative overflow-visible max-w-3xl mx-auto w-full p-6 sm:p-10 rounded-[48px] border border-stone-200/50 bg-white/40 backdrop-blur-sm shadow-[0_15px_50px_rgba(124,149,228,0.04)] text-center flex flex-col gap-5 mt-2"
                id="brand-hero-poster-banner"
              >
                {/* Decorative Floral Frame Corners */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t font-serif border-l border-stone-300 rounded-tl-xl pointer-events-none opacity-60" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-stone-300 rounded-tr-xl pointer-events-none opacity-60" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-stone-300 rounded-bl-xl pointer-events-none opacity-60" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-stone-300 rounded-br-xl pointer-events-none opacity-60" />

                {/* Embedded dynamic glowing ambiance orbs */}
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-36 bg-[#7C95E4]/10 rounded-full blur-3xl pointer-events-none -z-10 mix-blend-multiply transition-opacity duration-700" 
                  style={{ opacity: isHoveredTitle ? 1 : 0.65 }} 
                  id="glowing-ambiancer-orb"
                />

                {/* Rotating Vintage Milestone Seal / Stamp on Top Right */}
                <motion.div 
                  className="absolute right-3 top-3 sm:right-6 sm:top-6 z-20 pointer-events-auto cursor-help"
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  onClick={() => {
                    playCozySpark();
                  }}
                  id="milestone-20th-stamp-seal"
                >
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full border-2 border-dashed border-[#90A98C] bg-white shadow-sm p-1">
                    <div className="w-full h-full rounded-full border border-[#90A98C]/40 flex flex-col items-center justify-center bg-stone-50">
                      <span className="text-[6px] sm:text-[8px] font-mono font-bold tracking-widest text-stone-400 uppercase leading-none">EST.</span>
                      <span className="text-sm sm:text-lg font-serif font-black text-[#90A98C] leading-none">20</span>
                      <span className="text-[5px] sm:text-[7px] font-mono tracking-wider text-stone-400 uppercase leading-none">YEARS</span>
                    </div>
                  </div>
                </motion.div>

                {/* Desktop Left Decorative Gentle Swaying Foliage Leaf */}
                <motion.div 
                  className="absolute left-[-24px] top-1/3 hidden lg:flex items-center justify-center pointer-events-none z-10"
                  animate={{ 
                    y: [0, -12, 0],
                    rotate: [-3, 6, -3]
                  }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  id="botanical-swaying-decor-left"
                >
                  <div className={`p-3 rounded-full ${themeStyles.accentBg} ${themeStyles.accent} border ${themeStyles.accentBorder} shadow-md backdrop-blur-sm`}>
                    <Leaf size={20} />
                  </div>
                </motion.div>

                {/* Desktop Right Twinkling Constellation Cosmic Retro Star */}
                <motion.div 
                  className="absolute right-[-24px] top-1/2 hidden lg:flex items-center justify-center pointer-events-none z-10"
                  animate={{ 
                    scale: [0.95, 1.2, 0.95],
                    rotate: [0, 180, 360],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  id="cosmic-constell-decor-right"
                >
                  <div className="p-3 rounded-full bg-white border border-stone-200 shadow-md text-amber-500">
                    <Sparkles size={20} className="filter drop-shadow-sm" />
                  </div>
                </motion.div>

                {/* Sparkling elegant invite tagline with custom elegant botanical divider */}
                <div className="flex flex-col items-center gap-1.5" id="invite-tagline-container">
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-3"
                  >
                    <span className="w-10 h-[1px] bg-[#7C95E4]/20" />
                    <span className="font-cursive text-2xl text-[#7C95E4] select-none tracking-wide">
                      You are cordially invited to
                    </span>
                    <span className="w-10 h-[1px] bg-[#7C95E4]/20" />
                  </motion.div>

                  <div className="flex items-center justify-center gap-1.5 text-stone-300">
                    <span className="w-1 h-1 rounded-full bg-[#90A98C]/60" />
                    <span className="w-16 h-[1px] bg-gradient-to-r from-transparent to-[#90A98C]/40" />
                    <Leaf size={10} className="text-[#90A98C]/80 transform rotate-45" />
                    <span className="w-16 h-[1px] bg-gradient-to-l from-transparent to-[#90A98C]/40" />
                    <span className="w-1 h-1 rounded-full bg-[#90A98C]/60" />
                  </div>
                </div>

                {/* Aesthetic Stagger-Lift Interactive Header Title */}
                <h1 
                  className={`relative text-4xl sm:text-7xl tracking-tight leading-none uppercase ${themeStyles.headingText} flex flex-wrap items-center justify-center gap-x-4 gap-y-2 select-none py-2`}
                  id="staggered-header-title-box"
                >
                  {/* Primary Word "NATI'S" with subtle custom spring pop */}
                  <motion.span 
                    className="inline-block relative cursor-pointer font-serif font-black text-stone-850 hover:text-stone-900"
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    id="title-part-natis"
                  >
                    NATI'S
                  </motion.span>

                  {/* Cursive handwritten "Picnic" Word with customized SVG drawing loop */}
                  <span className="inline-block relative py-1 mx-1 group cursor-pointer" id="title-part-picnic-container">
                    {/* Background miniature aura pillow */}
                    <span className="absolute -inset-x-3 inset-y-1 bg-[#90A98C]/12 rounded-xl scale-75 group-hover:scale-105 transition-transform duration-300 -z-10" />
                    
                    <motion.span 
                      className="font-cursive italic font-light text-5xl sm:text-8xl text-[#90A98C] normal-case block relative z-10"
                      animate={{ rotate: [-1.5, 1.5, -1.5] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      whileHover={{ scale: 1.1, rotate: -4 }}
                      id="title-part-picnic-text"
                    >
                      Picnic
                    </motion.span>

                    {/* Dynamic calligraphy draw-sweep underline */}
                    <svg className="absolute left-0 bottom-[-4px] w-full h-[6px] overflow-visible pointer-events-none" viewBox="0 0 100 6">
                      <motion.path 
                        d="M 2, 3 Q 50, 6 98, 2" 
                        fill="transparent" 
                        stroke="#90A98C" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: isHoveredTitle ? 1 : 0.85 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    </svg>
                  </span>

                  {/* Secondary Word "BIRTHDAY" in vibrant brand accent periwinkle */}
                  <motion.span 
                    className="inline-block relative cursor-pointer font-serif font-black text-[#7C95E4]"
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    id="title-part-birthday"
                  >
                    BIRTHDAY
                  </motion.span>

                  {/* Floating Blossom & Leaf Sprinkler Particles Burst on Hover */}
                  <AnimatePresence>
                    {isHoveredTitle && (
                      <div className="absolute inset-0 pointer-events-none overflow-visible z-20" id="particle-emitter-overlay">
                        {Array.from({ length: 12 }).map((_, i) => {
                          const angle = i * (360 / 12);
                          const rad = (angle * Math.PI) / 180;
                          const speed = 75 + Math.random() * 95;
                          const targetX = Math.cos(rad) * speed;
                          const targetY = Math.sin(rad) * speed - 15;
                          const emojis = ["🌸", "🌿", "✨", "🌺", "🤍"];
                          const emoji = emojis[i % emojis.length];
                          
                          return (
                            <motion.div
                              key={i}
                              initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                              animate={{ 
                                scale: [0, 1.2, 1, 0], 
                                opacity: [0, 1, 0.8, 0],
                                x: targetX,
                                y: targetY,
                                rotate: [0, Math.random() * 180 - 90]
                              }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 1.3, ease: "easeOut" }}
                              className="absolute text-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-sans"
                            >
                              {emoji}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </AnimatePresence>
                </h1>

                {/* Improved Date Pill with Double Contour Border & Dynamic Countdown Info Trigger */}
                <div className="flex flex-col items-center gap-3.5 mt-2" id="date-pill-zone">
                  <motion.div 
                    onMouseEnter={() => setIsHoveredPill(true)}
                    onMouseLeave={() => setIsHoveredPill(false)}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      playCozySpark();
                      setActiveTab("rsvp");
                    }}
                    className={`relative border-2 border-stone-850 px-8 py-3 rounded-full font-sans font-black text-xs sm:text-sm tracking-[0.2em] bg-white text-stone-850 shadow-md uppercase cursor-pointer select-none ${themeStyles.accentRing} ring-4 transition-all duration-300`}
                    id="interactive-date-pill-button"
                  >
                    <div className="flex items-center gap-2">
                      <motion.span 
                        animate={{ 
                          rotate: isHoveredPill ? [0, -15, 15, -15, 0] : 0,
                          scale: isHoveredPill ? 1.25 : 1
                        }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="text-base animate-bounce"
                        style={{ animationDuration: "3s" }}
                      >
                        🌿
                      </motion.span>
                      <span>Sunday, 7 June 2026 • 3:00 PM – Sunset</span>
                    </div>

                    {/* Soft glowing active rim */}
                    <div className="absolute -inset-1 rounded-full opacity-0 hover:opacity-100 transition-opacity pointer-events-none duration-300 ring-2 ring-[#7C95E4]/20 -z-10" />
                  </motion.div>

                  {/* Elegant Permanent Status & Live Weather Widget */}
                  <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-4 text-[10px] font-mono tracking-widest text-stone-500 bg-stone-50/70 border border-stone-200/60 py-2 px-5 rounded-2xl max-w-lg shadow-sm" id="live-meadow-status-widget">
                    <div className="flex items-center gap-2 border-r border-stone-200/80 pr-4">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block shrink-0" />
                      <span className="font-bold text-stone-700">FORECAST:</span>
                      <span className="text-stone-600">🌤️ 22°C Gentle Sun</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#7C95E4]">★</span>
                      <span className="font-bold text-stone-700">MEADOW:</span>
                      <span className="text-stone-600">Soft Picnic Grass</span>
                    </div>
                  </div>

                  {/* High Quality Persistent Countdown Display */}
                  <div className="w-full max-w-sm bg-white border border-stone-150/80 rounded-2xl p-3 shadow-inner flex items-center justify-around" id="high-quality-persistent-countdown">
                    <div className="text-center">
                      <span className="block text-lg font-serif font-black text-[#7C95E4] leading-none mb-0.5">
                        {timeLeft.isPast ? "0" : timeLeft.days}
                      </span>
                      <span className="text-[7px] font-mono tracking-widest text-stone-400 uppercase">Days</span>
                    </div>
                    <div className="text-stone-250 font-light font-mono text-xs">:</div>
                    <div className="text-center">
                      <span className="block text-lg font-serif font-black text-[#7C95E4] leading-none mb-0.5">
                        {timeLeft.isPast ? "0" : timeLeft.hours}
                      </span>
                      <span className="text-[7px] font-mono tracking-widest text-stone-400 uppercase">Hours</span>
                    </div>
                    <div className="text-stone-250 font-light font-mono text-xs">:</div>
                    <div className="text-center">
                      <span className="block text-lg font-serif font-black text-[#7C95E4] leading-none mb-0.5">
                        {timeLeft.isPast ? "0" : timeLeft.minutes}
                      </span>
                      <span className="text-[7px] font-mono tracking-widest text-stone-400 uppercase">Minutes</span>
                    </div>
                    <div className="text-stone-250 font-light font-mono text-xs">:</div>
                    <div className="text-center animate-pulse" style={{ animationDuration: "1s" }}>
                      <span className="block text-lg font-serif font-black text-[#90A98C] leading-none mb-0.5">
                        {timeLeft.isPast ? "0" : timeLeft.seconds}
                      </span>
                      <span className="text-[7px] font-mono tracking-widest text-stone-400 uppercase">Secs</span>
                    </div>
                  </div>

                  {/* Tap to RSVP action visual promoter */}
                  <div className="h-4 relative overflow-visible" id="floating-countdown-notice-wrap">
                    <AnimatePresence>
                      {isHoveredPill && (
                        <motion.div 
                          initial={{ opacity: 0, y: -4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className={`text-[9px] font-mono uppercase tracking-[0.2em] font-semibold ${theme === 'aurora' ? 'text-[#8FA3E6]' : 'text-[#7C95E4]'}`}
                          id="active-countdown-pill-tooltip"
                        >
                          {timeLeft.isPast ? "Celebration is Live! 🎉" : "Countdown is running live ⏳"}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* DON'T TELL NATI SECRET PLANNER BANNER */}
              <div className="w-full max-w-3xl mx-auto my-6 px-1" id="dont-tell-nati-secret-planner">
                <div className="relative overflow-hidden rounded-[36px] bg-[#90A98C]/10 border border-[#90A98C]/20 backdrop-blur-sm p-6 sm:p-8 shadow-sm flex flex-col gap-5 text-center">
                  
                  {/* Decorative Confidential watermarks */}
                  <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 font-mono text-[70px] font-black text-amber-600/5 select-none uppercase tracking-widest pointer-events-none transform rotate-12">
                    CONFIDENTIAL
                  </div>
                  <div className="absolute bottom-0 left-0 -translate-x-4 translate-y-4 font-mono text-[75px] font-black text-amber-600/5 select-none uppercase tracking-widest pointer-events-none transform -rotate-12">
                    SHH!
                  </div>

                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <div className="flex items-center gap-2 bg-amber-50/90 border border-amber-200/50 px-3.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-[0.2em] text-amber-800 uppercase shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulseinline-block" />
                      <span>🤫 SECRET PLANNING ZONE • DO NOT LET NATI BROWSE THIS</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-850 leading-tight">
                      Don't Tell Nati! 🤫🤐
                    </h2>
                    <p className="text-xs text-stone-550 font-sans font-light max-w-lg leading-relaxed">
                      This is our secret, offline team assembly deck. Absolutely do not let the birthday boy see this panel!
                    </p>
                  </div>

                  {!hasSwornSecret ? (
                    /* SEALED PANEL WITH INTERACTIVE GATED KEY SHIELD */
                    <motion.div 
                      layoutId="secret-gate"
                      className="bg-white border border-stone-150 rounded-[28px] p-6 sm:p-8 flex flex-col items-center gap-4 relative z-10 shadow-sm"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shadow-inner">
                        <Lock size={20} className="animate-pulse" />
                      </div>
                      <div className="text-center">
                        <h4 className="text-xs sm:text-sm font-sans font-bold text-stone-850">The Seal of Trust is Active</h4>
                        <p className="text-[11px] text-stone-500 mt-1 max-w-sm">
                          To unfold the secret meadow surprise, details, and add custom whispers, you must swear the solemn picnic oath.
                        </p>
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setHasSwornSecret(true);
                          setIsSecretRevealed(true);
                          playCelebrationBurst();
                        }}
                        className="mt-1 py-2.5 px-6 rounded-xl font-sans text-[10px] uppercase tracking-widest font-black text-white bg-amber-600 hover:bg-amber-700 shadow-md cursor-pointer transition-all flex items-center gap-2 border-0 focus:outline-none"
                      >
                        I Solemnly Swear to Keep it a Secret! 🤞🤐
                      </motion.button>
                    </motion.div>
                  ) : (
                    /* UNLOCKED SHH! ACTIVE DESK WITH CAROUSEL */
                    <motion.div 
                      layoutId="secret-gate"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/95 border border-amber-200/40 rounded-[28px] p-5 sm:p-6 text-left relative z-10 shadow-md flex flex-col md:flex-row gap-6"
                    >
                      {/* Left: Swiped Carousel Tips */}
                      <div className="flex-1 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-150 pb-5 md:pb-0 md:pr-6 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-[#90A98C] font-bold">
                              🤫 SURPRISE PLAN {secretSlideIndex + 1} OF {SECRET_TIPS.length}
                            </span>
                            <span className="text-xs">✨</span>
                          </div>
                          
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={secretSlideIndex}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.2 }}
                              className="min-h-[85px] sm:min-h-[75px]"
                            >
                              <h5 className="font-serif font-black text-base text-stone-850 leading-tight flex items-center gap-2">
                                <span className="inline-block p-1 bg-amber-50 rounded text-xs select-none">💬</span>
                                {SECRET_TIPS[secretSlideIndex].title}
                              </h5>
                              <p className="text-[11px] text-stone-500 font-sans font-light mt-1.5 leading-relaxed">
                                {SECRET_TIPS[secretSlideIndex].desc}
                              </p>
                            </motion.div>
                          </AnimatePresence>
                        </div>

                        {/* Interactive Slide Controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              playPopSound();
                              setSecretSlideIndex((prev) => (prev - 1 + SECRET_TIPS.length) % SECRET_TIPS.length);
                            }}
                            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-all cursor-pointer focus:outline-none bg-white"
                          >
                            <ChevronRight size={13} className="transform rotate-180" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playPopSound();
                              setSecretSlideIndex((prev) => (prev + 1) % SECRET_TIPS.length);
                            }}
                            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-all cursor-pointer focus:outline-none bg-white"
                          >
                            <ChevronRight size={13} />
                          </button>
                          <span className="text-[9px] font-mono text-stone-450 select-none ml-2">
                            Browse surprise details
                          </span>
                        </div>
                      </div>

                      {/* Right: Whisper Suggestion wall */}
                      <div className="w-full md:w-64 shrink-0 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="text-[9px] font-mono font-bold tracking-widest text-[#7C95E4] uppercase flex items-center gap-1.5">
                              <span>🔒</span> WHISPER PLANNING BOX
                            </h6>
                            <span className="text-[8px] font-mono text-stone-400">Anonymous</span>
                          </div>
                          
                          {/* List of anonymous whispers */}
                          <div className="h-20 overflow-y-auto mb-3 bg-[#FAF8F5] p-2 rounded-xl border border-stone-150 text-[10px] font-sans font-light text-stone-500 flex flex-col gap-1.5 scrollbar-none">
                            {whispersList.map((whisper, idx) => (
                              <div key={idx} className="flex gap-1.5 items-start border-b border-stone-100/60 pb-1.5 last:border-0 last:pb-0">
                                <span className="text-amber-500 shrink-0">🌿</span>
                                <span className="italic leading-snug">{whisper}</span>
                              </div>
                            ))}
                          </div>

                          {/* Fast input form to submit whisper */}
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!secretWhisper.trim()) return;
                              const updatedWhispers = [secretWhisper, ...whispersList];
                              setWhispersList(updatedWhispers);
                              localStorage.setItem("picnic_secret_whispers", JSON.stringify(updatedWhispers));
                              setSecretWhisper("");
                              playCelebrationBurst();
                            }}
                            className="flex gap-1"
                          >
                            <input
                              type="text"
                              value={secretWhisper}
                              onChange={(e) => setSecretWhisper(e.target.value)}
                              placeholder="Add surprise suggestion..."
                              className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7C95E4] font-sans font-light"
                            />
                            <button
                              type="submit"
                              className="px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer border-0 transition-all flex items-center justify-center focus:outline-none font-black"
                            >
                              Send
                            </button>
                          </form>
                          <p className="text-[7px] text-stone-400 font-mono mt-1.5 leading-none">
                            *This planning block will automatically reset if you refresh.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
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
                          <circle cx="32" cy="32" r="28" stroke={theme === "brutalist" ? "black" : "#7C95E4"} strokeWidth="6" strokeDasharray="175" strokeDashoffset={175 - (175 * Math.min(totalAttending, OFFICIAL_GUESTS_DATA.length)) / OFFICIAL_GUESTS_DATA.length} fill="transparent" strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-xs font-mono font-black">{totalAttending}/{OFFICIAL_GUESTS_DATA.length}</span>
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
                  <div className="w-full overflow-x-auto pb-2 scrollbar-none flex justify-start sm:justify-center" id="navigation-tabs-deck-scroller">
                    <nav className="flex gap-1 p-1 bg-white/80 border border-stone-200/50 rounded-full shadow-sm min-w-max mx-auto sm:mx-0">
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
                            className={`relative px-3 sm:px-[18px] py-1.5 sm:py-2 rounded-full font-sans text-xs sm:text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer focus:outline-none ${
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
                          className={`glass-card p-4 sm:p-8 rounded-[32px] border flex flex-col gap-6 ${themeStyles.panelBg}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="text-left animate-fade-in">
                              <h3 className="text-xl sm:text-2xl font-serif font-black text-stone-850">Korea Park Event Map</h3>
                              <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase mt-0.5">FULLY INTERACTIVE RADAR & LOCATION HUB</p>
                            </div>
                            
                            {/* Toggle switcher between Layout and Real GPS */}
                            <div className="flex p-1 bg-stone-100 rounded-xl border border-stone-200 self-start sm:self-auto shadow-inner">
                              <button
                                type="button"
                                onClick={() => { setMapMode("layout"); playCozySpark(); }}
                                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-mono uppercase font-black transition-all cursor-pointer ${
                                  mapMode === "layout"
                                    ? "bg-white text-stone-850 shadow-sm"
                                    : "text-stone-500 hover:text-stone-700"
                                }`}
                              >
                                🗺️ Picnic Spot Board
                              </button>
                              <button
                                type="button"
                                onClick={() => { setMapMode("gps"); playCozySpark(); }}
                                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-mono uppercase font-black transition-all cursor-pointer ${
                                  mapMode === "gps"
                                    ? "bg-white text-stone-850 shadow-sm"
                                    : "text-stone-500 hover:text-stone-700"
                                }`}
                              >
                                🛰️ Real GPS Navigation
                              </button>
                            </div>
                          </div>

                          {/* Render the selected Map View */}
                          <AnimatePresence mode="wait">
                            {mapMode === "layout" ? (
                              <motion.div
                                key="layout-map"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="flex flex-col gap-6 w-full text-left"
                              >
                                {/* Highly interactive Stylized Garden Layout Map Canvas */}
                                <div className="border border-stone-200 rounded-3xl p-4 bg-[#F2EDE4] relative overflow-hidden h-72 sm:h-80 shadow-md">
                                  {/* Dynamic ambient grid background */}
                                  <div className="absolute inset-0 bg-[#E8E2D6] opacity-40 [background-size:24px_24px] bg-[linear-gradient(to_right,#C8BEAF_1px,transparent_1px),linear-gradient(to_bottom,#C8BEAF_1px,transparent_1px)]" />
                                  
                                  {/* Green Meadow circular shapes representing forest canopy */}
                                  <div className="absolute top-[10%] left-[10%] w-24 h-24 rounded-full bg-[#90A98C]/20 blur-md pointer-events-none" />
                                  <div className="absolute bottom-[10%] right-[10%] w-32 h-32 rounded-full bg-[#90A98C]/15 blur-lg pointer-events-none" />
                                  <div className="absolute top-[40%] right-[5%] w-24 h-24 rounded-full bg-[#90A98C]/12 blur-md pointer-events-none" />
                                  
                                  {/* Title seal */}
                                  <div className="absolute bottom-3 left-3 bg-white/90 border border-stone-200/80 px-2 py-1 rounded-lg text-[8px] font-mono leading-none tracking-widest text-stone-500 shadow-sm">
                                    EST. KOREA-ETHIOPIA MEMORIAL PARK (KOREA PARK)
                                  </div>

                                  {/* Picnic map pathways & boundaries */}
                                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                                    <path d="M 50 0 Q 70 120, 50 240 T 70 360" fill="transparent" stroke="#8E8272" strokeWidth="4" strokeDasharray="6,4" />
                                    <path d="M 0 150 Q 180 180, 400 130" fill="transparent" stroke="#8E8272" strokeWidth="3" strokeDasharray="6,4" />
                                  </svg>

                                  {/* Pinpoints mapping */}
                                  {[
                                    { id: "lawn", name: "Center Lawn 🏞️", x: "48%", y: "45%", color: "bg-emerald-500", emoji: "🏞️" },
                                    { id: "cake", name: "Cake Altar 🎂", x: "78%", y: "25%", color: "bg-amber-500", emoji: "🎂" },
                                    { id: "drinks", name: "Drinks Box 🥤", x: "25%", y: "22%", color: "bg-[#7C95E4]", emoji: "🥤" },
                                    { id: "fruits", name: "Fruit Blanket 🍓", x: "18%", y: "68%", color: "bg-rose-500", emoji: "🍓" },
                                    { id: "snacks", name: "Snacks Canopy 🍩", x: "74%", y: "72%", color: "bg-orange-500", emoji: "🍩" },
                                  ].map((zone) => {
                                    const isSelected = selectedMapZone === zone.id;
                                    return (
                                      <button
                                        key={zone.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedMapZone(zone.id as any);
                                          playPopSound();
                                        }}
                                        style={{ left: zone.x, top: zone.y }}
                                        className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20 focus:outline-none"
                                      >
                                        <div className="relative flex items-center justify-center">
                                          {/* Ripple pulse wave for selected pin */}
                                          {isSelected && (
                                            <span className="absolute inline-flex h-12 w-12 rounded-full bg-white animate-ping opacity-25" />
                                          )}
                                          
                                          {/* Visual connection line to map labels */}
                                          <div className={`p-2 sm:p-2.5 rounded-full border-2 ${
                                            isSelected 
                                              ? "bg-white border-stone-850 shadow-lg scale-110" 
                                              : "bg-stone-50 border-stone-200 hover:border-stone-400 hover:scale-105"
                                          } transition-all duration-300 relative z-10 flex items-center justify-center`}>
                                            <span className="text-base sm:text-lg leading-none select-none">{zone.emoji}</span>
                                          </div>

                                          {/* Small tooltip tag */}
                                          <div className={`absolute bottom-[108%] min-w-max bg-stone-900 text-white font-mono text-[8px] sm:text-[9px] uppercase tracking-wider py-1 px-2 rounded-md shadow-md pointer-events-none transition-all duration-300 ${
                                            isSelected ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 scale-95 group-hover:opacity-100 group-hover:translate-y-0"
                                          }`}>
                                            {zone.name}
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Hotspot Details Pane */}
                                <div className="bg-[#FCFBF9] border border-stone-200/80 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm">
                                  <div className="flex-1 flex gap-4 items-start text-left">
                                    <div className="text-3xl sm:text-4xl p-3 bg-white border border-stone-200 shadow-sm rounded-2xl shrink-0 mt-0.5">
                                      {selectedMapZone === "lawn" ? "🏞️" :
                                       selectedMapZone === "cake" ? "🎂" :
                                       selectedMapZone === "drinks" ? "🥤" :
                                       selectedMapZone === "fruits" ? "🍓" : "🍩"}
                                    </div>
                                    <div className="flex flex-col gap-1.5 animate-fade-in">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-mono font-bold tracking-widest text-[#7C95E4] uppercase bg-[#7C95E4]/10 border border-[#7C95E4]/25 px-2 py-0.5 rounded">
                                          {selectedMapZone === "lawn" ? "Main Base" :
                                           selectedMapZone === "cake" ? "Birthday Special" :
                                           selectedMapZone === "drinks" ? "Drinks Chiller" :
                                           selectedMapZone === "fruits" ? "Fresh Fruits Platters" : "Savory Bites"}
                                        </span>
                                      </div>
                                      <h4 className="font-serif font-black text-base sm:text-lg text-stone-850 leading-none">
                                        {selectedMapZone === "lawn" && "Korea Park Centenary Lawn"}
                                        {selectedMapZone === "cake" && "Birthday Cake Altar"}
                                        {selectedMapZone === "drinks" && "Refreshing Drinks Cooler Box"}
                                        {selectedMapZone === "fruits" && "Fresh Fruit Bowl (Banana, Habab, Orange, Strawberries)"}
                                        {selectedMapZone === "snacks" && "Crispy & Savory Snacks Corner (Chips, Cookies, Sambusa, Donuts)"}
                                      </h4>
                                      <p className="text-xs text-stone-500 font-sans font-light leading-relaxed">
                                        {selectedMapZone === "lawn" && "Where we spread out custom picnic blankets, share hilarious stories, tune the acoustical instruments, and launch the garden card game rounds under Addis Ababa's clear, friendly sky."}
                                        {selectedMapZone === "cake" && "The crown milestone center where Nati's majestic 20th birthday cake is served. We gather here at sundown for candle blows, warm snaps, and sweet birthday songs!"}
                                        {selectedMapZone === "drinks" && "Fully packed with cold beverages, citrusy orange juice buckets, premium soft drinks, and custom fruit coolers to beat the friendly summer park temperature!"}
                                        {selectedMapZone === "fruits" && "A stellar, farm-fresh fruit arrangement offering perfectly sliced sweet bananas, cold sweet watermelon cubes (Ethiopian Habab), zesty orange quarters, and vibrant red strawberries."}
                                        {selectedMapZone === "snacks" && "Our sweet and salty backup power block! Features classic salted crispy potato chips, freshly baked chocolate chip cookies, traditional warm Ethiopian savory meat/veggie Sambusas, and powdered ring donuts."}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Practical Action CTA for each Spot */}
                                  <div className="w-full md:w-auto mt-2 md:mt-0 shrink-0 border-t md:border-t-0 md:border-l border-stone-200/80 pt-4 md:pt-0 md:pl-6 text-left">
                                    <span className="block text-[8px] font-mono uppercase text-stone-400 tracking-wider">Zone Instruction</span>
                                    <span className="text-xs font-bold text-stone-700 block mt-0.5">
                                      {selectedMapZone === "lawn" && "Bring card decks!"}
                                      {selectedMapZone === "cake" && "Prepare beautiful wishes!"}
                                      {selectedMapZone === "drinks" && "Ice blocks provided!"}
                                      {selectedMapZone === "fruits" && "Chilled to serve!"}
                                      {selectedMapZone === "snacks" && "Eat warm if possible!"}
                                    </span>
                                    <button 
                                      type="button"
                                      onClick={() => { setActiveTab("vibes"); playCozySpark(); }}
                                      className="text-[9px] font-mono uppercase text-[#7C95E4] hover:text-[#5B73C2] transition-colors mt-2 flex items-center gap-1 cursor-pointer font-bold bg-transparent border-0 p-0 focus:outline-none"
                                    >
                                      Go to Vibes menu <ChevronRight size={10} />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="gps-map"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="flex flex-col gap-4 w-full"
                              >
                                {/* Fully zoomable OpenStreetMap Frame embed */}
                                <div className="rounded-3xl overflow-hidden border border-stone-200 shadow-md relative h-80 bg-stone-100">
                                  <iframe 
                                    width="100%" 
                                    height="100%" 
                                    src="https://www.openstreetmap.org/export/embed.html?bbox=38.7562,9.0232,38.7662,9.0312&amp;layer=mapnik&amp;marker=9.02722,38.76139" 
                                    className="border-0 w-full h-full"
                                    title="Korea Park Addis Ababa"
                                  />
                                  <div className="absolute top-2 left-2 bg-white/95 border border-stone-150 px-2.5 py-1 rounded-xl text-[9px] font-mono uppercase font-black text-stone-600 shadow-sm flex items-center gap-1.5 pointer-events-none">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                    <span>LIVE MAP CHANNEL</span>
                                  </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <MapPin size={20} className="text-[#90A98C]" />
                                    <div>
                                      <h5 className="text-xs font-bold text-stone-700">Korea-Ethiopia Memorial Park (Korea Park)</h5>
                                      <p className="text-[10px] text-stone-400 font-sans mt-0.5">Addis Ababa, Ethiopia (near Bole road / Centenary spots)</p>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                                    <motion.a
                                      href="https://maps.app.goo.gl/iV58btnZk2H4twedA"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className={`py-2 px-4 rounded-xl text-[9px] font-mono uppercase font-black tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer text-center justify-center ${themeStyles.buttonPrimary}`}
                                    >
                                      <MapPin size={11} /> Google Maps Pin ↗
                                    </motion.a>
                                    <motion.button
                                      type="button"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={downloadICSFile}
                                      className="py-2 px-4 rounded-xl text-[9px] font-mono uppercase font-black tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                                    >
                                      <Calendar size={11} /> Sync Calendar
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
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

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                            {[
                              { emoji: "🎂", label: "Milestone Birthday Cake", notes: "Custom Vanilla Frosting" },
                              { emoji: "🥤", label: "Refreshing Drinks", notes: "Ice-cold soda & custom juices" },
                              { emoji: "🍓", label: "Fresh Fruits Platter", notes: "Banana, Habab, Orange, Strawberries" },
                              { emoji: "🍩", label: "Savory & Sweet Snacks", notes: "Chips, Cookies, Sambusa, Donuts" }
                            ].map((food, idx) => (
                              <div key={idx} className="bg-[#FAF8F5] border border-stone-200 p-4 rounded-2xl flex flex-col items-center gap-1.5 shadow-sm hover:translate-y-[-2px] transition-transform">
                                <span className="text-3xl">{food.emoji}</span>
                                <h5 className="text-xs font-bold text-stone-700">{food.label}</h5>
                                <span className="text-[9px] font-sans font-light text-stone-400 leading-none">{food.notes}</span>
                              </div>
                            ))}
                          </div>

                          {/* Korea Park Host Card */}
                          <div className="mt-5 p-4 rounded-2xl border border-[#90A98C]/30 bg-[#90A98C]/5 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex gap-3 items-start">
                              <span className="text-3xl p-1 bg-white border border-[#90A98C]/20 rounded-xl leading-none shadow-sm mt-0.5 sm:mt-0 select-none">🏞️</span>
                              <div>
                                <h5 className="text-xs font-bold text-stone-800">Hosted at Korea-Ethiopia Memorial Park</h5>
                                <p className="text-[10px] text-stone-500 font-sans font-light leading-relaxed mt-0.5">
                                  Korea Park offers a gorgeous, peaceful natural ecosystem featuring beautiful memorial monuments, dense centenary pine shade trees, and pristine open-air picnic grass beds suited for dynamic card loops and birthday karaoke.
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setActiveTab("details"); playCozySpark(); }}
                              className="text-[9px] font-mono uppercase bg-[#90A98C] hover:bg-[#7D9579] text-white font-bold py-2 px-3 rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0 border-0 focus:outline-none"
                            >
                              View on Interactive Map 🗺️
                            </button>
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
                                  className="max-w-md mx-auto flex flex-col gap-4 text-left animate-fade-in"
                                >
                                  <div className="relative">
                                    <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-500 mb-1">Your Name *</label>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        required
                                        value={formName}
                                        onFocus={() => setIsNameDropdownOpen(true)}
                                        onBlur={() => setTimeout(() => setIsNameDropdownOpen(false), 250)}
                                        onChange={(e) => {
                                          setFormName(e.target.value);
                                          setIsNameDropdownOpen(true);
                                        }}
                                        placeholder="Type or select your name..."
                                        className="w-full pl-4 pr-24 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#7C95E4] bg-white text-stone-850 placeholder-stone-400 text-sm shadow-sm"
                                      />

                                      {/* Verified / Not Verified Inline Pill Badge */}
                                      {formName.trim() && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center select-none pointer-events-none">
                                          {isOfficialGuest(formName) ? (
                                            <span className="text-emerald-600 bg-emerald-50 border border-emerald-200/50 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg">
                                              ✓ Listed
                                            </span>
                                          ) : (
                                            <span className="text-rose-600 bg-rose-50 border border-rose-200/50 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg animate-pulse">
                                              ⚠️ Unknown
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Smart Autocomplete Suggestions Dropdown menu */}
                                    <AnimatePresence>
                                      {isNameDropdownOpen && (
                                        <motion.div
                                          initial={{ opacity: 0, y: 5 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: 5 }}
                                          transition={{ duration: 0.15 }}
                                          className="absolute left-0 right-0 top-[105%] z-50 max-h-48 overflow-y-auto bg-white border border-stone-200 rounded-2xl shadow-xl p-2.5 flex flex-col gap-1.5 scrollbar-none"
                                        >
                                          {matchedSuggestions.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                              <div className="text-[8px] font-bold font-mono tracking-widest text-[#7C95E4] uppercase px-2 pb-1 border-b border-stone-100 mb-1">
                                                Surprise June 7 Invited Guest List
                                              </div>
                                              {matchedSuggestions.map((g) => (
                                                <button
                                                  key={g.id}
                                                  type="button"
                                                  onMouseDown={() => {
                                                    setFormName(g.display);
                                                    setIsNameDropdownOpen(false);
                                                    playCozySpark();
                                                  }}
                                                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-stone-50 active:bg-stone-100 transition-colors flex items-center justify-between text-stone-700 font-sans cursor-pointer"
                                                >
                                                  <span className="flex items-center gap-2.5">
                                                    <div className="w-6 h-6 rounded-full bg-[#7C95E4]/10 border border-[#7C95E4]/20 flex items-center justify-center shrink-0 text-[#7C95E4]">
                                                      <User size={12} className="stroke-[2.5]" />
                                                    </div>
                                                    <span className="font-semibold text-stone-850">{g.display}</span>
                                                  </span>
                                                  <span className="text-[8px] font-mono uppercase bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded">
                                                    Tap to Select
                                                  </span>
                                                </button>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="px-3 py-3 text-center">
                                              <span className="text-[10px] text-stone-400 font-mono block">
                                                No matches on official list 📜
                                              </span>
                                              <span className="text-[8px] text-rose-500 font-sans leading-none block mt-1 font-semibold">
                                                Please contact admin (Meba) to add your name!
                                              </span>
                                            </div>
                                          )}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

                                    {/* Warnings and Helps Block info */}
                                    {formName.trim() && !isOfficialGuest(formName) && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-rose-50 border border-rose-200/50 p-3 rounded-2xl flex gap-2.5 text-left mt-2 shadow-sm"
                                      >
                                        <span className="text-base select-none">🚨</span>
                                        <div>
                                          <h5 className="text-[10px] font-bold text-rose-800 font-mono uppercase tracking-wider">Unverified Guest Access</h5>
                                          <p className="text-[10px] text-rose-600 font-sans font-normal leading-relaxed mt-0.5">
                                            The name <strong className="font-bold underline">{formName}</strong> is not listed on the official invite list.
                                          </p>
                                          <p className="text-[9px] text-rose-500/95 font-sans font-semibold mt-1 p-1 bg-white border border-rose-100 rounded-lg">
                                            👉 Contact the admin staff (<span className="underline font-black text-rose-700">Meba</span>) to be whitelisted for entry, or search and click your name from the autocomplete dropdown list directly!
                                          </p>
                                        </div>
                                      </motion.div>
                                    )}

                                    {formName.trim() && isOfficialGuest(formName) && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-2xl flex gap-2 items-center text-left mt-2 shadow-sm"
                                      >
                                        <span className="text-sm select-none">🌿</span>
                                        <div className="text-[10px] text-emerald-800 font-medium font-sans">
                                          Invite verified! Welcome to Nati's 20th surprise party roster. 😊
                                        </div>
                                      </motion.div>
                                    )}
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
                                    <label className="block text-[10px] font-mono uppercase tracking-widest text-[#7C95E4] mb-1 font-bold">Karaoke or Sunset Tune Song Request</label>
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
                                    whileHover={isOfficialGuest(formName) ? { scale: 1.02 } : {}}
                                    whileTap={isOfficialGuest(formName) ? { scale: 0.98 } : {}}
                                    type="submit"
                                    disabled={!isOfficialGuest(formName)}
                                    className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest text-center cursor-pointer font-mono duration-150 ${
                                      isOfficialGuest(formName) 
                                        ? themeStyles.buttonPrimary 
                                        : "bg-stone-100 border border-stone-200 text-stone-400 cursor-not-allowed"
                                    }`}
                                  >
                                    {isOfficialGuest(formName) ? "Send secure RSVP 💌" : "Unlock RSVP with Whitelisted Name 🔒"}
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
