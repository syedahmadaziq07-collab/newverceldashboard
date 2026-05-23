import { useState, useEffect } from "react";
import { 
  Layers, 
  Trash2, 
  UserPlus, 
  Trash, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check,
  ZapOff,
  AlertTriangle 
} from "lucide-react";
import { motion } from "motion/react";
import { QueueItem } from "../types";

interface QueueViewProps {
  queues: QueueItem[];
  loading: boolean;
  onQueueAction: (queueId: string | null, action: string) => Promise<void>;
  onRefresh: () => void;
}

export default function QueueView({ queues, loading, onQueueAction, onRefresh }: QueueViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  // Increment local ticker time
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleAction = async (queueId: string | null, action: string) => {
    setActionLoadingId(queueId ? `${queueId}_${action}` : `bulk_${action}`);
    try {
      await onQueueAction(queueId, action);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Helper to calculate waiting duration in minutes/seconds
  const getWaitingDurationSec = (queuedAtStr: string) => {
    try {
      const qTime = new Date(queuedAtStr);
      const diffMs = now.getTime() - qTime.getTime();
      return Math.max(0, Math.floor(diffMs / 1000));
    } catch {
      return 0;
    }
  };

  const getWaitingDuration = (queuedAtStr: string) => {
    const s = getWaitingDurationSec(queuedAtStr);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    
    if (mins < 1) {
      return `${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  // A queue entry is considered stale if waiting longer than 3 minutes (180 seconds)
  const isStale = (queuedAtStr: string) => {
    return getWaitingDurationSec(queuedAtStr) > 180;
  };

  return (
    <div className="space-y-4">
      
      {/* ⚠️ BULK CONTROLS PANEL */}
      <div className="bg-[#0b0f1d] rounded-2xl border border-[#1b253b] p-4 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-100 text-sm tracking-tight leading-none">
            Queue Actions
          </h3>
          <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-none">
            {queues.length} active TikTok links in waitlist
          </p>
        </div>

        <button
          onClick={() => handleAction(null, "clear_stale")}
          disabled={queues.length === 0 || actionLoadingId === "bulk_clear_stale"}
          className="bg-red-950/40 border border-red-900/40 text-rose-400 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          {actionLoadingId === "bulk_clear_stale" ? (
            <div className="w-3.5 h-3.5 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
          ) : (
            <>
              <Trash2 className="w-4 h-4" /> Reset Queue
            </>
          )}
        </button>
      </div>

      {loading && queues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0c1122] rounded-3xl border border-[#1b253b]">
          <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-450 font-medium">Syncing waitlist stream...</p>
        </div>
      ) : queues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-[#0c1122] rounded-3xl border border-[#1b253b] p-6 text-center">
          <ZapOff className="w-10 h-10 text-slate-505 stroke-[1.5] mb-2.5" />
          <p className="text-sm font-bold text-slate-350">Swap queue is empty</p>
          <p className="text-xs text-slate-500 mt-1 max-w-[210px] mx-auto">
            TikTok users will appear here when they execute `/cut` and input their link prompts.
          </p>
          <button
            onClick={onRefresh}
            className="mt-4 text-xs font-bold text-blue-400 bg-blue-950/40 border border-blue-900/30 hover:bg-blue-900/50 px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            Refresh Waitlist
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-[10px] font-black tracking-widest text-[#475569] uppercase px-1 font-mono">
            <span>Waiting list ({queues.length})</span>
            <span className="text-[10px] font-mono text-slate-500">Realtime Ticker</span>
          </div>

          <div className="space-y-3">
            {queues.map((item, idx) => {
              const staleItem = isStale(item.queuedAt);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className={`bg-[#0c1122] rounded-2xl border p-4 shadow-sm transition-all space-y-3 relative overflow-hidden ${
                    staleItem ? "border-amber-950/80" : "border-[#1b253b]"
                  }`}
                >
                  {/* Blinking stale badge */}
                  {staleItem && (
                    <div className="absolute top-0 right-0 left-0 bg-amber-500/10 border-b border-amber-500/25 py-0.5 px-3 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                        <span className="text-[8px] font-bold text-amber-400 tracking-widest uppercase font-mono">STALE TARGET DETECTED</span>
                      </div>
                      <span className="text-[7.5px] font-semibold text-amber-550 font-mono">WAITING &gt; 3 MINS</span>
                    </div>
                  )}

                  {/* Queue User Row */}
                  <div className={`flex items-center justify-between ${staleItem ? "pt-2.5" : ""}`}>
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-slate-205 text-sm tracking-tight leading-tight">
                        {item.telegramName || "Unknown User"}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-bold leading-none font-sans">
                        TikTok: <span className="text-blue-400 font-mono font-bold">@{item.tiktokUsername || "—"}</span>
                      </p>
                    </div>

                    <div className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold font-mono tracking-wide flex items-center gap-1 border ${
                      staleItem 
                        ? "bg-amber-950/40 text-amber-400 border-amber-900/40" 
                        : "bg-blue-950/40 text-blue-400 border-blue-900/40"
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{getWaitingDuration(item.queuedAt)}</span>
                    </div>
                  </div>

                  {/* Shared User Link Widget */}
                  <div className="space-y-1 bg-[#090d18] border border-[#141b2f] p-3 rounded-xl font-mono">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block leading-none">TikTok Promotion Target</span>
                    <div className="flex items-center justify-between gap-1 mt-1">
                      <span className="text-xs font-mono font-medium truncate text-blue-400 select-all leading-relaxed flex-1">
                        {item.submittedLink}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopy(item.id, item.submittedLink)}
                          className="p-1.5 rounded-lg hover:bg-[#1a233b] text-slate-400 active:text-slate-200 transition-all cursor-pointer"
                          title="Copy Link Bounds"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <a
                          href={item.submittedLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg hover:bg-[#1a233b] text-slate-400 active:text-slate-200 transition-all cursor-pointer"
                          title="Open Destination url"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Queue manual override controls */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleAction(item.id, "remove")}
                      disabled={actionLoadingId === `${item.id}_remove`}
                      className="flex-1 bg-[#121829] hover:bg-[#1c243b] text-slate-300 border border-[#1d2744] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {actionLoadingId === `${item.id}_remove` ? (
                        <div className="w-3.5 h-3.5 border-2 border-slate-600/30 border-t-slate-350 rounded-full animate-spin" />
                      ) : (
                        <>
                          <Trash className="w-3.5 h-3.5 text-rose-450" /> Kick Out
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleAction(item.id, "force_rematch")}
                      disabled={queues.length < 2 || actionLoadingId === `${item.id}_force_rematch`}
                      className="flex-1 bg-blue-600 active:bg-blue-700 disabled:bg-blue-900/60 disabled:text-slate-550 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md shadow-blue-500/15 cursor-pointer font-sans"
                    >
                      {actionLoadingId === `${item.id}_force_rematch` ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" /> Re-Match Swap A↔B
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
