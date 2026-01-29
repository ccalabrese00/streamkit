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
  handle: string; // @username format
  nowPlaying: string; // music/game ticker text
  labelLeft: string; // left footer label (usually "FOLLOW")
  labelRight: string; // right footer label (usually "SUBSCRIBE")
  accent: "purple" | "cyan" | "pink" | "lime" | "amber" | "red"; // theme color
  showTime: boolean; // whether to show current time
}

Create thematic, cohesive designs. Be creative with channel names, handles, and ticker text that match the vibe.`
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

  return httpServer;
}
