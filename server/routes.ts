import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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
