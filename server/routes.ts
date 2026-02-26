import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth, requireAdmin } from "./auth";
import { generateImageBuffer } from "./replit_integrations/image/client";

const GIPHY_API_KEY = process.env.GIPHY_API_KEY;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    const allUsers = await storage.getAllUsers();
    const safeUsers = allUsers.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      banned: u.banned,
      banReason: u.banReason,
      createdAt: u.createdAt,
    }));
    res.json(safeUsers);
  });

  app.post("/api/admin/users/:id/ban", requireAdmin, async (req, res) => {
    const { reason } = req.body;
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ error: "Ban reason is required" });
    }
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ error: "You cannot ban yourself" });
    }
    const user = await storage.banUser(req.params.id, String(reason).trim());
    if (!user) return res.status(404).json({ error: "User not found" });
    await storage.createSecurityEvent({
      type: "user_banned",
      severity: "medium",
      email: user.email,
      message: `Admin ${req.user!.username} banned user ${user.username}: ${reason}`,
    });
    res.json({ id: user.id, email: user.email, username: user.username, banned: user.banned, banReason: user.banReason });
  });

  app.post("/api/admin/users/:id/unban", requireAdmin, async (req, res) => {
    const user = await storage.unbanUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await storage.createSecurityEvent({
      type: "user_unbanned",
      severity: "low",
      email: user.email,
      message: `Admin ${req.user!.username} unbanned user ${user.username}`,
    });
    res.json({ id: user.id, email: user.email, username: user.username, banned: user.banned });
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ error: "You cannot delete yourself" });
    }
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await storage.createSecurityEvent({
      type: "user_deleted",
      severity: "high",
      email: user.email,
      message: `Admin ${req.user!.username} deleted user ${user.username} (${user.email})`,
    });
    await storage.deleteUser(req.params.id);
    res.json({ ok: true });
  });

  app.get("/api/admin/security-events", requireAdmin, async (req, res) => {
    const events = await storage.getSecurityEvents(200);
    res.json(events);
  });

  app.post("/api/admin/security-events/:id/resolve", requireAdmin, async (req, res) => {
    const event = await storage.resolveSecurityEvent(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  });

  app.get("/api/giphy/trending", requireAuth, async (req, res) => {
    try {
      if (!GIPHY_API_KEY) return res.status(500).json({ error: "Giphy not configured" });
      const limit = Math.min(Number(req.query.limit) || 25, 50);
      const offset = Number(req.query.offset) || 0;
      const response = await fetch(
        `https://api.giphy.com/v1/stickers/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&offset=${offset}&rating=g`
      );
      if (!response.ok) throw new Error("Giphy API error");
      const data = await response.json();
      const stickers = data.data.map((g: any) => ({
        id: g.id,
        title: g.title,
        url: g.images.fixed_height_small.url,
        previewUrl: g.images.preview_gif?.url || g.images.fixed_height_small.url,
        originalUrl: g.images.original.url,
        width: Number(g.images.fixed_height_small.width),
        height: Number(g.images.fixed_height_small.height),
      }));
      res.json({ stickers, total: data.pagination.total_count });
    } catch (err) {
      console.error("Giphy trending error:", err);
      res.status(500).json({ error: "Failed to fetch stickers" });
    }
  });

  app.get("/api/giphy/search", requireAuth, async (req, res) => {
    try {
      if (!GIPHY_API_KEY) return res.status(500).json({ error: "Giphy not configured" });
      const q = String(req.query.q || "").trim();
      if (!q) return res.status(400).json({ error: "Search query required" });
      const limit = Math.min(Number(req.query.limit) || 25, 50);
      const offset = Number(req.query.offset) || 0;
      const response = await fetch(
        `https://api.giphy.com/v1/stickers/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}&rating=g`
      );
      if (!response.ok) throw new Error("Giphy API error");
      const data = await response.json();
      const stickers = data.data.map((g: any) => ({
        id: g.id,
        title: g.title,
        url: g.images.fixed_height_small.url,
        previewUrl: g.images.preview_gif?.url || g.images.fixed_height_small.url,
        originalUrl: g.images.original.url,
        width: Number(g.images.fixed_height_small.width),
        height: Number(g.images.fixed_height_small.height),
      }));
      res.json({ stickers, total: data.pagination.total_count });
    } catch (err) {
      console.error("Giphy search error:", err);
      res.status(500).json({ error: "Failed to search stickers" });
    }
  });

  app.post("/api/ai/generate-image", requireAuth, async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || !String(prompt).trim()) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      const buffer = await generateImageBuffer(String(prompt).trim(), "1024x1024");
      const base64 = buffer.toString("base64");
      res.json({ dataUrl: `data:image/png;base64,${base64}` });
    } catch (err: any) {
      console.error("AI image generation error:", err);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  app.get("/api/overlays", requireAuth, async (req, res) => {
    const list = await storage.getOverlays(req.user!.id);
    res.json(list);
  });

  app.post("/api/overlays", requireAuth, async (req, res) => {
    const overlay = await storage.createOverlay({ ...req.body, userId: req.user!.id });
    res.json(overlay);
  });

  app.put("/api/overlays/:id", requireAuth, async (req, res) => {
    const existing = await storage.getOverlay(req.params.id);
    if (!existing || existing.userId !== req.user!.id) {
      return res.status(404).json({ error: "Not found" });
    }
    const updated = await storage.updateOverlay(req.params.id, req.body);
    res.json(updated);
  });

  app.delete("/api/overlays/:id", requireAuth, async (req, res) => {
    const existing = await storage.getOverlay(req.params.id);
    if (!existing || existing.userId !== req.user!.id) {
      return res.status(404).json({ error: "Not found" });
    }
    await storage.deleteOverlay(req.params.id);
    res.json({ ok: true });
  });

  app.get("/api/scenes", requireAuth, async (req, res) => {
    const list = await storage.getScenes(req.user!.id);
    res.json(list);
  });

  app.post("/api/scenes", requireAuth, async (req, res) => {
    const scene = await storage.createScene({ ...req.body, userId: req.user!.id });
    res.json(scene);
  });

  app.put("/api/scenes/:id", requireAuth, async (req, res) => {
    const existing = await storage.getScene(req.params.id);
    if (!existing || existing.userId !== req.user!.id) {
      return res.status(404).json({ error: "Not found" });
    }
    const updated = await storage.updateScene(req.params.id, req.body);
    res.json(updated);
  });

  app.delete("/api/scenes/:id", requireAuth, async (req, res) => {
    const existing = await storage.getScene(req.params.id);
    if (!existing || existing.userId !== req.user!.id) {
      return res.status(404).json({ error: "Not found" });
    }
    await storage.deleteScene(req.params.id);
    res.json({ ok: true });
  });

  app.get("/api/alerts", requireAuth, async (req, res) => {
    const list = await storage.getAlerts(req.user!.id);
    res.json(list);
  });

  app.post("/api/alerts", requireAuth, async (req, res) => {
    const alert = await storage.createAlert({ ...req.body, userId: req.user!.id });
    res.json(alert);
  });

  app.put("/api/alerts/:id", requireAuth, async (req, res) => {
    const existing = await storage.getAlert(req.params.id);
    if (!existing || existing.userId !== req.user!.id) {
      return res.status(404).json({ error: "Not found" });
    }
    const updated = await storage.updateAlert(req.params.id, req.body);
    res.json(updated);
  });

  app.delete("/api/alerts/:id", requireAuth, async (req, res) => {
    const existing = await storage.getAlert(req.params.id);
    if (!existing || existing.userId !== req.user!.id) {
      return res.status(404).json({ error: "Not found" });
    }
    await storage.deleteAlert(req.params.id);
    res.json({ ok: true });
  });

  return httpServer;
}
