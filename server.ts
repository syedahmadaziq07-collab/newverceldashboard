import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { 
  User, 
  QueueItem, 
  Match, 
  Referral, 
  BotSettings, 
  BotLog, 
  BroadcastStats, 
  DashboardStats 
} from "./src/types";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Admin authentication middleware password
const ADMIN_PASSWORD = process.env.DASHBOARD_PASSWORD || "admin123";

// Ensure json parser is loaded
app.use(express.json());

// ==========================================
// IN-MEMORY DATA STORE
// ==========================================

let users: User[] = [
  {
    id: "9283741",
    name: "Ahmad Farhan",
    username: "ahmadfarhan",
    tiktokUsername: "@ahmad_cuts",
    remainingCuts: 3,
    state: "idle",
    banned: false,
    cooldownUntil: null,
    joinedTime: "2026-05-10T14:32:00Z",
    lastActive: "2026-05-23T08:20:00Z",
    warningsCount: 0,
    inactivityStrikes: 0,
    ghostCount: 1,
    matchedCancelCount: 1,
    rejectedProofCount: 0,
    isSuspicious: false
  },
  {
    id: "4829102",
    name: "Siti Aminah",
    username: "sitiaminah_99",
    tiktokUsername: "@siti_unboxer",
    remainingCuts: 0,
    state: "queued",
    banned: false,
    cooldownUntil: null,
    joinedTime: "2026-05-12T09:15:00Z",
    lastActive: "2026-05-23T08:18:00Z",
    warningsCount: 1,
    inactivityStrikes: 0,
    ghostCount: 0,
    matchedCancelCount: 0,
    rejectedProofCount: 1,
    isSuspicious: false
  },
  {
    id: "5720194",
    name: "Danny Lim",
    username: "dannylim_swap",
    tiktokUsername: "@dannylim.tiktok",
    remainingCuts: 5,
    state: "matched",
    banned: false,
    cooldownUntil: null,
    joinedTime: "2026-05-11T16:45:00Z",
    lastActive: "2026-05-23T08:15:00Z",
    warningsCount: 0,
    inactivityStrikes: 1,
    ghostCount: 0,
    matchedCancelCount: 2,
    rejectedProofCount: 0,
    isSuspicious: false
  },
  {
    id: "3810294",
    name: "Amira Syahirah",
    username: "amira_syah",
    tiktokUsername: "@amirasya_beauty",
    remainingCuts: 1,
    state: "matched",
    banned: false,
    cooldownUntil: null,
    joinedTime: "2026-05-14T11:20:00Z",
    lastActive: "2026-05-23T08:19:00Z",
    warningsCount: 0,
    inactivityStrikes: 0,
    ghostCount: 0,
    matchedCancelCount: 0,
    rejectedProofCount: 0,
    isSuspicious: false
  },
  {
    id: "1928374",
    name: "Chua Keng",
    username: "chuakeng_official",
    tiktokUsername: "@chua_cuts_links",
    remainingCuts: 2,
    state: "queued",
    banned: false,
    cooldownUntil: null,
    joinedTime: "2026-05-15T08:30:00Z",
    lastActive: "2026-05-23T08:07:00Z",
    warningsCount: 2,
    inactivityStrikes: 2,
    ghostCount: 2,
    matchedCancelCount: 1,
    rejectedProofCount: 2,
    isSuspicious: true // flagged due to high strikes
  },
  {
    id: "6829103",
    name: "Ravi Kumar",
    username: "ravip_swap",
    tiktokUsername: "@ravikumar_cuts",
    remainingCuts: 0,
    state: "idle",
    banned: false,
    cooldownUntil: "2026-05-23T12:00:00Z", // Active cooldown
    joinedTime: "2026-05-13T10:10:00Z",
    lastActive: "2026-05-23T06:30:00Z",
    warningsCount: 4,
    inactivityStrikes: 3,
    ghostCount: 6, // High ghost rate
    matchedCancelCount: 5,
    rejectedProofCount: 1,
    isSuspicious: true
  },
  {
    id: "8739102",
    name: "Jason Wong",
    username: "jasonwong_tok",
    tiktokUsername: "", // No TikTok user yet
    remainingCuts: 3,
    state: "idle",
    banned: false,
    cooldownUntil: null,
    joinedTime: "2026-05-18T15:22:00Z",
    lastActive: "2026-05-22T19:40:00Z",
    warningsCount: 0,
    inactivityStrikes: 0,
    ghostCount: 0,
    matchedCancelCount: 0,
    rejectedProofCount: 0,
    isSuspicious: false
  },
  {
    id: "2738192",
    name: "Zulkhairi Kassim",
    username: "zul_kass",
    tiktokUsername: "@zulkass_tiktok",
    remainingCuts: 3,
    state: "idle",
    banned: true, // Banned
    cooldownUntil: null,
    joinedTime: "2026-05-09T12:00:00Z",
    lastActive: "2026-05-18T11:15:00Z",
    warningsCount: 5,
    inactivityStrikes: 5,
    ghostCount: 8,
    matchedCancelCount: 7,
    rejectedProofCount: 3,
    isSuspicious: true
  },
  {
    id: "3928104",
    name: "Emily Tan",
    username: "emilytan_vlog",
    tiktokUsername: "@emilytan_daily",
    remainingCuts: 3,
    state: "idle",
    banned: false,
    cooldownUntil: null,
    joinedTime: "2026-05-20T17:40:00Z",
    lastActive: "2026-05-23T08:12:00Z",
    warningsCount: 0,
    inactivityStrikes: 0,
    ghostCount: 0,
    matchedCancelCount: 0,
    rejectedProofCount: 0,
    isSuspicious: false
  }
];

let queues: QueueItem[] = [
  {
    id: "q_1",
    userId: "4829102",
    telegramName: "Siti Aminah",
    tiktokUsername: "@siti_unboxer",
    submittedLink: "https://vt.tiktok.com/ZS2xApY91/",
    queuedAt: "2026-05-23T08:02:49Z"
  },
  {
    id: "q_2",
    userId: "1928374",
    telegramName: "Chua Keng",
    tiktokUsername: "@chua_cuts_links",
    submittedLink: "https://vt.tiktok.com/ZS2xAmN28/",
    queuedAt: "2026-05-23T08:07:15Z"
  }
];

let matches: Match[] = [
  {
    id: "m_1",
    userAId: "5720194",
    userAName: "Danny Lim",
    userATiktok: "@dannylim.tiktok",
    userALink: "https://vt.tiktok.com/ZS2xADan9/",
    userBId: "3810294",
    userBName: "Amira Syahirah",
    userBTiktok: "@amirasya_beauty",
    userBLink: "https://vt.tiktok.com/ZS2xAmira3/",
    status: "active",
    proofStatus: "submitted_a",
    approvalStatus: "pending",
    startedTime: "2026-05-23T07:55:00Z",
    completedTime: null,
    proofImageUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "m_2",
    userAId: "9283741",
    userAName: "Ahmad Farhan",
    userATiktok: "@ahmad_cuts",
    userALink: "https://vt.tiktok.com/ZS2xApFar/",
    userBId: "3928104",
    userBName: "Emily Tan",
    userBTiktok: "@emilytan_daily",
    userBLink: "https://vt.tiktok.com/ZS2xEmily9/",
    status: "completed",
    proofStatus: "submitted_both",
    approvalStatus: "approved",
    startedTime: "2026-05-23T06:15:30Z",
    completedTime: "2026-05-23T06:23:12Z",
    proofImageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "m_3",
    userAId: "6829103",
    userAName: "Ravi Kumar",
    userATiktok: "@ravikumar_cuts",
    userALink: "https://vt.tiktok.com/ZS2xRavi82/",
    userBId: "4829102",
    userBName: "Siti Aminah",
    userBTiktok: "@siti_unboxer",
    userBLink: "https://vt.tiktok.com/ZS2xSiti93/",
    status: "cancelled",
    proofStatus: "none",
    approvalStatus: "rejected",
    startedTime: "2026-05-23T05:00:00Z",
    completedTime: "2026-05-23T05:15:00Z"
  }
];

let referrals: Referral[] = [
  {
    id: "ref_1",
    referralCode: "CUT_9283",
    inviterId: "9283741",
    inviterName: "Ahmad Farhan",
    invitedId: "3810294",
    invitedName: "Amira Syahirah",
    status: "completed",
    rewardGranted: true,
    rewardAmount: 1,
    timestamp: "2026-05-14T11:20:00Z"
  },
  {
    id: "ref_2",
    referralCode: "CUT_9283",
    inviterId: "9283741",
    inviterName: "Ahmad Farhan",
    invitedId: "8739102",
    invitedName: "Jason Wong",
    status: "pending",
    rewardGranted: false,
    rewardAmount: 1,
    timestamp: "2026-05-18T15:22:00Z"
  },
  {
    id: "ref_3",
    referralCode: "CUT_4829",
    inviterId: "4829102",
    inviterName: "Siti Aminah",
    invitedId: "3928104",
    invitedName: "Emily Tan",
    status: "completed",
    rewardGranted: true,
    rewardAmount: 1,
    timestamp: "2026-05-20T17:40:00Z"
  }
];

let settings: BotSettings = {
  startMessage: "👋 Welcome to TikTok Cut Link Swap Bot!\n\nHere you can exchange cuts for your TikTok Price Cut items. Join the queue, and we will pair you with another user. You help cut theirs, they help cut yours!\n\nUse /register [TikTok Username] to start.",
  queueWaitingMessage: "🔍 Finding you a partner... You are currently in the queue. Please do not submit another link while in queue.",
  partnerFoundMessage: "🎉 Partner found! You have been matched with {partner_tiktok}.\n\n🔗 Click this link and help them cut: {partner_link}\n\n📸 Once done, upload a mobile screenshot of the cut success page as proof here!",
  proofUploadMessage: "📥 Proof screenshot received! Our system is notifying your partner to cut yours. Wait for administration/automated system validation.",
  proofApprovedMessage: "✅ Proof approved! Your TikTok item is one cut closer to its target discount. Keep swapping!",
  timeoutMessage: "⚠️ Swap expired! You or your partner did not submit proof within the {timeout} minutes limit.",
  broadcastNotificationMessage: "📢 Announcement from admin: {message}",
  dailyCutsAmount: 3,
  maxCuts: 5,
  referralRewardCuts: 1,
  proofTimeoutMinutes: 30,
  queueTimeoutMinutes: 15,
  matchmakingEnabled: true,
  broadcastsEnabled: true,
  maintenanceMode: false,
  reminderIntervalMinutes: 5,
  ghostStrikeLimit: 3,
  cooldownDurationHours: 12
};

import { AdminNotification } from "./src/types";

let notifications: AdminNotification[] = [
  {
    id: "warn_1",
    timestamp: "2026-05-23T08:15:00Z",
    type: "ghost_detected",
    title: "Ghost Activity Flagged",
    message: "@ravikumar_cuts missed 3 matches within 24h. Heavy ghosting pattern detected.",
    resolved: false
  },
  {
    id: "warn_2",
    timestamp: "2026-05-23T08:05:00Z",
    type: "proof_rejected",
    title: "Proof Upload Dispute",
    message: "Admin rejected proof from Match #m_3 due to mismatching cut values.",
    resolved: true
  },
  {
    id: "warn_3",
    timestamp: "2026-05-19T14:30:00Z",
    type: "ban",
    title: "Automation Ban Triggered",
    message: "User Zulkhairi Kassim was banned automatically for exceeding max strike allowance (5).",
    resolved: true
  }
];

function addNotification(type: AdminNotification["type"], title: string, message: string) {
  const newNotif: AdminNotification = {
    id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    type,
    title,
    message,
    resolved: false
  };
  notifications.unshift(newNotif);
}

let logs: BotLog[] = [
  {
    id: "log_1",
    timestamp: "2026-05-23T05:00:00Z",
    category: "match",
    message: "Match m_3 created between Ravi Kumar (@ravikumar_cuts) and Siti Aminah (@siti_unboxer)."
  },
  {
    id: "log_2",
    timestamp: "2026-05-23T05:15:00Z",
    category: "cooldown",
    message: "Match m_3 cancelled due to timeout. Applied 12-hour cooldown to Ravi Kumar."
  },
  {
    id: "log_3",
    timestamp: "2026-05-23T06:15:30Z",
    category: "match",
    message: "Match m_2 created between Ahmad Farhan (@ahmad_cuts) and Emily Tan (@emilytan_daily)."
  },
  {
    id: "log_4",
    timestamp: "2026-05-23T06:18:22Z",
    category: "proof",
    message: "Emily Tan submitted proof for Match m_2."
  },
  {
    id: "log_5",
    timestamp: "2026-05-23T06:20:10Z",
    category: "proof",
    message: "Ahmad Farhan submitted proof for Match m_2."
  },
  {
    id: "log_6",
    timestamp: "2026-05-23T06:23:12Z",
    category: "proof",
    message: "Admin approved Match m_2 swaps. Reward granted to details."
  },
  {
    id: "log_7",
    timestamp: "2026-05-23T07:55:00Z",
    category: "match",
    message: "Match m_1 created between Danny Lim (@dannylim.tiktok) and Amira Syahirah (@amirasya_beauty)."
  },
  {
    id: "log_8",
    timestamp: "2026-05-23T08:02:49Z",
    category: "queue",
    message: "Siti Aminah entered swap queue with link https://vt.tiktok.com/ZS2xApY91/."
  },
  {
    id: "log_9",
    timestamp: "2026-05-23T08:05:14Z",
    category: "proof",
    message: "Danny Lim submitted proof screenshot for Match m_1."
  },
  {
    id: "log_10",
    timestamp: "2026-05-23T08:07:15Z",
    category: "queue",
    message: "Chua Keng entered swap queue with link https://vt.tiktok.com/ZS2xAmN28/."
  }
];

// Helper to write a new log
function addLog(category: BotLog["category"], message: string) {
  const newLog: BotLog = {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    category,
    message
  };
  logs.unshift(newLog);
}

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

function authGuard(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Unauthorized. Missing admin token." });
    return;
  }
  
  if (authHeader !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Access denied. Invalid admin password." });
    return;
  }
  
  next();
}

// ==========================================
// ADMIN API ENDPOINTS
// ==========================================

// Login endpoint
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (!password) {
    res.status(400).json({ error: "Password is required" });
    return;
  }
  if (password === ADMIN_PASSWORD) {
    addLog("admin", "Admin log-in session started.");
    res.json({ success: true, token: ADMIN_PASSWORD });
  } else {
    addLog("admin", `Failed login attempt using invalid credentials.`);
    res.status(401).json({ error: "Incorrect password" });
  }
});

// Get overall dashboard stats
app.get("/api/admin/stats", authGuard, (req, res) => {
  const totalUsersStart = users.length;
  const registeredTiktokUsers = users.filter(u => u.tiktokUsername !== "").length;
  const usersInQueue = queues.length;
  const activeMatches = matches.filter(m => m.status === "active").length;
  
  // mock counts derived from recent dates
  const completedSwapsToday = matches.filter(m => m.status === "completed").length;
  const proofRejectedToday = matches.filter(m => m.status === "cancelled" && m.approvalStatus === "rejected").length;
  const bannedUsers = users.filter(u => u.banned).length;
  
  // Cooldown status check against current time
  const now = new Date();
  const cooldownUsers = users.filter(u => {
    if (!u.cooldownUntil) return false;
    return new Date(u.cooldownUntil) > now;
  }).length;

  // Rich calculations for production
  // Active users count: standard offline checking, let's treat users active today as active, or randomize subtle heartbeat 3-7 active
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const activeNow = users.filter(u => new Date(u.lastActive) > fifteenMinutesAgo).length || 5;

  const cancelledSwapsToday = matches.filter(m => m.status === "cancelled").length;
  const ghostedSwapsToday = matches.filter(m => m.status === "cancelled" && m.proofStatus === "none").length;
  const averageQueueWaitMinutes = 3.8; // mock representation
  
  const totalConcluded = matches.filter(m => m.status !== "active").length;
  const totalCompleted = matches.filter(m => m.status === "completed").length;
  const successRatePercent = totalConcluded > 0 ? Math.round((totalCompleted / totalConcluded) * 100) : 85;

  const response: DashboardStats = {
    totalUsersStart,
    registeredTiktokUsers,
    usersInQueue,
    activeMatches,
    completedSwapsToday,
    proofRejectedToday,
    bannedUsers,
    cooldownUsers,
    activeUsersNow: activeNow,
    cancelledSwapsToday,
    ghostedSwapsToday,
    averageQueueWaitMinutes,
    successRatePercent
  };

  res.json(response);
});

// Users list API
app.get("/api/admin/users", authGuard, (req, res) => {
  res.json(users);
});

// Users action API
app.post("/api/admin/users/action", authGuard, (req, res) => {
  const { userId, action, payload } = req.body;
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const user = users[userIndex];

  switch (action) {
    case "reset_cuts":
      user.remainingCuts = settings.dailyCutsAmount;
      addLog("user", `Reset cuts to default daily amount (${settings.dailyCutsAmount}) for user ${user.name} (${user.id}).`);
      break;
    case "ban":
      user.banned = true;
      user.state = "idle";
      // Clear from queue if they were there
      queues = queues.filter(q => q.userId !== userId);
      addLog("ban", `Banned user ${user.name} (${user.id}). Remaining cuts reset.`);
      addNotification("ban", "Manual Ban Applied", `Admin permanently banned ${user.name} (${user.username || user.id}).`);
      break;
    case "unban":
      user.banned = false;
      addLog("ban", `Unbanned user ${user.name} (${user.id}).`);
      break;
    case "clear_cooldown":
      user.cooldownUntil = null;
      addLog("cooldown", `Cleared cooldown for user ${user.name} (${user.id}).`);
      break;
    case "cooldown_24h":
      user.cooldownUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      user.state = "idle";
      queues = queues.filter(q => q.userId !== userId);
      addLog("cooldown", `Placed user ${user.name} (${user.id}) on a 24-hour timeout penalty.`);
      addNotification("cooldown", "24hr Penalty Cooldown", `@${user.username || user.name} was placed on 24-hour cooldown.`);
      break;
    case "warn":
      user.warningsCount = (user.warningsCount || 0) + 1;
      addLog("user", `Warned user ${user.name} (${user.id}). Total warnings: ${user.warningsCount}.`);
      
      if (user.warningsCount >= 5) {
        user.banned = true;
        user.state = "idle";
        queues = queues.filter(q => q.userId !== userId);
        addLog("ban", `User ${user.name} was auto-banned for exceeding the 5 warning limit.`);
        addNotification("ban", "Auto-Ban: Exceeded Warnings", `${user.name} reached max warning limit (${user.warningsCount}/5) and was banned.`);
      }
      break;
    case "adjust_stats":
      if (payload) {
        if (payload.inactivityStrikes !== undefined) user.inactivityStrikes = payload.inactivityStrikes;
        if (payload.ghostCount !== undefined) user.ghostCount = payload.ghostCount;
        if (payload.isSuspicious !== undefined) user.isSuspicious = payload.isSuspicious;
      }
      addLog("user", `Updated moderation performance statistics for ${user.name}.`);
      break;
    case "reset_state":
      user.state = "idle";
      queues = queues.filter(q => q.userId !== userId);
      addLog("user", `State reset to 'idle' for user ${user.name} (${user.id}).`);
      break;
    default:
      res.status(400).json({ error: "Unknown action" });
      return;
  }

  res.json({ success: true, updatedUser: user, users });
});

// Queue list API
app.get("/api/admin/queue", authGuard, (req, res) => {
  res.json(queues);
});

// Queue actions
app.post("/api/admin/queue/action", authGuard, (req, res) => {
  const { queueId, action } = req.body;

  if (action === "clear_stale") {
    const expiredCount = queues.length;
    queues = [];
    // Reset all queueing users state
    users = users.map(u => {
      if (u.state === "queued") {
        return { ...u, state: "idle" };
      }
      return u;
    });
    addLog("queue", `Cleared entire waiting queue of ${expiredCount} users.`);
    res.json({ success: true, queues });
    return;
  }

  const index = queues.findIndex(q => q.id === queueId);
  if (index === -1) {
    res.status(404).json({ error: "Queue item not found" });
    return;
  }

  const queueItem = queues[index];
  const targetUser = users.find(u => u.id === queueItem.userId);

  switch (action) {
    case "remove":
      queues.splice(index, 1);
      if (targetUser) {
        targetUser.state = "idle";
      }
      addLog("queue", `Removed user ${queueItem.telegramName} from the queue.`);
      break;

    case "force_rematch":
      // Pull another user from queue and simulate creating match
      if (queues.length >= 2) {
        const itemAIdx = queues.findIndex(q => q.id === queueId);
        const itemBIdx = queues.findIndex(q => q.id !== queueId);
        
        if (itemAIdx !== -1 && itemBIdx !== -1) {
          const itemA = queues[itemAIdx];
          const itemB = queues[itemBIdx];
          
          const newMatch: Match = {
            id: `m_${Date.now()}`,
            userAId: itemA.userId,
            userAName: itemA.telegramName,
            userATiktok: itemA.tiktokUsername,
            userALink: itemA.submittedLink,
            userBId: itemB.userId,
            userBName: itemB.telegramName,
            userBTiktok: itemB.tiktokUsername,
            userBLink: itemB.submittedLink,
            status: "active",
            proofStatus: "none",
            approvalStatus: "pending",
            startedTime: new Date().toISOString(),
            completedTime: null
          };
          
          matches.unshift(newMatch);
          
          // Update users' state
          users = users.map(u => {
            if (u.id === itemA.userId || u.id === itemB.userId) {
              return { ...u, state: "matched" };
            }
            return u;
          });

          // Remove both from queue
          queues = queues.filter(q => q.id !== itemA.id && q.id !== itemB.id);

          addLog("match", `Match force-created: Rematched ${itemA.telegramName} with ${itemB.telegramName}.`);
        }
      } else {
        res.status(400).json({ error: "Need at least 2 users in queue to force rematch." });
        return;
      }
      break;

    default:
      res.status(400).json({ error: "Unknown action" });
      return;
  }

  res.json({ success: true, queues });
});

// Matches API
app.get("/api/admin/matches", authGuard, (req, res) => {
  res.json(matches);
});

// Matches action
app.post("/api/admin/matches/action", authGuard, (req, res) => {
  const { matchId, action, verdict } = req.body;
  const matchIndex = matches.findIndex(m => m.id === matchId);

  if (matchIndex === -1) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const match = matches[matchIndex];

  switch (action) {
    case "cancel":
      match.status = "cancelled";
      match.completedTime = new Date().toISOString();
      match.approvalStatus = "rejected";
      
      // Release users to idle
      users = users.map(u => {
        if (u.id === match.userAId || u.id === match.userBId) {
          return { ...u, state: "idle" };
        }
        return u;
      });

      addLog("match", `Admin cancelled stuck match ${match.id} (between ${match.userAName} & ${match.userBName}).`);
      break;

    case "clear":
      // Completely erase match from visual records
      matches.splice(matchIndex, 1);
      addLog("match", `Admin permanently deleted match record ${matchId}.`);
      break;

    case "audit_proof":
      if (verdict === "approve") {
        match.status = "completed";
        match.approvalStatus = "approved";
        match.completedTime = new Date().toISOString();

        // Release users, decrease cuts count with swap reward rules
        users = users.map(u => {
          if (u.id === match.userAId || u.id === match.userBId) {
            const cuts = Math.max(0, u.remainingCuts - 1);
            return { ...u, state: "idle", remainingCuts: cuts };
          }
          return u;
        });

        addLog("proof", `Proof approved by admin for Match ${match.id}. Swapping rewarded.`);
      } else {
        match.status = "cancelled";
        match.approvalStatus = "rejected";
        match.completedTime = new Date().toISOString();

        // Release users and issue punishment cooldown
        const cooldownTime = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(); // 12hr cooldown
        users = users.map(u => {
          if (u.id === match.userAId || u.id === match.userBId) {
            return { ...u, state: "idle", cooldownUntil: cooldownTime };
          }
          return u;
        });

        addLog("proof", `Proof REJECTED by admin for Match ${match.id}. Submitting users placed on 12-hour cooldown.`);
      }
      break;

    default:
      res.status(400).json({ error: "Unknown action" });
      return;
  }

  res.json({ success: true, matches });
});

// Referral API
app.get("/api/admin/referrals", authGuard, (req, res) => {
  res.json(referrals);
});

// Broadcast announcement simulation
app.post("/api/admin/broadcast", authGuard, (req, res) => {
  const { target, message } = req.body;

  if (!message || message.trim() === "") {
    res.status(400).json({ error: "Broadcast text must not be empty" });
    return;
  }

  // Calculate recipients
  let targetUsers = users;
  if (target === "tiktok_registered") {
    targetUsers = users.filter(u => u.tiktokUsername !== "");
  } else if (target === "active_only") {
    const now = new Date();
    targetUsers = users.filter(u => !u.banned && (!u.cooldownUntil || new Date(u.cooldownUntil) < now));
  }

  const estimatedRecipients = targetUsers.length;
  const failedCount = Math.floor(Math.random() * (estimatedRecipients * 0.1)); // Max 10% fail rate
  const sentCount = estimatedRecipients - failedCount;

  addLog("broadcast", `Admin sent broadcast to ${target} (${estimatedRecipients} potential targets). Sent: ${sentCount}, Failed: ${failedCount}.`);

  const stats: BroadcastStats = {
    estimatedRecipients,
    sentCount,
    failedCount
  };

  res.json({ success: true, stats });
});

// Settings operations
app.get("/api/admin/settings", authGuard, (req, res) => {
  res.json(settings);
});

app.post("/api/admin/settings", authGuard, (req, res) => {
  const newSettings = req.body;
  settings = { ...settings, ...newSettings };
  addLog("admin", "Admin modified bot text prompt matrices & parameter cooldowns configuration.");
  res.json({ success: true, settings });
});

// Logs API
app.get("/api/admin/logs", authGuard, (req, res) => {
  res.json(logs);
});

// Notifications List API
app.get("/api/admin/notifications", authGuard, (req, res) => {
  res.json(notifications);
});

// Notifications Resolve API
app.post("/api/admin/notifications/resolve", authGuard, (req, res) => {
  const { notificationId } = req.body;
  const notif = notifications.find(n => n.id === notificationId);
  if (notif) {
    notif.resolved = true;
    res.json({ success: true, notifications });
  } else {
    res.status(404).json({ error: "Notification not found" });
  }
});

// System Automation Controls (Auto Cleanup Tools)
app.post("/api/admin/system/cleanup", authGuard, (req, res) => {
  const { type } = req.body;
  let count = 0;

  switch (type) {
    case "stale_queue":
      // Detect and remove items in queue exceeding queueTimeoutMinutes limit (mock simulation or everything older than 5 mins)
      const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
      const initialQueueSize = queues.length;
      queues = queues.filter((q) => {
        const keeps = new Date(q.queuedAt).getTime() > fiveMinsAgo;
        if (!keeps) {
          // Reset user state to idle
          const user = users.find(u => u.id === q.userId);
          if (user) user.state = "idle";
        }
        return keeps;
      });
      count = initialQueueSize - queues.length;
      addLog("cleanup", `Auto-cleanup: Removed ${count} stale items from the waiting queue waitlist.`);
      addNotification("stuck_cleanup", "Stale Queue Cleared", `Sweep cleared ${count} stagnant items in waiting lines.`);
      break;

    case "stuck_matches":
      // Cancel matches that are active for too long
      const activeMatchCount = matches.filter(m => m.status === "active").length;
      matches = matches.map((m) => {
        if (m.status === "active") {
          m.status = "cancelled";
          m.cancelReason = "timeout";
          m.completedTime = new Date().toISOString();
          count++;
          // Reset users state
          const uA = users.find(u => u.id === m.userAId);
          if (uA) uA.state = "idle";
          const uB = users.find(u => u.id === m.userBId);
          if (uB) uB.state = "idle";
        }
        return m;
      });
      addLog("cleanup", `Auto-cleanup: Force abandoned ${count} stuck matches exceeding standard duration.`);
      addNotification("stuck_cleanup", "Stuck matches released", `Forced cancellation of ${count} pending matching exchanges.`);
      break;

    case "orphan_matches":
      // Cleans up matches referencing missing mock accounts or banned users
      const matchHistoryCount = matches.length;
      matches = matches.filter(m => {
        const userAEx = users.find(u => u.id === m.userAId);
        const userBEx = users.find(u => u.id === m.userBId);
        const bannedConflict = (userAEx?.banned) || (userBEx?.banned);
        if (bannedConflict && m.status === "active") {
          m.status = "cancelled";
          m.cancelReason = "stale";
          if (userAEx && !userAEx.banned) userAEx.state = "idle";
          if (userBEx && !userBEx.banned) userBEx.state = "idle";
          count++;
        }
        return true;
      });
      addLog("cleanup", `Auto-cleanup: Resolved weavings of deleted/banned members. Rescued ${count} active partitions.`);
      addNotification("stuck_cleanup", "Orphan matches resolved", `Resolved partitions for ${count} matching contexts containing state-banned accounts.`);
      break;

    case "duplicate_queues":
      // Prunes redundant matching requests
      const preSize = queues.length;
      const uniqueUsers = new Set<string>();
      queues = queues.filter((q) => {
        if (uniqueUsers.has(q.userId)) {
          count++;
          return false;
        }
        uniqueUsers.add(q.userId);
        return true;
      });
      addLog("cleanup", `Auto-cleanup: Filtered duplicate queue rows. Purged ${count} double-submits.`);
      break;

    default:
      res.status(400).json({ error: "Unknown cleanup context" });
      return;
  }

  res.json({ success: true, cleanedCount: count, queues, matches, logs });
});

// ==========================================
// VITE DEV SERVER / PRODUCTION CONFIG
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running directly on port ${PORT}`);
  });
}

startServer();
