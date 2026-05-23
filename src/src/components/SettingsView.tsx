import { useState, useEffect, FormEvent } from "react";
import { 
  Sliders, 
  HelpCircle, 
  Save, 
  RefreshCw, 
  Languages, 
  MessageSquareCode,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Zap,
  Clock,
  Settings,
  Flame,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BotSettings } from "../types";

interface SettingsProps {
  initialSettings: BotSettings | null;
  onSave: (settings: BotSettings) => Promise<void>;
  onRefresh: () => void;
}

export default function SettingsView({ initialSettings, onSave, onRefresh }: SettingsProps) {
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"text" | "limits">("limits");

  useEffect(() => {
    if (initialSettings) {
      setSettings({ ...initialSettings });
    }
  }, [initialSettings]);

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#0c1122] rounded-3xl border border-[#1b253b]">
        <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400 font-medium">Fetching active bot parameters...</p>
      </div>
    );
  }

  const handleTextChange = (key: keyof BotSettings, val: string) => {
    setSettings((prev) => prev ? { ...prev, [key]: val } : null);
  };

  const handleNumChange = (key: keyof BotSettings, val: number) => {
    setSettings((prev) => prev ? { ...prev, [key]: val } : null);
  };

  const handleBoolChange = (key: keyof BotSettings, val: boolean) => {
    setSettings((prev) => prev ? { ...prev, [key]: val } : null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSuccess(false);

    try {
      await onSave(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* 🔮 SETTINGS TAB SECTORS */}
      <div className="flex bg-[#0a0f1d] rounded-2xl p-1 border border-[#1b253b] shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("limits")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "limits"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/15"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sliders className="w-4 h-4" /> Threshold Variables
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("text")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "text"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/15"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <MessageSquareCode className="w-4 h-4" /> Prompt Templates
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {activeTab === "limits" ? (
          /* ==========================================
             SYSTEM LIMITS AND TIMEOUT SETTINGS
             ========================================== */
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0c1122] rounded-2xl border border-[#1b253b] p-5 shadow-sm space-y-4 font-sans text-slate-100"
          >
            <div className="border-b border-[#1b253b] pb-2">
              <h4 className="font-extrabold text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-blue-400" /> Bot Operation Limits
              </h4>
              <p className="text-[10px] text-slate-450 mt-1 leading-none">Configure system properties and security guardrails.</p>
            </div>

            <div className="space-y-4 text-xs font-mono">
              
              {/* Daily crops reset limits */}
              <div className="space-y-1.5 font-sans">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-semibold text-slate-300">Daily Crops Reset Allowed</span>
                  <span className="font-mono bg-blue-950/40 border border-blue-900/30 px-2 py-0.5 rounded text-blue-400 font-bold">{settings.dailyCutsAmount} slots</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={15}
                  step={1}
                  value={settings.dailyCutsAmount}
                  onChange={(e) => handleNumChange("dailyCutsAmount", parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-[10px] text-slate-450 block leading-none font-sans">
                  The daily allowance slot given to verified non-banned participants. Default: 3
                </span>
              </div>

              {/* Warnings Threshold before Permanent Ban */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300 font-sans">Max Warnings Threshold</span>
                  <span className="font-mono bg-[#221015] border border-red-900/30 px-2.5 py-0.5 rounded text-rose-455 font-bold">5 warnings</span>
                </div>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={settings.maxCuts ? 5 : 5} // Static binding for demo config bounds or dynamic override
                  disabled
                  className="w-full bg-[#080d19] border border-[#1b253b] py-2.5 px-3 rounded-xl focus:ring-1 focus:ring-blue-500 text-slate-400 font-mono font-bold"
                />
                <span className="text-[10.5px] text-slate-450 block font-sans leading-none mt-1">
                  Once a matched thread exceeds 5 accumulative warnings, an automated block triggers permanently.
                </span>
              </div>

              {/* Referral reward bonus */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300 font-sans">Referral Award (Slots)</span>
                  <span className="font-mono bg-blue-950/40 border border-blue-900/30 px-2 py-0.5 rounded text-blue-400 font-bold">+{settings.referralRewardCuts} slots</span>
                </div>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={settings.referralRewardCuts}
                  onChange={(e) => handleNumChange("referralRewardCuts", Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#080d19] border border-[#1b253b] py-2.5 px-3 rounded-xl focus:ring-1 focus:ring-blue-500 text-slate-100 font-mono font-bold"
                />
                <span className="text-[10.5px] text-slate-450 block font-sans leading-none mt-1">
                  Swapping slot rewarded once single referral validates code.
                </span>
              </div>

              {/* Proof Screenshot timer limit override */}
              <div className="grid grid-cols-2 gap-3 pt-1 font-sans text-slate-100">
                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-300 block text-[11px] font-mono">Proof Time Limit (min)</span>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={settings.proofTimeoutMinutes}
                    onChange={(e) => handleNumChange("proofTimeoutMinutes", Math.max(5, parseInt(e.target.value) || 5))}
                    className="w-full bg-[#080d19] border border-[#1b253b] py-2.5 px-3 rounded-xl focus:ring-1 focus:ring-blue-500 text-slate-100 font-mono font-bold"
                  />
                  <span className="text-[9.5px] text-slate-450 block leading-tight">
                    Proof submission limit before timeout trigger. Def: 30
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-300 block text-[11px] font-mono">Queue Idle Limit (min)</span>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={settings.queueTimeoutMinutes}
                    onChange={(e) => handleNumChange("queueTimeoutMinutes", Math.max(5, parseInt(e.target.value) || 5))}
                    className="w-full bg-[#080d19] border border-[#1b253b] py-2.5 px-3 rounded-xl focus:ring-1 focus:ring-blue-500 text-slate-100 font-mono font-bold"
                  />
                  <span className="text-[9.5px] text-slate-450 block leading-tight">
                    Waiting duration before clearing item automatically. Def: 15
                  </span>
                </div>
              </div>

              {/* 🛠️ COOLDOWN BYPASS & FLUSH CONTROLS */}
              <div className="p-4 bg-[#111726]/40 rounded-xl border border-[#1b253b] space-y-3 pt-3 font-sans">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Advanced Engine Diagnostics</span>
                </div>

                {/* Matchmaking Cooldown Bypass Toggle */}
                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-200 block">Matchmaking Cooldown Bypass</span>
                    <span className="text-[9.5px] text-slate-450 leading-none">Bypass warning & 12hr penalties in Matching loop</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={(settings as any).bypassCooldown || false} 
                      onChange={(e) => handleBoolChange("bypassCooldown" as any, e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-10 h-5 bg-[#161f36] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-350 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>

              {/* ⚙️ SYSTEM AUTOMATION CONTROLS (Requirement Section 12) */}
              <div className="p-4 bg-[#111726]/40 rounded-xl border border-[#1b253b] space-y-4 pt-3 font-sans text-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 font-mono border-b border-[#1b253b] pb-2">
                  <Settings className="w-4 h-4 text-blue-400" />
                  <span>System Automation Switches</span>
                </div>

                {/* Matchmaking enabled Toggle */}
                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-200 block">Matchmaking Processing</span>
                    <span className="text-[9.5px] text-slate-450 leading-none">Enable/disable pairing of items and link swappers</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={settings.matchmakingEnabled ?? true} 
                      onChange={(e) => handleBoolChange("matchmakingEnabled", e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-10 h-5 bg-[#161f36] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-350 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Telegram Notifications enabled Toggle */}
                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-200 block">System Broadcast Messages</span>
                    <span className="text-[9.5px] text-slate-450 leading-none">Enable outgoing broadcast channels push delivery</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={settings.broadcastsEnabled ?? true} 
                      onChange={(e) => handleBoolChange("broadcastsEnabled", e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-10 h-5 bg-[#161f36] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-350 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Maintenance Mode Toggle */}
                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-rose-400 block">Maintenance Safe Lock</span>
                    <span className="text-[9.5px] text-slate-450 leading-none">Suspend bot workflows and alert queue members</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={settings.maintenanceMode ?? false} 
                      onChange={(e) => handleBoolChange("maintenanceMode", e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-10 h-5 bg-[#161f36] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-350 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
                </div>

                {/* Numeric fields for strikers */}
                <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-[10.5px]">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-300 block">Ghost Strike Limit</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={settings.ghostStrikeLimit ?? 3}
                      onChange={(e) => handleNumChange("ghostStrikeLimit", Math.max(1, parseInt(e.target.value) || 3))}
                      className="w-full bg-[#080d19] border border-[#1b253b] py-2 px-2.5 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-100 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold text-slate-300 block">Reminder Int. (min)</span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={settings.reminderIntervalMinutes ?? 5}
                      onChange={(e) => handleNumChange("reminderIntervalMinutes", Math.max(1, parseInt(e.target.value) || 5))}
                      className="w-full bg-[#080d19] border border-[#1b253b] py-2 px-2.5 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-100 font-bold"
                    />
                  </div>
                </div>

                {/* Cooldown duration hours limit slider */}
                <div className="pt-2 font-sans">
                  <div className="flex justify-between items-center text-xs font-mono mb-1">
                    <span className="font-semibold text-slate-300 font-sans">Penalty Cooldown Duration</span>
                    <span className="font-bold text-blue-400">{(settings as any).cooldownDurationHours ?? 12} hours</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={72}
                    value={(settings as any).cooldownDurationHours ?? 12}
                    onChange={(e) => handleNumChange("cooldownDurationHours", parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

            </div>
          </motion.div>
        ) : (
          /* ==========================================
             CUSTOM TELEGRAM PROMPT TEXT TEMPLATES
             ========================================== */
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0c1122] rounded-2xl border border-[#1b253b] p-5 shadow-sm space-y-4"
          >
            <div className="border-b border-[#1b253b] pb-2">
              <h4 className="font-extrabold text-[#f1f5f9] text-sm tracking-tight flex items-center gap-1.5">
                <MessageSquareCode className="w-4 h-4 text-blue-400" /> Bot Messaging Templates
              </h4>
              <p className="text-[10px] text-slate-450 mt-1">Configure prompt copies dispatched to participants.</p>
            </div>

            <div className="space-y-4 text-xs text-slate-200">
              
              {/* /start greeting */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-300 block font-mono">/start Greeting Message</label>
                <textarea
                  rows={3}
                  value={settings.startMessage}
                  onChange={(e) => handleTextChange("startMessage", e.target.value)}
                  className="w-full bg-[#080d19] border border-[#1b253b] focus:ring-1 focus:ring-blue-500 p-3.5 rounded-xl text-slate-100 font-sans text-xs focus:outline-none"
                />
              </div>

              {/* Waiting queue feedback */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-300 block font-mono">Queue Entering Alert</label>
                <textarea
                  rows={2}
                  value={settings.queueWaitingMessage}
                  onChange={(e) => handleTextChange("queueWaitingMessage", e.target.value)}
                  className="w-full bg-[#080d19] border border-[#1b253b] focus:ring-1 focus:ring-blue-500 p-3.5 rounded-xl text-slate-100 font-sans text-xs focus:outline-none"
                />
              </div>

              {/* Match found template alert */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center font-mono">
                  <label className="font-extrabold text-slate-300 block">Match Sinks Alert</label>
                  <span className="text-[8px] font-black text-blue-400">vars: {"{partner_tiktok}"}, {"{partner_link}"}</span>
                </div>
                <textarea
                  rows={3}
                  value={settings.partnerFoundMessage}
                  onChange={(e) => handleTextChange("partnerFoundMessage", e.target.value)}
                  className="w-full bg-[#080d19] border border-[#1b253b] focus:ring-1 focus:ring-blue-500 p-3.5 rounded-xl text-slate-100 font-sans text-xs focus:outline-none"
                />
              </div>

              {/* Session timeout expired message */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center font-mono">
                  <label className="font-extrabold text-slate-300 block">Fulfillment Timed out</label>
                  <span className="text-[8px] font-black text-blue-400">vars: {"{timeout}"}</span>
                </div>
                <textarea
                  rows={2}
                  value={settings.timeoutMessage}
                  onChange={(e) => handleTextChange("timeoutMessage", e.target.value)}
                  className="w-full bg-[#080d19] border border-[#1b253b] focus:ring-1 focus:ring-blue-500 p-3.5 rounded-xl text-slate-100 font-sans text-xs focus:outline-none"
                />
              </div>

            </div>
          </motion.div>
        )}

        {/* Action feedback banner */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-900/30 flex items-center gap-3 text-[#10b981] text-xs font-semibold"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Diagnostic updates successfully saved!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Submission bottom actions */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            className="bg-[#0c1122] hover:bg-[#151d33] border border-[#1b253b] p-4 rounded-2xl text-slate-400 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            title="Reload config parameters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 active:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold p-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15 cursor-pointer uppercase tracking-wider"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Bot Config
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
