import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import bcrypt from "bcryptjs";
import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      username: string;
      password: string;
      role: string;
      createdAt: Date;
    }
  }
}

export function setupAuth(app: Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "stream-overlay-secret-key-change-in-prod",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || undefined);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, username, password } = req.body;

      if (!email || !username || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const trimmedEmail = String(email).trim().toLowerCase();
      const trimmedUsername = String(username).trim();
      const rawPassword = String(password);

      if (!trimmedEmail) {
        return res.status(400).json({ error: "Email is required" });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      if (!trimmedUsername || trimmedUsername.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters" });
      }
      if (trimmedUsername.length > 30) {
        return res.status(400).json({ error: "Username must be 30 characters or less" });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
        return res.status(400).json({ error: "Username can only contain letters, numbers, and underscores" });
      }
      if (rawPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      if (rawPassword.length > 128) {
        return res.status(400).json({ error: "Password must be 128 characters or less" });
      }
      if (!/[A-Z]/.test(rawPassword)) {
        return res.status(400).json({ error: "Password must include an uppercase letter" });
      }
      if (!/[a-z]/.test(rawPassword)) {
        return res.status(400).json({ error: "Password must include a lowercase letter" });
      }
      if (!/[0-9]/.test(rawPassword)) {
        return res.status(400).json({ error: "Password must include a number" });
      }
      if (!/[^A-Za-z0-9]/.test(rawPassword)) {
        return res.status(400).json({ error: "Password must include a special character" });
      }

      const existing = await storage.getUserByEmail(trimmedEmail);
      if (existing) {
        return res.status(400).json({ error: "Email already in use" });
      }

      const hashed = await bcrypt.hash(rawPassword, 10);
      const user = await storage.createUser({ email: trimmedEmail, username: trimmedUsername, password: hashed });

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed after registration" });
        }
        return res.json({ id: user.id, email: user.email, username: user.username, role: user.role });
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      return res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body || {};

    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    req.body.email = String(email).trim().toLowerCase();

    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        return res.json({ id: user.id, email: user.email, username: user.username, role: user.role });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      return res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = req.user!;
    return res.json({ id: user.id, email: user.email, username: user.username, role: user.role });
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
