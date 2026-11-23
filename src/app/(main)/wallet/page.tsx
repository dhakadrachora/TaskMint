"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Users,
  Lock,
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

function WalletContent() {
  const searchParams = useSearchParams();
  const { profile, refreshProfile, updateCoinsLocal, updateCommissionCoinsLocal } = useProfile();

  // Dual-wallet selector for withdrawal: 'earning' | 'commission'
  const [walletToWithdraw, setWalletToWithdraw] = useState<"earning" | "commission">("earning");

  const [upiId, setUpiId] = useState("");
  const [selectedCoins, setSelectedCoins] = useState<number>(500);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [activeTab, setActiveTab] = useState<"withdrawals" | "earnings">("withdrawals");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasPriorWithdrawals, setHasPriorWithdrawals] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const earningCoins = profile?.coins ?? 0;
  const commissionCoins = profile?.commission_coins ?? 0;

  const earningInr = coinsToInr(earningCoins);
  const commissionInr = coinsToInr(commissionCoins);

  // Load URL query param for default tab
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "commission") {
      setWalletToWithdraw("commission");
      setSelectedCoins(1000);
    }
  }, [searchParams]);

  // Load history
  const loadHistory = async () => {
    try {
      const res = await fetch("/api/wallet/history");
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
        setTransactions(data.transactions || []);
        setHasPriorWithdrawals(Boolean(data.hasPriorWithdrawals));

        if (walletToWithdraw === "earning" && data.hasPriorWithdrawals && selectedCoins < 1000) {
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

  // When switching wallet tab, adjust selected preset
  const handleWalletTabSwitch = (target: "earning" | "commission") => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(25);
    }
    setWalletToWithdraw(target);
    setMessage(null);
    if (target === "commission") {
      setSelectedCoins(1000);
    } else {
      setSelectedCoins(hasPriorWithdrawals ? 1000 : 500);
    }
  };

  const handleSelectCoins = (coins: number) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }
    setSelectedCoins(coins);
  };

  const isCommission = walletToWithdraw === "commission";
  const activeCoins = isCommission ? commissionCoins : earningCoins;
  const minRequired = isCommission ? 1000 : hasPriorWithdrawals ? 1000 : 500;
  const minInr = isCommission ? 100 : hasPriorWithdrawals ? 100 : 50;
  const isCommissionLocked = isCommission && commissionCoins < 1000;
  const commissionProgress = Math.min(100, Math.round((commissionCoins / 1000) * 100));

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (isCommissionLocked) {
      setMessage({
        type: "error",
        text: `Commission withdrawal unlocks at 1,000 Coins (₹100). You need ${1000 - commissionCoins} more coins.`,
      });
      return;
    }

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

    if (activeCoins < selectedCoins) {
      setMessage({
        type: "error",
        text: `Insufficient coins in your ${isCommission ? "Commission" : "Earning"} Wallet. You have ${formatCoins(activeCoins)} Coins, but requested ${formatCoins(selectedCoins)} Coins.`,
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
          walletType: walletToWithdraw,
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
          text: `🎉 Withdrawal of ${formatInr(coinsToInr(selectedCoins))} requested from ${isCommission ? "Commission" : "Earning"} Wallet! Payout will be processed to ${upiId.trim()}.`,
        });

        if (isCommission) {
          updateCommissionCoinsLocal(-selectedCoins);
        } else {
          updateCoinsLocal(-selectedCoins);
        }

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
      {/* Dual-Wallet Balances Overview */}
      <div className="grid grid-cols-2 gap-3">
        {/* Wallet 1: Self-Earning Balance */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-4 text-white shadow-md border border-emerald-500/20 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-500/15 blur-lg pointer-events-none" />
          <div className="relative z-10 space-y-1.5">
            <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Earning Wallet</span>
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-white">{formatCoins(earningCoins)}</span>
              <span className="text-[10px] font-bold text-amber-400">Coins</span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              ≈ <strong className="text-emerald-400">{formatInr(earningInr)}</strong>
            </p>
            <p className="text-[9px] text-slate-400 pt-0.5">Tasks &amp; Check-ins</p>
          </div>
        </div>

        {/* Wallet 2: Commission Balance */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-4 text-white shadow-md border border-purple-500/20 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-purple-500/15 blur-lg pointer-events-none" />
          <div className="relative z-10 space-y-1.5">
            <div className="flex items-center space-x-1 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
              <Users className="h-3 w-3 text-purple-400" />
              <span>Commission</span>
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-white">{formatCoins(commissionCoins)}</span>
              <span className="text-[10px] font-bold text-purple-300">Coins</span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              ≈ <strong className="text-purple-300">{formatInr(commissionInr)}</strong>
            </p>
            <p className="text-[9px] text-purple-200/70 pt-0.5">1% Friends Commission</p>
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

      {/* Withdrawal Form Card with Wallet Chooser */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm space-y-4">
        {/* Wallet Selection Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Choose Wallet to Withdraw From
          </label>
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => handleWalletTabSwitch("earning")}
              className={`py-2.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                walletToWithdraw === "earning"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Earning Wallet</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-black">
                ₹{earningInr}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleWalletTabSwitch("commission")}
              className={`py-2.5 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                walletToWithdraw === "commission"
                  ? "bg-white text-purple-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Commission</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-black">
                ₹{commissionInr}
              </span>
            </button>
          </div>
        </div>

        {/* Header Rule Indicator */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                isCommission ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">
                Redeem {isCommission ? "Commission" : "Earning"} Balance to UPI
              </h3>
              <p className="text-[10px] text-slate-500">
                {isCommission
                  ? "100% of your referral commission directly to bank"
                  : "Self-earned coins via tasks & check-ins"}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
            Min: {minRequired} Coins ({formatInr(minInr)})
          </span>
        </div>

        {/* Message Banner */}
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

        {/* Commission Locked View */}
        {isCommissionLocked && (
          <div className="rounded-xl bg-purple-50 border border-purple-200/80 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-purple-950">
                <Lock className="h-4 w-4 text-purple-600" />
                <span>Commission Withdrawal Locked</span>
              </div>
              <span className="text-xs font-black text-purple-700 font-mono">
                {commissionProgress}% Complete
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-purple-200/70 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${commissionProgress}%` }}
              />
            </div>

            <p className="text-[11px] text-purple-900 leading-relaxed">
              Commission withdrawal unlocks when you reach <strong className="text-purple-950">1,000 Coins (₹100)</strong>. You have <strong>{commissionCoins} Coins</strong> and need <strong className="text-purple-700 font-bold">{1000 - commissionCoins} more Coins</strong>.
            </p>

            <Link
              href="/refer"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-purple-800 bg-white border border-purple-300 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-purple-100 transition-colors"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Invite Friends to Reach ₹100 Faster →</span>
            </Link>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleWithdraw} className="space-y-4">
          {/* Preset amount selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Payout Amount
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(isCommission
                ? [
                    { coins: 1000, inr: 100, disabled: isCommissionLocked },
                    { coins: 2500, inr: 250, disabled: isCommissionLocked },
                    { coins: 5000, inr: 500, disabled: isCommissionLocked },
                  ]
                : [
                    { coins: 500, inr: 50, disabled: hasPriorWithdrawals },
                    { coins: 1000, inr: 100, disabled: false },
                    { coins: 2500, inr: 250, disabled: false },
                  ]
              ).map((opt) => {
                const isSelected = selectedCoins === opt.coins;
                return (
                  <button
                    key={opt.coins}
                    type="button"
                    onClick={() => !opt.disabled && handleSelectCoins(opt.coins)}
                    disabled={opt.disabled}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center cursor-pointer ${
                      opt.disabled
                        ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed opacity-50"
                        : isSelected
                        ? isCommission
                          ? "bg-purple-50 border-purple-500 text-purple-900 shadow-sm ring-1 ring-purple-500"
                          : "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm ring-1 ring-emerald-500"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xs font-black">₹{opt.inr}</span>
                    <span
                      className={`text-[10px] font-bold mt-0.5 ${
                        isCommission ? "text-purple-600" : "text-amber-600"
                      }`}
                    >
                      {opt.coins} Coins
                    </span>
                    {opt.disabled && !isCommission && (
                      <span className="text-[8px] text-slate-400 mt-0.5">1st payout only</span>
                    )}
                  </button>
                );
              })}
            </div>
            {!isCommission && hasPriorWithdrawals && (
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
              Supports Google Pay, PhonePe, Paytm, BHIM &amp; all Indian Bank UPIs.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || activeCoins < selectedCoins || isCommissionLocked}
            className={`w-full flex items-center justify-center space-x-2 rounded-xl py-3.5 px-4 text-xs font-bold shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              isCommission
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-600/25"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/25"
            }`}
          >
            {submitting ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isCommissionLocked ? (
              <>
                <Lock className="h-4 w-4" />
                <span>Locked (Requires ₹100 / 1000 Coins)</span>
              </>
            ) : (
              <>
                <ArrowUpRight className="h-4 w-4" />
                <span>
                  Withdraw {formatInr(coinsToInr(selectedCoins))} ({selectedCoins} Coins) from{" "}
                  {isCommission ? "Commission" : "Earning"}
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
            Transactions ({transactions.length})
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
                          {w.wallet_type === "commission" ? (
                            <span className="bg-purple-100 text-purple-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                              Commission
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                              Earning
                            </span>
                          )}
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
                  referral: "1% Referral Commission",
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

export default function WalletPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
          <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Loading Wallet...</p>
        </div>
      }
    >
      <WalletContent />
    </Suspense>
  );
}
