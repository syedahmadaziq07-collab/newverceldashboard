import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { verifyAdminToken, AdminRequest } from "../middleware/adminAuth";
import * as svc from "../services/adminService";
import { addLog } from "../utils/adminLogger";

const router = Router();

// ─── LOGIN RATE LIMITER ───────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── AUTH ─────────────────────────────────────────────────────────────────────

router.post("/login", loginLimiter, async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body;

  if (!password) {
    res.status(400).json({ success: false, message: "Password is required." });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  if (!adminPassword || !jwtSecret) {
    res.status(500).json({ success: false, message: "Server misconfiguration." });
    return;
  }

  if (password !== adminPassword) {
    await addLog("admin", "Failed admin login attempt (wrong password)");
    res.status(401).json({ success: false, message: "Invalid password." });
    return;
  }

  const token = jwt.sign({ role: "admin" }, jwtSecret, { expiresIn: "12h" });
  await addLog("admin", "Admin login successful — session started.");
  res.json({ success: true, token });
});

// ─── ALL ROUTES BELOW REQUIRE JWT ────────────────────────────────────────────

router.use(verifyAdminToken);

// ─── STATS ────────────────────────────────────────────────────────────────────

router.get("/stats", async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const data = await svc.getDashboardStats();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch stats." });
  }
});

// ─── QUEUE ────────────────────────────────────────────────────────────────────

router.get("/queue", async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const data = await svc.getQueue(page, limit);
    res.json({ success: true, ...data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch queue." });
  }
});

router.post("/queue/action", async (req: AdminRequest, res: Response): Promise<void> => {
  const { action, telegramId, telegramIdA, telegramIdB } = req.body;

  try {
    if (action === "clear_stale") {
      const count = await svc.clearEntireQueue();
      res.json({ success: true, message: `Cleared ${count} queue entries.` });
      return;
    }
    if (action === "remove") {
      if (!telegramId) { res.status(400).json({ success: false, message: "telegramId required." }); return; }
      const ok = await svc.removeFromQueue(telegramId);
      if (!ok) { res.status(404).json({ success: false, message: "Queue item not found." }); return; }
      res.json({ success: true });
      return;
    }
    if (action === "force_rematch") {
      if (!telegramIdA || !telegramIdB) { res.status(400).json({ success: false, message: "telegramIdA and telegramIdB required." }); return; }
      const match = await svc.forceRematch(telegramIdA, telegramIdB);
      res.json({ success: true, data: match });
      return;
    }
    res.status(400).json({ success: false, message: "Unknown action." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Queue action failed.";
    res.status(500).json({ success: false, message });
  }
});

// ─── MATCHES ─────────────────────────────────────────────────────────────────

router.get("/matches", async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string | undefined;
    const data = await svc.getMatches(page, limit, status);
    res.json({ success: true, ...data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch matches." });
  }
});

router.post("/cancel-match", async (req: AdminRequest, res: Response): Promise<void> => {
  const { matchId } = req.body;
  if (!matchId) { res.status(400).json({ success: false, message: "matchId is required." }); return; }
  try {
    const ok = await svc.cancelMatch(matchId);
    if (!ok) { res.status(404).json({ success: false, message: "Match not found." }); return; }
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: "Failed to cancel match." });
  }
});

router.post("/matches/action", async (req: AdminRequest, res: Response): Promise<void> => {
  const { matchId, action, verdict } = req.body;
  if (!matchId) { res.status(400).json({ success: false, message: "matchId is required." }); return; }

  try {
    if (action === "cancel") {
      const ok = await svc.cancelMatch(matchId);
      if (!ok) { res.status(404).json({ success: false, message: "Match not found." }); return; }
      res.json({ success: true });
      return;
    }
    if (action === "audit_proof") {
      if (!verdict || !["approve", "reject"].includes(verdict)) {
        res.status(400).json({ success: false, message: "verdict must be 'approve' or 'reject'." });
        return;
      }
      const settings = await svc.getSettings();
      const ok = await svc.auditProof(matchId, verdict, settings.cooldownDurationHours ?? 12);
      if (!ok) { res.status(404).json({ success: false, message: "Match not found." }); return; }
      res.json({ success: true });
      return;
    }
    res.status(400).json({ success: false, message: "Unknown action." });
  } catch {
    res.status(500).json({ success: false, message: "Match action failed." });
  }
});

// ─── LOGS ─────────────────────────────────────────────────────────────────────

router.get("/logs", async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const category = req.query.category as string | undefined;
    const data = await svc.getLogs(page, limit, category);
    res.json({ success: true, ...data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch logs." });
  }
});

// ─── USERS ────────────────────────────────────────────────────────────────────

router.get("/users", async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string | undefined;
    const bannedOnly = req.query.banned === "true";
    const data = await svc.getUsers(page, limit, search, bannedOnly);
    res.json({ success: true, ...data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
});

router.post("/users/action", async (req: AdminRequest, res: Response): Promise<void> => {
  const { telegramId, userId, action, payload } = req.body;
  const id = telegramId || userId;
  if (!id) { res.status(400).json({ success: false, message: "telegramId is required." }); return; }
  if (!action) { res.status(400).json({ success: false, message: "action is required." }); return; }

  try {
    const result = await svc.performUserAction(id, action, payload);
    if (!result.success) { res.status(result.message === "User not found" ? 404 : 400).json(result); return; }
    res.json(result);
  } catch {
    res.status(500).json({ success: false, message: "User action failed." });
  }
});

// ─── BAN / UNBAN ─────────────────────────────────────────────────────────────

router.post("/ban", async (req: AdminRequest, res: Response): Promise<void> => {
  const { telegramId, reason } = req.body;
  if (!telegramId) { res.status(400).json({ success: false, message: "telegramId is required." }); return; }
  try {
    const ok = await svc.banUser(telegramId, reason || "Manual ban by admin");
    if (!ok) { res.status(404).json({ success: false, message: "User not found." }); return; }
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: "Ban failed." });
  }
});

router.post("/unban", async (req: AdminRequest, res: Response): Promise<void> => {
  const { telegramId } = req.body;
  if (!telegramId) { res.status(400).json({ success: false, message: "telegramId is required." }); return; }
  try {
    const ok = await svc.unbanUser(telegramId);
    if (!ok) { res.status(404).json({ success: false, message: "User not found." }); return; }
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: "Unban failed." });
  }
});

// ─── PUNISHMENTS ─────────────────────────────────────────────────────────────

router.get("/punishments", async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const data = await svc.getPunishments();
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch punishments." });
  }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

router.get("/notifications", async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const data = await svc.getNotifications(page, limit);
    res.json({ success: true, ...data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch notifications." });
  }
});

router.post("/notifications/resolve", async (req: AdminRequest, res: Response): Promise<void> => {
  const { notificationId } = req.body;
  if (!notificationId) { res.status(400).json({ success: false, message: "notificationId is required." }); return; }
  try {
    const ok = await svc.resolveNotification(notificationId);
    if (!ok) { res.status(404).json({ success: false, message: "Notification not found." }); return; }
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: "Failed to resolve notification." });
  }
});

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

router.get("/settings", async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const data = await svc.getSettings();
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch settings." });
  }
});

router.post("/settings", async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const data = await svc.updateSettings(req.body);
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update settings." });
  }
});

// ─── BROADCAST ────────────────────────────────────────────────────────────────

router.post("/broadcast", async (req: AdminRequest, res: Response): Promise<void> => {
  const { target, message } = req.body;
  if (!message || !message.trim()) {
    res.status(400).json({ success: false, message: "Broadcast message must not be empty." });
    return;
  }
  try {
    const stats = await svc.simulateBroadcast(target || "all", message);
    res.json({ success: true, data: stats });
  } catch {
    res.status(500).json({ success: false, message: "Broadcast failed." });
  }
});

// ─── CLEANUP ─────────────────────────────────────────────────────────────────

router.post("/system/cleanup", async (req: AdminRequest, res: Response): Promise<void> => {
  const { type } = req.body;
  if (!type) { res.status(400).json({ success: false, message: "type is required." }); return; }
  try {
    const result = await svc.runCleanup(type);
    res.json({ success: true, cleanedCount: result.count });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Cleanup failed.";
    res.status(400).json({ success: false, message });
  }
});

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────

router.get("/activity", async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const [logs, notifications] = await Promise.all([
      svc.getLogs(1, 20),
      svc.getNotifications(1, 10),
    ]);
    res.json({
      success: true,
      data: {
        recentLogs: logs.data,
        recentNotifications: notifications.data,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch activity." });
  }
});

export default router;
