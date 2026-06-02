import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// =========================================================================
// IN-PROJECT CONFIGURATION (Keys, Variables, and IDs declared directly in-code)
// =========================================================================
const PROJECT_CONFIG = {
  // Put your Gemini API key directly here. Fallbacks to process.env if empty.
  GEMINI_API_KEY: "",
  
  // Telegram Bot Credentials for instant RSVP notification updates
  TELEGRAM_TOKEN: "8554836962:AAG0C4kFkGbjaMHpEirFbH47M2RxZmFvp8c",
  TELEGRAM_CHAT_ID: "5970769337"
};

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client to prevent crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = PROJECT_CONFIG.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. AI wishes will use fallback messages.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// AI Wish Generator Endpoint
app.post("/api/wish", async (req, res) => {
  try {
    const { friendName, relation, vibe, memories } = req.body;
    
    const client = getGeminiClient();
    if (!client) {
      return res.status(503).json({
        error: "AI service is currently unavailable as the GEMINI_API_KEY is not configured.",
      });
    }

    const systemInstruction = 
      "You are a professional birthday card copywriter. Your goal is to write a custom, beautiful, and engaging birthday greeting for a friend's June 7 birthday. " +
      "The message should represent the selected vibe (funny, heartfelt, poetic, nerdy, or nostalgic) and optionally incorporate specific memories. " +
      "Keep it relatively short (2-4 paragraphs/stanzas) so it fits perfectly on an interactive card. " +
      "Return ONLY the greeting text itself. Do not add intro/outro greetings like 'Here is your card' or markdown code blocks.";

    const promptText = `Write a ${vibe || 'funny'} birthday card greeting from a guest for their friend named ${friendName || 'Friend'}.
The relation of the writer to ${friendName} is: ${relation || 'Friend'}.
${memories ? `Here are some special memories / insider details to weave in: ${memories}` : ""}
Write a high-quality greeting specifically for the upcoming card.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 1.0,
      },
    });

    const generatedText = response.text || "Wishing you the happiest of birthdays on June 7! May your day be filled with endless joy, laughter, and amazing moments surrounded by friends who cherish you.";
    
    res.json({ message: generatedText });
  } catch (err: any) {
    console.error("Gemini API error:", err);
    res.status(500).json({ error: err.message || "Failed to generate birthday wish." });
  }
});

const RSVP_FILE = path.join(process.cwd(), "rsvps.json");

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
const CLOUD_STORAGE_URL = "https://kvdb.io/NatiPicnicSurpriseRsvps_2026_v2/rsvp_list";

function getLocalRSVPs() {
  try {
    if (fs.existsSync(RSVP_FILE)) {
      const data = fs.readFileSync(RSVP_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to read local rsvps.json:", error);
  }
  return INITIAL_GUESTS;
}

function saveLocalRSVPs(list: any[]) {
  try {
    fs.writeFileSync(RSVP_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write to local rsvps.json:", error);
  }
}

async function getRSVPs(): Promise<any[]> {
  try {
    const res = await fetch(CLOUD_STORAGE_URL, {
      headers: { "Accept": "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        // Cache locally in case cloud goes down
        saveLocalRSVPs(data);
        return data;
      }
    } else if (res.status === 404) {
      return [];
    }
  } catch (error) {
    console.error("Failed to read from Cloud Storage, using local backup:", error);
  }
  return getLocalRSVPs();
}

async function saveRSVPs(list: any[]) {
  // Sync locally first
  saveLocalRSVPs(list);
  
  // Save to Cloud Storage
  try {
    const res = await fetch(CLOUD_STORAGE_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(list)
    });
    if (!res.ok) {
      console.error("Cloud Storage Save failed with status:", res.status);
    }
  } catch (error) {
    console.error("Failed to save to Cloud Storage:", error);
  }
}

// RSVP API Routes
app.get("/api/rsvp", async (req, res) => {
  const rsvps = await getRSVPs();
  res.json(rsvps);
});

app.post("/api/rsvp", async (req, res) => {
  try {
    const { name, attending, song, note } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Name is a required field." });
    }

    const trimmed = name.trim();
    const matched = OFFICIAL_GUESTS_DATA.find(g => 
      g.id === trimmed.toLowerCase() || 
      g.display.toLowerCase() === trimmed.toLowerCase()
    );

    if (!matched) {
      return res.status(403).json({ error: "Your name is not on Nati's official guest invite list. Please double check the spelling or contact the administrator (Meba) to be added!" });
    }

    const currentList = await getRSVPs();
    const newEntry = {
      name: matched.display, // Save standardized display name (e.g. "Ruth")
      attending: !!attending,
      song: song ? song.trim() : "Surprise Nati Vibes!",
      note: note ? note.trim() : "Sending best wishes on your 20th! 🤍",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };

    const updatedList = [newEntry, ...currentList];
    await saveRSVPs(updatedList);

    // Dynamic Telegram notification dispatch to the Host (Meba)
    try {
      const tgToken = PROJECT_CONFIG.TELEGRAM_TOKEN;
      const tgChatId = PROJECT_CONFIG.TELEGRAM_CHAT_ID;

      const statusIcon = newEntry.attending ? "✅ YES, Count me in! 🎉" : "❌ NO, Can't make it 😢";
      const messageText = 
        `🔔 *New RSVP Received for Nati's Picnic!* 🌿🤍\n\n` +
        `👤 *Guest Name:* ${newEntry.name}\n` +
        `🎟️ *Attending:* ${statusIcon}\n` +
        `🎵 *Song Request:* ${newEntry.song}\n` +
        `💬 *Message:* "${newEntry.note}"\n\n` +
        `📅 *Sent limit:* ${newEntry.date}`;

      fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: messageText,
          parse_mode: "Markdown"
        })
      })
        .then(tgRes => {
          if (!tgRes.ok) {
            console.error("Telegram API alert failed with status:", tgRes.status);
          } else {
            console.log("Telegram notification sent successfully!");
          }
        })
        .catch(tgErr => {
          console.error("Telegram delivery promise failed:", tgErr);
        });
    } catch (tgOuterErr) {
      console.error("Telegram system routing failure:", tgOuterErr);
    }

    res.json({ success: true, entry: newEntry, list: updatedList });
  } catch (err: any) {
    console.error("Failed to process RSVP post:", err);
    res.status(500).json({ error: "Failed to record RSVP." });
  }
});

async function boot() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

boot();
