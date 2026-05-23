import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  key: string;
  startMessage: string;
  queueWaitingMessage: string;
  partnerFoundMessage: string;
  proofUploadMessage: string;
  proofApprovedMessage: string;
  timeoutMessage: string;
  broadcastNotificationMessage: string;
  dailyCutsAmount: number;
  maxCuts: number;
  referralRewardCuts: number;
  proofTimeoutMinutes: number;
  queueTimeoutMinutes: number;
  matchmakingEnabled: boolean;
  broadcastsEnabled: boolean;
  maintenanceMode: boolean;
  reminderIntervalMinutes: number;
  ghostStrikeLimit: number;
  cooldownDurationHours: number;
}

const SettingsSchema = new Schema<ISettings>(
  {
    key: { type: String, default: "global", unique: true },
    startMessage: { type: String, default: "" },
    queueWaitingMessage: { type: String, default: "" },
    partnerFoundMessage: { type: String, default: "" },
    proofUploadMessage: { type: String, default: "" },
    proofApprovedMessage: { type: String, default: "" },
    timeoutMessage: { type: String, default: "" },
    broadcastNotificationMessage: { type: String, default: "" },
    dailyCutsAmount: { type: Number, default: 3 },
    maxCuts: { type: Number, default: 5 },
    referralRewardCuts: { type: Number, default: 1 },
    proofTimeoutMinutes: { type: Number, default: 30 },
    queueTimeoutMinutes: { type: Number, default: 15 },
    matchmakingEnabled: { type: Boolean, default: true },
    broadcastsEnabled: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    reminderIntervalMinutes: { type: Number, default: 5 },
    ghostStrikeLimit: { type: Number, default: 3 },
    cooldownDurationHours: { type: Number, default: 12 },
  },
  { timestamps: true }
);

export default mongoose.model<ISettings>("Settings", SettingsSchema);
