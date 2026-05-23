import { useState, FormEvent } from "react";
import { 
  Megaphone, 
  Send, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Bot, 
  Zap, 
  Clock,
  History,
  AlertTriangle,
  Flame,
  UserCheck
} from "lucide-react";
import { motion } from "motion/react";
import { User, BroadcastStats } from "../types";

interface BroadcastViewProps {
  users: User[];
  onSendBroadcast: (target: string, message: string) => Promise<BroadcastStats>;
}

interface BroadcastHistoryItem {
  id: string;
  timestamp: string;
  target: string;
  text: string;
  stats: BroadcastStats;
}

export default function BroadcastView({ users, onSendBroadcast }: BroadcastViewProps) {
  const [targetScope, setTargetScope] = useState<"all" | "tiktok_registered" | "active_only">("all");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Local broadcast history state
  const [history, setHistory] = useState<BroadcastHistoryItem[]>([
    {
      id: "b_1",
      timestamp: "2026-05-22T15:30:00Z",
      target: "all",
      text: "⚡ TikTok Swapping Event is active! Speed matches have been boosted by 15% and queue timeouts decreased to 10 minutes. Cut yours today!",
      stats: { estimatedRecipients: 9, sentCount: 8, failedCount: 1 }
    }
  ]);

  const [lastAnnouncementStats, setLastAnnouncementStats] = useState<BroadcastStats | null>(null);

  // Live client-side calculation of targets — guard against null fields
  const safeUsers = users ?? [];
  const getEstimatedCount = () => {
    if (targetScope === "tiktok_registered") {
      return safeUsers.filter(u => (u.tiktokUsername || "") !== "").length;
    }
    if (targetScope === "active_only") {
      const now = new Date();
      return safeUsers.filter(u => !u.banned && (!u.cooldownUntil || new Date(u.cooldownUntil) < now)).length;
    }
    return safeUsers.length;
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim() || loading) return;

    setLoading(true);
    setLastAnnouncementStats(null);

    try {
      const result = await onSendBroadcast(targetScope, broadcastMessage);
      setLastAnnouncementStats(result);

      // Save historic record
      const newHistoryItem: BroadcastHistoryItem = {
        id: `b_${Date.now()}`,
        timestamp: new Date().toISOString(),
        target: targetScope,
        text: broadcastMessage,
        stats: result
      };

      setHistory(prev => [newHistoryItem, ...prev]);
      setBroadcastMessage(""); // reset
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTargetLabel = (scope: string) => {
    if (scope === "tiktok_registered") return "TikTok Registered Only";
    if (scope === "active_only") return "Active / Cooldown Free";
    return "All Members (/start)";
  };

  return (
    <div className="space-y-5">
      
      {/* 🔮 BROADCAST CONTEXT WRAPPER */}
      <div className="bg-[#0c1122] rounded-2xl border border-[#1b253b] p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1b253b]">
          <div className="p-2 bg-blue-950/40 border border-blue-900/30 text-blue-400 rounded-xl">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm tracking-tight leading-none">
              Compose Telegram Broadcast
            </h3>
            <p className="text-[10px] text-slate-450 mt-1 leading-none">Sends instant push notification alerts to Telegram members.</p>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          
          {/* Target segments radio selector */}
          <div className="space-y-2">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-450 pl-1 block font-mono">
              RECIPIENT SCOPE TARGET
            </span>
            <div className="grid grid-cols-1 gap-2 text-xs font-sans">
              {([
                { id: "all", label: "All Pressers (/start)", desc: `Reaches all starting accounts (${safeUsers.length} targets)` },
                { id: "tiktok_registered", label: "Only Registered TikTok Profiles", desc: `Reaches accounts with valid /register (${safeUsers.filter(u => (u.tiktokUsername || "") !== "").length} targets)` },
                { id: "active_only", label: "Only Active & Cooldown-free", desc: `Excludes banned profiles and active penalties (${safeUsers.filter(u => !u.banned && (!u.cooldownUntil || new Date(u.cooldownUntil) < new Date())).length} targets)` }
              ] as const).map((scope) => (
                <label
                  key={scope.id}
                  className={`border p-3.5 rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                    targetScope === scope.id
                      ? "bg-[#11182c] border-[#31487f]"
                      : "bg-[#090d19]/80 border-[#1b253b] hover:bg-[#0f1526]"
                  }`}
                >
                  <input
                    type="radio"
                    name="targetScope"
                    checked={targetScope === scope.id}
                    onChange={() => setTargetScope(scope.id)}
                    className="mt-1 accent-blue-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200 leading-none block">
                      {scope.label}
                    </span>
                    <span className="text-[10px] text-slate-450 font-medium leading-none block mt-1">
                      {scope.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Text compose box */}
          <div className="space-y-1.5">
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#475569] pl-1 block font-mono">
              ANNOUNCEMENT MESSAGE
            </span>
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Type telegram message content here. Supports basic markdown emojis..."
              rows={4}
              maxLength={1000}
              className="w-full bg-[#080d19] border border-[#1b253b] focus:outline-none focus:ring-1 focus:ring-blue-500/50 p-4 rounded-xl text-xs placeholder:text-slate-500 leading-relaxed text-slate-100 font-sans"
            />
            <div className="flex justify-between text-[10px] text-slate-450 px-1 font-medium font-mono">
              <span>Selected Pool: {getEstimatedCount()} targets</span>
              <span>{broadcastMessage.length}/1000 limit</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!broadcastMessage.trim() || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900/40 text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer leading-none uppercase tracking-widest"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" /> Dispatch Pushes Alert
              </>
            )}
          </button>
        </form>
      </div>

      {/* 📈 COMPLETED BROADCAST RESULTS FEEDBACK */}
      {lastAnnouncementStats && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-950/30 border border-emerald-900/40 p-5 rounded-2xl space-y-3 font-sans"
        >
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
            <CheckCircle2 className="w-5 h-5" />
            <span>Broadcast completed!</span>
          </div>
          <p className="text-[10.5px] text-slate-400 leading-normal">
            Memory stack transmission simulation completed. Transaction metrics:
          </p>

          <div className="grid grid-cols-3 gap-2.5 text-center mt-2.5 font-mono text-xs">
            <div className="p-2.5 bg-[#0c1122] rounded-xl border border-[#1b253b]">
              <span className="text-[8px] uppercase font-bold text-slate-500 block leading-none">Recipients</span>
              <span className="text-xs font-black text-slate-250 block mt-1">
                {lastAnnouncementStats.estimatedRecipients}
              </span>
            </div>
            <div className="p-2.5 bg-[#0c1122] rounded-xl border border-[#1b253b]">
              <span className="text-[8px] uppercase font-bold text-[#10b981] block leading-none">Delivered</span>
              <span className="text-xs font-black text-[#10b981] block mt-1">
                {lastAnnouncementStats.sentCount}
              </span>
            </div>
            <div className="p-2.5 bg-[#0c1122] rounded-xl border border-[#1b253b]">
              <span className="text-[8px] uppercase font-bold text-rose-450 block leading-none">Failures</span>
              <span className="text-xs font-black text-rose-400 block mt-1">
                {lastAnnouncementStats.failedCount}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ⏳ HISTORIC LOG OF PREVIOUS ANNOUNCEMENTS */}
      <div className="space-y-3 font-sans">
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#475569] pl-1 block flex items-center gap-1.5 font-mono">
          <History className="w-4 h-4" /> Dispatched Logstream ({history.length})
        </span>

        <div className="space-y-3">
          {history.map((hist) => (
            <div
              key={hist.id}
              className="bg-[#0c1122] rounded-2xl border border-[#1b253b] p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-blue-400 font-bold bg-blue-950/45 border border-blue-900/30 px-2.5 py-1 rounded-lg uppercase tracking-wider text-[8px]">
                  {getTargetLabel(hist.target)}
                </span>
                <span className="text-slate-500">
                  {new Date(hist.timestamp).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs text-slate-300 italic leading-relaxed border-l-2 border-[#1e2a47] pl-3">
                "{hist.text}"
              </p>

              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono font-bold leading-none bg-[#080d19] p-2 rounded-lg border border-[#141c2f]/70">
                <span>Successful: {hist.stats.sentCount} / Failures: {hist.stats.failedCount}</span>
                <span className="text-emerald-400">
                  {Math.round((hist.stats.sentCount / hist.stats.estimatedRecipients) * 100)}% Delivered
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
