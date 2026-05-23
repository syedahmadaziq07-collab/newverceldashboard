import { useState } from "react";
import { 
  HeartHandshake, 
  Gift, 
  UserCheck, 
  Users, 
  ExternalLink, 
  Copy, 
  Check, 
  HelpCircle,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";
import { Referral } from "../types";

interface ReferralViewProps {
  referrals: Referral[];
  loading: boolean;
}

export default function ReferralView({ referrals, loading }: ReferralViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (id: string, code: string) => {
    const link = `https://t.me/CutPriceBot?start=ref_${code}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Aggregated analytics
  const totalCutsBonus = referrals
    .filter((r) => r.rewardGranted)
    .reduce((acc, r) => acc + r.rewardAmount, 0);

  const activeReferralsCount = referrals.length;
  const completedReferralsCount = referrals.filter((r) => r.status === "completed").length;
  const pendingReferralsCount = referrals.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* 📊 CORE INVITATION KPI OVERVIEW */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-white border border-blue-50/75 rounded-2xl p-3 shadow-xs space-y-0.5">
          <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Total Reffs</span>
          <span className="text-base font-bold text-slate-800 font-display block">{activeReferralsCount}</span>
        </div>
        <div className="bg-white border border-blue-50/75 rounded-2xl p-3 shadow-xs space-y-0.5">
          <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none font-sans">Bonus Issued</span>
          <span className="text-base font-bold text-blue-600 font-display block">+{totalCutsBonus} cuts</span>
        </div>
        <div className="bg-white border border-blue-50/75 rounded-2xl p-3 shadow-xs space-y-0.5">
          <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Pending Inv</span>
          <span className="text-base font-bold text-amber-500 font-display block">{pendingReferralsCount}</span>
        </div>
      </div>

      {/* 🔗 AFFILIATE USER RECORD LOGS */}
      <div className="space-y-3">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 pl-1 block">
          Affiliate Invitation Pipelines
        </span>

        {loading && referrals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-blue-50/50">
            <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-600 rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-400 font-medium">Loading invitation metrics...</p>
          </div>
        ) : referrals.length === 0 ? (
          <div className="p-10 bg-white rounded-3xl border border-blue-50/50 text-center text-slate-400 text-xs">
            No referral data available.
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((ref, idx) => {
              const referralLink = `https://t.me/CutPriceBot?start=ref_${ref.referralCode}`;
              
              return (
                <motion.div
                  key={ref.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="bg-white rounded-3xl border border-blue-50/65 p-4 shadow-sm space-y-3"
                >
                  {/* Status header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                    <div className="flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-blue-500" />
                      <span className="font-bold text-xs text-slate-700 font-mono">
                        Code: {ref.referralCode}
                      </span>
                    </div>

                    {ref.status === "completed" ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Completed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                        <Clock className="w-3.5 h-3.5" /> Pending TikTok
                      </span>
                    )}
                  </div>

                  {/* Inviters pairs splits */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-2 bg-slate-50 rounded-2xl border border-slate-100 px-3">
                    <div>
                      <span className="text-[8px] uppercase font-bold text-slate-400 block leading-none mb-1">Inviter</span>
                      <span className="font-bold text-slate-700 block truncate">
                        {ref.inviterName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {ref.inviterId}</span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase font-bold text-slate-400 block leading-none mb-1">Invited User</span>
                      <span className="font-bold text-slate-700 block truncate">
                        {ref.invitedName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {ref.invitedId}</span>
                    </div>
                  </div>

                  {/* Reward status and Link copy options */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider leading-none">Cuts Reward</span>
                      {ref.rewardGranted ? (
                        <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                          🎁 Reward Granted (+{ref.rewardAmount} Cut)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] flex items-center gap-1 font-medium">
                          No Reward Issued Yet
                        </span>
                      )}
                    </div>

                    {/* Copy Referral link */}
                    <button
                      onClick={() => handleCopyLink(ref.id, ref.referralCode)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === ref.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Link
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
