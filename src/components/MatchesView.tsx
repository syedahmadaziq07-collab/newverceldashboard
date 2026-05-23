import { useState } from "react";
import { 
  Zap, 
  ArrowLeftRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Eye, 
  X,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  FileCheck,
  UserX,
  Sparkles,
  RefreshCw,
  Ban
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Match } from "../types";

interface MatchesViewProps {
  matches: Match[];
  loading: boolean;
  onMatchAction: (matchId: string, action: string, verdict?: "approve" | "reject") => Promise<void>;
  onRefresh: () => void;
}

export default function MatchesView({ matches, loading, onMatchAction, onRefresh }: MatchesViewProps) {
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");
  const [selectedAuditMatch, setSelectedAuditMatch] = useState<Match | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filter strategy — guard against undefined array
  const filteredMatches = (matches ?? []).filter((m) => {
    if (filter === "active") return m.status === "active";
    if (filter === "completed") return m.status === "completed";
    if (filter === "cancelled") return m.status === "cancelled";
    return true;
  });

  const handleAction = async (matchId: string, action: string, verdict?: "approve" | "reject") => {
    setActionLoadingId(`${matchId}_${action}_${verdict || ""}`);
    try {
      await onMatchAction(matchId, action, verdict);
      if (selectedAuditMatch && selectedAuditMatch.id === matchId) {
        setSelectedAuditMatch(null); // Close modal on audit success
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (match: Match) => {
    if (match.status === "completed") {
      return (
        <span className="px-2 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 rounded-lg text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" /> Approved
        </span>
      );
    }
    if (match.status === "cancelled") {
      return (
        <span className="px-2 py-1 bg-red-950/40 text-rose-450 border border-red-900/40 rounded-lg text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" /> Cancelled
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-blue-950/40 text-blue-400 border border-blue-900/40 rounded-lg text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1 animate-pulse">
        <Zap className="w-3.5 h-3.5 fill-blue-500 text-blue-500" /> Active Swap
      </span>
    );
  };

  const getProofStatusDetails = (match: Match) => {
    const isASub = match.proofStatus === "submitted_both" || match.proofStatus === "submitted_a";
    const isBSub = match.proofStatus === "submitted_both" || match.proofStatus === "submitted_b";

    return (
      <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono">
        <span className={`px-2 py-0.5 rounded border ${isASub ? "bg-emerald-950/35 text-emerald-400 border-emerald-900/30" : "bg-slate-900 text-slate-500 border-slate-800"}`}>
          USER A: {isASub ? "✅ SUBMITTED" : "⏳ INACTIVE"}
        </span>
        <span className={`px-2 py-0.5 rounded border ${isBSub ? "bg-emerald-950/35 text-emerald-400 border-emerald-900/30" : "bg-slate-900 text-slate-500 border-slate-800"}`}>
          USER B: {isBSub ? "✅ SUBMITTED" : "⏳ INACTIVE"}
        </span>
      </div>
    );
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* 📊 MATCH STATUS FILTERS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-sans">
        {([
          { id: "all", label: "All Swaps" },
          { id: "active", label: "Live Exchanges" },
          { id: "completed", label: "Completed" },
          { id: "cancelled", label: "Cancelled" },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
              filter === tab.id
                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/15"
                : "bg-[#0c1122] border-[#1b253b] text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0c1122] rounded-3xl border border-[#1b253b]">
          <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-400 font-medium">Downloading match instances...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-[#0c1122] p-6 rounded-2xl border border-[#1b253b] text-center">
          <AlertTriangle className="w-10 h-10 text-slate-500 stroke-[1.5] mb-2.5" />
          <p className="text-sm font-bold text-slate-300">No matches found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
            No active swaps or completed histories align with this tab's scope.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              className="bg-[#0c1122] rounded-2xl border border-[#1b253b] p-4 shadow-sm space-y-3 relative overflow-hidden"
            >
              {/* Card Meta Row */}
              <div className="flex items-center justify-between pb-2 border-b border-[#1b253b]">
                <span className="text-[10px] font-mono font-bold text-slate-450">
                  REF: #{(match.id || "").slice(-8) || "—"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-450 flex items-center gap-1 font-mono font-bold">
                    <Clock className="w-3 h-3 text-blue-400" /> {formatDate(match.startedTime)}
                  </span>
                  {getStatusBadge(match)}
                </div>
              </div>

              {/* Matched Duel Row */}
              <div className="flex items-center justify-between py-2 px-3 bg-[#080d19] rounded-xl border border-[#141b2f] gap-2">
                {/* User A Block */}
                <div className="flex-1 w-20 text-center font-sans">
                  <span className="text-xs font-bold text-slate-200 block truncate">
                    {match.userAName}
                  </span>
                  <span className="text-[9px] text-[#5c72ff] font-mono truncate block mt-0.5">
                    @{match.userATiktok}
                  </span>
                </div>

                {/* Match Vector Arrow */}
                <div className="flex flex-col items-center justify-center text-blue-500 shrink-0">
                  <ArrowLeftRight className="w-4 h-4 stroke-[2]" />
                  <span className="text-[7px] uppercase tracking-widest font-black mt-1 text-slate-500 leading-none font-mono">
                    SWAP
                  </span>
                </div>

                {/* User B Block */}
                <div className="flex-1 w-20 text-center font-sans">
                  <span className="text-xs font-bold text-slate-200 block truncate">
                    {match.userBName}
                  </span>
                  <span className="text-[9px] text-[#5c72ff] font-mono truncate block mt-0.5">
                    @{match.userBTiktok}
                  </span>
                </div>
              </div>

              {/* Proof Details status row */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="space-y-1.5">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-widest font-mono leading-none">Screenshots submitted</span>
                  {getProofStatusDetails(match)}
                </div>

                {/* Proof preview trigger */}
                {match.proofStatus !== "none" && match.proofImageUrl && (
                  <button
                    onClick={() => setSelectedAuditMatch(match)}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-200 bg-blue-950/40 border border-blue-900/30 hover:bg-blue-900/50 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-sans"
                  >
                    <Eye className="w-3.5 h-3.5" /> Assess
                  </button>
                )}
              </div>

              {/* Match actions bottom bar */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1b253b] gap-2">
                {match.status === "active" && (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[8px] font-mono text-amber-500 flex items-center gap-1 uppercase">
                      <Clock className="w-3 h-3 animate-spin" /> Timer counting (120m limit)
                    </span>
                    <button
                      onClick={() => handleAction(match.id, "cancel")}
                      disabled={actionLoadingId === `${match.id}_cancel_`}
                      className="bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/45 text-rose-400 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {actionLoadingId === `${match.id}_cancel_` ? (
                        <div className="w-3.5 h-3.5 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Force Cancel
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Clear completed match button */}
                {match.status !== "active" && (
                  <div className="flex items-center justify-between w-full font-mono text-[9px] text-slate-500">
                    <span>Closed status</span>
                    <button
                      onClick={() => handleAction(match.id, "clear")}
                      disabled={actionLoadingId === `${match.id}_clear_`}
                      className="bg-slate-900 hover:bg-[#111726] border border-slate-800 text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      title="Wipe historical swap row"
                    >
                      {actionLoadingId === `${match.id}_clear_` ? (
                        <div className="w-3.5 h-3.5 border-2 border-slate-500/30 border-t-slate-400 rounded-full animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" /> Wipe Log
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 📱 DETAILED PROOF SCREENING OVERLAY SHEET (Page section 7 Side-By-Side requirement) */}
      <AnimatePresence>
        {selectedAuditMatch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAuditMatch(null)}
              className="fixed inset-0 z-50 bg-[#020306]/85 max-w-md mx-auto"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "150%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-[#0c101c] border-t border-[#1e2a47] rounded-t-[28px] p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl pb-12"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#1b253b]">
                <div>
                  <h3 className="font-extrabold font-display text-slate-100 text-[15px] flex items-center gap-1.5">
                    <FileCheck className="w-5 h-5 text-blue-400" /> Proof Screenshot Audit
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">Cross-check accounts side-by-side</p>
                </div>
                <button
                  onClick={() => setSelectedAuditMatch(null)}
                  className="p-1.5 rounded-full bg-[#151d30] text-slate-400 hover:text-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* 7. Side-by-Side Username + Data details Block */}
              <div className="grid grid-cols-2 gap-2.5 text-[10.5px] font-mono leading-relaxed">
                <div className="p-3 bg-blue-950/20 rounded-xl border border-blue-900/35 space-y-1">
                  <span className="text-[8px] font-black text-blue-400 block tracking-widest uppercase mb-0.5">SWAP PARTER A</span>
                  <div className="text-slate-200 font-extrabold truncate">{selectedAuditMatch.userAName}</div>
                  <div className="text-[#5c72ff] font-bold truncate">@{selectedAuditMatch.userATiktok}</div>
                  <div className="text-[7.5px] text-slate-500 break-all leading-none">{selectedAuditMatch.userAId}</div>
                </div>

                <div className="p-3 bg-[#111726]/80 rounded-xl border border-[#1b253b] space-y-1">
                  <span className="text-[8px] font-black text-[#10b981] block tracking-widest uppercase mb-0.5">SWAP PARTER B</span>
                  <div className="text-slate-200 font-extrabold truncate">{selectedAuditMatch.userBName}</div>
                  <div className="text-emerald-400 font-bold truncate">@{selectedAuditMatch.userBTiktok}</div>
                  <div className="text-[7.5px] text-slate-500 break-all leading-none">{selectedAuditMatch.userBId}</div>
                </div>
              </div>

              {/* Proof Image viewport */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-[#1b253b] max-h-72 shadow-inner flex items-center justify-center">
                <img
                  src={selectedAuditMatch.proofImageUrl}
                  alt="TikTok Cut screenshot proof"
                  referrerPolicy="no-referrer"
                  className="object-contain w-full h-full max-h-72"
                />
                
                <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-2 py-1 rounded-md text-slate-100 font-bold font-mono text-[8px] select-none tracking-widest">
                  PNG PROOF
                </div>
              </div>

              {/* Active Audit Decision controls */}
              {selectedAuditMatch.status === "active" ? (
                <div className="space-y-3 pt-2 font-sans">
                  <span className="text-slate-400 block text-[9.5px] uppercase font-bold tracking-widest font-mono leading-none">
                    Admin Verification Decision
                  </span>

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => handleAction(selectedAuditMatch.id, "audit_proof", "approve")}
                      disabled={actionLoadingId !== null}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
                    >
                      {actionLoadingId === `${selectedAuditMatch.id}_audit_proof_approve` ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full' animate-spin" />
                      ) : (
                        <>
                          <ThumbsUp className="w-4 h-4" /> Approve Swap
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleAction(selectedAuditMatch.id, "audit_proof", "reject")}
                      disabled={actionLoadingId !== null}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-500/10 cursor-pointer"
                    >
                      {actionLoadingId === `${selectedAuditMatch.id}_audit_proof_reject` ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <ThumbsDown className="w-4 h-4" /> Reject & Cool
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[9.5px] text-slate-450 text-center leading-relaxed max-w-[340px] mx-auto font-sans leading-normal">
                    * Approving completes the swap, adds success tallies, and frees the thread. Rejecting triggers a 12-hour penalty cooldown period under timeout restrictions.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-[#111726]/60 border border-[#1b253b] rounded-xl text-center font-mono">
                  <p className="text-xs font-bold text-slate-300">
                    Audit Status: Closed ({selectedAuditMatch.approvalStatus === "approved" ? "✅ Completed Swapping" : "❌ Rejected Submissions"})
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Audit log is finalized. No further action needed.</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
