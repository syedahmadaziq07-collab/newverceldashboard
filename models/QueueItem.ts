import mongoose, { Schema, Document } from "mongoose";

export interface IQueueItem extends Document {
  telegramId: string;
  telegramUsername: string;
  telegramName: string;
  tiktokUsername: string;
  submittedLink: string;
  isReady: boolean;
  queuedAt: Date;
}

const QueueItemSchema = new Schema<IQueueItem>(
  {
    telegramId: { type: String, required: true, unique: true, index: true },
    telegramUsername: { type: String, default: "" },
    telegramName: { type: String, required: true },
    tiktokUsername: { type: String, default: "" },
    submittedLink: { type: String, required: true },
    isReady: { type: Boolean, default: true },
    queuedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export default mongoose.model<IQueueItem>("QueueItem", QueueItemSchema);
