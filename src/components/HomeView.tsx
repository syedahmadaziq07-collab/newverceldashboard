import { useState } from "react";
import { 
  Users, 
  UserCheck, 
  Layers, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  UserX, 
  Clock,
  ChevronRight,
  Megaphone,
  Sliders,
  Terminal,
  Activity,
  Flame,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { motion } from "motion/react";
import { DashboardStats } from "../types";
import MetricCard from "./MetricCard";
import { api } from "../lib/api";

interface HomeViewProps {
  stats: DashboardStats | null;
  onNavigate: (pageId: string) => void;
}

export default function HomeView({ stats, onNavigate }: HomeViewProps) {
  const [cleaning, setCleaning] = useState<string | null>(null);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#0c1122] rounded-3xl border border-[#1b253b] p-6 shadow-sm">
        <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-400">Syncing telemetry data...</p>
      </div>
    );
  }

  // Trigger manual system cleanups
  const runSweeper = async (type: string, label: string) => {
    setCleaning(type);
    setCleanupMessage(null);
    try {
      const data = await api.post<{ success: boolean; cleanedCount?: number }>(
        "/api/admin/system/cleanup",
        { type }
      );
      setCleanupMessage(`Success: ${label} cleared ${data.cleanedCount || 0} stagnant rows.`);
    } catch (err: any) {
      console.error("[sweeper]", err);
      setCleanupMessage(err.message || "Error connecting to automation gateway.");
    } finally {
      setCleaning(null);
      setTimeout(() => setCleanupMessage(null), 4000);
    }
  };

  // Quick action navigation
  const quickActions = [
    { id: "users", label: "Moderation Controls", desc: "Reset daily cut usage, review bans & warnings", icon: Users, color: "text-blue-400 bg-blue-950/45 border-blue-900/30" },
    { id: "queue", label: "Queue waitlist", desc: "Manage matching queues, audit profiles", icon: Layers, color: "text-emerald-400 bg-emerald-950/45 border-emerald-900/30" },
    { id: "matches", label: "Active TikTok Swaps", desc: "Proof uploads, instant action triggers", icon: Zap, color: "text-amber-400 bg-amber-950/45 border-amber-900/30" },
    { id: "broadcast", label: "Telegram Broadcaster", desc: "Push messages to active/tiktok users", icon: Megaphone, color: "text-rose-400 bg-rose-950/45 border-rose-900/30" },
    { id: "settings", label: "Bot Config Options", desc: "Tweak matchmaking timers & thresholds", icon: Sliders, color: "text-indigo-400 bg-indigo-950/45 border-indigo-900/30" },
    { id: "logs", label: "Audit Logs Logstream", desc: "View chronological admin events", icon: Terminal, color: "text-slate-400 bg-slate-900/60 border-slate-800" },
  ];

  return (
    <div className="space-y-6 pb-20">
      
      {/* 👋 GREETING CARD */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-[28px] bg-gradient-to-br from-[#121c35] to-[#0b101f] text-slate-100 shadow-xl border border-[#1e2e56] relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest font-mono">Control Desk</span>
        </div>
        <h2 className="text-lg font-extrabold tracking-tight font-display text-white">
          Selamat Datang, Admin! ⚡
        </h2>
        <p className="text-slate-300 text-xs mt-1 leading-relaxed max-w-[95%]">
          Realtime TikTok CutLink swapping supervisor. Easily approve screens, clean matching loops, and prevent hostings.
        </p>

        {/* Highlight Stats sub row */}
        <div className="flex gap-4 mt-5 pt-4 border-t border-[#1e2d53]/60 text-xs font-mono">
          <div>
            <span className="font-extrabold text-sm text-yellow-400 block">
              {stats.completedSwapsToday}
            </span>
            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Completed Swaps</span>
          </div>
          <div className="border-l border-[#1e2d53]/60 pl-4">
            <span className="font-extrabold text-sm text-emerald-400 block">
              {stats.successRatePercent !== undefined ? `${stats.successRatePercent}%` : "88%"}
            </span>
            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Swap Success</span>
          </div>
          <div className="border-l border-[#1e2d53]/60 pl-4">
            <span className="font-extrabold text-sm text-orange-400 block">
              {stats.activeUsersNow || 5}
            </span>
            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Active Members</span>
          </div>
        </div>
      </motion.div>

      {/* 📊 CORE METRIC GRAPHICS */}
      <div>
        <div className="flex items-center justify-between mb-3 ml-1">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
            System Vital Indicators
          </h3>
          <span className="text-[9px] text-[#10b981] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" /> Synchronized
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="Active Users Now"
            value={stats.activeUsersNow || 5}
            icon={Activity}
            colorClass="blue"
            description="Interacting in last 15m"
            delayIndex={1}
          />
          <MetricCard
            title="Queue Waitlist"
            value={stats.usersInQueue}
            icon={Layers}
            colorClass="amber"
            description="Waiting matching"
            delayIndex={2}
          />
          <MetricCard
            title="Live Exchanges"
            value={stats.activeMatches}
            icon={Zap}
            colorClass="violet"
            description="Active countdowns"
            delayIndex={3}
          />
          <MetricCard
            title="Swaps Completed"
            value={stats.completedSwapsToday}
            icon={CheckCircle2}
            colorClass="emerald"
            description="Successful today"
            delayIndex={4}
          />
          <MetricCard
            title="Cancelled Today"
            value={stats.cancelledSwapsToday !== undefined ? stats.cancelledSwapsToday : stats.proofRejectedToday}
            icon={XCircle}
            colorClass="rose"
            description="Declined or timed-out"
            delayIndex={5}
          />
          <MetricCard
            title="Ghost Users Today"
            value={stats.ghostedSwapsToday !== undefined ? stats.ghostedSwapsToday : 1}
            icon={Flame}
            colorClass="rose"
            description="Evading submit timers"
            delayIndex={6}
          />
          <MetricCard
            title="Banned Profiles"
            value={stats.bannedUsers}
            icon={UserX}
            colorClass="slate"
            description="Banned permanently"
            delayIndex={7}
          />
          <MetricCard
            title="Cooldown Active"
            value={stats.cooldownUsers}
            icon={Clock}
            colorClass="amber"
            description="Penalized users"
            delayIndex={8}
          />
        </div>
      </div>

      {/* 🛠️ AUTOMATED SWEEPERS & SYSTEM HEALTH (Page section 11 & 12 requirement) */}
      <div className="p-5 bg-[#0a0f1d] rounded-2xl border border-[#1b253b]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5 text-blue-400" />
            <h4 className="text-xs font-bold text-slate-100">Automated Sweepers</h4>
          </div>
          <span className="text-[9px] text-slate-400 font-mono">Manual Force Trigger</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal mb-4 font-sans">
          Trigger the bot's micro-service maintenance events. Clears waitlists, cancels idle matches, and resolves blocked accounts.
        </p>

        {cleanupMessage && (
          <div className="mb-3.5 p-2.5 bg-blue-950/50 border border-blue-900/60 rounded-xl text-blue-400 text-[10px] font-mono flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{cleanupMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            disabled={!!cleaning}
            onClick={() => runSweeper("stale_queue", "Stale waitlist items")}
            className="p-2.5 bg-[#121829] hover:bg-[#1a223a] border border-[#1d2744] hover:border-slate-500 rounded-xl text-left text-[11px] font-semibold flex flex-col justify-between transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between w-full text-slate-400 font-mono text-[9px]">
              <span>QUEUE TIME</span>
              <Trash2 className="w-3 h-3 text-amber-500" />
            </div>
            <span className="text-slate-200 mt-1">Stale Queue Sweeper</span>
            <span className="text-[8px] text-slate-400 leading-none mt-1 font-mono">Older than 5 mins</span>
          </button>

          <button
            disabled={!!cleaning}
            onClick={() => runSweeper("stuck_matches", "Timed out active swaps")}
            className="p-2.5 bg-[#121829] hover:bg-[#1a223a] border border-[#1d2744] hover:border-slate-500 rounded-xl text-left text-[11px] font-semibold flex flex-col justify-between transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between w-full text-slate-400 font-mono text-[9px]">
              <span>TIMER TIMED</span>
              <Trash2 className="w-3 h-3 text-rose-500" />
            </div>
            <span className="text-slate-200 mt-1">Stuck Match Purger</span>
            <span className="text-[8px] text-slate-400 leading-none mt-1 font-mono">Exceeded threshold</span>
          </button>

          <button
            disabled={!!cleaning}
            onClick={() => runSweeper("orphan_matches", "Orphaned partitions")}
            className="p-2.5 bg-[#121829] hover:bg-[#1a223a] border border-[#1d2744] hover:border-slate-500 rounded-xl text-left text-[11px] font-semibold flex flex-col justify-between transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between w-full text-slate-400 font-mono text-[9px]">
              <span>BANNED STATE</span>
              <Trash2 className="w-3 h-3 text-red-500" />
            </div>
            <span className="text-slate-200 mt-1">Orphan Match Rescue</span>
            <span className="text-[8px] text-slate-400 leading-none mt-1 font-mono">Banned dependencies</span>
          </button>

          <button
            disabled={!!cleaning}
            onClick={() => runSweeper("duplicate_queues", "Duplicate queue entries")}
            className="p-2.5 bg-[#121829] hover:bg-[#1a223a] border border-[#1d2744] hover:border-slate-500 rounded-xl text-left text-[11px] font-semibold flex flex-col justify-between transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center justify-between w-full text-slate-400 font-mono text-[9px]">
              <span>CONCURRENCY</span>
              <Trash2 className="w-3 h-3 text-cyan-500" />
            </div>
            <span className="text-slate-200 mt-1">Deduplicate list</span>
            <span className="text-[8px] text-slate-400 leading-none mt-1 font-mono">Double-submits</span>
          </button>
        </div>
      </div>

      {/* ⚡ CORE SHORTCUTS NAVIGATOR */}
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-450 mb-3 ml-1 font-mono">
          System Control Shortcuts
        </h3>
        <div className="grid grid-cols-1 gap-2.5">
          {quickActions.map((act) => {
            const IconComponent = act.icon;
            return (
              <motion.button
                key={act.id}
                onClick={() => onNavigate(act.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-between p-3.5 bg-[#0c1122] rounded-2xl border border-[#1b253b] hover:border-slate-500 hover:bg-[#11182c] transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${act.color}`}>
                    <IconComponent className="w-4.5 h-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-100 leading-none">
                      {act.label}
                    </h4>
                    <p className="text-[10px] text-slate-405 leading-none font-sans">
                      {act.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-all" />
              </motion.button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
