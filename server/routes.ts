import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/generate-scene", async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `You are a Twitch scene designer. Generate scene configurations based on user descriptions.
Output ONLY valid JSON matching this TypeScript type:
{
  channel: string; // stream channel name
  socials: {
    twitch: string; // twitch username (without twitch.tv/)
    youtube: string; // youtube handle (without @)
    instagram: string; // instagram handle (without @)
    x: string; // X/Twitter handle (without @)
    tiktok: string; // tiktok handle (without @)
    discord: string; // discord server invite or name
  };
  nowPlaying: string; // music/game ticker text
  labelLeft: string; // left footer label (usually "FOLLOW")
  labelRight: string; // right footer label (usually "SUBSCRIBE")
  accent: "purple" | "cyan" | "pink" | "lime" | "amber" | "red"; // theme color
  showTime: boolean; // whether to show current time
}

Create thematic, cohesive designs. Be creative with channel names, socials, and ticker text that match the vibe. Fill in relevant social handles based on the theme.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const sceneConfig = JSON.parse(content);
      res.json(sceneConfig);
    } catch (error) {
      console.error("AI generation error:", error);
      res.status(500).json({ error: "Failed to generate scene" });
    }
  });

  app.post("/api/generate-overlay", async (req, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `You are a stream overlay designer. Generate custom overlay configurations based on user descriptions.
Output ONLY valid JSON matching this structure:
{
  "name": string, // overlay name
  "bgColor": string, // hex color for background (e.g. "#0a0a0f")
  "elements": [
    {
      "type": "text" | "socials" | "nowPlaying" | "clock" | "logo" | "chatPreview",
      "x": number, // x position (0-800)
      "y": number, // y position (0-450)
      "width": number, // element width
      "height": number, // element height
      "content": string, // text content (for text, socials, nowPlaying)
      "fontSize": number, // font size in pixels
      "color": string, // hex text color
      "bgColor": string, // hex background color
      "bgOpacity": number, // 0-1 opacity
      "fontWeight": "normal" | "bold",
      "textAlign": "left" | "center" | "right"
    }
  ]
}

Create visually appealing, well-positioned overlays. Include 3-6 elements based on the theme. Position elements thoughtfully - avoid overlapping. Use colors that match the vibe. Common layouts:
- Social info in corners
- Main text centered
- Clock in top right
- Now playing at bottom`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const overlayConfig = JSON.parse(content);
      res.json(overlayConfig);
    } catch (error) {
      console.error("AI overlay generation error:", error);
      res.status(500).json({ error: "Failed to generate overlay" });
    }
  });

  return httpServer;
}
