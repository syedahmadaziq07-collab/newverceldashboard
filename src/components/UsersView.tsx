import { useState } from "react";
import { 
  Search, 
  UserMinus, 
  Ban, 
  CheckCircle, 
  Clock, 
  X, 
  RefreshCw, 
  UserCheck, 
  Info,
  Unlock,
  AlertTriangle,
  UserX,
  AlertCircle,
  Flame,
  ShieldAlert,
  Sliders,
  Check,
  ShieldOff,
  TimerOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";
import { api } from "../lib/api";

interface UsersViewProps {
  users: User[];
  loading: boolean;
  onUserAction: (userId: string, action: string, payload?: any) => Promise<void>;
  onRefresh: () => void;
}

export default function UsersView({ users, loading, onUserAction, onRefresh }: UsersViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "tiktok" | "banned" | "cooldown" | "active" | "suspicious">("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // States for manual form adjustments inside the detail modal
  const [editStrikes, setEditStrikes] = useState<number>(0);
  const [editGhosts, setEditGhosts] = useState<number>(0);
  const [editSuspicious, setEditSuspicious] = useState<boolean>(false);
  const [savingStats, setSavingStats] = useState<boolean>(false);

  // Filter and search logic
  const filteredUsers = (users ?? []).filter((u) => {
    // Search match — guard against null/undefined backend fields
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (u.name || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q) ||
      (u.id || "").includes(searchQuery) ||
      (u.tiktokUsername || "").toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // Filter type match
    if (filterType === "tiktok") {
      return u.tiktokUsername !== "";
    }
    if (filterType === "banned") {
      return u.banned;
    }
    if (filterType === "cooldown") {
      if (!u.cooldownUntil) return false;
      return new Date(u.cooldownUntil) > new Date();
    }
    if (filterType === "active") {
      return !u.banned && u.state !== "idle";
    }
    if (filterType === "suspicious") {
      return !!u.isSuspicious;
    }

    return true;
  });

  const handleAction = async (userId: string, action: string, payload?: any) => {
    setActionLoadingId(`${userId}_${action}`);
    try {
      await onUserAction(userId, action, payload);
      if (selectedUser && selectedUser.id === userId) {
        const copy = { ...selectedUser };
        if (action === "ban") { copy.banned = true; copy.isBlocked = true; copy.state = "idle"; }
        if (action === "unban") { copy.banned = false; copy.isBlocked = false; }
        if (action === "clear_cooldown") { copy.cooldownUntil = null; }
        if (action === "cooldown_24h") { copy.cooldownUntil = new Date(Date.now() + 24*60*60*1000).toISOString(); copy.state = "idle"; }
        if (action === "reset_cuts") { copy.remainingCuts = 3; }
        if (action === "reset_state") { copy.state = "idle"; }
        if (action === "warn") { copy.warningsCount = (copy.warningsCount || 0) + 1; if (copy.warningsCount >= 5) copy.banned = true; }
        if (action === "adjust_stats") {
          copy.inactivityStrikes = payload?.inactivityStrikes;
          copy.ghostCount = payload?.ghostCount;
          copy.isSuspicious = payload?.isSuspicious;
        }
        setSelectedUser(copy);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDirectAction = async (
    userId: string,
    endpoint: "block" | "unblock" | "cooldown" | "remove-cooldown",
    confirmMsg: string,
    body?: Record<string, unknown>
  ) => {
    if (!window.confirm(confirmMsg)) return;
    const key = `${userId}_${endpoint}`;
    setActionLoadingId(key);
    try {
      await api.post(`/api/admin/users/${userId}/${endpoint}`, body ?? {});
      onRefresh();
      if (selectedUser && selectedUser.id === userId) {
        const copy = { ...selectedUser };
        if (endpoint === "block") { copy.banned = true; copy.isBlocked = true; copy.state = "idle"; }
        if (endpoint === "unblock") { copy.banned = false; copy.isBlocked = false; }
        if (endpoint === "cooldown") { copy.cooldownUntil = new Date(Date.now() + 24*60*60*1000).toISOString(); copy.state = "idle"; }
        if (endpoint === "remove-cooldown") { copy.cooldownUntil = null; copy.cooldownReason = null; }
        setSelectedUser(copy);
      }
    } catch (err: any) {
      alert(err?.message ?? `Action "${endpoint}" failed.`);
      console.error(`[${endpoint}]`, err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const openUserModal = (user: User) => {
    setSelectedUser(user);
    setEditStrikes(user.inactivityStrikes || 0);
    setEditGhosts(user.ghostCount || 0);
    setEditSuspicious(!!user.isSuspicious);
  };

  const saveStatsAdjustment = async () => {
    if (!selectedUser) return;
    setSavingStats(true);
    try {
      await handleAction(selectedUser.id, "adjust_stats", {
        inactivityStrikes: editStrikes,
        ghostCount: editGhosts,
        isSuspicious: editSuspicious
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingStats(false);
    }
  };

  const getStatusPill = (user: User) => {
    if (user.banned || user.isBlocked) {
      return (
        <span className="px-2.5 py-1 bg-red-950/40 text-rose-400 border border-red-900/45 rounded-lg text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1">
          <Ban className="w-3 h-3" /> BLOCKED
        </span>
      );
    }

    const now = new Date();
    if (user.cooldownUntil && new Date(user.cooldownUntil) > now) {
      return (
        <span className="px-2.5 py-1 bg-amber-950/45 text-amber-400 border border-amber-900/40 rounded-lg text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1">
          <Clock className="w-3 h-3" /> COOLDOWN
        </span>
      );
    }

    // Checking state handles
    if (user.state === "queued") {
      return (
        <span className="px-2.5 py-1 bg-emerald-950/45 text-emerald-400 border border-emerald-900/40 rounded-lg text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1">
          QUEUED
        </span>
      );
    }
    if (user.state === "matched") {
      return (
        <span className="px-2.5 py-1 bg-blue-950/40 text-blue-400 border border-blue-900/40 rounded-lg text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1 animate-pulse">
          MATCHED
        </span>
      );
    }
    if (user.state === "verifying_proof") {
      return (
        <span className="px-2.5 py-1 bg-violet-950/40 text-violet-400 border border-violet-900/40 rounded-lg text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1">
          PROOFING
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1">
        IDLE
      </span>
    );
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-MY", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* 🔍 SEARCH & CATEGORIES BAR */}
      <div className="space-y-3">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#475569]">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, TG Username, or TikTok id..."
            className="w-full pl-10 pr-4 py-3 bg-[#0c1122] rounded-2xl border border-[#1b253b] focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 text-sm placeholder:text-slate-500 text-slate-100"
          />
        </div>

        {/* Categories slider horizontal */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {([
            { id: "all", label: "All Users" },
            { id: "tiktok", label: "Has TikTok" },
            { id: "banned", label: "Banned" },
            { id: "cooldown", label: "Penalized" },
            { id: "active", label: "Matched/Exchanging" },
            { id: "suspicious", label: "Suspicious Tag" },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilterType(opt.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                filterType === opt.id
                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/15"
                  : "bg-[#0c1122] border-[#1b253b] text-slate-400 hover:text-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0c1122] rounded-3xl border border-[#1b253b]">
          <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-400 font-medium">Downloading member indices...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-[#0c1122] rounded-3xl border border-[#1b253b] p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-500 stroke-[1.5] mb-2.5" />
          <p className="text-sm font-bold text-slate-300">No users found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
            No member profiles matching these criteria were found.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px] font-black tracking-widest text-slate-500 uppercase px-1 font-mono">
            <span>Roster matches ({filteredUsers.length})</span>
            <button onClick={onRefresh} className="text-blue-400 hover:underline cursor-pointer">
              Force Sync
            </button>
          </div>

          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const warnings = user.warningsCount || 0;
              const strikes = user.inactivityStrikes || 0;
              const ghosts = user.ghostCount || 0;

              return (
                <motion.div
                  key={user.id}
                  layoutId={user.id}
                  className={`bg-[#0c1122] rounded-2xl border p-4 shadow-sm transition-all space-y-3 relative overflow-hidden ${
                    user.isSuspicious ? "border-rose-950/60" : "border-[#1b253b]"
                  }`}
                >
                  {user.isSuspicious && (
                    <div className="absolute top-0 right-0 left-0 bg-rose-500/10 border-b border-rose-500/20 py-0.5 px-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                      <span className="text-[8px] font-bold text-rose-400 tracking-widest uppercase font-mono">SUSPICIOUS PROFILE</span>
                    </div>
                  )}

                  <div className={`flex items-start justify-between ${user.isSuspicious ? "pt-2.5" : ""}`}>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[13px] text-slate-200 tracking-tight">
                          {user.name}
                        </span>
                        {user.username && (
                          <span className="text-xs text-blue-400/80 font-semibold font-mono">
                            @{user.username}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-450 font-mono">
                        TGID: {user.id}
                      </div>
                    </div>
                    {getStatusPill(user)}
                  </div>

                  {/* Abuse indicator badges row */}
                  <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono">
                    <span className={`px-2 py-0.5 rounded-md border ${
                      warnings > 0 
                        ? warnings >= 3 ? "bg-red-950/30 text-red-400 border-red-900/30" : "bg-amber-950/20 text-amber-400 border-amber-900/30"
                        : "bg-slate-900/40 text-slate-400 border-slate-800"
                    }`}>
                      WARNINGS: {warnings}/5
                    </span>
                    <span className={`px-2 py-0.5 rounded-md border ${
                      strikes > 0 ? "bg-orange-950/20 text-orange-400 border-orange-900/30" : "bg-slate-900/40 text-slate-400 border-slate-800"
                    }`}>
                      STRIKES: {strikes}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md border ${
                      ghosts > 0 ? "bg-rose-950/35 text-rose-400 border-rose-900/30" : "bg-slate-900/40 text-slate-400 border-slate-800"
                    }`}>
                      GHOSTS: {ghosts}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] py-1.5 px-3 bg-[#080d19] rounded-xl border border-[#141c2f]/70 font-mono text-slate-300">
                    <div>
                      <span className="text-slate-500 text-[8px] block font-bold uppercase tracking-wider">TikTok Register</span>
                      <span className="font-bold text-blue-400 truncate block">
                        {user.tiktokUsername || "⚠️ Unregistered"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[8px] block font-bold uppercase tracking-wider">Swaps Limit Left</span>
                      <span className="font-bold text-emerald-400">
                        {user.remainingCuts} slots
                      </span>
                    </div>
                  </div>

                  {/* Operational Controls panel */}
                  <div className="space-y-1.5 pt-1">
                    {/* Row 1: Details + Warn */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openUserModal(user)}
                        className="flex-1 bg-[#161f35] active:bg-[#202c4b] text-slate-300 border border-[#233154] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5" /> Details
                      </button>

                      <button
                        onClick={() => handleAction(user.id, "warn")}
                        disabled={actionLoadingId === `${user.id}_warn`}
                        className="flex-1 bg-amber-950/40 hover:bg-amber-900/40 text-amber-400 border border-amber-900/40 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        {actionLoadingId === `${user.id}_warn` ? (
                          <div className="w-3.5 h-3.5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                        ) : (
                          <><AlertCircle className="w-3.5 h-3.5" /> Warn ({warnings})</>
                        )}
                      </button>
                    </div>

                    {/* Row 2: Block/Unblock + Cooldown/Remove Cooldown */}
                    <div className="flex items-center gap-1.5">
                      {(user.banned || user.isBlocked) ? (
                        <button
                          onClick={() => handleDirectAction(user.id, "unblock", `Unblock ${user.name}?`)}
                          disabled={actionLoadingId === `${user.id}_unblock`}
                          className="flex-1 bg-emerald-950/40 active:bg-emerald-900/40 text-emerald-400 border border-emerald-900/40 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          {actionLoadingId === `${user.id}_unblock` ? (
                            <div className="w-3.5 h-3.5 border-2 border-emerald-600/30 border-t-emerald-400 rounded-full animate-spin" />
                          ) : (
                            <><Unlock className="w-3.5 h-3.5" /> Unblock</>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDirectAction(user.id, "block", `Block ${user.name}?`, { reason: "Blocked by admin" })}
                          disabled={actionLoadingId === `${user.id}_block`}
                          className="flex-1 bg-[#241217] active:bg-rose-950 text-rose-400 border border-rose-900/35 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          {actionLoadingId === `${user.id}_block` ? (
                            <div className="w-3.5 h-3.5 border-2 border-red-600/30 border-t-red-500 rounded-full animate-spin" />
                          ) : (
                            <><UserMinus className="w-3.5 h-3.5" /> Block</>
                          )}
                        </button>
                      )}

                      {(user.cooldownUntil && new Date(user.cooldownUntil) > new Date()) ? (
                        <button
                          onClick={() => handleDirectAction(user.id, "remove-cooldown", `Remove cooldown for ${user.name}?`)}
                          disabled={actionLoadingId === `${user.id}_remove-cooldown`}
                          className="flex-1 bg-sky-950/40 active:bg-sky-900/40 text-sky-400 border border-sky-900/35 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          {actionLoadingId === `${user.id}_remove-cooldown` ? (
                            <div className="w-3.5 h-3.5 border-2 border-sky-600/30 border-t-sky-400 rounded-full animate-spin" />
                          ) : (
                            <><TimerOff className="w-3.5 h-3.5" /> Remove CD</>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDirectAction(user.id, "cooldown", `Apply 24h cooldown to ${user.name}?`, { hours: 24, reason: "Admin cooldown" })}
                          disabled={actionLoadingId === `${user.id}_cooldown`}
                          className="flex-1 bg-[#241a12] active:bg-amber-950/60 text-amber-500 border border-amber-900/35 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          {actionLoadingId === `${user.id}_cooldown` ? (
                            <div className="w-3.5 h-3.5 border-2 border-amber-600/30 border-t-amber-500 rounded-full animate-spin" />
                          ) : (
                            <><Clock className="w-3.5 h-3.5" /> Cooldown 24h</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📱 DETAIL BOTTOM SHEET (Page section 5 side-by-side spec) */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 z-50 bg-[#020306]/85 max-w-md mx-auto"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-[#0c101c] border-t border-[#1e2a47] rounded-t-[28px] p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl pb-12"
            >
              {/* Sheet header controls */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1b253b]">
                <div>
                  <h3 className="font-extrabold font-display text-slate-100 text-[15px] flex items-center gap-2">
                    {selectedUser.name} <span className="font-mono text-[9px] text-[#5c72ff]">DETAILS</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">Adjust moderation parameters dynamically</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 rounded-full bg-[#151d30] text-slate-400 hover:text-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Data keys specifications grid */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-[#111726]/80 rounded-xl border border-[#1b253b]">
                  <span className="text-slate-500 block font-bold text-[8px] uppercase tracking-wider">Telegram ID</span>
                  <span className="text-slate-350 tracking-tight text-[11px] break-all">{selectedUser.id}</span>
                </div>
                <div className="p-3 bg-[#111726]/80 rounded-xl border border-[#1b253b]">
                  <span className="text-slate-500 block font-bold text-[8px] uppercase tracking-wider">TG Username</span>
                  <span className="text-blue-400 font-bold text-[11px]">
                    {selectedUser.username ? `@${selectedUser.username}` : "None"}
                  </span>
                </div>
                <div className="p-3 bg-[#111726]/80 rounded-xl border border-[#1b253b]">
                  <span className="text-slate-500 block font-bold text-[8px] uppercase tracking-wider">TikTok ID</span>
                  <span className="text-slate-200 font-bold text-[11px] break-all">
                    {selectedUser.tiktokUsername || "Not Registered"}
                  </span>
                </div>
                <div className="p-3 bg-[#111726]/80 rounded-xl border border-[#1b253b]">
                  <span className="text-slate-500 block font-bold text-[8px] uppercase tracking-wider">Joined Date</span>
                  <span className="text-slate-300 font-semibold">{formatDate(selectedUser.joinedTime)}</span>
                </div>
              </div>

              {/* 🛠️ ADJUSTMENT OF CORE LIMITS FORM */}
              <div className="p-4 bg-[#111726]/60 rounded-xl border border-[#1c2844] space-y-3.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-300 uppercase tracking-widest font-mono">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span>Interactive Abuses Fine-Tuning</span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {/* Inactivity Strikes */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Inactivity Strikes:</span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setEditStrikes(Math.max(0, editStrikes - 1))}
                        className="w-7 h-7 bg-[#151e34] border border-[#1d2744] hover:border-slate-400 rounded-lg text-slate-200 font-black cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-slate-100 font-extrabold text-sm">{editStrikes}</span>
                      <button 
                        onClick={() => setEditStrikes(editStrikes + 1)}
                        className="w-7 h-7 bg-[#151e34] border border-[#1d2744] hover:border-slate-400 rounded-lg text-slate-200 font-black cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Ghost count reports */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Scam/Ghost Count:</span>
                    <div className="flex items-center gap-1 font-sans">
                      <button 
                        onClick={() => setEditGhosts(Math.max(0, editGhosts - 1))}
                        className="w-7 h-7 font-mono bg-[#151e34] border border-[#1d2744] rounded-lg text-slate-200 font-black cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono text-slate-100 font-extrabold text-sm">{editGhosts}</span>
                      <button 
                        onClick={() => setEditGhosts(editGhosts + 1)}
                        className="w-7 h-7 font-mono bg-[#151e34] border border-[#1d2744] rounded-lg text-slate-200 font-black cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Suspicious Profile Tag Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400">Suspicious Flag tag:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editSuspicious} 
                        onChange={(e) => setEditSuspicious(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-[#161f36] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-350 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                    </label>
                  </div>
                </div>

                <button
                  disabled={savingStats}
                  onClick={saveStatsAdjustment}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all mt-1.5"
                >
                  {savingStats ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Save adjusted indicators
                    </>
                  )}
                </button>
              </div>

              {/* Advanced Admin Penalties */}
              <div className="space-y-2 pt-1 font-sans">
                <span className="text-slate-450 text-[10px] font-bold tracking-wider uppercase pl-1 block">
                  Advanced Penalization Tools
                </span>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {(selectedUser.cooldownUntil && new Date(selectedUser.cooldownUntil) > new Date()) ? (
                    <button
                      onClick={() => handleDirectAction(selectedUser.id, "remove-cooldown", `Remove cooldown for ${selectedUser.name}?`)}
                      disabled={actionLoadingId === `${selectedUser.id}_remove-cooldown`}
                      className="p-3 bg-sky-950/40 text-sky-400 hover:bg-sky-900/40 border border-sky-900/35 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                    >
                      {actionLoadingId === `${selectedUser.id}_remove-cooldown` ? (
                        <div className="w-3.5 h-3.5 border-2 border-sky-600/30 border-t-sky-400 rounded-full animate-spin" />
                      ) : (
                        <><TimerOff className="w-3.5 h-3.5" /> Remove Cooldown</>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDirectAction(selectedUser.id, "cooldown", `Apply 24h cooldown to ${selectedUser.name}?`, { hours: 24, reason: "Admin cooldown" })}
                      disabled={actionLoadingId === `${selectedUser.id}_cooldown`}
                      className="p-3 bg-[#241a12] text-amber-500 hover:bg-[#342417] border border-amber-900/35 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                    >
                      {actionLoadingId === `${selectedUser.id}_cooldown` ? (
                        <div className="w-3.5 h-3.5 border-2 border-amber-600/30 border-t-amber-500 rounded-full animate-spin" />
                      ) : (
                        <><Clock className="w-3.5 h-3.5" /> 24hr Cooldown Penalty</>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => handleAction(selectedUser.id, "reset_state")}
                    disabled={actionLoadingId === `${selectedUser.id}_reset_state`}
                    className="p-3 bg-[#121829] text-blue-400 hover:bg-[#1a233d] border border-blue-900/35 rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reset Workflow State
                  </button>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="w-full bg-[#151d30] text-slate-300 hover:text-white rounded-xl py-3 font-semibold text-xs tracking-wide transition-all uppercase cursor-pointer text-center"
                  >
                    Close Profile Sheet
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
