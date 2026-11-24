"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Sparkles,
  Coins,
  Gift,
  Zap,
  Shield,
  ArrowRight,
  Mail,
  Lock,
  User,
  KeyRound,
  CheckCircle2,
  Phone,
  ChevronDown,
  HelpCircle,
  Video,
  Wallet,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"quick" | "existing">("quick");

  // Quick Start Name state
  const [fullName, setFullName] = useState("");
  const [refCode, setRefCode] = useState<string | null>(null);

  // Existing User Login state
  const [identifier, setIdentifier] = useState(""); // Email or Phone
  const [password, setPassword] = useState("");

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is TaskMint and how does it work?",
      a: "TaskMint is India's 100% free micro-rewards web app. You earn virtual coins by completing quick activities like daily check-ins, watching 15-second sponsor ads, and inviting friends. Coins can be redeemed for real UPI cash or free Instagram video views.",
    },
    {
      q: "How to earn real money watching ads on TaskMint?",
      a: "Simply tap 'Watch Ads' on your dashboard. Watch the 15-second sponsor ad, wait for the timer to complete, and claim 1 Coin (+₹0.10) per ad. Combine this with the Daily Check-in (+2 Coins) and refer friends for 1% lifetime commission.",
    },
    {
      q: "How do I get free Instagram views?",
      a: "Go to the Views tab, paste your public Instagram Reel or video URL, select your desired views quantity (1,000 to 50,000 views), and pay using your earned coins. Views are delivered automatically within 1 to 24 hours.",
    },
    {
      q: "Is TaskMint free to join?",
      a: "Yes! TaskMint is 100% free with zero investment. You can join in 5 seconds with just your name, no complex passwords or bank details needed upfront.",
    },
    {
      q: "What is the minimum withdrawal and how to withdraw?",
      a: "The minimum withdrawal is just ₹10 (100 coins). Go to the Wallet section, enter your UPI ID (Google Pay, PhonePe, Paytm), and submit. Payouts are verified and sent directly to your bank account.",
    },
  ];

  useEffect(() => {
    setMounted(true);
    const ref = searchParams.get("ref");
    if (ref) {
      const sanitized = ref.trim().toUpperCase();
      setRefCode(sanitized);
      try {
        localStorage.setItem("taskmint_ref", sanitized);
        document.cookie = `taskmint_ref=${sanitized}; path=/; max-age=604800; SameSite=Lax`;
      } catch (e) {
        console.error("Storage error:", e);
      }
    } else {
      try {
        const stored = localStorage.getItem("taskmint_ref");
        if (stored) setRefCode(stored);
      } catch (e) {
        console.error("Storage error:", e);
      }
    }
  }, [searchParams]);

  // 1. Quick Name-Only Entry
  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = fullName.trim();
    if (!trimmed) {
      setError("Please enter your name to start earning!");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // Attempt Supabase anonymous sign in first
      try {
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously({
          options: {
            data: {
              full_name: trimmed,
              referred_by: refCode || undefined,
            },
          },
        });

        if (!anonError && anonData?.user) {
          // Update full_name in profile if needed
          await supabase
            .from("profiles")
            .update({ full_name: trimmed })
            .eq("id", anonData.user.id);

          window.location.href = "/";
          return;
        }
      } catch {
        // Fallback to quick-login API if anonymous auth not enabled
      }

      // Guaranteed fallback: /api/auth/quick-login creates user & establishes session
      const res = await fetch("/api/auth/quick-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          refCode: refCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start session. Please try again.");
      }

      window.location.href = "/";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Quick login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Existing User Login (Email or Phone + Password)
  const handleExistingLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedIdent = identifier.trim();
    if (!trimmedIdent || !password) {
      setError("Please enter your Email/Phone and Password.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // Check if identifier is an email (contains @)
      let loginEmail = trimmedIdent;
      if (!trimmedIdent.includes("@")) {
        // Look up registered email from phone number
        const cleanPhone = trimmedIdent.replace(/\D/g, "");
        const lookupRes = await fetch("/api/auth/lookup-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanPhone }),
        });
        const lookupData = await lookupRes.json();
        if (lookupData.email) {
          loginEmail = lookupData.email;
        } else {
          setError("No account found with this phone number. Please enter your registered email address.");
          setLoading(false);
          return;
        }
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      window.location.href = "/";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid credentials";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Send Reset Password Email
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!forgotEmail.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${origin}/api/auth/callback?next=/reset-password`,
      });

      if (resetError) throw resetError;

      setForgotSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send reset link";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col justify-between p-6 shadow-xl border-x border-slate-200/60">
      {/* Top Branding */}
      <div className="pt-4">
        <div className="flex items-center justify-center space-x-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/25">
            <Sparkles className="h-7 w-7 fill-white/20" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Task<span className="text-emerald-600">Mint</span>
            </h1>
            <p className="text-xs font-semibold text-slate-500">Paid Surveys & Micro-Tasks</p>
          </div>
        </div>

        {/* Hero Card */}
        <div className="mt-5 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-900 p-5 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center space-x-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-sm mb-2.5">
              <Gift className="h-3.5 w-3.5 text-amber-300" />
              <span>Instant 20 Coins Signup Bonus (₹2.00)</span>
            </div>
            <h2 className="text-lg font-black leading-snug">
              Enter your name &amp; <span className="text-amber-300">start earning instantly</span>.
            </h2>
            <p className="mt-1 text-xs text-emerald-100/90 leading-relaxed">
              No long forms required! Set up your email &amp; password later in settings to withdraw to your UPI ID.
            </p>
          </div>
        </div>

        {/* Referral notice if invited */}
        {mounted && refCode && (
          <div className="mt-3 flex items-center space-x-2 rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900 shadow-sm">
            <Gift className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Invited with code: <strong className="font-mono text-amber-800">{refCode}</strong>. 10 Coins (₹1.00) bonus applied!
            </span>
          </div>
        )}

        {/* Main Tab Switcher */}
        <div className="mt-4 grid grid-cols-2 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("quick");
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${activeTab === "quick"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
              }`}
          >
            🚀 Quick Name Entry
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("existing");
              setError(null);
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${activeTab === "existing"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
              }`}
          >
            🔐 Existing User Login
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-600 font-semibold">
            {error}
          </div>
        )}

        {/* TAB 1: Instant Name-Only Entry */}
        {activeTab === "quick" && (
          <form onSubmit={handleQuickLogin} className="mt-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                What is your Full Name?
              </label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Rohit Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoFocus
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                You can link an email &amp; password anytime from Profile Settings to lock in your wallet.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 px-4 text-xs font-bold shadow-md shadow-emerald-600/25 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Continue / Start Earning</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: Existing User Login */}
        {activeTab === "existing" && (
          <form onSubmit={handleExistingLogin} className="mt-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Email Address or Phone Number
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="yourname@gmail.com or 9876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 text-xs font-bold shadow-md active:scale-[0.98] transition-all cursor-pointer"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to TaskMint</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Feature Highlights */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white p-2.5 border border-slate-200/80 shadow-2xs">
            <Coins className="h-4 w-4 text-amber-500 mx-auto" />
            <p className="text-[10px] font-bold text-slate-800 mt-1">10 Coins = ₹1</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 border border-slate-200/80 shadow-2xs">
            <Zap className="h-4 w-4 text-emerald-600 mx-auto" />
            <p className="text-[10px] font-bold text-slate-800 mt-1">Instant UPI</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 border border-slate-200/80 shadow-2xs">
            <Shield className="h-4 w-4 text-indigo-600 mx-auto" />
            <p className="text-[10px] font-bold text-slate-800 mt-1">CPX Partner</p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Reset Password</h3>
                <p className="text-[10px] text-slate-500">We will email you a secure recovery link</p>
              </div>
            </div>

            {forgotSuccess ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-bold flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Password reset email sent! Please check your inbox and click the link to choose a new password.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(false);
                  }}
                  className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Registered Email
                  </label>
                  <input
                    type="email"
                    placeholder="name@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    {loading ? "Sending..." : "Send Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* How TaskMint Works SEO Section */}
      <div className="mt-8 pt-6 border-t border-slate-200/80 space-y-6">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2">
            <Sparkles className="h-3 w-3" />
            <span>How It Works</span>
          </div>
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Earn Real Cash &amp; Instagram Views in 3 Easy Steps
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Over 50,000+ creators and students use TaskMint daily to earn pocket money and boost their social reach.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="space-y-2.5">
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs">
              1
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Sign Up Instantly for Free</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Enter your name to unlock your dashboard and claim an instant 20 Coins (₹2.00) welcome bonus.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs">
              2
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Watch Ads &amp; Claim Streaks</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Watch 15-second sponsor ads (+1 Coin) and claim the daily streak bonus (+2 Coins) every 24 hours.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs">
              3
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Cash Out via UPI or Get Views</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Withdraw directly to Google Pay, PhonePe, or Paytm UPI (min ₹10), or order real Instagram video views!
              </p>
            </div>
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-100">
            <div className="flex items-center space-x-1.5 text-emerald-700 mb-1">
              <Wallet className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold">Instant UPI Cash</span>
            </div>
            <p className="text-[10px] text-slate-600">
              Direct transfer to GPay, PhonePe, Paytm with low ₹10 threshold.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50/80 to-pink-50/50 border border-purple-100">
            <div className="flex items-center space-x-1.5 text-purple-700 mb-1">
              <Video className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold">Instagram Views</span>
            </div>
            <p className="text-[10px] text-slate-600">
              Boost your Reels with 1,000 to 50,000 real organic video views.
            </p>
          </div>
        </div>

        {/* FAQ Accordion Section for SEO and Google AI Overviews */}
        <div className="pt-2">
          <div className="flex items-center space-x-1.5 mb-3">
            <HelpCircle className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-black text-slate-900 tracking-tight">
              Frequently Asked Questions (FAQ)
            </h2>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/90 bg-white overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-3 flex items-center justify-between text-xs font-bold text-slate-800 hover:text-emerald-700 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-emerald-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 pt-0 text-[11px] text-slate-600 leading-relaxed border-t border-slate-100 mt-1">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200/80 flex items-center justify-around text-center">
          <div>
            <p className="text-xs font-black text-slate-900">100% Free</p>
            <p className="text-[9px] text-slate-500 font-medium">No Investment</p>
          </div>
          <div className="h-6 w-px bg-slate-300/80" />
          <div>
            <p className="text-xs font-black text-emerald-700">Instant UPI</p>
            <p className="text-[9px] text-slate-500 font-medium">Real Payouts</p>
          </div>
          <div className="h-6 w-px bg-slate-300/80" />
          <div>
            <p className="text-xs font-black text-purple-700">Real Views</p>
            <p className="text-[9px] text-slate-500 font-medium">SMM API</p>
          </div>
        </div>
      </div>

      {/* Bottom Legal links */}
      <div className="pt-4 pb-2 text-center text-[10px] text-slate-500 leading-normal">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="text-emerald-700 underline font-medium hover:text-emerald-800">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-emerald-700 underline font-medium hover:text-emerald-800">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md mx-auto min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="flex flex-col items-center space-y-3">
            <div className="h-8 w-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading TaskMint...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
