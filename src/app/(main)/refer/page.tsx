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
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { formatCoins, coinsToInr, formatInr, timeAgo } from "@/lib/utils";
import { Transaction } from "@/lib/types";

interface InvitedUser {
  id: string;
  full_name: string | null;
  created_at: string;
}

interface ReferralData {
  referralCode: string;
  invitedCount: number;
  invitedUsers?: InvitedUser[];
  totalCommissionCoins: number;
  transactions: Transaction[];
}

export default function ReferPage() {
  const { profile, refreshProfile } = useProfile();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Manual Referral Code binding state
  const [manualCode, setManualCode] = useState("");
  const [binding, setBinding] = useState(false);
  const [bindMessage, setBindMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
  
  // Instant synchronous referral link ready on frame 0
  const baseOrigin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://taskmint-iota.vercel.app";
  const referralLink = `${baseOrigin}/login?ref=${referralCode}`;

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(35);
      }
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `💸 Earn real cash with me on TaskMint! Complete quick paid surveys & daily check-ins to withdraw real cash directly to UPI.\n\n🎁 Use my referral link to get an instant 10 Coins (₹1.00) Bonus:\n${referralLink}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleApplyReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setBindMessage(null);

    const trimmed = manualCode.trim().toUpperCase();
    if (!trimmed || trimmed.length < 4) {
      setBindMessage({ type: "error", text: "Please enter a valid referral code." });
      return;
    }

    setBinding(true);
    try {
      const res = await fetch("/api/referrals/bind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: trimmed }),
      });

      const resData = await res.json();
      if (res.ok) {
        setBindMessage({ type: "success", text: resData.message });
        setManualCode("");
        await refreshProfile();
      } else {
        setBindMessage({ type: "error", text: resData.error || "Failed to apply referral code." });
      }
    } catch {
      setBindMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setBinding(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-amber-400/15 blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-purple-200 backdrop-blur-sm">
            <Percent className="h-3.5 w-3.5 text-amber-300" />
            <span>1% Live Lifetime Commission</span>
          </div>

          <h2 className="text-xl font-black leading-tight">
            Invite Friends &amp; Earn <br />
            <span className="text-amber-300">1% Passive Cash</span>
          </h2>

          <p className="text-xs text-purple-100/90 leading-relaxed pt-1">
            Whenever a friend you invite finishes any paid survey, you automatically receive <strong className="text-amber-200">1% of their earned coins</strong> credited directly into your Commission Wallet forever!
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
        <div className="flex items-center justify-between rounded-xl bg-purple-50 border border-purple-200/80 px-3.5 py-2.5">
          <div className="flex items-center space-x-2">
            <Gift className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-purple-900 font-semibold">Your Referral Code:</span>
          </div>
          <span className="font-mono text-sm font-black text-purple-950 tracking-wider bg-white px-2.5 py-0.5 rounded-lg border border-purple-200">
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

      {/* "Have a Referral Code?" Box (Shown if user has no referrer yet) */}
      {!profile?.referred_by && (
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-slate-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <LinkIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Have a Referral Code?</h3>
              <p className="text-[10px] text-slate-500">Joined without a link? Enter your friend&apos;s code here.</p>
            </div>
          </div>

          {bindMessage && (
            <div
              className={`rounded-xl p-2.5 text-xs font-semibold flex items-start space-x-2 ${
                bindMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {bindMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              )}
              <span>{bindMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleApplyReferral} className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="ENTER 6-DIGIT CODE"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              maxLength={10}
              className="flex-1 uppercase font-mono tracking-wider bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={binding}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              {binding ? "Linking..." : "Apply Code"}
            </button>
          </form>
        </div>
      )}

      {/* Linked Referrer Confirmation if already bound */}
      {profile?.referred_by && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 p-3 flex items-center space-x-2 text-xs text-emerald-900 font-semibold">
          <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            Connected to Referrer: <strong className="font-mono text-emerald-950">{profile.referred_by}</strong>
          </span>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
            <Users className="h-4 w-4 text-purple-600" />
            <span>Invited Friends</span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {loading ? "..." : data?.invitedCount ?? 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Friends joined with your link</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
            <Coins className="h-4 w-4 text-purple-600" />
            <span>1% Commission Earned</span>
          </div>
          <p className="mt-2 text-2xl font-black text-purple-600">
            {loading ? "..." : formatCoins(data?.totalCommissionCoins ?? 0)}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
            ≈ {formatInr(coinsToInr(data?.totalCommissionCoins ?? 0))} Real Cash
          </p>
        </div>
      </div>

      {/* Invited Friends List */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Referred Friends ({data?.invitedUsers?.length ?? 0})
          </h3>
          <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
            Live Network
          </span>
        </div>

        {loading ? (
          <div className="py-6 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <div className="h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Loading invited friends...</p>
          </div>
        ) : data?.invitedUsers && data.invitedUsers.length > 0 ? (
          <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
            {data.invitedUsers.map((friend, idx) => (
              <div key={friend.id} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-800">{friend.full_name || "Anonymous Friend"}</p>
                    <p className="text-[10px] text-slate-400">{timeAgo(friend.created_at)}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  1% Active
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 space-y-1">
            <Users className="h-7 w-7 mx-auto text-slate-300" />
            <p className="text-xs font-medium text-slate-600">No friends joined yet</p>
            <p className="text-[11px] text-slate-400">Share your link above to build your passive income stream!</p>
          </div>
        )}
      </div>

      {/* How it Works Step-by-Step */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          How 1% Referral Commission Works
        </h3>

        <div className="space-y-2.5">
          <div className="flex items-start space-x-3 text-xs">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-800 font-black text-[10px]">
              1
            </span>
            <p className="text-slate-600">
              Share your link or 6-digit code with friends &amp; communities.
            </p>
          </div>

          <div className="flex items-start space-x-3 text-xs">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-800 font-black text-[10px]">
              2
            </span>
            <p className="text-slate-600">
              They receive an instant <strong className="text-slate-800">10 Coins (₹1.00)</strong> welcome bonus upon entry.
            </p>
          </div>

          <div className="flex items-start space-x-3 text-xs">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-800 font-black text-[10px]">
              3
            </span>
            <p className="text-slate-600">
              Every time they finish a survey, you automatically receive <strong className="text-purple-700">1% of their earnings in Coins</strong> credited to your Commission Wallet!
            </p>
          </div>
        </div>
      </div>

      {/* Referral Bonus Transactions List */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            1% Commission Earnings History
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            {data?.transactions?.length ?? 0} Bonus Payments
          </span>
        </div>

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <div className="h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Loading referral transactions...</p>
          </div>
        ) : data?.transactions && data.transactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {data.transactions.map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">1% Survey Commission</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {timeAgo(tx.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-purple-600 font-mono">
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
            <Coins className="h-8 w-8 mx-auto text-slate-300" />
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
