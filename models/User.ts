import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  telegramId: number;
  telegramUsername: string;
  tiktokUsername: string;
  cutBalance: number;
  state: string;
  isBanned: boolean;
  banReason?: string;
  blockedAt: Date | null;
  cancelCooldownUntil: Date | null;
  cooldownReason: string | null;
  joinedTime: Date;
  createdAt?: Date;
  updatedAt?: Date;
  strikes: number;
  inactivityStrikes: number;
  ghostCount: number;
  matchedCancelCount: number;
  rejectedProofCount: number;
  isSuspicious: boolean;
  totalApprovedCount: number;
}

const UserSchema = new Schema<IUser>(
  {
    telegramId: { type: Number, required: true, unique: true, index: true },
    telegramUsername: { type: String, default: "" },
    tiktokUsername: { type: String, default: "" },
    cutBalance: { type: Number, default: 0 },
    state: { type: String, default: "idle" },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },
    blockedAt: { type: Date, default: null },
    cancelCooldownUntil: { type: Date, default: null },
    cooldownReason: { type: String, default: null },
    joinedTime: { type: Date, default: Date.now },
    strikes: { type: Number, default: 0 },
    inactivityStrikes: { type: Number, default: 0 },
    ghostCount: { type: Number, default: 0 },
    matchedCancelCount: { type: Number, default: 0 },
    rejectedProofCount: { type: Number, default: 0 },
    isSuspicious: { type: Boolean, default: false },
    totalApprovedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
