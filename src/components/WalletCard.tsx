import React from "react";
import Link from "next/link";
import { Coins, ArrowUpRight, TrendingUp, ShieldCheck, Users, Sparkles } from "lucide-react";
import { formatCoins, coinsToInr, formatInr } from "@/lib/utils";

interface WalletCardProps {
  coins: number;
  commissionCoins?: number;
  userName?: string | null;
}

export function WalletCard({ coins = 0, commissionCoins = 0 }: WalletCardProps) {
  const earningInr = coinsToInr(coins);
  const commissionInr = coinsToInr(commissionCoins);

  return (
    <div className="space-y-3">
      {/* 1. Self-Earning Wallet Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-4 text-white shadow-lg border border-emerald-500/20">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/15 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Self-Earning Balance</span>
            </div>
            <div className="flex items-center space-x-1 text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span>Tasks &amp; Check-ins</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-slate-950 shadow-sm font-bold">
                  <Coins className="h-4 w-4" />
                </div>
                <span className="text-2xl font-black tracking-tight text-white">
                  {formatCoins(coins)}
                </span>
                <span className="text-xs font-semibold text-amber-400">Coins</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-300 font-medium">
                ≈ <span className="text-emerald-400 font-bold text-base">{formatInr(earningInr)}</span>{" "}
                <span className="text-[10px] text-slate-400">Real Cash</span>
              </p>
            </div>

            <Link
              href="/wallet?tab=earning"
              prefetch={true}
              className="flex items-center space-x-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/30 hover:brightness-110 active:scale-95 transition-all"
            >
              <span>Withdraw</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px] text-slate-300">
            <div className="flex items-center space-x-1 text-emerald-300">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span>Instant UPI Payout</span>
            </div>
            <span className="text-[10px] text-slate-400">Min: ₹50 (500 Coins)</span>
          </div>
        </div>
      </div>

      {/* 2. Referral Commission Wallet Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-4 text-white shadow-md border border-purple-500/20">
        <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-purple-500/15 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-purple-300 uppercase tracking-wider">
              <Users className="h-3.5 w-3.5 text-purple-400" />
              <span>Referral Commission Wallet</span>
            </div>
            <div className="flex items-center space-x-1 text-[10px] text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full font-semibold">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>1% Live Lifetime</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500 text-white shadow-sm font-bold">
                  <Coins className="h-4 w-4" />
                </div>
                <span className="text-2xl font-black tracking-tight text-white">
                  {formatCoins(commissionCoins)}
                </span>
                <span className="text-xs font-semibold text-purple-300">Coins</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-300 font-medium">
                ≈ <span className="text-purple-300 font-bold text-base">{formatInr(commissionInr)}</span>{" "}
                <span className="text-[10px] text-slate-400">From Friends</span>
              </p>
            </div>

            <Link
              href="/wallet?tab=commission"
              prefetch={true}
              className="flex items-center space-x-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/30 hover:brightness-110 active:scale-95 transition-all"
            >
              <span>Withdraw</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px] text-slate-300">
            <span className="text-[10px] text-purple-200">Earned from invited friends&apos; surveys</span>
            <span className="text-[10px] font-bold text-amber-300">Min: ₹100 (1000 Coins)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
