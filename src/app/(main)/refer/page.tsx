"use client";

import React, { useState, useEffect } from "react";
import { useProfile } from "@/context/ProfileContext";
import {
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  Coins,
  TrendingUp,
  Percent,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatCoins, coinsToInr, formatInr, timeAgo } from "@/lib/utils";
import { Transaction } from "@/lib/types";

interface ReferralData {
  referralCode: string;
  invitedCount: number;
  totalCommissionCoins: number;
  transactions: Transaction[];
}

export default function ReferPage() {
  const { profile } = useProfile();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadReferralData() {
      try {
        const res = await fetch("/api/referrals");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load referrals", err);
      } finally {
        setLoading(false);
      }
    }
    loadReferralData();
  }, []);

  const referralCode = profile?.referral_code || data?.referralCode || "TASKMINT";
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const referralLink = origin ? `${origin}/login?ref=${referralCode}` : "";

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `💸 Earn real cash with me on TaskMint! Complete quick paid surveys & daily check-ins to withdraw real cash directly to UPI.\n\n🎁 Use my referral link to get an instant 20 Coins Bonus:\n${referralLink}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-900 p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-sm">
            <Percent className="h-3.5 w-3.5 text-amber-300" />
            <span>10% Lifetime Commission</span>
          </div>

          <h2 className="text-xl font-black leading-tight">
            Invite Friends & Build <br />
            <span className="text-amber-300">Passive Income</span>
          </h2>

          <p className="text-xs text-emerald-100/90 leading-relaxed pt-1">
            Whenever a friend you invited finishes any paid survey, you instantly receive <strong className="text-amber-200">10% of their earned coins</strong> credited to your wallet forever!
          </p>
        </div>
      </div>

      {/* Share Box */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Your Unique Referral Link
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 truncate select-all">
              {referralLink || "Generating link..."}
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Referral Code Highlight */}
        <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200/80 px-3.5 py-2.5">
          <div className="flex items-center space-x-2">
            <Gift className="h-4 w-4 text-amber-600" />
            <span className="text-xs text-amber-900 font-semibold">Your Referral Code:</span>
          </div>
          <span className="font-mono text-sm font-black text-amber-950 tracking-wider bg-white px-2.5 py-0.5 rounded-lg border border-amber-200">
            {referralCode}
          </span>
        </div>

        {/* WhatsApp Share Button */}
        <button
          onClick={handleWhatsAppShare}
          className="w-full flex items-center justify-center space-x-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white py-3 px-4 text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Share2 className="h-4 w-4 fill-white" />
          <span>Share on WhatsApp</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
            <Users className="h-4 w-4 text-emerald-600" />
            <span>Invited Friends</span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {loading ? "..." : data?.invitedCount ?? 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Friends joined with your link</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
            <Coins className="h-4 w-4 text-amber-500" />
            <span>Commission Earned</span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {loading ? "..." : formatCoins(data?.totalCommissionCoins ?? 0)}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
            ≈ {formatInr(coinsToInr(data?.totalCommissionCoins ?? 0))} Real Cash
          </p>
        </div>
      </div>

      {/* How it Works Step-by-Step */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          How Referral Earnings Work
        </h3>

        <div className="space-y-2.5">
          <div className="flex items-start space-x-3 text-xs">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
              1
            </span>
            <p className="text-slate-600">
              Share your link with friends, family, or social communities.
            </p>
          </div>

          <div className="flex items-start space-x-3 text-xs">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
              2
            </span>
            <p className="text-slate-600">
              They get an instant <strong className="text-slate-800">20 Coins</strong> signup bonus when signing in with Google.
            </p>
          </div>

          <div className="flex items-start space-x-3 text-xs">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
              3
            </span>
            <p className="text-slate-600">
              Every time they finish a survey, you automatically receive <strong className="text-emerald-700">10% of their earnings in Coins</strong>!
            </p>
          </div>
        </div>
      </div>

      {/* Referral Bonus Transactions List */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Referral Earnings History
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            {data?.transactions?.length ?? 0} Bonus Payments
          </span>
        </div>

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Loading referral transactions...</p>
          </div>
        ) : data?.transactions && data.transactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {data.transactions.map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">10% Survey Commission</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {timeAgo(tx.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-600 font-mono">
                    +{formatCoins(tx.amount_coins)} Coins
                  </span>
                  <p className="text-[10px] text-slate-500">
                    +{formatInr(coinsToInr(tx.amount_coins))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 space-y-1.5">
            <Users className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium text-slate-600">No referral commission yet</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Share your link above with friends to start earning passive coins on every survey they take!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
