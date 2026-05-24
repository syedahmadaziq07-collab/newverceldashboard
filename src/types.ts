export interface User {
  id: string; // Telegram ID
  name: string; // Telegram Name
  username: string; // Telegram Username
  tiktokUsername: string;
  remainingCuts: number;
  state: 'idle' | 'queued' | 'matched' | 'verifying_proof';
  banned: boolean;
  isBlocked?: boolean; // alias for banned, returned by new block endpoints
  banReason?: string | null;
  blockedAt?: string | null;
  cooldownUntil: string | null; // ISO Date String or null
  cooldownReason?: string | null;
  joinedTime: string;
  lastActive: string;
  warningsCount?: number;
  inactivityStrikes?: number;
  ghostCount?: number;
  matchedCancelCount?: number;
  rejectedProofCount?: number;
  isSuspicious?: boolean;
  completedSwaps?: number;
}

export interface QueueItem {
  id: string;
  userId: string;
  telegramName: string;
  tiktokUsername: string;
  submittedLink: string;
  queuedAt: string; // ISO Date String
}

export interface Match {
  id: string;
  userAId: string;
  userAName: string;
  userATiktok: string;
  userALink: string;
  userBId: string;
  userBName: string;
  userBTiktok: string;
  userBLink: string;
  status: 'active' | 'completed' | 'cancelled';
  proofStatus: 'pending' | 'submitted_a' | 'submitted_b' | 'submitted_both' | 'none';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  startedTime: string;
  completedTime: string | null;
  proofImageUrl?: string;
  cancelReason?: 'timeout' | 'ghosted' | 'manual' | 'stale';
  auditLoggerNote?: string;
}

export interface Referral {
  id: string;
  referralCode: string;
  inviterId: string;
  inviterName: string;
  invitedId: string;
  invitedName: string;
  status: 'pending' | 'completed';
  rewardGranted: boolean;
  rewardAmount: number;
  timestamp: string;
}

export interface BotSettings {
  startMessage: string;
  queueWaitingMessage: string;
  partnerFoundMessage: string;
  proofUploadMessage: string;
  proofApprovedMessage: string;
  timeoutMessage: string;
  broadcastNotificationMessage: string;
  dailyCutsAmount: number;
  maxCuts: number;
  referralRewardCuts: number;
  proofTimeoutMinutes: number;
  queueTimeoutMinutes: number;
  // Production Automation controls
  matchmakingEnabled: boolean;
  broadcastsEnabled: boolean;
  maintenanceMode: boolean;
  reminderIntervalMinutes: number;
  ghostStrikeLimit: number;
  cooldownDurationHours: number;
}

export type LogCategory = 'user' | 'tiktok' | 'queue' | 'match' | 'proof' | 'broadcast' | 'cooldown' | 'ban' | 'admin' | 'cleanup';

export interface BotLog {
  id: string;
  timestamp: string;
  category: LogCategory;
  message: string;
}

export interface BroadcastStats {
  estimatedRecipients: number;
  sentCount: number;
  failedCount: number;
  scheduledTime?: string;
  targetFilter?: string;
}

export interface DashboardStats {
  totalUsersStart: number;
  registeredTiktokUsers: number;
  usersInQueue: number;
  activeMatches: number;
  completedSwapsToday: number;
  proofRejectedToday: number;
  bannedUsers: number;
  cooldownUsers: number;
  // Production stats
  activeUsersNow: number;
  cancelledSwapsToday: number;
  ghostedSwapsToday: number;
  averageQueueWaitMinutes: number;
  successRatePercent: number;
}

export interface AdminNotification {
  id: string;
  timestamp: string;
  type: 'swap_completed' | 'proof_rejected' | 'timeout' | 'ghost_detected' | 'cooldown' | 'ban' | 'stuck_cleanup';
  title: string;
  message: string;
  resolved: boolean;
}
