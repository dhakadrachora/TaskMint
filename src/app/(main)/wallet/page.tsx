"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useProfile } from "@/context/ProfileContext";
import {
  Wallet,
  Coins,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ArrowDownLeft,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import {
  formatCoins,
  coinsToInr,
  formatInr,
  validateUpiId,
  timeAgo,
} from "@/lib/utils";
import { Withdrawal, Transaction } from "@/lib/types";
import confetti from "canvas-confetti";

export default function WalletPage() {
  const { profile, refreshProfile, updateCoinsLocal } = useProfile();

  const [upiId, setUpiId] = useState("");
  const [selectedCoins, setSelectedCoins] = useState<number>(500);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [activeTab, setActiveTab] = useState<"withdrawals" | "earnings">("withdrawals");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasPriorWithdrawals, setHasPriorWithdrawals] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const currentCoins = profile?.coins ?? 0;
  const inrBalance = coinsToInr(currentCoins);

  // Load history
  const loadHistory = async () => {
    try {
      const res = await fetch("/api/wallet/history");
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
        setTransactions(data.transactions || []);
        setHasPriorWithdrawals(Boolean(data.hasPriorWithdrawals));

        // Adjust selected preset if first time is 500, but subsequent is 1000
        if (data.hasPriorWithdrawals && selectedCoins < 1000) {
          setSelectedCoins(1000);
        }
      }
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const minRequired = hasPriorWithdrawals ? 1000 : 500;
  const minInr = hasPriorWithdrawals ? 100 : 50;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!upiId.trim()) {
      setMessage({ type: "error", text: "Please enter your UPI ID." });
      return;
    }

    if (!validateUpiId(upiId)) {
      setMessage({
        type: "error",
        text: "Invalid UPI ID format. Expected format: username@bank or mobile@upi",
      });
      return;
    }

    if (currentCoins < selectedCoins) {
      setMessage({
        type: "error",
        text: `Insufficient coins. You have ${formatCoins(currentCoins)} Coins, but requested ${formatCoins(selectedCoins)} Coins.`,
      });
      return;
    }

    if (selectedCoins < minRequired) {
      setMessage({
        type: "error",
        text: `Minimum withdrawal amount is ${minRequired} Coins (${formatInr(minInr)}).`,
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upiId: upiId.trim(),
          coins: selectedCoins,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#10B981", "#3B82F6", "#F59E0B"],
          });
        } catch {
          // confetti fallback
        }

        setMessage({
          type: "success",
          text: `🎉 Withdrawal of ${formatInr(coinsToInr(selectedCoins))} requested! Payout will be processed to ${upiId.trim()}.`,
        });

        updateCoinsLocal(-selectedCoins);
        await refreshProfile();
        await loadHistory();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Withdrawal request failed. Please try again.",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Network error occurred. Please check your connection.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Balance Summary Header */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-5 text-white shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Withdrawable Balance
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-black text-white">
                {formatCoins(currentCoins)}
              </span>
              <span className="text-xs font-bold text-amber-400">Coins</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              ≈ <strong className="text-emerald-400 font-bold text-base">{formatInr(inrBalance)}</strong> Real Cash
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Wallet className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Account Security Notice Badge before withdrawal */}
      {(!profile?.email || profile.email.includes("@taskmint.app") || profile.email.includes("@anonymous.supabase.co")) && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200/90 p-3.5 text-xs text-amber-900 shadow-xs flex items-start justify-between space-x-2">
          <div className="flex items-start space-x-2.5">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">Security Notice: Unlinked Account</p>
              <p className="text-[11px] text-amber-800 leading-normal mt-0.5">
                Link an Email &amp; Password in Settings so your coins and withdrawal receipts remain permanently secure.
              </p>
            </div>
          </div>
          <Link
            href="/profile"
            className="shrink-0 bg-amber-200/80 hover:bg-amber-200 text-amber-950 px-2.5 py-1 rounded-lg font-bold text-[10px] transition-colors"
          >
            Settings →
          </Link>
        </div>
      )}

      {/* Withdrawal Form Card */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-black text-slate-900">Redeem to UPI</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2.5 py-0.5 rounded-full">
            Min: {minRequired} Coins ({formatInr(minInr)})
          </span>
        </div>

        {message && (
          <div
            className={`rounded-xl p-3 text-xs font-semibold flex items-start space-x-2 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleWithdraw} className="space-y-4">
          {/* Preset amount selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Payout Amount
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { coins: 500, inr: 50, disabled: hasPriorWithdrawals },
                { coins: 1000, inr: 100, disabled: false },
                { coins: 2500, inr: 250, disabled: false },
              ].map((opt) => {
                const isSelected = selectedCoins === opt.coins;
                return (
                  <button
                    key={opt.coins}
                    type="button"
                    onClick={() => !opt.disabled && setSelectedCoins(opt.coins)}
                    disabled={opt.disabled}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center cursor-pointer ${
                      opt.disabled
                        ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed opacity-50"
                        : isSelected
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm ring-1 ring-emerald-500"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xs font-black">₹{opt.inr}</span>
                    <span className="text-[10px] font-bold text-amber-600 mt-0.5">
                      {opt.coins} Coins
                    </span>
                    {opt.disabled && (
                      <span className="text-[8px] text-slate-400 mt-0.5">1st payout only</span>
                    )}
                  </button>
                );
              })}
            </div>
            {hasPriorWithdrawals && (
              <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                First withdrawal was unlocked at ₹50. Subsequent minimum is ₹100 (1000 Coins).
              </p>
            )}
          </div>

          {/* UPI ID input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              UPI Address / VPA
            </label>
            <div className="relative">
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. yourname@oksbi or 9876543210@paytm"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Supports Google Pay, PhonePe, Paytm, BHIM & all Indian Bank UPIs.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || currentCoins < selectedCoins}
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3.5 px-4 text-xs font-bold shadow-md shadow-emerald-600/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ArrowUpRight className="h-4 w-4" />
                <span>
                  Withdraw {formatInr(coinsToInr(selectedCoins))} ({selectedCoins} Coins)
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* History Tabs Card */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-sm">
        {/* Tab Headers */}
        <div className="grid grid-cols-2 border-b border-slate-200/90 text-center text-xs font-bold">
          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`py-3 transition-colors ${
              activeTab === "withdrawals"
                ? "text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/40"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Withdrawals ({withdrawals.length})
          </button>
          <button
            onClick={() => setActiveTab("earnings")}
            className={`py-3 transition-colors ${
              activeTab === "earnings"
                ? "text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/40"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Earnings ({transactions.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4">
          {loadingHistory ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <div className="h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading transaction history...</p>
            </div>
          ) : activeTab === "withdrawals" ? (
            withdrawals.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {withdrawals.map((w) => {
                  const statusColors = {
                    pending: "bg-amber-100 text-amber-800 border-amber-200",
                    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
                    rejected: "bg-red-100 text-red-800 border-red-200",
                  };

                  const StatusIcon = {
                    pending: Clock,
                    paid: CheckCircle2,
                    rejected: XCircle,
                  }[w.status];

                  return (
                    <div key={w.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-900">
                            ₹{w.amount_inr}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            ({w.coins} Coins)
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          UPI: {w.upi_id}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {timeAgo(w.created_at)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-flex items-center space-x-1 rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${
                            statusColors[w.status]
                          }`}
                        >
                          <StatusIcon className="h-2.5 w-2.5" />
                          <span>{w.status}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <Wallet className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium text-slate-600">No withdrawals yet</p>
                <p className="text-[11px] text-slate-400">
                  Earn at least 500 Coins to make your first withdrawal!
                </p>
              </div>
            )
          ) : transactions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => {
                const isPositive = tx.amount_coins > 0;
                const typeLabels: Record<string, string> = {
                  survey: "CPX Paid Survey",
                  checkin: "Daily Check-in Bonus",
                  referral: "Referral Commission",
                  signup_bonus: "Welcome Signup Bonus",
                  withdrawal: "UPI Withdrawal",
                  refund: "Withdrawal Refund",
                };

                return (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isPositive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {typeLabels[tx.type] || tx.type}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {timeAgo(tx.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold font-mono ${
                          isPositive ? "text-emerald-600" : "text-slate-800"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {formatCoins(tx.amount_coins)} Coins
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {isPositive ? "+" : ""}
                        {formatInr(coinsToInr(Math.abs(tx.amount_coins)))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 space-y-1">
              <Coins className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium text-slate-600">No earnings recorded yet</p>
              <p className="text-[11px] text-slate-400">
                Complete surveys and daily check-ins to view activity.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
