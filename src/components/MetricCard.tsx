import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface MetricProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorClass: string; // e.g., 'blue', 'orange', 'green'
  description?: string;
  delayIndex?: number;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  colorClass,
  description,
  delayIndex = 0
}: MetricProps) {
  
  // Custom color classes for obsidian premium UI
  const themeColors: Record<string, { bg: string; iconBg: string; text: string; fillBar: string; bgBar: string }> = {
    blue: {
      bg: "bg-[#0c1122]",
      iconBg: "bg-blue-950/40 text-blue-400 border-blue-900/40",
      text: "text-blue-400",
      fillBar: "bg-blue-500 w-3/4",
      bgBar: "bg-blue-950/20"
    },
    emerald: {
      bg: "bg-[#0c1122]",
      iconBg: "bg-emerald-950/40 text-[#10b981] border-emerald-900/40",
      text: "text-emerald-400",
      fillBar: "bg-[#10b981] w-4/5",
      bgBar: "bg-emerald-950/20"
    },
    amber: {
      bg: "bg-[#0c1122]",
      iconBg: "bg-amber-950/40 text-amber-400 border-amber-900/40",
      text: "text-amber-400",
      fillBar: "bg-amber-500 w-2/5",
      bgBar: "bg-amber-950/20"
    },
    rose: {
      bg: "bg-[#0c1122]",
      iconBg: "bg-rose-950/40 text-rose-400 border-rose-900/40",
      text: "text-rose-400",
      fillBar: "bg-rose-500 w-1/4",
      bgBar: "bg-rose-950/20"
    },
    violet: {
      bg: "bg-[#0c1122]",
      iconBg: "bg-violet-950/40 text-violet-400 border-violet-900/40",
      text: "text-violet-400",
      fillBar: "bg-violet-500 w-2/3",
      bgBar: "bg-violet-950/20"
    },
    indigo: {
      bg: "bg-[#0c1122]",
      iconBg: "bg-indigo-950/40 text-indigo-400 border-indigo-900/40",
      text: "text-indigo-400",
      fillBar: "bg-[#5c72ff] w-3/5",
      bgBar: "bg-indigo-950/20"
    },
    slate: {
      bg: "bg-[#0c1122]",
      iconBg: "bg-slate-900 text-slate-400 border-slate-800",
      text: "text-slate-300",
      fillBar: "bg-slate-600 w-1/2",
      bgBar: "bg-slate-900"
    }
  };

  const colors = themeColors[colorClass] || themeColors.blue;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delayIndex * 0.05 }}
      whileHover={{ y: -2 }}
      className="p-4 bg-[#0c1122] rounded-2xl border border-[#1b253b] shadow-lg flex flex-col justify-between min-h-[110px]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {title}
          </p>
          <p className={`text-xl font-black ${colors.text} tracking-tight`}>
            {value}
          </p>
        </div>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${colors.iconBg} shrink-0`}>
          <Icon className="w-4 h-4 stroke-[2]" />
        </div>
      </div>

      <div className="mt-2.5">
        <div className={`h-1.5 w-full ${colors.bgBar} rounded-full overflow-hidden`}>
          <div className={`h-full rounded-full transition-all duration-500 ${colors.fillBar}`}></div>
        </div>
        <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400 font-medium font-mono">
          <span>{description || "Active Tracking"}</span>
          <span className="text-emerald-400 animate-pulse">● LIVE</span>
        </div>
      </div>
    </motion.div>
  );
}
