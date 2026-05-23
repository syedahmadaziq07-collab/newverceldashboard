import User from "../models/User";
import Match from "../models/Match";
import QueueItem from "../models/QueueItem";
import BotLog from "../models/BotLog";
import AdminNotification from "../models/AdminNotification";
import Settings from "../models/Settings";
import { addLog, addNotification } from "../utils/adminLogger";

// ─── STATS ────────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const [
    totalUsers,
    registeredTiktokUsers,
    usersInQueue,
    activeMatches,
    completedToday,
    cancelledToday,
    bannedUsers,
    cooldownUsers,
    activeUsersNow,
    ghostedToday,
    pendingProofs,
    rejectedToday,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ tiktokUsername: { $ne: "" } }),
    QueueItem.countDocuments(),
    Match.countDocuments({ status: "active" }),
    Match.countDocuments({ status: "completed", completedTime: { $gte: startOfDay } }),
    Match.countDocuments({ status: "cancelled", completedTime: { $gte: startOfDay } }),
    User.countDocuments({ banned: true }),
    User.countDocuments({ cooldownUntil: { $gt: now } }),
    User.countDocuments({ lastActive: { $gte: fifteenMinutesAgo }, banned: false }),
    Match.countDocuments({ status: "cancelled", proofStatus: "none", completedTime: { $gte: startOfDay } }),
    Match.countDocuments({ status: "active", proofStatus: { $in: ["submitted_a", "submitted_b", "submitted_both"] } }),
    Match.countDocuments({ approvalStatus: "rejected", completedTime: { $gte: startOfDay } }),
  ]);

  const totalConcluded = completedToday + cancelledToday;
  const successRatePercent = totalConcluded > 0
    ? Math.round((completedToday / totalConcluded) * 100)
    : 0;

  return {
    totalUsersStart: totalUsers,
    registeredTiktokUsers,
    usersInQueue,
    activeMatches,
    completedSwapsToday: completedToday,
    proofRejectedToday: rejectedToday,
    bannedUsers,
    cooldownUsers,
    activeUsersNow,
    cancelledSwapsToday: cancelledToday,
    ghostedSwapsToday: ghostedToday,
    averageQueueWaitMinutes: 0,
    successRatePercent,
    pendingProofs,
  };
}

// ─── QUEUE ────────────────────────────────────────────────────────────────────

export async function getQueue(page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    QueueItem.find().sort({ queuedAt: 1 }).skip(skip).limit(limit).lean(),
    QueueItem.countDocuments(),
  ]);
  const now = Date.now();
  const data = items.map((q) => ({
    id: q._id,
    telegramId: q.telegramId,
    telegramUsername: q.telegramUsername,
    telegramName: q.telegramName,
    tiktokUsername: q.tiktokUsername,
    submittedLink: q.submittedLink,
    isReady: q.isReady,
    queuedAt: q.queuedAt,
    waitingMinutes: Math.floor((now - new Date(q.queuedAt).getTime()) / 60000),
  }));
  return { data, total, page, pages: Math.ceil(total / limit) };
}

// ─── MATCHES ─────────────────────────────────────────────────────────────────

export async function getMatches(
  page = 1,
  limit = 50,
  status?: string
) {
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  const [items, total] = await Promise.all([
    Match.find(filter).sort({ startedTime: -1 }).skip(skip).limit(limit).lean(),
    Match.countDocuments(filter),
  ]);
  return { data: items, total, page, pages: Math.ceil(total / limit) };
}

export async function cancelMatch(matchId: string): Promise<boolean> {
  const match = await Match.findOne({ matchId });
  if (!match) return false;

  match.status = "cancelled";
  match.cancelReason = "manual";
  match.completedTime = new Date();
  match.approvalStatus = "rejected";
  await match.save();

  await User.updateMany(
    { telegramId: { $in: [match.userA.telegramId, match.userB.telegramId] } },
    { $set: { state: "idle" } }
  );

  await addLog(
    "match",
    `Admin force-cancelled match ${matchId}.`,
    undefined,
    matchId
  );
  return true;
}

export async function auditProof(
  matchId: string,
  verdict: "approve" | "reject",
  cooldownHours = 12
): Promise<boolean> {
  const match = await Match.findOne({ matchId });
  if (!match) return false;

  if (verdict === "approve") {
    match.status = "completed";
    match.approvalStatus = "approved";
    match.completedTime = new Date();
    await match.save();
    await User.updateMany(
      { telegramId: { $in: [match.userA.telegramId, match.userB.telegramId] } },
      { $set: { state: "idle" }, $inc: { completedSwaps: 1 } }
    );
    await addLog("proof", `Proof approved for match ${matchId}.`, undefined, matchId);
  } else {
    match.status = "cancelled";
    match.approvalStatus = "rejected";
    match.completedTime = new Date();
    await match.save();
    const cooldownUntil = new Date(Date.now() + cooldownHours * 60 * 60 * 1000);
    await User.updateMany(
      { telegramId: { $in: [match.userA.telegramId, match.userB.telegramId] } },
      { $set: { state: "idle", cooldownUntil } }
    );
    await addLog("proof", `Proof rejected for match ${matchId}. Cooldown applied.`, undefined, matchId);
  }
  return true;
}

// ─── LOGS ─────────────────────────────────────────────────────────────────────

export async function getLogs(
  page = 1,
  limit = 100,
  category?: string
) {
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;
  const [items, total] = await Promise.all([
    BotLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    BotLog.countDocuments(filter),
  ]);
  return { data: items, total, page, pages: Math.ceil(total / limit) };
}

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function getUsers(
  page = 1,
  limit = 50,
  search?: string,
  bannedOnly = false
) {
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};
  if (bannedOnly) filter.banned = true;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
      { tiktokUsername: { $regex: search, $options: "i" } },
      { telegramId: { $regex: search, $options: "i" } },
    ];
  }
  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ joinedTime: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v")
      .lean(),
    User.countDocuments(filter),
  ]);
  return { data: items, total, page, pages: Math.ceil(total / limit) };
}

export async function banUser(telegramId: string, reason: string): Promise<boolean> {
  const user = await User.findOne({ telegramId });
  if (!user) return false;

  user.banned = true;
  user.banReason = reason;
  user.state = "idle";
  await user.save();

  await QueueItem.deleteOne({ telegramId });
  await addLog("ban", `Admin banned user ${user.name} (${telegramId}). Reason: ${reason}`, telegramId);
  await addNotification("ban", "Manual Ban Applied", `Admin banned ${user.name} (@${user.username}). Reason: ${reason}`);
  return true;
}

export async function unbanUser(telegramId: string): Promise<boolean> {
  const user = await User.findOne({ telegramId });
  if (!user) return false;

  user.banned = false;
  user.banReason = undefined;
  await user.save();

  await addLog("ban", `Admin unbanned user ${user.name} (${telegramId})`, telegramId);
  return true;
}

export async function performUserAction(
  telegramId: string,
  action: string,
  payload?: Record<string, unknown>
): Promise<{ success: boolean; message: string; user?: unknown }> {
  const user = await User.findOne({ telegramId });
  if (!user) return { success: false, message: "User not found" };

  const settings = await Settings.findOne({ key: "global" }).lean();
  const dailyCutsAmount = settings?.dailyCutsAmount ?? 3;
  const cooldownDurationHours = settings?.cooldownDurationHours ?? 12;

  switch (action) {
    case "reset_cuts":
      user.remainingCuts = dailyCutsAmount;
      await addLog("user", `Reset cuts to ${dailyCutsAmount} for ${user.name}`, telegramId);
      break;

    case "ban":
      user.banned = true;
      user.banReason = (payload?.reason as string) || "Manual ban by admin";
      user.state = "idle";
      await QueueItem.deleteOne({ telegramId });
      await addLog("ban", `Admin banned ${user.name}`, telegramId);
      await addNotification("ban", "Manual Ban Applied", `Admin banned ${user.name} (@${user.username})`);
      break;

    case "unban":
      user.banned = false;
      user.banReason = undefined;
      await addLog("ban", `Admin unbanned ${user.name}`, telegramId);
      break;

    case "clear_cooldown":
      user.cooldownUntil = null;
      await addLog("cooldown", `Cleared cooldown for ${user.name}`, telegramId);
      break;

    case "cooldown_24h": {
      const until = new Date(Date.now() + 24 * 60 * 60 * 1000);
      user.cooldownUntil = until;
      user.state = "idle";
      await QueueItem.deleteOne({ telegramId });
      await addLog("cooldown", `Applied 24h cooldown to ${user.name}`, telegramId);
      await addNotification("cooldown", "24hr Penalty Cooldown", `@${user.username} was placed on 24h cooldown`);
      break;
    }

    case "warn":
      user.warningsCount = (user.warningsCount || 0) + 1;
      await addLog("user", `Warned ${user.name}. Total: ${user.warningsCount}`, telegramId);
      if (user.warningsCount >= 5) {
        user.banned = true;
        user.state = "idle";
        await QueueItem.deleteOne({ telegramId });
        await addLog("ban", `Auto-banned ${user.name} (exceeded warning limit)`, telegramId);
        await addNotification("ban", "Auto-Ban: Exceeded Warnings", `${user.name} reached max warnings (${user.warningsCount}/5)`);
      }
      break;

    case "reset_state":
      user.state = "idle";
      await QueueItem.deleteOne({ telegramId });
      await addLog("user", `Reset state to idle for ${user.name}`, telegramId);
      break;

    case "adjust_stats":
      if (payload) {
        if (payload.inactivityStrikes !== undefined) user.inactivityStrikes = payload.inactivityStrikes as number;
        if (payload.ghostCount !== undefined) user.ghostCount = payload.ghostCount as number;
        if (payload.isSuspicious !== undefined) user.isSuspicious = payload.isSuspicious as boolean;
      }
      await addLog("user", `Updated stats for ${user.name}`, telegramId);
      break;

    default:
      return { success: false, message: "Unknown action" };
  }

  await user.save();
  return { success: true, message: "Action applied", user };
}

// ─── PUNISHMENTS ─────────────────────────────────────────────────────────────

export async function getPunishments() {
  const now = new Date();
  const [banned, cooldowns] = await Promise.all([
    User.find({ banned: true })
      .select("telegramId name username tiktokUsername banReason warningsCount ghostCount")
      .lean(),
    User.find({ cooldownUntil: { $gt: now } })
      .select("telegramId name username tiktokUsername cooldownUntil warningsCount")
      .lean(),
  ]);

  return {
    banned: banned.map((u) => ({
      telegramId: u.telegramId,
      name: u.name,
      username: u.username,
      tiktokUsername: u.tiktokUsername,
      reason: u.banReason || "No reason provided",
      warningsCount: u.warningsCount,
      ghostCount: u.ghostCount,
    })),
    cooldowns: cooldowns.map((u) => ({
      telegramId: u.telegramId,
      name: u.name,
      username: u.username,
      tiktokUsername: u.tiktokUsername,
      cooldownUntil: u.cooldownUntil,
      warningsCount: u.warningsCount,
      minutesRemaining: Math.ceil(
        (new Date(u.cooldownUntil!).getTime() - now.getTime()) / 60000
      ),
    })),
  };
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export async function getNotifications(page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    AdminNotification.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AdminNotification.countDocuments(),
  ]);
  return { data: items, total, page, pages: Math.ceil(total / limit) };
}

export async function resolveNotification(id: string): Promise<boolean> {
  const result = await AdminNotification.findByIdAndUpdate(id, { resolved: true });
  return !!result;
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

export async function getSettings() {
  let settings = await Settings.findOne({ key: "global" }).lean();
  if (!settings) {
    settings = await Settings.create({ key: "global" });
  }
  return settings;
}

export async function updateSettings(updates: Partial<Record<string, unknown>>) {
  const settings = await Settings.findOneAndUpdate(
    { key: "global" },
    { $set: updates },
    { upsert: true, new: true }
  ).lean();
  await addLog("admin", "Admin updated bot settings");
  return settings;
}

// ─── QUEUE ACTIONS ────────────────────────────────────────────────────────────

export async function removeFromQueue(telegramId: string): Promise<boolean> {
  const item = await QueueItem.findOneAndDelete({ telegramId });
  if (!item) return false;
  await User.updateOne({ telegramId }, { $set: { state: "idle" } });
  await addLog("queue", `Removed ${item.telegramName} from queue`, telegramId);
  return true;
}

export async function clearEntireQueue(): Promise<number> {
  const count = await QueueItem.countDocuments();
  const items = await QueueItem.find().select("telegramId").lean();
  const ids = items.map((i) => i.telegramId);
  await QueueItem.deleteMany({});
  if (ids.length > 0) {
    await User.updateMany({ telegramId: { $in: ids } }, { $set: { state: "idle" } });
  }
  await addLog("queue", `Admin cleared entire queue (${count} users removed)`);
  return count;
}

export async function forceRematch(telegramIdA: string, telegramIdB: string): Promise<unknown> {
  const [itemA, itemB] = await Promise.all([
    QueueItem.findOne({ telegramId: telegramIdA }),
    QueueItem.findOne({ telegramId: telegramIdB }),
  ]);
  if (!itemA || !itemB) throw new Error("One or both queue items not found");

  const matchId = `m_${Date.now()}`;
  const match = await Match.create({
    matchId,
    userA: {
      telegramId: itemA.telegramId,
      name: itemA.telegramName,
      tiktokUsername: itemA.tiktokUsername,
      link: itemA.submittedLink,
      isReady: false,
      proofSubmitted: false,
    },
    userB: {
      telegramId: itemB.telegramId,
      name: itemB.telegramName,
      tiktokUsername: itemB.tiktokUsername,
      link: itemB.submittedLink,
      isReady: false,
      proofSubmitted: false,
    },
    status: "active",
    proofStatus: "none",
    approvalStatus: "pending",
    startedTime: new Date(),
  });

  await Promise.all([
    QueueItem.deleteMany({ telegramId: { $in: [telegramIdA, telegramIdB] } }),
    User.updateMany(
      { telegramId: { $in: [telegramIdA, telegramIdB] } },
      { $set: { state: "matched" } }
    ),
  ]);

  await addLog("match", `Admin force-created match between ${itemA.telegramName} and ${itemB.telegramName}`);
  return match;
}

// ─── CLEANUP ─────────────────────────────────────────────────────────────────

export async function runCleanup(type: string): Promise<{ count: number }> {
  let count = 0;
  const settings = await Settings.findOne({ key: "global" }).lean();
  const queueTimeoutMinutes = settings?.queueTimeoutMinutes ?? 15;

  switch (type) {
    case "stale_queue": {
      const cutoff = new Date(Date.now() - queueTimeoutMinutes * 60 * 1000);
      const stale = await QueueItem.find({ queuedAt: { $lt: cutoff } }).select("telegramId").lean();
      const ids = stale.map((i) => i.telegramId);
      count = ids.length;
      if (count > 0) {
        await QueueItem.deleteMany({ telegramId: { $in: ids } });
        await User.updateMany({ telegramId: { $in: ids } }, { $set: { state: "idle" } });
      }
      await addLog("cleanup", `Removed ${count} stale queue items`);
      break;
    }

    case "stuck_matches": {
      const stuck = await Match.find({ status: "active" }).lean();
      count = stuck.length;
      const ids: string[] = [];
      for (const m of stuck) {
        ids.push(m.userA.telegramId, m.userB.telegramId);
      }
      await Match.updateMany({ status: "active" }, {
        $set: { status: "cancelled", cancelReason: "timeout", completedTime: new Date() },
      });
      if (ids.length > 0) {
        await User.updateMany({ telegramId: { $in: ids } }, { $set: { state: "idle" } });
      }
      await addLog("cleanup", `Force-cancelled ${count} stuck active matches`);
      break;
    }

    case "duplicate_queues": {
      const all = await QueueItem.find().sort({ queuedAt: 1 }).lean();
      const seen = new Set<string>();
      const toDelete: string[] = [];
      for (const q of all) {
        if (seen.has(q.telegramId)) toDelete.push(q.telegramId);
        else seen.add(q.telegramId);
      }
      count = toDelete.length;
      if (count > 0) {
        await QueueItem.deleteMany({ telegramId: { $in: toDelete } });
      }
      await addLog("cleanup", `Removed ${count} duplicate queue entries`);
      break;
    }

    default:
      throw new Error("Unknown cleanup type");
  }

  return { count };
}

// ─── BROADCAST ────────────────────────────────────────────────────────────────

export async function simulateBroadcast(target: string, message: string) {
  const now = new Date();
  let filter: Record<string, unknown> = {};
  if (target === "tiktok_registered") filter = { tiktokUsername: { $ne: "" } };
  else if (target === "active_only") filter = { banned: false, $or: [{ cooldownUntil: null }, { cooldownUntil: { $lt: now } }] };

  const estimatedRecipients = await User.countDocuments(filter);
  const failedCount = Math.floor(Math.random() * Math.ceil(estimatedRecipients * 0.05));
  const sentCount = estimatedRecipients - failedCount;

  await addLog("broadcast", `Admin broadcast to [${target}] — ${sentCount} sent, ${failedCount} failed.`);
  return { estimatedRecipients, sentCount, failedCount };
}
