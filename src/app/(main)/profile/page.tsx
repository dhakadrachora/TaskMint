"use client";

import React, { useState, useEffect } from "react";
import { useProfile } from "@/context/ProfileContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Gift,
  Copy,
  Check,
  Trophy,
  Coins,
  Shield,
  FileText,
  Lock,
  Send,
  LogOut,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { formatCoins, coinsToInr, formatInr } from "@/lib/utils";

interface StatsData {
  surveysCompleted: number;
  totalEarnedCoins: number;
}

export default function ProfilePage() {
  const { profile } = useProfile();
  const router = useRouter();

  const [stats, setStats] = useState<StatsData>({
    surveysCompleted: 0,
    totalEarnedCoins: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/profile/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load profile stats", err);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  const handleCopyCode = async () => {
    if (!profile?.referral_code) return;
    try {
      await navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
      setLoggingOut(false);
    }
  };

  const telegramUrl =
    process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT_URL || "https://t.me/taskmint_support";

  return (
    <div className="space-y-4">
      {/* Profile Header Card */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 border-2 border-emerald-500/40 overflow-hidden text-slate-600 shadow-xs shrink-0">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.full_name || "User Avatar"}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-slate-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <h2 className="text-base font-black text-slate-900 truncate">
                {profile?.full_name || "TaskMint Earner"}
              </h2>
              {profile?.is_admin && (
                <span className="rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
              <Mail className="h-3 w-3 text-slate-400 shrink-0" />
              <span>{profile?.email || "Connected with Google"}</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "2025"}
            </p>
          </div>
        </div>

        {/* Referral Code Box */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-2.5">
          <div className="flex items-center space-x-2">
            <Gift className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-700">Referral Code:</span>
            <span className="font-mono text-xs font-black text-emerald-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              {profile?.referral_code || "..."}
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
            <Trophy className="h-4 w-4 text-emerald-600" />
            <span>Surveys Completed</span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {loadingStats ? "..." : stats.surveysCompleted}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Verified surveys completed</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-medium">
            <Coins className="h-4 w-4 text-amber-500" />
            <span>Total Earned</span>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {loadingStats ? "..." : formatCoins(stats.totalEarnedCoins)}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
            ≈ {formatInr(coinsToInr(stats.totalEarnedCoins))} Real Cash
          </p>
        </div>
      </div>

      {/* Admin Panel Quick Link (If Admin) */}
      {profile?.is_admin && (
        <Link
          href="/admin"
          className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-4 text-white shadow-md hover:brightness-105 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Admin Management Panel</p>
              <p className="text-[10px] text-indigo-200">Review pending payouts & user stats</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-indigo-300" />
        </Link>
      )}

      {/* Support & Community Section */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Help & Community
        </h3>

        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl bg-[#229ED9]/10 hover:bg-[#229ED9]/15 border border-[#229ED9]/30 p-3 text-slate-800 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#229ED9] text-white shadow-sm">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Official Telegram Support</p>
              <p className="text-[10px] text-slate-500">Fast help for survey credits & UPI queries</p>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 text-[#229ED9]" />
        </a>
      </div>

      {/* Legal & Policy Links (Critical for CPX approval) */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-1">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
          Legal & Compliance
        </h3>

        <Link
          href="/privacy"
          className="flex items-center justify-between py-2.5 px-1 hover:text-emerald-700 text-slate-700 text-xs font-medium border-b border-slate-100 transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            <Lock className="h-4 w-4 text-slate-400" />
            <span>Privacy Policy</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </Link>

        <Link
          href="/terms"
          className="flex items-center justify-between py-2.5 px-1 hover:text-emerald-700 text-slate-700 text-xs font-medium transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            <FileText className="h-4 w-4 text-slate-400" />
            <span>Terms of Service & Rules</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </Link>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full flex items-center justify-center space-x-2 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-red-600 py-3 px-4 text-xs font-bold shadow-xs transition-colors active:scale-[0.99] cursor-pointer"
      >
        {loggingOut ? (
          <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <LogOut className="h-4 w-4" />
            <span>Sign Out of TaskMint</span>
          </>
        )}
      </button>
    </div>
  );
}
