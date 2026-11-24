"use client";

import React, { useState, useEffect } from "react";
import { CalendarCheck, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { useProfile } from "@/context/ProfileContext";

export function DailyCheckInCard() {
  const { profile, refreshProfile, updateCoinsLocal } = useProfile();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.last_checkin) {
      setIsAvailable(true);
      setCountdown(null);
      return;
    }

    const checkAvailability = () => {
      const last = new Date(profile.last_checkin!).getTime();
      const now = Date.now();
      const diff = now - last;
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (diff >= twentyFourHours) {
        setIsAvailable(true);
        setCountdown(null);
      } else {
        setIsAvailable(false);
        const remaining = twentyFourHours - diff;
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        setCountdown(
          `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
        );
      }
    };

    checkAvailability();
    const interval = setInterval(checkAvailability, 1000);
    return () => clearInterval(interval);
  }, [profile?.last_checkin]);

  const handleClaim = async () => {
    if (!isAvailable || loading) return;

    // Open sponsored Adsterra Smartlink to monetize check-in view
    const adUrl =
      process.env.NEXT_PUBLIC_ADSTERRA_SMARTLINK_URL ||
      "https://araplhn.org/4/8a33c77b2b1a00b4079fd7d7cd362a2a";
    if (typeof window !== "undefined") {
      window.open(adUrl, "_blank", "noopener,noreferrer");
    }

    // 0ms Optimistic UI Response (+2 Coins)
    setIsAvailable(false);
    updateCoinsLocal(2);
    setToastMessage("🎉 +2 Coins Added!");
    setTimeout(() => setToastMessage(null), 3500);

    // Instant confetti micro-interaction
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#10B981", "#F59E0B", "#3B82F6"],
      });
    } catch {
      // Ignored if confetti fails
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        await refreshProfile();
      } else {
        // Rollback on rejection
        updateCoinsLocal(-2);
        setIsAvailable(true);
        setToastMessage(data.error || "Claim failed. Please try again.");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch {
      // Rollback on network failure
      updateCoinsLocal(-2);
      setIsAvailable(true);
      setToastMessage("Network error, please check connection");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm">
      {toastMessage && (
        <div className="absolute top-2 left-4 right-4 z-20 rounded-xl bg-emerald-600 text-white text-center py-2 px-3 text-xs font-bold shadow-md animate-bounce">
          {toastMessage}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-extrabold text-slate-900 text-sm">Daily Check-In</h3>
              <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5">
                +2 Coins (₹0.20)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Claim daily streak rewards every 24 hours
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
        {isAvailable ? (
          <div className="flex items-center space-x-1 text-xs text-emerald-600 font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            <span>Ready to claim today&apos;s bonus!</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Next in: <strong className="font-mono text-slate-700">{countdown}</strong></span>
          </div>
        )}

        <button
          onClick={handleClaim}
          disabled={!isAvailable || loading}
          className={`flex items-center space-x-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${
            isAvailable
              ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-amber-500/25"
              : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/60"
          }`}
        >
          {loading ? (
            <div className="h-3.5 w-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          ) : isAvailable ? (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Claim +2</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
              <span>Claimed</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
