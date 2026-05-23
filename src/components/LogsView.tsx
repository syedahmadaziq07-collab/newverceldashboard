import { useState } from "react";
import { 
  Terminal, 
  Search, 
  RefreshCw, 
  Clock, 
  UserPlus, 
  Link, 
  Megaphone, 
  Flame, 
  Ban, 
  ShieldCheck, 
  Settings, 
  CheckCircle, 
  X,
  UserCheck
} from "lucide-react";
import { motion } from "motion/react";
import { BotLog, LogCategory } from "../types";

interface LogsViewProps {
  logs: BotLog[];
  loading: boolean;
  onRefresh: () => void;
}

export default function LogsView({ logs, loading, onRefresh }: LogsViewProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | LogCategory>("all");

  const filteredLogs = (logs ?? []).filter((l) => {
    const matchesSearch = (l.message || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || l.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryTheme = (cat: LogCategory) => {
    switch (cat) {
      case "ban":
        return { bg: "bg-red-50 text-red-600 border-red-100", label: "Ban", icon: Ban };
      case "cooldown":
        return { bg: "bg-amber-50 text-amber-600 border-amber-100", label: "Cooldown", icon: Flame };
      case "match":
        return { bg: "bg-blue-50 text-blue-600 border-blue-100", label: "Match", icon: UserPlus };
      case "proof":
        return { bg: "bg-emerald-50 text-emerald-600 border-emerald-100", label: "Proof", icon: ShieldCheck };
      case "queue":
        return { bg: "bg-violet-50 text-violet-600 border-violet-100", label: "Queue", icon: Clock };
      case "broadcast":
        return { bg: "bg-pink-50 text-pink-600 border-pink-100", label: "Broadcast", icon: Megaphone };
      case "tiktok":
        return { bg: "bg-sky-50 text-sky-600 border-sky-100", label: "TikTok", icon: UserCheck };
      case "admin":
        return { bg: "bg-slate-100 text-slate-700 border-slate-200", label: "Admin", icon: Settings };
      case "user":
      default:
        return { bg: "bg-slate-50 text-slate-500 border-slate-100", label: "User", icon: Clock };
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return isoString;
    }
  };

  const categories: ("all" | LogCategory)[] = [
    "all", "user", "tiktok", "queue", "match", "proof", "broadcast", "cooldown", "ban", "admin"
  ];

  return (
    <div className="space-y-4">
      {/* 🔍 LOG SEARCH FILTER CONTAINER */}
      <div className="space-y-3">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search system audit messages..."
            className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm placeholder:text-slate-400"
          />
        </div>

        {/* Categories slider chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {categories.map((cat) => {
            const isActive = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? "bg-slate-800 border-slate-800 text-white shadow-md shadow-slate-800/15"
                    : "bg-white border-blue-50/55 text-slate-505 hover:bg-slate-50 text-slate-400 capitalize"
                }`}
              >
                {cat === "all" ? "All Logs" : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ⏳ LEDGER TIMELINE RENDERING */}
      <div className="bg-white rounded-3xl border border-blue-50/65 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-500" />
            <span className="font-bold text-slate-800 text-sm tracking-tight leading-none">
              Chronological Audit Ledger
            </span>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-500 transition-all cursor-pointer flex items-center justify-center"
            title="Reload logs data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-550 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-600 rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-400 font-medium font-sans">Syncing system events...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No logged events match current criteria filters.
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-6">
            {filteredLogs.map((log) => {
              const theme = getCategoryTheme(log.category);
              const LogIcon = theme.icon;

              return (
                <div key={log.id} className="relative text-xs space-y-1">
                  
                  {/* Timeline vector dot indicator */}
                  <div className={`absolute -left-10 top-0.5 w-8 h-8 rounded-xl border flex items-center justify-center shadow-xs ${theme.bg}`}>
                    <LogIcon className="w-4 h-4 stroke-[2]" />
                  </div>

                  {/* Header metadata row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-500 font-sans text-[11px] uppercase tracking-wider">
                      {theme.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold font-mono">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>

                  {/* Operational Details Message */}
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {log.message}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
