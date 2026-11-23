import React from "react";
import Link from "next/link";
import { Coins, ArrowUpRight, TrendingUp, ShieldCheck } from "lucide-react";
import { formatCoins, coinsToInr, formatInr } from "@/lib/utils";

interface WalletCardProps {
  coins: number;
  userName?: string | null;
}

export function WalletCard({ coins }: WalletCardProps) {
  const inrValue = coinsToInr(coins);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-5 text-white shadow-xl glowing-wallet-card border border-emerald-500/20">
      {/* Decorative background glow & circles */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between space-y-4">
        {/* Top row: Label & Security badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Available Balance</span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>100 Coins = ₹10</span>
          </div>
        </div>

        {/* Center: Total Coins and INR value */}
        <div className="flex items-baseline justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-md">
                <Coins className="h-5 w-5" />
              </div>
              <span className="text-3xl font-extrabold tracking-tight text-white">
                {formatCoins(coins)}
              </span>
              <span className="text-sm font-medium text-amber-400">Coins</span>
            </div>
            <p className="mt-1 text-sm text-slate-300 flex items-center gap-1 font-medium">
              ≈ <span className="text-emerald-400 font-bold text-lg">{formatInr(inrValue)}</span>
              <span className="text-xs text-slate-400">Real Cash Value</span>
            </p>
          </div>

          {/* Quick Withdraw CTA */}
          <Link
            href="/wallet"
            className="flex items-center space-x-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 hover:brightness-110 active:scale-95 transition-all"
          >
            <span>Withdraw</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Bottom micro-info */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-300">
          <div className="flex items-center space-x-1 text-emerald-300 font-medium">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span>Instant UPI Payouts</span>
          </div>
          <span className="text-[11px] text-slate-400">Min: ₹50 (500 Coins)</span>
        </div>
      </div>
    </div>
  );
}
