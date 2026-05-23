import BotLog, { LogCategory } from "../models/BotLog";
import AdminNotification from "../models/AdminNotification";

export async function addLog(
  category: LogCategory,
  message: string,
  relatedUserId?: string,
  relatedMatchId?: string
): Promise<void> {
  try {
    await BotLog.create({
      category,
      message,
      relatedUserId,
      relatedMatchId,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("[adminLogger] Failed to write log:", err);
  }
}

export async function addNotification(
  type: IAdminNotificationType,
  title: string,
  message: string
): Promise<void> {
  try {
    await AdminNotification.create({
      type,
      title,
      message,
      resolved: false,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("[adminLogger] Failed to write notification:", err);
  }
}

type IAdminNotificationType =
  | "swap_completed"
  | "proof_rejected"
  | "timeout"
  | "ghost_detected"
  | "cooldown"
  | "ban"
  | "stuck_cleanup";
