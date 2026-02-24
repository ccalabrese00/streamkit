import {
  type User, type InsertUser,
  type Overlay, type InsertOverlay,
  type Scene, type InsertScene,
  type Alert, type InsertAlert,
  users, overlays, scenes, alerts,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getOverlays(userId: string): Promise<Overlay[]>;
  getOverlay(id: string): Promise<Overlay | undefined>;
  createOverlay(overlay: InsertOverlay): Promise<Overlay>;
  updateOverlay(id: string, data: Partial<InsertOverlay>): Promise<Overlay | undefined>;
  deleteOverlay(id: string): Promise<void>;

  getScenes(userId: string): Promise<Scene[]>;
  getScene(id: string): Promise<Scene | undefined>;
  createScene(scene: InsertScene): Promise<Scene>;
  updateScene(id: string, data: Partial<InsertScene>): Promise<Scene | undefined>;
  deleteScene(id: string): Promise<void>;

  getAlerts(userId: string): Promise<Alert[]>;
  getAlert(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: string, data: Partial<InsertAlert>): Promise<Alert | undefined>;
  deleteAlert(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getOverlays(userId: string): Promise<Overlay[]> {
    return db.select().from(overlays).where(eq(overlays.userId, userId));
  }

  async getOverlay(id: string): Promise<Overlay | undefined> {
    const [overlay] = await db.select().from(overlays).where(eq(overlays.id, id));
    return overlay;
  }

  async createOverlay(overlay: InsertOverlay): Promise<Overlay> {
    const [created] = await db.insert(overlays).values(overlay).returning();
    return created;
  }

  async updateOverlay(id: string, data: Partial<InsertOverlay>): Promise<Overlay | undefined> {
    const [updated] = await db.update(overlays).set(data).where(eq(overlays.id, id)).returning();
    return updated;
  }

  async deleteOverlay(id: string): Promise<void> {
    await db.delete(overlays).where(eq(overlays.id, id));
  }

  async getScenes(userId: string): Promise<Scene[]> {
    return db.select().from(scenes).where(eq(scenes.userId, userId));
  }

  async getScene(id: string): Promise<Scene | undefined> {
    const [scene] = await db.select().from(scenes).where(eq(scenes.id, id));
    return scene;
  }

  async createScene(scene: InsertScene): Promise<Scene> {
    const [created] = await db.insert(scenes).values(scene).returning();
    return created;
  }

  async updateScene(id: string, data: Partial<InsertScene>): Promise<Scene | undefined> {
    const [updated] = await db.update(scenes).set(data).where(eq(scenes.id, id)).returning();
    return updated;
  }

  async deleteScene(id: string): Promise<void> {
    await db.delete(scenes).where(eq(scenes.id, id));
  }

  async getAlerts(userId: string): Promise<Alert[]> {
    return db.select().from(alerts).where(eq(alerts.userId, userId));
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert;
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [created] = await db.insert(alerts).values(alert).returning();
    return created;
  }

  async updateAlert(id: string, data: Partial<InsertAlert>): Promise<Alert | undefined> {
    const [updated] = await db.update(alerts).set(data).where(eq(alerts.id, id)).returning();
    return updated;
  }

  async deleteAlert(id: string): Promise<void> {
    await db.delete(alerts).where(eq(alerts.id, id));
  }
}

export const storage = new DatabaseStorage();
