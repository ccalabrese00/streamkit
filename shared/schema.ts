import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const overlays = pgTable("overlays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  bgColor: text("bg_color").notNull().default("#0a0a1a"),
  elements: jsonb("elements").notNull().default([]),
});

export const scenes = pgTable("scenes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull().default("custom"),
  config: jsonb("config").notNull().default({}),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  name: text("name").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  message: text("message").notNull().default(""),
  duration: integer("duration").notNull().default(5),
  sound: text("sound").notNull().default("default"),
  color: text("color").notNull().default("#8b5cf6"),
  fontSize: integer("font_size").notNull().default(32),
  animation: text("animation").notNull().default("fadeIn"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const insertOverlaySchema = createInsertSchema(overlays).omit({ id: true });
export const insertSceneSchema = createInsertSchema(scenes).omit({ id: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Overlay = typeof overlays.$inferSelect;
export type InsertOverlay = z.infer<typeof insertOverlaySchema>;
export type Scene = typeof scenes.$inferSelect;
export type InsertScene = z.infer<typeof insertSceneSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
