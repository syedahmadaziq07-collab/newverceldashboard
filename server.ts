import express from "express";
import path from "path";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import mongoose from "mongoose";
import adminRouter from "./routes/admin.js";
dotenv.config();
const app = express();
app.set("trust proxy", 1);
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
const allowedOrigins = [
  process.env.DASHBOARD_URL,
  "https://newverceldashboard-yvw4.vercel.app",
  "https://newverceldashboard-364rveku6-syedahmadaziq07-1130s-projects.vercel.app",
  /\.vercel\.app$/,
  /\.replit\.dev$/,
  /\.replit\.app$/,
  "http://localhost:5000",
  "http://localhost:3000",
].filter(Boolean) as (string | RegExp)[];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
      if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return callback(null, true);
      const allowed = allowedOrigins.some((o) =>
        o instanceof RegExp ? o.test(origin) : o === origin
      );
      if (allowed) return callback(null, true);
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
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("/{*splat}", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] CutPricebot API running on port ${PORT}`);
  });
}
startServer();
