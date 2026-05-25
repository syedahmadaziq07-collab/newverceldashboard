import User from "../models/User";
import Match from "../models/Match";
import QueueItem from "../models/QueueItem";
import BotLog from "../models/BotLog";
import AdminNotification from "../models/AdminNotification";
import Settings from "../models/Settings";
import { addLog, addNotification } from "../utils/adminLogger";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function deriveProofStatus(m: any): string {
  if (m.user1ProofSubmitted && m.user2ProofSubmitted) return "submitted_both";
  if (m.user1ProofSubmitted) return "submitted_a";
  if (m.user2ProofSubmitted) return "submitted_b";
  return "none";
}

function deriveApprovalStatus(m: any): string {
  if (m.user1ProofApprovedByPartner && m.user2ProofApprovedByPartner) return "approved";
  if (m.status === "cancelled" || m.status === "expired") return "rejected";
  return "pending";
}

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
    Match.countDocuments({ status: { $in: ["active", "pending_ready"] } }),
    Match.countDocuments({ status: "completed", updatedAt: { $gte: startOfDay } }),
    Match.countDocuments({ status: { $in: ["cancelled", "expired"] }, updatedAt: { $gte: startOfDay } }),
    User.countDocuments({ isBanned: true }),
    User.countDocuments({ cancelCooldownUntil: { $gt: now } }),
    User.countDocuments({ updatedAt: { $gte: fifteenMinutesAgo }, isBanned: false }),
    Match.countDocuments({
      status: { $in: ["cancelled", "expired"] },
      user1ProofSubmitted: false,
      user2ProofSubmitted: false,
      updatedAt: { $gte: startOfDay },
    }),
    Match.countDocuments({
      status: { $in: ["active", "pending_ready"] },
      $or: [{ user1ProofSubmitted: true }, { user2ProofSubmitted: true }],
    }),
    Match.countDocuments({
      user1ProofApprovedByPartner: false,
      user2ProofApprovedByPartner: false,
      status: { $in: ["cancelled", "expired"] },
      updatedAt: { $gte: startOfDay },
      $or: [{ user1ProofSubmitted: true }, { user2ProofSubmitted: true }],
    }),
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
    QueueItem.find().sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    QueueItem.countDocuments(),
  ]);
  const now = Date.now();
  const data = items.map((q: any) => ({
    id: String(q.telegramId),
    userId: String(q.telegramId),
    telegramId: String(q.telegramId),
    telegramUsername: q.telegramUsername || "",
    telegramName: q.telegramName || "",
    tiktokUsername: q.tiktokUsername || "",
    submittedLink: q.pendingLink || "",
    isReady: q.status === "waiting",
    queuedAt: q.createdAt instanceof Date ? q.createdAt.toISOString() : String(q.createdAt ?? ""),
    waitingMinutes: q.createdAt ? Math.floor((now - new Date(q.createdAt).getTime()) / 60000) : 0,
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
    Match.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Match.countDocuments(filter),
  ]);
  const data = items.map((m: any) => ({
    id: m._id.toString(),
    userAId: m.user1Id,
    userAName: "",
    userATiktok: "",
    userALink: m.link1,
    userBId: m.user2Id,
    userBName: "",
    userBTiktok: "",
    userBLink: m.link2,
    status: m.status,
    proofStatus: deriveProofStatus(m),
    approvalStatus: deriveApprovalStatus(m),
    cancelReason: m.cancelReason ?? null,
    startedTime: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
    completedTime: m.updatedAt instanceof Date ? m.updatedAt.toISOString() : null,
    proofImageUrl: undefined,
    auditLoggerNote: m.auditNote,
  }));
  return { data, total, page, pages: Math.ceil(total / limit) };
}

export async function cancelMatch(matchId: string): Promise<boolean> {
  const match = await Match.findById(matchId);
  if (!match) return false;

  match.status = "cancelled";
  match.cancelReason = "manual";
  await match.save();

  await User.updateMany(
    { telegramId: { $in: [match.user1Id, match.user2Id] } },
    { $set: { state: "idle" } }
  );

  await addLog("match", `Admin force-cancelled match ${matchId}.`, undefined, matchId);
  return true;
}

export async function auditProof(
  matchId: string,
  verdict: "approve" | "reject",
  cooldownHours = 12
): Promise<boolean> {
  const match = await Match.findById(matchId);
  if (!match) return false;

  if (verdict === "approve") {
    match.status = "completed";
    match.user1ProofApprovedByPartner = true;
    match.user2ProofApprovedByPartner = true;
    await match.save();
    await User.updateMany(
      { telegramId: { $in: [match.user1Id, match.user2Id] } },
      { $set: { state: "idle" }, $inc: { totalApprovedCount: 1 } }
    );
    await addLog("proof", `Proof approved for match ${matchId}.`, undefined, matchId);
  } else {
    match.status = "cancelled";
    await match.save();
    const cancelCooldownUntil = new Date(Date.now() + cooldownHours * 60 * 60 * 1000);
    await User.updateMany(
      { telegramId: { $in: [match.user1Id, match.user2Id] } },
      { $set: { state: "idle", cancelCooldownUntil } }
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
  const data = items.map((l: any) => ({
    id: l._id.toString(),
    timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : String(l.timestamp),
    category: l.category,
    message: l.message,
  }));
  return { data, total, page, pages: Math.ceil(total / limit) };
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
  if (bannedOnly) filter.isBanned = true;
  if (search) {
    filter.$or = [
      { telegramUsername: { $regex: search, $options: "i" } },
      { tiktokUsername: { $regex: search, $options: "i" } },
      { telegramId: isNaN(Number(search)) ? undefined : Number(search) },
    ].filter((c) => c !== undefined && Object.values(c)[0] !== undefined);
  }
  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v")
      .lean(),
    User.countDocuments(filter),
  ]);

  const data = items.map((u: any) => ({
    id: String(u.telegramId),
    name: u.telegramUsername || String(u.telegramId),
    username: u.telegramUsername || "",
    tiktokUsername: u.tiktokUsername || "",
    remainingCuts: u.cutBalance ?? 0,
    state: u.state,
    banned: u.isBanned,
    isBlocked: u.isBanned,
    banReason: u.banReason ?? null,
    blockedAt: u.blockedAt ? new Date(u.blockedAt).toISOString() : null,
    cooldownUntil: u.cancelCooldownUntil ? new Date(u.cancelCooldownUntil).toISOString() : null,
    cooldownReason: u.cooldownReason ?? null,
    joinedTime: u.joinedTime?.toISOString?.() ?? new Date().toISOString(),
    lastActive: u.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    warningsCount: u.strikes ?? 0,
    inactivityStrikes: u.inactivityStrikes ?? 0,
    ghostCount: u.ghostCount ?? 0,
    matchedCancelCount: u.matchedCancelCount ?? 0,
    rejectedProofCount: u.rejectedProofCount ?? 0,
    isSuspicious: u.isSuspicious ?? false,
    completedSwaps: u.totalApprovedCount ?? 0,
  }));

  return { data, total, page, pages: Math.ceil(total / limit) };
}

export async function blockUser(telegramId: string, reason: string): Promise<boolean> {
  const user = await User.findOne({ telegramId: Number(telegramId) });
  if (!user) return false;

  user.isBanned = true;
  user.banReason = reason;
  (user as any).blockedAt = new Date();
  user.state = "idle";
  await user.save();

  await QueueItem.deleteOne({ telegramId: Number(telegramId) });
  const displayName = (user as any).telegramUsername || String(user.telegramId);
  await addLog("ban", `Admin BLOCKED user ${displayName} (${telegramId}). Reason: ${reason}`, telegramId);
  await addNotification("ban", "USER_BLOCKED", `Admin blocked ${displayName}. Reason: ${reason}`);
  return true;
}

export async function unblockUser(telegramId: string): Promise<boolean> {
  const user = await User.findOne({ telegramId: Number(telegramId) });
  if (!user) return false;

  user.isBanned = false;
  user.banReason = undefined;
  (user as any).blockedAt = null;
  await user.save();

  const displayName = (user as any).telegramUsername || String(user.telegramId);
  await addLog("ban", `Admin UNBLOCKED user ${displayName} (${telegramId})`, telegramId);
  return true;
}

export async function applyUserCooldown(telegramId: string, hours: number, reason: string): Promise<boolean> {
  const user = await User.findOne({ telegramId: Number(telegramId) });
  if (!user) return false;

  const cancelCooldownUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
  user.cancelCooldownUntil = cancelCooldownUntil;
  (user as any).cooldownReason = reason;
  user.state = "idle";
  await user.save();

  await QueueItem.deleteOne({ telegramId: Number(telegramId) });
  const displayName = (user as any).telegramUsername || String(user.telegramId);
  await addLog("cooldown", `Admin applied ${hours}h cooldown to ${displayName}. Reason: ${reason}`, telegramId);
  await addNotification("cooldown", "USER_COOLDOWN_APPLIED", `${displayName} placed on ${hours}h cooldown. Reason: ${reason}`);
  return true;
}

export async function removeUserCooldown(telegramId: string): Promise<boolean> {
  const user = await User.findOne({ telegramId: Number(telegramId) });
  if (!user) return false;

  user.cancelCooldownUntil = null;
  (user as any).cooldownReason = null;
  await user.save();

  const displayName = (user as any).telegramUsername || String(user.telegramId);
  await addLog("cooldown", `Admin removed cooldown from ${displayName} (${telegramId})`, telegramId);
  return true;
}

export async function banUser(telegramId: string, reason: string): Promise<boolean> {
  const user = await User.findOne({ telegramId: Number(telegramId) });
  if (!user) return false;

  user.isBanned = true;
  user.banReason = reason;
  user.state = "idle";
  await user.save();

  await QueueItem.deleteOne({ telegramId: Number(telegramId) });
  const displayName = (user as any).telegramUsername || String(user.telegramId);
  await addLog("ban", `Admin banned user ${displayName} (${telegramId}). Reason: ${reason}`, telegramId);
  await addNotification("ban", "Manual Ban Applied", `Admin banned ${displayName}. Reason: ${reason}`);
  return true;
}

export async function unbanUser(telegramId: string): Promise<boolean> {
  const user = await User.findOne({ telegramId: Number(telegramId) });
  if (!user) return false;

  user.isBanned = false;
  user.banReason = undefined;
  await user.save();

  const displayName = (user as any).telegramUsername || String(user.telegramId);
  await addLog("ban", `Admin unbanned user ${displayName} (${telegramId})`, telegramId);
  return true;
}

export async function performUserAction(
  telegramId: string,
  action: string,
  payload?: Record<string, unknown>
): Promise<{ success: boolean; message: string; user?: unknown }> {
  const user = await User.findOne({ telegramId: Number(telegramId) });
  if (!user) return { success: false, message: "User not found" };

  const settings = await Settings.findOne({ key: "global" }).lean();
  const dailyCutsAmount = settings?.dailyCutsAmount ?? 3;
  const displayName = (user as any).telegramUsername || String(user.telegramId);

  switch (action) {
    case "reset_cuts":
      (user as any).cutBalance = dailyCutsAmount;
      await addLog("user", `Reset cuts to ${dailyCutsAmount} for ${displayName}`, telegramId);
      break;

    case "ban":
      user.isBanned = true;
      user.banReason = (payload?.reason as string) || "Manual ban by admin";
      user.state = "idle";
      await QueueItem.deleteOne({ telegramId: Number(telegramId) });
      await addLog("ban", `Admin banned ${displayName}`, telegramId);
      await addNotification("ban", "Manual Ban Applied", `Admin banned ${displayName}`);
      break;

    case "unban":
      user.isBanned = false;
      user.banReason = undefined;
      await addLog("ban", `Admin unbanned ${displayName}`, telegramId);
      break;

    case "clear_cooldown":
      user.cancelCooldownUntil = null;
      await addLog("cooldown", `Cleared cooldown for ${displayName}`, telegramId);
      break;

    case "cooldown_24h": {
      const until = new Date(Date.now() + 24 * 60 * 60 * 1000);
      user.cancelCooldownUntil = until;
      user.state = "idle";
      await QueueItem.deleteOne({ telegramId: Number(telegramId) });
      await addLog("cooldown", `Applied 24h cooldown to ${displayName}`, telegramId);
      await addNotification("cooldown", "24hr Penalty Cooldown", `@${displayName} was placed on 24h cooldown`);
      break;
    }

    case "warn":
      user.strikes = (user.strikes || 0) + 1;
      await addLog("user", `Warned ${displayName}. Total: ${user.strikes}`, telegramId);
      if (user.strikes >= 5) {
        user.isBanned = true;
        user.state = "idle";
        await QueueItem.deleteOne({ telegramId: Number(telegramId) });
        await addLog("ban", `Auto-banned ${displayName} (exceeded warning limit)`, telegramId);
        await addNotification("ban", "Auto-Ban: Exceeded Warnings", `${displayName} reached max warnings (${user.strikes}/5)`);
      }
      break;

    case "reset_state":
      user.state = "idle";
      await QueueItem.deleteOne({ telegramId: Number(telegramId) });
      await addLog("user", `Reset state to idle for ${displayName}`, telegramId);
      break;

    case "adjust_stats":
      if (payload) {
        if (payload.inactivityStrikes !== undefined) user.inactivityStrikes = payload.inactivityStrikes as number;
        if (payload.ghostCount !== undefined) user.ghostCount = payload.ghostCount as number;
        if (payload.isSuspicious !== undefined) user.isSuspicious = payload.isSuspicious as boolean;
      }
      await addLog("user", `Updated stats for ${displayName}`, telegramId);
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
    User.find({ isBanned: true })
      .select("telegramId telegramUsername tiktokUsername banReason strikes ghostCount")
      .lean(),
    User.find({ cancelCooldownUntil: { $gt: now } })
      .select("telegramId telegramUsername tiktokUsername cancelCooldownUntil strikes")
      .lean(),
  ]);

  return {
    banned: banned.map((u: any) => ({
      telegramId: String(u.telegramId),
      name: u.telegramUsername || String(u.telegramId),
      username: u.telegramUsername || "",
      tiktokUsername: u.tiktokUsername,
      reason: u.banReason || "No reason provided",
      warningsCount: u.strikes,
      ghostCount: u.ghostCount,
    })),
    cooldowns: cooldowns.map((u: any) => ({
      telegramId: String(u.telegramId),
      name: u.telegramUsername || String(u.telegramId),
      username: u.telegramUsername || "",
      tiktokUsername: u.tiktokUsername,
      cooldownUntil: u.cancelCooldownUntil,
      warningsCount: u.strikes,
      minutesRemaining: Math.ceil(
        (new Date(u.cancelCooldownUntil!).getTime() - now.getTime()) / 60000
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
  const item = await QueueItem.findOneAndDelete({ telegramId: Number(telegramId) });
  if (!item) return false;
  await User.updateOne({ telegramId: Number(telegramId) }, { $set: { state: "idle" } });
  const name = (item as any).telegramName || (item as any).telegramUsername || telegramId;
  await addLog("queue", `Removed ${name} from queue`, telegramId);
  return true;
}

export async function clearEntireQueue(): Promise<number> {
  const count = await QueueItem.countDocuments();
  const items = await QueueItem.find().select("telegramId").lean();
  const ids = items.map((i: any) => Number(i.telegramId));
  await QueueItem.deleteMany({});
  if (ids.length > 0) {
    await User.updateMany({ telegramId: { $in: ids } }, { $set: { state: "idle" } });
  }
  await addLog("queue", `Admin cleared entire queue (${count} users removed)`);
  return count;
}

export async function forceRematch(telegramIdA: string, telegramIdB: string): Promise<unknown> {
  const [itemA, itemB] = await Promise.all([
    QueueItem.findOne({ telegramId: Number(telegramIdA) }),
    QueueItem.findOne({ telegramId: Number(telegramIdB) }),
  ]);
  if (!itemA || !itemB) throw new Error("One or both queue items not found");

  const match = await Match.create({
    user1Id: String(itemA.telegramId),
    user2Id: String(itemB.telegramId),
    link1: (itemA as any).pendingLink || "",
    link2: (itemB as any).pendingLink || "",
    status: "active",
    user1ProofSubmitted: false,
    user2ProofSubmitted: false,
    user1ProofApprovedByPartner: false,
    user2ProofApprovedByPartner: false,
  });

  await Promise.all([
    QueueItem.deleteMany({ telegramId: { $in: [Number(telegramIdA), Number(telegramIdB)] } }),
    User.updateMany(
      { telegramId: { $in: [Number(telegramIdA), Number(telegramIdB)] } },
      { $set: { state: "matched" } }
    ),
  ]);

  const nameA = (itemA as any).telegramName || (itemA as any).telegramUsername || telegramIdA;
  const nameB = (itemB as any).telegramName || (itemB as any).telegramUsername || telegramIdB;
  await addLog("match", `Admin force-created match between ${nameA} and ${nameB}`);
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
      const stale = await QueueItem.find({ createdAt: { $lt: cutoff } }).select("telegramId").lean();
      const ids = stale.map((i: any) => Number(i.telegramId));
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
        ids.push(m.user1Id, m.user2Id);
      }
      await Match.updateMany({ status: "active" }, {
        $set: { status: "cancelled", cancelReason: "timeout" },
      });
      if (ids.length > 0) {
        await User.updateMany({ telegramId: { $in: ids.map(Number) } }, { $set: { state: "idle" } });
      }
      await addLog("cleanup", `Force-cancelled ${count} stuck active matches`);
      break;
    }

    case "duplicate_queues": {
      const all = await QueueItem.find().sort({ createdAt: 1 }).lean();
      const seen = new Set<string>();
      const toDelete: number[] = [];
      for (const q of all as any[]) {
        const key = String(q.telegramId);
        if (seen.has(key)) toDelete.push(Number(q.telegramId));
        else seen.add(key);
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
  else if (target === "banned") filter = { isBanned: true };
  else if (target === "cooldown") filter = { cancelCooldownUntil: { $gt: now } };

  const recipientCount = await User.countDocuments(filter);

  await addLog("admin", `Admin broadcast to "${target}" (${recipientCount} users): ${message.slice(0, 80)}`);

  return {
    target,
    recipientCount,
    message,
    simulatedAt: now.toISOString(),
  };
}
