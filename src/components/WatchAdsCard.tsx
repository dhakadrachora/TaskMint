"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Sparkles,
  Coins,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  ShieldAlert,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useProfile } from "@/context/ProfileContext";

export function WatchAdsCard() {
  const { refreshProfile, updateCoinsLocal } = useProfile();

  const adUrl =
    process.env.NEXT_PUBLIC_ADSTERRA_SMARTLINK_URL ||
    "https://araplhn.org/4/8a33c77b2b1a00b4079fd7d7cd362a2a";

  // State
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const [adStartedAt, setAdStartedAt] = useState<number | null>(null);

  // Start watching ad with anti-bypass tracking
  const handleStartWatch = () => {
    const now = Date.now();
    setAdStartedAt(now);

    // Open Adsterra Smartlink in a new tab
    if (typeof window !== "undefined") {
      window.open(adUrl, "_blank", "noopener,noreferrer");
    }

    // Open timer modal
    setAdModalOpen(true);
    setCountdown(15);
    setCanClaim(false);
  };

  // 15 seconds strict countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (adModalOpen && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (adModalOpen && countdown === 0) {
      setCanClaim(true);
    }
    return () => clearTimeout(timer);
  }, [adModalOpen, countdown]);

  // Claim reward
  const handleClaim = async () => {
    if (!canClaim || claiming || !adStartedAt) return;

    // Verify minimum 14.5 seconds on client
    if (Date.now() - adStartedAt < 14500) {
      setToastMessage("⚠️ Ad view incomplete! Please view for full 15 seconds.");
      return;
    }

    setClaiming(true);

    // 1. Instant Optimistic UI (+1 Coin) & Confetti
    updateCoinsLocal(1);
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#F59E0B", "#10B981", "#3B82F6"],
      });
    } catch {
      // Ignored
    }

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([40, 60]);
    }

    setToastMessage("🎉 +1 Coin Added!");
    setAdModalOpen(false);

    try {
      const res = await fetch("/api/ads/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startedAt: adStartedAt,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setRemainingToday(data.remainingToday);
        await refreshProfile();
      } else {
        // Rollback on rejection (e.g. daily limit, cooldown or bypass)
        updateCoinsLocal(-1);
        setToastMessage(data.error || "Claim failed");
        await refreshProfile();
      }
    } catch {
      setToastMessage("Network error. Please try again.");
    } finally {
      setClaiming(false);
      setAdStartedAt(null);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const progressPercent = Math.min(100, Math.round(((15 - countdown) / 15) * 100));

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto rounded-2xl bg-slate-900 text-white text-center py-3 px-4 text-xs font-bold shadow-xl border border-amber-400/40 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Main Watch Ads Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950/60 p-4 text-white shadow-lg border border-amber-500/30">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between space-y-3">
          {/* Card Top Label */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              <Flame className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>Sponsored Cash Ads</span>
            </div>
            <div className="flex items-center space-x-1 text-[10px] text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>+1 Coin (₹0.10) Per Ad</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Watch Ads &amp; Earn</span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/20 px-1.5 py-0.2 rounded">
                  Active
                </span>
              </h3>
              <p className="mt-0.5 text-xs text-slate-300 font-medium">
                View 15-second sponsor ads completely to claim coins!
              </p>
            </div>

            <button
              onClick={handleStartWatch}
              className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black px-4 py-2.5 text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="h-4 w-4 fill-slate-950" />
              <span>Watch Ad</span>
            </button>
          </div>

          {/* Bottom Info bar */}
          <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px] text-slate-300">
            <div className="flex items-center space-x-1 text-emerald-400">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Instant UPI Payouts</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {remainingToday !== null ? `${remainingToday} Ads left today` : "Up to 30 Ads daily"}
            </span>
          </div>
        </div>
      </div>

      {/* 15-Second Ad Timer Modal with Anti-Bypass */}
      {adModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl text-center space-y-4 border border-slate-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mx-auto shadow-xs">
              <Play className="h-6 w-6 fill-amber-600" />
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900">
                {canClaim ? "🎉 Ad View Complete!" : "Viewing Sponsored Ad..."}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {canClaim
                  ? "Your 15-second ad view is verified! Click Claim to add +1 Coin to your balance."
                  : "The sponsor ad is open in another tab. Please keep this screen open for full 15 seconds to receive your coin."}
              </p>
            </div>

            {/* Countdown Display & Progress Bar */}
            {!canClaim ? (
              <div className="space-y-2 py-2">
                <div className="flex items-center justify-center space-x-2 text-2xl font-black font-mono text-slate-900">
                  <Clock className="h-5 w-5 text-amber-500 animate-spin" />
                  <span>{countdown}s</span>
                </div>

                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <p className="text-[10px] text-amber-700 font-bold flex items-center justify-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> Do not close or bypass the ad!
                </p>
              </div>
            ) : null}

            {/* Claim or Cancel Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleClaim}
                disabled={!canClaim || claiming}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  canClaim
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/25 active:scale-95 animate-pulse"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Coins className="h-4 w-4" />
                <span>
                  {claiming
                    ? "Adding Coin..."
                    : canClaim
                    ? "Claim +1 Coin (₹0.10) Now!"
                    : `Please wait ${countdown}s...`}
                </span>
              </button>

              <button
                onClick={() => {
                  setAdModalOpen(false);
                  setAdStartedAt(null);
                }}
                className="w-full py-2 text-[11px] font-bold text-slate-400 hover:text-slate-600"
              >
                Close / Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
