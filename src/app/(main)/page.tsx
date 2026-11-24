"use client";

import React from "react";
import { WalletCard } from "@/components/WalletCard";
import { DailyCheckInCard } from "@/components/DailyCheckInCard";
import { WatchAdsCard } from "@/components/WatchAdsCard";
import { CpxOfferwall } from "@/components/CpxOfferwall";
import { useProfile } from "@/context/ProfileContext";
import { Sparkles, Trophy, Users, ShieldCheck, Flame } from "lucide-react";
import Link from "next/link";

export default function EarnDashboard() {
  const { profile } = useProfile();

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Hi, {profile?.full_name?.split(" ")[0] || "Earner"} 👋
          </h2>
          <p className="text-xs text-slate-500 font-medium">Ready to earn real cash today?</p>
        </div>
        <div className="flex items-center space-x-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
          <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          <span>Active Streak</span>
        </div>
      </div>

      {/* Glowing Dual-Wallet Balance Cards */}
      <WalletCard
        coins={profile?.coins ?? 0}
        commissionCoins={profile?.commission_coins ?? 0}
        userName={profile?.full_name}
      />

      {/* Watch Ads & Earn Instant Coins Card (Adsterra Smartlink) */}
      <WatchAdsCard />

      {/* Daily Check-In Card (+10 Coins every 24h with live countdown) */}
      <DailyCheckInCard />

      {/* Quick Action Highlight Banner (Refer & Earn teaser) */}
      <Link
        href="/refer"
        prefetch={true}
        className="block rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-200/80 p-3.5 transition-all hover:bg-amber-500/20 active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <p className="text-xs font-black text-slate-900">Refer &amp; Earn 1% Live Commission</p>
                <span className="rounded bg-amber-200 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.2">HOT</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Earn 1% instant commission on every survey your friends complete!
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-800">Invite →</span>
        </div>
      </Link>

      {/* CPX Research Offerwall Section */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center space-x-1.5">
            <Trophy className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-black text-slate-900">High-Paying Surveys</h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified CPX Partner
          </span>
        </div>

        <CpxOfferwall profile={profile} />
      </div>
    </div>
  );
}
