"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  Coins,
  IndianRupee,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { MobileContainer } from "@/components/MobileContainer";
import { formatCoins, formatInr, timeAgo } from "@/lib/utils";
import { Withdrawal, AdminStats } from "@/lib/types";

export default function AdminPage() {
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid" | "rejected">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, withRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/withdrawals"),
      ]);

      if (statsRes.status === 403 || withRes.status === 403) {
        // Not admin, redirect to home
        router.push("/");
        return;
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (withRes.ok) {
        const withData = await withRes.json();
        setWithdrawals(withData.withdrawals || []);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleAction = async (withdrawalId: string, action: "paid" | "reject") => {
    setActionLoading(withdrawalId + action);
    setNotification(null);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, action }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotification({
          type: "success",
          text: data.message || `Action ${action} succeeded.`,
        });
        await loadAdminData();
      } else {
        setNotification({
          type: "error",
          text: data.error || "Action failed.",
        });
      }
    } catch {
      setNotification({
        type: "error",
        text: "Network error occurred.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesFilter = filterStatus === "all" ? true : w.status === filterStatus;
    const matchesSearch =
      searchTerm.trim() === "" ||
      w.upi_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <MobileContainer className="pb-16 bg-slate-50">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2.5">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center space-x-1.5">
            <Shield className="h-4 w-4 text-emerald-400" />
            <h1 className="text-sm font-black">Admin Management</h1>
          </div>
        </div>

        <button
          onClick={loadAdminData}
          disabled={loading}
          className="flex items-center space-x-1 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Sync</span>
        </button>
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {notification && (
          <div
            className={`rounded-xl p-3 text-xs font-bold ${
              notification.type === "success"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-red-100 text-red-800 border border-red-300"
            }`}
          >
            {notification.text}
          </div>
        )}

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-xl bg-white border border-slate-200/90 p-3 shadow-2xs">
            <div className="flex items-center space-x-1 text-slate-500 text-[10px] font-bold uppercase">
              <Users className="h-3 w-3 text-indigo-600" />
              <span>Users</span>
            </div>
            <p className="mt-1.5 text-base font-black text-slate-900">
              {stats?.totalUsers ?? 0}
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5">Total registered</p>
          </div>

          <div className="rounded-xl bg-white border border-slate-200/90 p-3 shadow-2xs">
            <div className="flex items-center space-x-1 text-slate-500 text-[10px] font-bold uppercase">
              <Coins className="h-3 w-3 text-amber-500" />
              <span>Coins Sent</span>
            </div>
            <p className="mt-1.5 text-base font-black text-amber-600">
              {formatCoins(stats?.totalCoinsDistributed ?? 0)}
            </p>
            <p className="text-[9px] text-emerald-600 font-bold mt-0.5">
              ≈ ₹{((stats?.totalCoinsDistributed ?? 0) / 10).toFixed(0)}
            </p>
          </div>

          <div className="rounded-xl bg-white border border-slate-200/90 p-3 shadow-2xs">
            <div className="flex items-center space-x-1 text-slate-500 text-[10px] font-bold uppercase">
              <IndianRupee className="h-3 w-3 text-emerald-600" />
              <span>Pending</span>
            </div>
            <p className="mt-1.5 text-base font-black text-emerald-600">
              {formatInr(stats?.pendingPayoutsInr ?? 0)}
            </p>
            <p className="text-[9px] text-slate-400 mt-0.5">Awaiting payout</p>
          </div>
        </div>

        {/* Withdrawals Management Section */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Manage Withdrawals
              </h3>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {filteredWithdrawals.length} Shown
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by UPI ID or Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5">
              {(["pending", "all", "paid", "rejected"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-colors cursor-pointer ${
                    filterStatus === st
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Withdrawals List */}
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                Loading withdrawals...
              </div>
            ) : filteredWithdrawals.length > 0 ? (
              filteredWithdrawals.map((w) => {
                const isPending = w.status === "pending";

                return (
                  <div key={w.id} className="p-3.5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm font-black text-slate-900">
                            ₹{w.amount_inr}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            ({w.coins} Coins)
                          </span>
                          {w.wallet_type === "commission" ? (
                            <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Commission Wallet
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Earning Wallet
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono font-bold text-emerald-700 select-all mt-0.5">
                          {w.upi_id}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {w.profile?.full_name || "User"} • {w.profile?.email || "No email"}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            w.status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : w.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {w.status}
                        </span>
                        <p className="text-[9px] text-slate-400 mt-1">
                          {timeAgo(w.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons for Pending items */}
                    {isPending && (
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => handleAction(w.id, "paid")}
                          disabled={Boolean(actionLoading)}
                          className="flex-1 flex items-center justify-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-1.5 px-3 text-[11px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Mark as Paid</span>
                        </button>

                        <button
                          onClick={() => handleAction(w.id, "reject")}
                          disabled={Boolean(actionLoading)}
                          className="flex-1 flex items-center justify-center space-x-1 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded-lg py-1.5 px-3 text-[11px] font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Reject &amp; Refund</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-slate-400 text-xs">
                No {filterStatus} withdrawals found.
              </div>
            )}
          </div>
        </div>
      </div>
    </MobileContainer>
  );
}
