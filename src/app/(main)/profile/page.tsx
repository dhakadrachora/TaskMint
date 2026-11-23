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
  Phone,
  ShieldCheck,
  ShieldAlert,
  Save,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { formatCoins, coinsToInr, formatInr } from "@/lib/utils";

interface StatsData {
  surveysCompleted: number;
  totalEarnedCoins: number;
}

export default function ProfilePage() {
  const { profile, refreshProfile } = useProfile();
  const router = useRouter();

  const [stats, setStats] = useState<StatsData>({
    surveysCompleted: 0,
    totalEarnedCoins: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Account Settings Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isGuestAccount =
    !profile?.email ||
    profile.email.includes("@taskmint.app") ||
    profile.email.includes("@anonymous.supabase.co");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setEmail(
        profile.email && !profile.email.includes("@taskmint.app")
          ? profile.email
          : ""
      );
      setPhone(profile.phone || "");
    }
  }, [profile]);

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

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage(null);

    if (newPassword && newPassword.length < 6) {
      setSettingsMessage({
        type: "error",
        text: "New password must be at least 6 characters long.",
      });
      return;
    }

    setSavingSettings(true);
    try {
      const res = await fetch("/api/profile/update-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          newPassword: newPassword.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSettingsMessage({
          type: "success",
          text: "🎉 Account settings saved! Your account is now permanent & secured.",
        });
        setNewPassword("");
        await refreshProfile();
      } else {
        setSettingsMessage({
          type: "error",
          text: data.error || "Failed to update account settings.",
        });
      }
    } catch {
      setSettingsMessage({
        type: "error",
        text: "Network error. Please try again.",
      });
    } finally {
      setSavingSettings(false);
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
              <span>
                {isGuestAccount ? "Quick Entry Account" : profile?.email}
              </span>
            </p>

            <div className="mt-1 flex items-center space-x-1.5">
              {isGuestAccount ? (
                <span className="inline-flex items-center space-x-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-bold px-2 py-0.2">
                  <ShieldAlert className="h-2.5 w-2.5 text-amber-600" />
                  <span>Unprotected Account</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-bold px-2 py-0.2">
                  <ShieldCheck className="h-2.5 w-2.5 text-emerald-600" />
                  <span>Account Secured</span>
                </span>
              )}
            </div>
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

      {/* Account & Security Settings Card */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Account &amp; Security Settings
              </h3>
              <p className="text-[10px] text-slate-500">
                Link email &amp; password to lock in your earnings
              </p>
            </div>
          </div>

          {isGuestAccount && (
            <span className="rounded-full bg-amber-100 text-amber-900 text-[9px] font-bold px-2 py-0.5">
              Action Required
            </span>
          )}
        </div>

        {isGuestAccount && (
          <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              Secure your account before withdrawing!
            </p>
            <p className="text-[11px] text-amber-800 mt-1">
              Add your Email, Phone &amp; set a Password below. Your <strong>{formatCoins(profile?.coins ?? 0)} Coins</strong> and referral links will permanently transfer to this login.
            </p>
          </div>
        )}

        {settingsMessage && (
          <div
            className={`rounded-xl p-3 text-xs font-bold flex items-start space-x-2 ${
              settingsMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {settingsMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <span>{settingsMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateSettings} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your Full Name"
                required
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                required={isGuestAccount}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Used to log in from other devices or recover account.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isGuestAccount ? "Set Password" : "Change Password (optional)"}
            </label>
            <div className="relative">
              <Lock className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={isGuestAccount ? "Create password (min 6 chars)" : "Leave blank to keep current"}
                required={isGuestAccount}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
          >
            {savingSettings ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save &amp; Protect Account</span>
              </>
            )}
          </button>
        </form>
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
              <p className="text-[10px] text-indigo-200">Review pending payouts &amp; user stats</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-indigo-300" />
        </Link>
      )}

      {/* Support & Community Section */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Help &amp; Community
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
              <p className="text-[10px] text-slate-500">Fast help for survey credits &amp; UPI queries</p>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 text-[#229ED9]" />
        </a>
      </div>

      {/* Legal & Policy Links */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-1">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
          Legal &amp; Compliance
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
            <span>Terms of Service &amp; Rules</span>
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
