import mongoose, { Schema, Document } from "mongoose";

export type LogCategory =
  | "user"
  | "tiktok"
  | "queue"
  | "match"
  | "proof"
  | "broadcast"
  | "cooldown"
  | "ban"
  | "admin"
  | "cleanup";

export interface IBotLog extends Document {
  category: LogCategory;
  message: string;
  relatedUserId?: string;
  relatedMatchId?: string;
  timestamp: Date;
}

const BotLogSchema = new Schema<IBotLog>(
  {
    category: {
      type: String,
      enum: [
        "user",
        "tiktok",
        "queue",
        "match",
        "proof",
        "broadcast",
        "cooldown",
        "ban",
        "admin",
        "cleanup",
      ],
      required: true,
      index: true,
    },
    message: { type: String, required: true },
    relatedUserId: { type: String, index: true },
    relatedMatchId: { type: String, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export default mongoose.model<IBotLog>("BotLog", BotLogSchema);
