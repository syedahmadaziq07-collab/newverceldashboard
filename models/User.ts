import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  telegramId: string;
  name: string;
  username: string;
  tiktokUsername: string;
  remainingCuts: number;
  state: "idle" | "queued" | "matched" | "verifying_proof";
  banned: boolean;
  banReason?: string;
  cooldownUntil: Date | null;
  joinedTime: Date;
  lastActive: Date;
  warningsCount: number;
  inactivityStrikes: number;
  ghostCount: number;
  matchedCancelCount: number;
  rejectedProofCount: number;
  isSuspicious: boolean;
  completedSwaps: number;
}

const UserSchema = new Schema<IUser>(
  {
    telegramId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    username: { type: String, default: "" },
    tiktokUsername: { type: String, default: "" },
    remainingCuts: { type: Number, default: 0 },
    state: {
      type: String,
      enum: ["idle", "queued", "matched", "verifying_proof"],
      default: "idle",
    },
    banned: { type: Boolean, default: false },
    banReason: { type: String },
    cooldownUntil: { type: Date, default: null },
    joinedTime: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
    warningsCount: { type: Number, default: 0 },
    inactivityStrikes: { type: Number, default: 0 },
    ghostCount: { type: Number, default: 0 },
    matchedCancelCount: { type: Number, default: 0 },
    rejectedProofCount: { type: Number, default: 0 },
    isSuspicious: { type: Boolean, default: false },
    completedSwaps: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
