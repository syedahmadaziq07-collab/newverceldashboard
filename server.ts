import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import mongoose from "mongoose";
import adminRouter from "./routes/admin";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);
const MONGO_URI = process.env.MONGODB_URI || "";
const DASHBOARD_URL = process.env.DASHBOARD_URL || "";

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

const allowedOrigins: string[] = [];
if (DASHBOARD_URL) allowedOrigins.push(DASHBOARD_URL);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// ─── ADMIN API ────────────────────────────────────────────────────────────────

app.use("/api/admin", adminRouter);

// ─── VITE / STATIC FRONTEND ───────────────────────────────────────────────────

async function startServer() {
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log("[db] MongoDB connected");
    } catch (err) {
      console.error("[db] MongoDB connection failed:", err);
      console.warn("[db] Continuing without MongoDB — API endpoints will return errors");
    }
  } else {
    console.warn("[db] MONGODB_URI not set — running without database");
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] Running on port ${PORT}`);
  });
}

startServer();
