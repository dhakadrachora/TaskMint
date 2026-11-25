"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Instagram,
  Zap,
  TrendingUp,
  Coins,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Play,
  Flame,
  ArrowRight,
} from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { formatCoins, formatInr, timeAgo } from "@/lib/utils";
import { SmmOrder } from "@/lib/types";
import confetti from "canvas-confetti";

export default function InstagramViewsStorePage() {
  const { profile, refreshProfile, updateCoinsLocal } = useProfile();

  // Form State
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState<number>(1000);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Orders State
  const [orders, setOrders] = useState<SmmOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const userCoins = profile?.coins ?? 0;

  // Rate calculation: ₹2 per 1000 views = 20 Coins per 1000 views
  const safeQty = Math.max(1000, quantity || 1000);
  const chargeCoins = Math.ceil((safeQty / 1000) * 20);
  const chargeInr = Number(((safeQty / 1000) * 2).toFixed(2));
  const hasEnoughCoins = userCoins >= chargeCoins;

  // Fetch orders
  const loadOrders = async () => {
    try {
      const res = await fetch("/api/smm/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error("Failed to load SMM orders:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Handle Preset Click with instant micro-interaction
  const handleSelectPreset = (qty: number) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(25);
    }
    setQuantity(qty);
    setMessage(null);
  };

  // Submit Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const trimmed = link.trim();
    if (!trimmed) {
      setMessage({ type: "error", text: "Please enter your Instagram Reel or Post link." });
      return;
    }

    if (safeQty < 1000) {
      setMessage({ type: "error", text: "Minimum order quantity is 1,000 views." });
      return;
    }

    if (!hasEnoughCoins) {
      setMessage({
        type: "error",
        text: `Insufficient coins. You need ${chargeCoins} Coins (₹${chargeInr}), but have only ${userCoins} Coins. Earn more from the Earn tab!`,
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/smm/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          link: trimmed,
          quantity: safeQty,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#E1306C", "#F77737", "#10B981"],
          });
        } catch {
          // fallback
        }

        setMessage({
          type: "success",
          text: data.message || `🎉 Order placed for ${safeQty.toLocaleString()} Views! Delivery starts in 0-15 mins.`,
        });

        updateCoinsLocal(-chargeCoins);
        setLink("");
        setQuantity(1000);
        await refreshProfile();
        await loadOrders();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to place order. Please try again.",
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

  // Refresh status of single order
  const handleRefreshStatus = async (orderId: string) => {
    setRefreshingId(orderId);
    try {
      const res = await fetch("/api/smm/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o))
          );
        }
      }
    } catch (e) {
      console.error("Refresh status error:", e);
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Top Gradient Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-600 via-rose-600 to-purple-900 p-5 text-white shadow-xl">
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-rose-100 backdrop-blur-sm">
            <Instagram className="h-3.5 w-3.5 text-pink-200" />
            <span>CheapSMMHub Instant Partner</span>
          </div>

          <h2 className="text-xl font-black leading-tight tracking-tight">
            Boost Instagram <br />
            <span className="text-amber-300">Reels &amp; Video Views</span>
          </h2>

          <p className="text-xs text-rose-100/90 leading-relaxed pt-1">
            Grow your Instagram reach using your earned TaskMint coins! Instant delivery started within 0-15 minutes.
          </p>

          <div className="pt-2 flex items-center space-x-2 text-[11px]">
            <span className="bg-white/20 border border-white/20 px-2.5 py-1 rounded-lg font-bold text-white flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-300 fill-amber-300" />
              1,000 Views = 20 Coins (₹2)
            </span>
            <span className="bg-white/10 px-2 py-1 rounded-lg text-rose-100">
              Min: 1,000
            </span>
          </div>
        </div>
      </div>

      {/* Earn Free Coins for Views Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-300/80 p-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black shadow-sm">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <p className="text-xs font-black text-slate-900">Need More Coins for Views?</p>
              <span className="rounded bg-amber-200 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.2">FREE</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Watch 15-second sponsor ads and earn instant coins to order views!
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="shrink-0 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-black shadow-sm active:scale-95 transition-all"
        >
          Watch Ads →
        </Link>
      </div>

      {/* Main Order Card */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-sm">
              <Play className="h-4 w-4 fill-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Buy Instagram Views</h3>
              <p className="text-[10px] text-slate-500">Service #4483 • Max 50,000 Views</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500">Your Coins:</span>
            <p className="text-xs font-black text-emerald-700 font-mono">
              {formatCoins(userCoins)} Coins
            </p>
          </div>
        </div>

        {/* Message notification */}
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

        <form onSubmit={handlePlaceOrder} className="space-y-4">
          {/* Instagram Link input */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Instagram Reel / Post Link
            </label>
            <div className="relative">
              <Instagram className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://www.instagram.com/reel/C7xY9z.../"
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:bg-white transition-colors"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Supports Public Reels, Videos, and Posts. Make sure your account is not private.
            </p>
          </div>

          {/* Quantity selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800">
                Quantity (Number of Views)
              </label>
              <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                Min: 1,000 Views
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min={1000}
                max={50000}
                step={500}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-pink-500 focus:bg-white"
              />
            </div>

            {/* Quick preset chips */}
            <div className="grid grid-cols-5 gap-1.5 mt-2">
              {[1000, 2500, 5000, 10000, 25000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer border ${
                    safeQty === preset
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {preset >= 1000 ? `${preset / 1000}K` : preset}
                </button>
              ))}
            </div>
          </div>

          {/* Live Price Calculator & Delivery Summary Box */}
          <div className="rounded-xl bg-gradient-to-br from-slate-50 to-pink-50/40 border border-pink-200/70 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Views Requested:</span>
              <span className="font-bold font-mono text-slate-900">{safeQty.toLocaleString()} Views</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Cost in Coins:</span>
              <span className="font-bold font-mono text-amber-600 flex items-center gap-1">
                <Coins className="h-3.5 w-3.5" />
                {chargeCoins} Coins
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">INR Equivalent:</span>
              <span className="font-bold text-emerald-700">₹{chargeInr} INR</span>
            </div>

            <div className="border-t border-pink-200/60 pt-2 flex items-center space-x-1.5 text-[10px] text-slate-500">
              <Clock className="h-3.5 w-3.5 text-purple-600 shrink-0" />
              <span>
                <strong>Speed:</strong> Starts in 0-15 mins • Est. Complete: 30 mins - 2 hours
              </span>
            </div>
          </div>

          {/* Low Balance Warning */}
          {!hasEnoughCoins && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start justify-between space-x-2">
              <div className="flex items-start space-x-2">
                <Coins className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Need {chargeCoins - userCoins} more coins</p>
                  <p className="text-[11px] text-amber-800">
                    Complete quick surveys or daily check-ins to get free coins for this order!
                  </p>
                </div>
              </div>
              <Link
                href="/"
                className="shrink-0 bg-amber-200 hover:bg-amber-300 text-amber-950 px-2.5 py-1 rounded-lg font-bold text-[10px] transition-colors"
              >
                Earn Coins →
              </Link>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !hasEnoughCoins}
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white py-3.5 px-4 text-xs font-bold shadow-md shadow-pink-600/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>
                  Order {safeQty.toLocaleString()} Views ({chargeCoins} Coins / ₹{chargeInr})
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Orders History & Live Tracker */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-pink-600" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              My Orders &amp; Live Tracker ({orders.length})
            </h3>
          </div>
          <button
            onClick={loadOrders}
            className="text-[11px] font-bold text-pink-700 hover:text-pink-900 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh All</span>
          </button>
        </div>

        <div className="p-4">
          {loadingOrders ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <div className="h-5 w-5 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading order tracker...</p>
            </div>
          ) : orders.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {orders.map((o) => {
                const isPending = o.status.toLowerCase().includes("pending");
                const isCompleted = o.status.toLowerCase().includes("completed");
                const isInProgress = o.status.toLowerCase().includes("progress");
                const isCanceled = o.status.toLowerCase().includes("cancel");

                const statusColor = isCompleted
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : isInProgress
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : isCanceled
                  ? "bg-red-100 text-red-800 border-red-200"
                  : "bg-amber-100 text-amber-800 border-amber-200";

                const isRefreshingThis = refreshingId === o.id;

                return (
                  <div key={o.id} className="py-3.5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-slate-900">
                            {o.quantity.toLocaleString()} Views
                          </span>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded font-mono">
                            {o.charge_coins} Coins (₹{o.charge_inr})
                          </span>
                        </div>

                        {/* Short link */}
                        <a
                          href={o.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-pink-700 hover:underline flex items-center gap-1 max-w-[200px] truncate"
                        >
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{o.link}</span>
                        </a>

                        <p className="text-[9px] text-slate-400">
                          Order #{o.provider_order_id} • {timeAgo(o.created_at)}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <span
                          className={`inline-block border px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}
                        >
                          {o.status}
                        </span>

                        <div>
                          <button
                            onClick={() => handleRefreshStatus(o.id)}
                            disabled={isRefreshingThis}
                            className="inline-flex items-center space-x-1 text-[10px] font-bold text-slate-600 hover:text-pink-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw
                              className={`h-2.5 w-2.5 ${isRefreshingThis ? "animate-spin" : ""}`}
                            />
                            <span>{isRefreshingThis ? "Checking..." : "Live Status"}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress micro stats */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg text-[10px] text-slate-600 border border-slate-100">
                      <div>
                        <span className="text-slate-400">Start Count:</span>{" "}
                        <strong className="text-slate-800">{o.start_count ?? "Pending..."}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400">Remains:</span>{" "}
                        <strong className="text-slate-800">{o.remains ?? "Processing..."}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 space-y-1.5">
              <Instagram className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium text-slate-700">No Instagram orders yet</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Paste your Instagram Reel or Video URL above to get verified high-speed views delivered instantly!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
