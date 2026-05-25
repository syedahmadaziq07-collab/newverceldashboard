import mongoose, { Schema, Document } from "mongoose";

export interface IMatch extends Document {
  user1Id: string;
  user2Id: string;
  link1: string;
  link2: string;
  status: string;
  user1ProofSubmitted: boolean;
  user2ProofSubmitted: boolean;
  user1ProofApprovedByPartner: boolean;
  user2ProofApprovedByPartner: boolean;
  cancelReason?: string;
  auditNote?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    user1Id: { type: String, required: true, index: true },
    user2Id: { type: String, required: true, index: true },
    link1: { type: String, default: "" },
    link2: { type: String, default: "" },
    status: { type: String, default: "active", index: true },
    user1ProofSubmitted: { type: Boolean, default: false },
    user2ProofSubmitted: { type: Boolean, default: false },
    user1ProofApprovedByPartner: { type: Boolean, default: false },
    user2ProofApprovedByPartner: { type: Boolean, default: false },
    cancelReason: { type: String },
    auditNote: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IMatch>("Match", MatchSchema);
