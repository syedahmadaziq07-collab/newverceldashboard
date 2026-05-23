import mongoose, { Schema, Document } from "mongoose";

export interface IMatch extends Document {
  matchId: string;
  userA: {
    telegramId: string;
    name: string;
    tiktokUsername: string;
    link: string;
    isReady: boolean;
    proofSubmitted: boolean;
    proofImageUrl?: string;
  };
  userB: {
    telegramId: string;
    name: string;
    tiktokUsername: string;
    link: string;
    isReady: boolean;
    proofSubmitted: boolean;
    proofImageUrl?: string;
  };
  status: "active" | "completed" | "cancelled";
  proofStatus: "none" | "submitted_a" | "submitted_b" | "submitted_both";
  approvalStatus: "pending" | "approved" | "rejected";
  cancelReason?: "timeout" | "ghosted" | "manual" | "stale";
  startedTime: Date;
  completedTime: Date | null;
  auditNote?: string;
}

const MatchSchema = new Schema<IMatch>(
  {
    matchId: { type: String, required: true, unique: true, index: true },
    userA: {
      telegramId: { type: String, required: true },
      name: { type: String, required: true },
      tiktokUsername: { type: String, default: "" },
      link: { type: String, required: true },
      isReady: { type: Boolean, default: false },
      proofSubmitted: { type: Boolean, default: false },
      proofImageUrl: { type: String },
    },
    userB: {
      telegramId: { type: String, required: true },
      name: { type: String, required: true },
      tiktokUsername: { type: String, default: "" },
      link: { type: String, required: true },
      isReady: { type: Boolean, default: false },
      proofSubmitted: { type: Boolean, default: false },
      proofImageUrl: { type: String },
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
      index: true,
    },
    proofStatus: {
      type: String,
      enum: ["none", "submitted_a", "submitted_b", "submitted_both"],
      default: "none",
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    cancelReason: {
      type: String,
      enum: ["timeout", "ghosted", "manual", "stale"],
    },
    startedTime: { type: Date, default: Date.now },
    completedTime: { type: Date, default: null },
    auditNote: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IMatch>("Match", MatchSchema);
