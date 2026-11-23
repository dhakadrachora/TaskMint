"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sparkles, Coins, Gift, Zap, Shield, ArrowRight, Mail, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const origin = window.location.origin;
      const referral = refCode ? `?ref=${encodeURIComponent(refCode)}` : "";
      const redirectTo = `${origin}/api/auth/callback${referral}`;

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (signInError) {
        throw signInError;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to initiate login";
      setError(message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in email and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              referred_by: refCode || undefined,
              full_name: email.split("@")[0],
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setError("Account created! Please check your email or sign in.");
          setLoading(false);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;

        router.push("/");
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col justify-between p-6 shadow-xl border-x border-slate-200/60">
      {/* Top Branding */}
      <div className="pt-6">
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
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-900 p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center space-x-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-sm mb-3">
              <Gift className="h-3.5 w-3.5 text-amber-300" />
              <span>Instant 20 Coins Signup Bonus</span>
            </div>
            <h2 className="text-xl font-extrabold leading-snug">
              Turn your free time into <span className="text-amber-300">instant UPI cash</span>.
            </h2>
            <p className="mt-2 text-xs text-emerald-100/90 leading-relaxed">
              Complete verified CPX Research surveys, earn daily streak bonuses, and withdraw to your Google Pay, PhonePe, or Paytm UPI handle.
            </p>
          </div>
        </div>

        {/* Referral notice if invited (Client only to avoid mismatch) */}
        {mounted && refCode && (
          <div className="mt-4 flex items-center space-x-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 shadow-sm">
            <Gift className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Invited with code: <strong className="font-mono text-amber-800">{refCode}</strong>. Your bonus will activate upon signing in!
            </span>
          </div>
        )}

        {/* Feature List */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center space-x-3 rounded-xl bg-white p-3 border border-slate-200/80 shadow-xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Coins className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">100 Coins = ₹10 INR</p>
              <p className="text-[10px] text-slate-500">Transparent 10:1 conversion rate</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rounded-xl bg-white p-3 border border-slate-200/80 shadow-xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Fast UPI Payouts</p>
              <p className="text-[10px] text-slate-500">Direct transfer to any bank UPI ID</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rounded-xl bg-white p-3 border border-slate-200/80 shadow-xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Official CPX Research Partner</p>
              <p className="text-[10px] text-slate-500">High-paying global & Indian surveys</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Section */}
      <div className="pb-2 pt-4">
        {error && (
          <div className="mb-3 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* Continue with Google button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-3 rounded-xl bg-white border border-slate-300 py-3.5 px-4 text-sm font-bold text-slate-800 shadow-md hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
        >
          {loading && !showEmailAuth ? (
            <div className="h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </button>

        {/* Collapsible Email sign-in for instant testing */}
        <div className="mt-3 text-center">
          <button
            onClick={() => setShowEmailAuth(!showEmailAuth)}
            className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold underline"
          >
            {showEmailAuth ? "Hide Email Login" : "Or continue with Email / Password"}
          </button>
        </div>

        {showEmailAuth && (
          <form onSubmit={handleEmailAuth} className="mt-3 p-3 bg-white rounded-xl border border-slate-200 space-y-2.5">
            <div className="relative">
              <Mail className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="relative">
              <Lock className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[10px] text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
              </button>
            </div>
          </form>
        )}

        {/* Legal links required for CPX approval */}
        <p className="mt-3 text-center text-[10px] text-slate-500 leading-normal">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-emerald-700 underline font-medium hover:text-emerald-800">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-emerald-700 underline font-medium hover:text-emerald-800">
            Privacy Policy
          </Link>
          .
        </p>
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
