import mongoose, { Schema, Document } from "mongoose";

export interface IMatch extends Document {
  user1Id: string;
  user2Id: string;
  link1: string;
  link2: string;
  status: "active" | "completed" | "cancelled";
  proofStatus: "none" | "submitted_a" | "submitted_b" | "submitted_both";
  approvalStatus: "pending" | "approved" | "rejected";
  cancelReason?: "timeout" | "ghosted" | "manual" | "stale";
  auditNote?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    user1Id: { type: String, required: true, index: true },
    user2Id: { type: String, required: true, index: true },
    link1: { type: String, required: true },
    link2: { type: String, required: true },
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
    auditNote: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IMatch>("Match", MatchSchema);
