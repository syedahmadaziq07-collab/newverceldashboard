import mongoose, { Schema, Document } from "mongoose";

export interface IQueueItem extends Document {
  telegramId: number;
  telegramUsername: string;
  telegramName: string;
  tiktokUsername: string;
  pendingLink: string;
  status: string;
  createdAt: Date;
}

const QueueItemSchema = new Schema<IQueueItem>(
  {
    telegramId: { type: Number, required: true, unique: true, index: true },
    telegramUsername: { type: String, default: "" },
    telegramName: { type: String, default: "" },
    tiktokUsername: { type: String, default: "" },
    pendingLink: { type: String, default: "" },
    status: { type: String, default: "waiting" },
  },
  { timestamps: true }
);

export default mongoose.model<IQueueItem>("Queue", QueueItemSchema);
