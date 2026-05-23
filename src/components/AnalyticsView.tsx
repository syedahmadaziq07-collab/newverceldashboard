import { useState, useMemo } from "react";
import { 
  BarChart3, 
  ShieldAlert, 
  Clock, 
  Activity, 
  TrendingUp, 
  Flame, 
  ThumbsDown, 
  Sparkles,
  RefreshCw,
  UserX,
  AlertTriangle,
  UserCheck,
  Zap,
  LayoutGrid
} from "lucide-react";
import { User, Match } from "../types";

interface AnalyticsViewProps {
  users: User[];
  matches: Match[];
  onRefresh: () => void;
}

export default function AnalyticsView({ users, matches, onRefresh }: AnalyticsViewProps) {
  const [activeTab, setActiveTab] = useState<"performance" | "abuse">("performance");

  // Heatmap hourly distribution (Aesthetics: pure modern, high shadow bars)
  const heatmapData = [
    { hour: "00:00 - 04:00", volume: 15, level: "low" },
    { hour: "04:00 - 08:00", volume: 38, level: "medium" },
    { hour: "08:00 - 12:00", volume: 92, level: "high" },
    { hour: "12:00 - 16:00", volume: 110, level: "ultra" },
    { hour: "16:00 - 20:00", volume: 85, level: "high" },
    { hour: "20:00 - 23:59", volume: 45, level: "medium" }
  ];

  // Daily swaps completed data simulation (Custom interactive SVG representation)
  const dailySwaps = [
    { label: "Mon", value: 42 },
    { label: "Tue", value: 58 },
    { label: "Wed", value: 39 },
    { label: "Thu", value: 76 },
    { label: "Fri", value: 94 },
    { label: "Sat", value: 112 },
    { label: "Sun", value: 88 }
  ];

  // Retention rates simulation by swap experience points
  const retentionStages = [
    { tenure: "1st Swap Complete", rate: "95%" },
    { tenure: "3+ Swap Loops", rate: "80%" },
    { tenure: "10+ Hardcore Swappers", rate: "54%" },
    { tenure: "Daily Active Swap Streak", rate: "38%" }
  ];

  // Core metrics derived dynamically from dataset
  const dynamicMetrics = useMemo(() => {
    const totalExchanges = matches.length;
    const completed = matches.filter(m => m.status === "completed").length;
    const cancelled = matches.filter(m => m.status === "cancelled").length;
    const ghosted = matches.filter(m => m.status === "cancelled" && m.proofStatus === "none").length;
    const rejected = matches.filter(m => m.approvalStatus === "rejected").length;

    const rate = totalExchanges > 0 ? ((completed / (completed + cancelled)) * 100) : 88;
    const ghostRate = cancelled > 0 ? (ghosted / cancelled) * 100 : 25;
    const rejectionRate = totalExchanges > 0 ? (rejected / totalExchanges) * 100 : 12;

    // Filter top active users
    const userSwaps = users.map(u => {
      // count matches involving user
      const userMatches = matches.filter(m => m.userAId === u.id || m.userBId === u.id);
      const totalCombined = userMatches.length;
      const userCompleted = userMatches.filter(m => m.status === "completed").length;
      return {
        ...u,
        totalCombined,
        userCompleted
      };
    }).sort((a, b) => b.totalCombined - a.totalCombined);

    // Filter top list of abuse tags
    const ghostRank = [...users].sort((a, b) => (b.ghostCount || 0) - (a.ghostCount || 0));
    const rejectRank = [...users].sort((a, b) => (b.rejectedProofCount || 0) - (a.rejectedProofCount || 0));
    const strikesRank = [...users].filter(u => (u.inactivityStrikes || 0) > 0 || (u.warningsCount || 0) > 0)
      .sort((a, b) => (b.warningsCount || 0) - (a.warningsCount || 0));

    return {
      successRate: Math.round(rate),
      ghostRatePercent: Math.round(ghostRate),
      rejectionRatePercent: Math.round(rejectionRate),
      userCompleted,
      userSwaps: userSwaps.slice(0, 4),
      ghostRank: ghostRank.slice(0, 4),
      rejectRank: rejectRank.slice(0, 4),
      strikesRank: strikesRank.slice(0, 4)
    };
  }, [users, matches]);

  const getHeatmapColor = (level: string) => {
    switch (level) {
      case "low": return "bg-blue-950/25 border-blue-900/30 text-blue-400";
      case "medium": return "bg-blue-950/50 border-blue-800/40 text-blue-300";
      case "high": return "bg-indigo-950/70 border-indigo-700/50 text-indigo-200";
      case "ultra": return "bg-indigo-550 border-indigo-400 text-white shadow-lg shadow-indigo-600/20";
      default: return "";
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-100">
      
      {/* 🔮 INTERCHANGE TABS HEADER */}
      <div className="flex bg-[#0a0f1d] rounded-2xl p-1 border border-[#1b253b] shadow-xs shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("performance")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "performance"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/15"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" /> BOT PERFORMANCE
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("abuse")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "abuse"
              ? "bg-[#271117] text-rose-400 border border-rose-900/35"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" /> ABUSE MATRIX
        </button>
      </div>

      {activeTab === "performance" ? (
        /* ==========================================
           1. CORE BOT USAGE PERFORMANCE METRICS
           ========================================== */
        <div className="space-y-4">
          
          {/* Daily Swap Graphs Visual (Tailwind Responsive Graph) */}
          <div className="bg-[#0c1122] rounded-2xl border border-[#1b253b] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 font-mono font-bold block uppercase tracking-wide leading-none">Concluded Swaps</span>
                <h4 className="font-extrabold text-white text-xs mt-1 leading-none">Weekly Daily Swaps Trend</h4>
              </div>
              <TrendingUp className="w-4.5 h-4.5 text-blue-400 shrink-0" />
            </div>

            {/* Custom Interactive SVG Block representing bars bar chart */}
            <div className="pt-2">
              <div className="flex items-end justify-between h-24 px-1 gap-2.5 select-none relative">
                
                {/* Visual guideline background */}
                <div className="absolute inset-0 flex flex-col justify-between border-b border-[#1b253b]/40 pointer-events-none">
                  <div className="w-full border-t border-[#1b253b]/20" />
                  <div className="w-full border-t border-[#1b253b]/30" />
                  <div className="w-full border-t border-[#1b253b]/10" />
                </div>

                {dailySwaps.map((day) => {
                  const percentHeight = Math.min(100, Math.max(15, (day.value / 120) * 100));
                  return (
                    <div key={day.label} className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end z-10 group">
                      <div className="relative w-full group flex flex-col justify-end h-full">
                        {/* Interactive popup tooltip detail */}
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap">
                          {day.value} cuts
                        </div>

                        <div 
                          style={{ height: `${percentHeight}%` }}
                          className="w-full rounded-t-md bg-gradient-to-t from-blue-700/80 to-blue-400 cursor-pointer group-hover:from-blue-500 group-hover:to-cyan-400 transition-all shadow-md shadow-blue-500/10"
                        />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 font-mono leading-none">{day.label}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-slate-500 text-center font-mono leading-none mt-4">Average swaps: 73 exchange events / day</p>
            </div>
          </div>

          {/* Active hours Heatmap visual */}
          <div className="bg-[#0c1122] rounded-2xl border border-[#1b253b] p-5 space-y-3.5">
            <div className="flex items-center gap-1.5 border-b border-[#1b253b] pb-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h4 className="font-extrabold text-slate-100 text-xs uppercase tracking-wide">Active Hours Heatmap</h4>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal">
              Optimal matching window intervals showing when the maximum volume of Telegram users is submitting cuts:
            </p>

            <div className="grid grid-cols-2 gap-2 text-[10.5px]">
              {heatmapData.map((item) => (
                <div 
                  key={item.hour}
                  className={`border px-3 py-2.5 rounded-xl flex items-center justify-between font-mono font-medium ${getHeatmapColor(item.level)}`}
                >
                  <span className="font-extrabold font-sans leading-none">{item.hour}</span>
                  <span className="text-[10px] font-black">{item.volume} trans</span>
                </div>
              ))}
            </div>
          </div>

          {/* Retention stages and active wait times layout */}
          <div className="grid grid-cols-5 gap-3 shrink-0">
            <div className="bg-[#0c1122] rounded-2xl border border-[#1b253b] p-4 col-span-2 flex flex-col justify-between">
              <div>
                <span className="text-[8px] text-slate-400 font-bold block uppercase font-mono tracking-wider">Wait Time KPI</span>
                <span className="text-xl font-black text-emerald-400 block font-display mt-1 leading-none">3.8 min</span>
              </div>
              <p className="text-[8.5px] text-slate-405 leading-relaxed mt-2.5 font-sans">
                Average queue matchmaking resolve speed.
              </p>
            </div>

            <div className="bg-[#0c1122] rounded-2xl border border-[#1b253b] p-4 col-span-3 space-y-2">
              <span className="text-[8px] text-slate-400 font-bold block uppercase font-mono tracking-wider">Member Retention Rate</span>
              <div className="space-y-1.5 font-sans text-[10px]">
                {retentionStages.map((st) => (
                  <div key={st.tenure} className="flex justify-between items-center text-slate-300 font-mono">
                    <span className="font-sans font-semibold text-slate-400 truncate max-w-[70%]">{st.tenure}</span>
                    <span className="font-bold text-slate-100">{st.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top most active users list */}
          <div className="bg-[#0c1122] rounded-2xl border border-[#1b253b] p-5 space-y-3">
            <div className="flex items-center gap-1.5 border-b border-[#1b253b] pb-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h4 className="font-bold text-slate-100 text-xs uppercase tracking-wide">Most Active Swappers</h4>
            </div>

            <div className="space-y-2">
              {dynamicMetrics.userSwaps.map((user, idx) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-2.5 bg-[#080d19]/60 rounded-xl border border-[#1b253b]/50 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-950 border border-blue-900/30 text-blue-400 font-bold text-[9px] flex items-center justify-center font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-extrabold text-slate-200 leading-none block">{user.name}</span>
                      <span className="text-[10px] text-slate-450 leading-none block mt-1 font-mono">{user.tiktokUsername || "@no_register"}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-slate-200 block text-[11px] leading-none">{user.totalCombined} matches</span>
                    <span className="text-[9px] text-[#10b981] leading-none block mt-1">
                      {user.userCompleted} approved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* ==========================================
           2. ABUSE ANALYTICS AND SUSPICIOUS TRACKER
           ========================================== */
        <div className="space-y-4">
          
          {/* Warning banner */}
          <div className="p-4 bg-red-950/20 rounded-2xl border border-red-900/30 text-xs text-rose-350 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-black tracking-wider uppercase font-mono text-[9px] text-rose-400 block">Abuse Prevention Gate</span>
              <p className="leading-relaxed font-sans">
                Below are flagged profiles exhibiting high warning counts, proof rejections, and inactive evading patterns. Trigger manual actions accordingly.
              </p>
            </div>
          </div>

          {/* Quick Stats: Ghost stats */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="bg-[#110a0d] rounded-2xl border border-red-950/50 p-3">
              <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest block leading-none">Spam Index</span>
              <span className="text-xs font-black text-red-400 mt-1 block">18.5%</span>
            </div>
            <div className="bg-[#110a0d] rounded-2xl border border-red-950/50 p-3">
              <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest block leading-none">Ghost rate</span>
              <span className="text-xs font-black text-red-300 mt-1 block">{dynamicMetrics.ghostRatePercent}%</span>
            </div>
            <div className="bg-[#110a0d] rounded-2xl border border-red-950/50 p-3">
              <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest block leading-none">Proof Disputes</span>
              <span className="text-xs font-black text-red-200 mt-1 block">{dynamicMetrics.rejectionRatePercent}%</span>
            </div>
          </div>

          {/* Top Ghost / Timeout offender rank */}
          <div className="bg-[#0c1122] rounded-2xl border border-[#1b253b] p-5 space-y-3.5">
            <div className="flex items-center gap-1.5 border-b border-[#1b253b] pb-2 text-rose-400">
              <Flame className="w-4 h-4 text-orange-500" />
              <h4 className="font-extrabold text-slate-100 text-xs uppercase tracking-wide">Top Ghosting Offenders</h4>
            </div>

            <div className="space-y-2">
              {dynamicMetrics.ghostRank.filter(u => (u.ghostCount || 0) > 0).map((user) => (
                <div 
                  key={user.id}
                  className="p-3 bg-[#130d10] border border-red-950/40 rounded-xl flex items-center justify-between text-xs font-sans"
                >
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-slate-205 block">{user.name}</span>
                    <span className="font-mono text-slate-500 text-[10px] block leading-none mt-1">ID: {user.id}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-orange-450 block text-[11px] leading-none">{user.ghostCount} ghosts</span>
                    <span className="text-[8.5px] text-slate-450 block mt-1 leading-none font-sans">Missed submit timers</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Highest Proof Rejection rates list */}
          <div className="bg-[#0c1122] rounded-2xl border border-[#1b253b] p-5 space-y-3.5">
            <div className="flex items-center gap-1.5 border-b border-[#1b253b] pb-2 text-rose-455">
              <ThumbsDown className="w-4 h-4 text-rose-500" />
              <h4 className="font-extrabold text-slate-100 text-xs uppercase tracking-wide font-sans">Spam Submitters & disputes</h4>
            </div>

            <div className="space-y-2">
              {dynamicMetrics.rejectRank.filter(u => (u.rejectedProofCount || 0) > 0).map((user) => (
                <div 
                  key={user.id}
                  className="p-3 bg-[#130d10] border border-red-950/40 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5 font-sans">
                    <span className="font-extrabold text-slate-205 block">{user.name}</span>
                    <span className="font-mono text-slate-500 text-[10px] block leading-none mt-1">TikTok: {user.tiktokUsername || "N/A"}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-rose-450 block text-[11px] leading-none">{user.rejectedProofCount} rejected</span>
                    <span className="text-[9px] text-[#475569] block mt-1 leading-none font-sans">Fake screenshot uploads</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Duplicate attempts & active warning profiles */}
          <div className="p-5 bg-[#0c1122] rounded-2xl border border-[#1b253b]">
            <div className="flex items-center justify-between pb-2 border-b border-[#1b253b] mb-3">
              <div className="flex items-center gap-2">
                <UserX className="w-4.5 h-4.5 text-rose-400" />
                <h4 className="text-xs font-bold text-slate-100 font-sans">Active Warnings Profiles</h4>
              </div>
              <span className="text-[9px] font-mono text-rose-400 bg-red-950/50 px-2 py-0.5 rounded-lg border border-red-900/40">Threshold: 5 Max</span>
            </div>

            <div className="space-y-2 text-xs">
              {dynamicMetrics.strikesRank.length === 0 ? (
                <p className="text-slate-400 text-center text-[11px] py-4">No profiles with warning points currently.</p>
              ) : (
                dynamicMetrics.strikesRank.map((user) => (
                  <div 
                    key={user.id} 
                    className="p-2 bg-[#0c1122]/70 border border-[#1b253b] rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-300 block">{user.name}</span>
                      <span className="text-[9px] text-slate-500 block mt-1 font-mono">Strikes: {user.inactivityStrikes || 0}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-[10px] font-extrabold text-rose-500 bg-red-950/40 px-2.5 py-0.5 rounded-md border border-red-950/50">
                        {user.warningsCount}/5 Warns
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
