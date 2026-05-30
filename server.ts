import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client to prevent crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
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
