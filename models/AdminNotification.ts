import mongoose, { Schema, Document } from "mongoose";

export interface IAdminNotification extends Document {
  type:
    | "swap_completed"
    | "proof_rejected"
    | "timeout"
    | "ghost_detected"
    | "cooldown"
    | "ban"
    | "stuck_cleanup";
  title: string;
  message: string;
  resolved: boolean;
  timestamp: Date;
}

const AdminNotificationSchema = new Schema<IAdminNotification>(
  {
    type: {
      type: String,
      enum: [
        "swap_completed",
        "proof_rejected",
        "timeout",
        "ghost_detected",
        "cooldown",
        "ban",
        "stuck_cleanup",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    resolved: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export default mongoose.model<IAdminNotification>(
  "AdminNotification",
  AdminNotificationSchema
);
