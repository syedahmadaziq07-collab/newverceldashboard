import { useState, useMemo } from "react";
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  ExternalLink,
  RefreshCw,
  MoreVertical,
  AlertOctagon,
  Image,
  ArrowRight
} from "lucide-react";
import { Match } from "../types";

interface HistoryViewProps {
  matches: Match[];
  loading: boolean;
  onRefresh: () => void;
}

export default function HistoryView({ matches, loading, onRefresh }: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "cancelled" | "timeout" | "rejected">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week">("all");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Filter & Search Logic
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        m.id.toLowerCase().includes(q) ||
        m.userAName.toLowerCase().includes(q) ||
        m.userBName.toLowerCase().includes(q) ||
        m.userATiktok.toLowerCase().includes(q) ||
        m.userBTiktok.toLowerCase().includes(q) ||
        (m.userALink && m.userALink.toLowerCase().includes(q)) ||
        (m.userBLink && m.userBLink.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // 2. Status Filters
      if (statusFilter === "completed") {
        if (m.status !== "completed") return false;
      } else if (statusFilter === "cancelled") {
        if (m.status !== "cancelled") return false;
      } else if (statusFilter === "timeout") {
        if (m.status !== "cancelled" || m.cancelReason !== "timeout") return false;
      } else if (statusFilter === "rejected") {
        if (m.approvalStatus !== "rejected") return false;
      }

      // 3. Date Filters
      if (dateFilter === "today") {
        const todayStr = new Date().toISOString().split("T")[0];
        const matchStr = new Date(m.startedTime).toISOString().split("T")[0];
        if (matchStr !== todayStr) return false;
      } else if (dateFilter === "week") {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (new Date(m.startedTime).getTime() < weekAgo) return false;
      }

      return true;
    });
  }, [matches, searchQuery, statusFilter, dateFilter]);

  // Aggregate states
  const stats = useMemo(() => {
    let completed = 0;
    let cancelled = 0;
    let timeouts = 0;
    let rejected = 0;

    matches.forEach(m => {
      if (m.status === "completed") completed++;
      if (m.status === "cancelled") cancelled++;
      if (m.cancelReason === "timeout") timeouts++;
      if (m.approvalStatus === "rejected") rejected++;
    });

    return { completed, cancelled, timeouts, rejected, total: matches.length };
  }, [matches]);

  const getStatusBadge = (m: Match) => {
    if (m.status === "completed") {
      return (
        <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
          <CheckCircle className="w-2.5 h-2.5" /> Approved
        </span>
      );
    }
    if (m.cancelReason === "timeout") {
      return (
        <span className="bg-orange-950/40 text-orange-400 border border-orange-900/40 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" /> Timed Out
        </span>
      );
    }
    if (m.approvalStatus === "rejected") {
      return (
        <span className="bg-rose-950/40 text-rose-400 border border-rose-900/40 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
          <XCircle className="w-2.5 h-2.5" /> Rejected Proof
        </span>
      );
    }
    return (
      <span className="bg-slate-900/80 text-slate-400 border border-slate-800 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
        <XCircle className="w-2.5 h-2.5" /> Cancelled
      </span>
    );
  };

  return (
    <div className="space-y-4 font-sans text-slate-100">
      
      {/* 🔮 STATS BLOCK */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-[#0c1122] rounded-2xl border border-[#1b253b] p-3">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Total</span>
          <span className="text-sm font-black text-slate-205 mt-1 block font-mono">{stats.total}</span>
        </div>
        <div className="bg-[#0c1122] rounded-2xl border border-[#1b253b] p-3">
          <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest block leading-none">Success</span>
          <span className="text-sm font-black text-emerald-400 mt-1 block font-mono">{stats.completed}</span>
        </div>
        <div className="bg-[#0c1122] rounded-2xl border border-[#1b253b] p-3">
          <span className="text-[8px] font-bold text-orange-400 uppercase tracking-widest block leading-none">Timeout</span>
          <span className="text-sm font-black text-orange-400 mt-1 block font-mono">{stats.timeouts}</span>
        </div>
        <div className="bg-[#0c1122] rounded-2xl border border-[#1b253b] p-3">
          <span className="text-[8px] font-bold text-rose-400 uppercase tracking-widest block leading-none">Rejected</span>
          <span className="text-sm font-black text-rose-400 mt-1 block font-mono">{stats.rejected}</span>
        </div>
      </div>

      {/* 🔍 SEARCH AND FILTERS CARD */}
      <div className="bg-[#0c1122] rounded-2xl border border-[#1b253b] p-4 space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wide">Swap History Filter</h3>
        </div>

        {/* Input box */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username, tiktok link or id..."
            className="w-full bg-[#080d19] border border-[#1b253b] focus:outline-none focus:ring-1 focus:ring-blue-500 py-2.5 pl-9 pr-4 rounded-xl text-xs placeholder:text-slate-500 text-slate-200 font-sans"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>

        {/* Status filters buttons row */}
        <div className="space-y-1.5">
          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block font-mono">STATUS SEGMENT</span>
          <div className="flex flex-wrap gap-1">
            {([
              { id: "all", label: "All Cases" },
              { id: "completed", label: "Approved" },
              { id: "timeout", label: "Timeouts" },
              { id: "rejected", label: "Rejections" },
              { id: "cancelled", label: "Cancelled" }
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`py-1.5 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                  statusFilter === tab.id
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-[#080d19]/60 border-[#1a253e] text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date filter select dropdown */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <span className="text-[8px] text-slate-440 font-bold uppercase tracking-wider block mb-1">DATE PERIOD</span>
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e: any) => setDateFilter(e.target.value)}
                className="w-full bg-[#080d19] border border-[#1b253b] rounded-xl py-2 px-3 text-[11px] text-slate-300 pointer-events-auto cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-505"
              >
                <option value="all">All Available Records</option>
                <option value="today">Swaps Completed Today</option>
                <option value="week">Swaps Last 7 Days</option>
              </select>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="w-full bg-[#12192e] hover:bg-[#1a2444] border border-[#1b253b] py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-slate-100 transition-all cursor-pointer font-bold text-[11px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
              <span>Force Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📋 LIST RESULTS OF SWAP TICKETS */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 bg-[#0c1122] rounded-2xl border border-[#1b253b]">
            <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-2" />
            <p className="text-[10px] text-slate-450 font-medium">Extracting swap log database...</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-10 bg-[#0c1122] rounded-2xl border border-[#1b253b] text-slate-400 text-xs">
            No history log lines found representing selected parameters.
          </div>
        ) : (
          filteredMatches.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelectedMatch(selectedMatch?.id === m.id ? null : m)}
              className={`p-4 bg-[#0c1122] hover:bg-[#10172d] rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 ${
                selectedMatch?.id === m.id ? "border-blue-500/60 bg-[#101730]" : "border-[#1b253b]"
              }`}
            >
              {/* Header metrics */}
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400 font-bold">Match ID: {m.id}</span>
                <div className="flex items-center gap-1.5">
                  {getStatusBadge(m)}
                </div>
              </div>

              {/* Side-by-side core swappers */}
              <div className="flex items-center justify-between bg-[#080d19]/40 p-2.5 rounded-xl border border-[#141b2e] text-xs">
                <div className="text-left max-w-[45%]">
                  <span className="text-slate-400 block text-[9px] uppercase font-mono tracking-wider font-semibold">User A</span>
                  <span className="font-extrabold text-slate-200 hover:underline block truncate" title={m.userAName}>
                    {m.userAName}
                  </span>
                  <span className="font-mono text-blue-400 text-[10px] block truncate">
                    {m.userATiktok || "@not_setup"}
                  </span>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 mx-2" />

                <div className="text-right max-w-[45%]">
                  <span className="text-slate-400 block text-[9px] uppercase font-mono tracking-wider font-semibold">User B</span>
                  <span className="font-extrabold text-slate-200 hover:underline block truncate" title={m.userBName}>
                    {m.userBName}
                  </span>
                  <span className="font-mono text-blue-400 text-[10px] block truncate">
                    {m.userBTiktok || "@not_setup"}
                  </span>
                </div>
              </div>

              {/* Collapsible deeper verification details */}
              {selectedMatch?.id === m.id && (
                <div className="pt-2 border-t border-[#1e2a47]/70 space-y-3 font-sans text-[11px] text-slate-350 mt-1">
                  
                  {/* Proof representation if available */}
                  {m.proofImageUrl ? (
                    <div className="space-y-1.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1">
                        <Image className="w-3.5 h-3.5 text-blue-400" /> Audit Screenshot Proof
                      </span>
                      <div className="relative rounded-xl overflow-hidden border border-[#222f4d] bg-slate-950 aspect-video flex items-center justify-center">
                        <img 
                          src={m.proofImageUrl} 
                          alt="Transaction proof uploaded" 
                          referrerPolicy="no-referrer"
                          className="object-contain w-full h-full"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#111726] rounded-xl border border-dashed border-[#1e2e50] text-slate-400 flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 text-orange-400 shrink-0" />
                      <span>No verification proof screenshot available for this exchange.</span>
                    </div>
                  )}

                  {/* Datetime intervals */}
                  <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono leading-relaxed bg-[#080d19] p-3 rounded-xl border border-[#1b253b]/60">
                    <div>
                      <span className="text-[8px] text-slate-500 block">STARTED TIME</span>
                      <span className="text-slate-300 font-bold">{new Date(m.startedTime).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-500 block">CONCLUDED TIME</span>
                      <span className="text-slate-300 font-bold">
                        {m.completedTime ? new Date(m.completedTime).toLocaleString() : "N/A (Timeout)"}
                      </span>
                    </div>
                  </div>

                  {/* Submission Links */}
                  <div className="space-y-1.5 bg-[#080d19]/45 p-3 rounded-xl border border-[#1b253b]/40 font-mono">
                    <span className="text-[8px] text-slate-440 font-bold uppercase block">Cutlink Exchanges</span>
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="truncate max-w-[70%]">A: {m.userALink}</span>
                        <a 
                          href={m.userALink} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-400 hover:underline flex items-center gap-0.5"
                        >
                          Check <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="truncate max-w-[70%]">B: {m.userBLink}</span>
                        <a 
                          href={m.userBLink} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-400 hover:underline flex items-center gap-0.5"
                        >
                          Check <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Custom system actions / audit log information */}
                  {m.cancelReason && (
                    <div className="p-3 bg-red-950/20 rounded-xl border border-red-950/40 text-rose-350">
                      <span className="font-bold font-mono text-[9px] uppercase tracking-wider block">CANCELLATION CONTEXT</span>
                      <p className="mt-1 leading-normal font-sans text-xs">
                        Exchange was terminated with reason tag: <strong className="font-mono text-rose-400 underline italic">{m.cancelReason}</strong>.
                      </p>
                    </div>
                  )}

                  {m.auditLoggerNote && (
                    <div className="p-3 bg-blue-950/20 rounded-xl border border-blue-900/20 text-blue-300 font-sans">
                      <span className="font-bold font-mono text-[9px] uppercase tracking-wider block">ADMIN CONSOLE NOTES</span>
                      <p className="mt-1 leading-normal text-xs italic">
                        "{m.auditLoggerNote}"
                      </p>
                    </div>
                  )}

                </div>
              )}

              {/* Collapsed footer hint */}
              {selectedMatch?.id !== m.id && (
                <div className="text-[9px] text-slate-500 font-mono text-right hover:text-slate-350">
                  Click card to audit proof links and timestamp parameters...
                </div>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
}
