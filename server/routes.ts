import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { getUncachableGitHubClient } from "./github";

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
            content: `You are an expert Twitch/YouTube stream overlay designer. Create professional, visually stunning overlay configurations.

CANVAS: 1920x1080 pixels (full HD). Position elements using these coordinates.

OUTPUT FORMAT (JSON only):
{
  "name": "Overlay Name",
  "bgColor": "#hexcolor",
  "elements": [
    {
      "type": "text" | "socials" | "nowPlaying" | "clock" | "logo" | "chatPreview",
      "x": number (0-1920),
      "y": number (0-1080),
      "width": number (min 100),
      "height": number (min 40),
      "content": "text content",
      "fontSize": number (16-72),
      "color": "#hexcolor",
      "bgColor": "#hexcolor",
      "bgOpacity": number (0-1),
      "fontWeight": "normal" | "bold",
      "textAlign": "left" | "center" | "right"
    }
  ]
}

DESIGN PRINCIPLES:
1. Use semi-transparent backgrounds (bgOpacity 0.3-0.7) for readability
2. Create visual hierarchy with varied font sizes (title: 48-64px, subtitle: 24-32px, small: 16-20px)
3. Position elements with proper spacing (min 40px from edges, 20px between elements)
4. Match colors to the theme/mood requested
5. Include 4-8 elements for a complete overlay

COMMON LAYOUTS:
- Logo/branding: top-left corner (x: 40, y: 40)
- Clock: top-right corner (x: 1680, y: 40)
- Main title: center (x: 660, y: 480, width: 600)
- Socials: bottom-left (x: 40, y: 980) or bottom-right (x: 1400, y: 980)
- Now Playing: bottom center (x: 710, y: 1000)
- Chat preview: right side (x: 1520, y: 300)

ELEMENT SIZES:
- Logo: 120x120 to 200x200
- Clock: 200x60
- Text blocks: 300-600 width, 60-120 height
- Socials: 300x80
- Now Playing: 500x80
- Chat preview: 350x400

COLOR PALETTES BY THEME:
- Gaming/Neon: Deep purples (#1a0a2e), cyan (#00f5d4), magenta (#f72585), dark bg
- Cozy/Lo-fi: Warm browns (#2d1b0e), cream (#f5e6d3), soft orange (#e89b4c)
- Minimal/Clean: Pure black (#000000), white (#ffffff), single accent color
- Cyberpunk: Dark teal (#0a1628), hot pink (#ff006e), electric blue (#00b4d8)
- Nature/Chill: Forest green (#1b4332), soft teal (#40916c), cream (#d8f3dc)
- Retro/Synthwave: Purple (#7b2cbf), pink (#e500a4), orange (#ff6d00), dark blue bg

Be creative! Generate unique, professional overlays that match the user's vision.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2000,
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

  app.get("/api/github/repos", async (_req, res) => {
    try {
      const octokit = await getUncachableGitHubClient();
      const { data } = await octokit.repos.listForAuthenticatedUser({
        sort: "updated",
        per_page: 100,
      });
      res.json(data.map((r: any) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        html_url: r.html_url,
        description: r.description,
        private: r.private,
        default_branch: r.default_branch,
        updated_at: r.updated_at,
      })));
    } catch (error: any) {
      console.error("GitHub repos error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch repos" });
    }
  });

  app.get("/api/github/user", async (_req, res) => {
    try {
      const octokit = await getUncachableGitHubClient();
      const { data } = await octokit.users.getAuthenticated();
      res.json({
        login: data.login,
        avatar_url: data.avatar_url,
        name: data.name,
        html_url: data.html_url,
      });
    } catch (error: any) {
      console.error("GitHub user error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch user" });
    }
  });

  return httpServer;
}
