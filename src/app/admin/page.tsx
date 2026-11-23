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
  LifeBuoy,
  Instagram,
  UserCheck,
  UserX,
  Plus,
  Minus,
  MessageSquare,
  Send,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { MobileContainer } from "@/components/MobileContainer";
import { formatCoins, formatInr, timeAgo } from "@/lib/utils";
import { Withdrawal, AdminStats, SupportTicket, SmmOrder, Profile } from "@/lib/types";

type AdminTab = "overview" | "withdrawals" | "support" | "users" | "smm";

export default function AdminPage() {
  const router = useRouter();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  // Core Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [smmOrders, setSmmOrders] = useState<SmmOrder[]>([]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters & Search
  const [withdrawalFilter, setWithdrawalFilter] = useState<"all" | "pending" | "paid" | "rejected">("pending");
  const [withdrawalSearch, setWithdrawalSearch] = useState("");

  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "in_progress" | "resolved">("open");
  const [ticketSearch, setTicketSearch] = useState("");

  const [userSearch, setUserSearch] = useState("");

  // Notification Toast
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modals
  const [adjustCoinModalUser, setAdjustCoinModalUser] = useState<Profile | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>("");
  const [adjustWalletType, setAdjustWalletType] = useState<"earning" | "commission">("earning");
  const [adjustReason, setAdjustReason] = useState<string>("");

  const [replyTicketId, setReplyTicketId] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState<string>("");

  // Copy helper
  const handleCopy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (navigator.vibrate) navigator.vibrate(25);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  // Load all admin data
  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, withRes, ticketsRes, usersRes, smmRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/withdrawals"),
        fetch("/api/admin/support"),
        fetch("/api/admin/users"),
        fetch("/api/admin/smm"),
      ]);

      if (statsRes.status === 401 || statsRes.status === 403) {
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

      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setSupportTickets(ticketsData.tickets || []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      if (smmRes.ok) {
        const smmData = await smmRes.json();
        setSmmOrders(smmData.orders || []);
      }
    } catch (err) {
      console.error("Admin load error:", err);
      setNotification({ type: "error", text: "Failed to load admin datasets." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // 1. Withdrawal Actions (Mark Paid / Reject & Refund)
  const handleWithdrawalAction = async (withdrawalId: string, action: "paid" | "reject") => {
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
          text: data.message || `Withdrawal updated to ${action}.`,
        });
        await loadAdminData();
      } else {
        setNotification({ type: "error", text: data.error || "Action failed." });
      }
    } catch {
      setNotification({ type: "error", text: "Network error occurred." });
    } finally {
      setActionLoading(null);
    }
  };

  // 2. Support Ticket Reply & Status Update
  const handleReplyTicket = async (ticketId: string, newStatus?: string) => {
    if (!ticketReplyText.trim() && !newStatus) return;

    setActionLoading(ticketId);
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          reply: ticketReplyText.trim() || undefined,
          status: newStatus || "resolved",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotification({
          type: "success",
          text: "Reply sent and ticket status updated successfully!",
        });
        setReplyTicketId(null);
        setTicketReplyText("");
        await loadAdminData();
      } else {
        setNotification({ type: "error", text: data.error || "Failed to update ticket." });
      }
    } catch {
      setNotification({ type: "error", text: "Network error occurred." });
    } finally {
      setActionLoading(null);
    }
  };

  // 3. User Adjust Coins
  const handleAdjustCoinsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustCoinModalUser || !adjustAmount) return;

    setActionLoading("adjust_coins");
    try {
      const res = await fetch("/api/admin/users/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust_coins",
          userId: adjustCoinModalUser.id,
          amount: Number(adjustAmount),
          walletType: adjustWalletType,
          reason: adjustReason.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotification({ type: "success", text: data.message });
        setAdjustCoinModalUser(null);
        setAdjustAmount("");
        setAdjustReason("");
        await loadAdminData();
      } else {
        setNotification({ type: "error", text: data.error || "Failed to adjust coins." });
      }
    } catch {
      setNotification({ type: "error", text: "Network error occurred." });
    } finally {
      setActionLoading(null);
    }
  };

  // 4. User Toggle Ban
  const handleToggleBan = async (user: Profile) => {
    const isCurrentlyBanned = Boolean(user.is_banned);
    const confirmMsg = isCurrentlyBanned
      ? `Are you sure you want to UNBAN ${user.full_name || user.email}?`
      : `Are you sure you want to BAN ${user.full_name || user.email}? They will be locked out.`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(`ban_${user.id}`);
    try {
      const res = await fetch("/api/admin/users/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_ban",
          userId: user.id,
          banned: !isCurrentlyBanned,
          reason: isCurrentlyBanned ? "" : "Admin security ban",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotification({ type: "success", text: data.message });
        await loadAdminData();
      } else {
        setNotification({ type: "error", text: data.error || "Failed to update ban state." });
      }
    } catch {
      setNotification({ type: "error", text: "Network error occurred." });
    } finally {
      setActionLoading(null);
    }
  };

  // 5. Sync SMM Order Status with CheapSMMHub
  const handleSyncSmmOrder = async (orderId: string) => {
    setActionLoading(`smm_${orderId}`);
    try {
      const res = await fetch("/api/admin/smm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotification({
          type: "success",
          text: `SMM Order status synced: ${data.status} (Remains: ${data.remains ?? "N/A"})`,
        });
        await loadAdminData();
      } else {
        setNotification({ type: "error", text: data.error || "Sync failed." });
      }
    } catch {
      setNotification({ type: "error", text: "Network error occurred." });
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered lists
  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesFilter = withdrawalFilter === "all" ? true : w.status === withdrawalFilter;
    const matchesSearch =
      withdrawalSearch.trim() === "" ||
      w.upi_id.toLowerCase().includes(withdrawalSearch.toLowerCase()) ||
      w.profile?.email?.toLowerCase().includes(withdrawalSearch.toLowerCase()) ||
      w.profile?.full_name?.toLowerCase().includes(withdrawalSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredTickets = supportTickets.filter((t) => {
    const matchesFilter = ticketFilter === "all" ? true : t.status === ticketFilter;
    const matchesSearch =
      ticketSearch.trim() === "" ||
      t.ticket_number.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.subject.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.profile?.full_name?.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.profile?.email?.toLowerCase().includes(ticketSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.referral_code && u.referral_code.toLowerCase().includes(q))
    );
  });

  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === "pending").length;
  const openTicketsCount = supportTickets.filter((t) => t.status === "open").length;

  return (
    <MobileContainer className="pb-20 bg-slate-100 min-h-screen">
      {/* SuperAdmin Header */}
      <header className="sticky top-0 z-30 bg-slate-950 text-white px-4 py-3 shadow-md border-b border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center space-x-1.5">
              <Shield className="h-4 w-4 text-emerald-400" />
              <div>
                <h1 className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>TaskMint Admin</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.2 rounded border border-emerald-500/30">
                    MASTER
                  </span>
                </h1>
              </div>
            </div>
          </div>

          <button
            onClick={loadAdminData}
            disabled={loading}
            className="flex items-center space-x-1 rounded-xl bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-xs font-bold active:scale-95 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            <span>Sync</span>
          </button>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pt-2.5 pb-0.5 no-scrollbar text-[11px] font-bold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg shrink-0 transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-emerald-500 text-slate-950 shadow-sm font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📊 Overview
          </button>

          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`px-3 py-1.5 rounded-lg shrink-0 transition-all cursor-pointer flex items-center space-x-1 ${
              activeTab === "withdrawals"
                ? "bg-emerald-500 text-slate-950 shadow-sm font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>💸 Payouts</span>
            {pendingWithdrawalsCount > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                {pendingWithdrawalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("support")}
            className={`px-3 py-1.5 rounded-lg shrink-0 transition-all cursor-pointer flex items-center space-x-1 ${
              activeTab === "support"
                ? "bg-emerald-500 text-slate-950 shadow-sm font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🎫 Support</span>
            {openTicketsCount > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                {openTicketsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-3 py-1.5 rounded-lg shrink-0 transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-emerald-500 text-slate-950 shadow-sm font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            👥 Users ({users.length})
          </button>

          <button
            onClick={() => setActiveTab("smm")}
            className={`px-3 py-1.5 rounded-lg shrink-0 transition-all cursor-pointer ${
              activeTab === "smm"
                ? "bg-emerald-500 text-slate-950 shadow-sm font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            👁️ Views ({smmOrders.length})
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-4 space-y-4">
        {/* Floating Notification */}
        {notification && (
          <div
            className={`rounded-xl p-3 text-xs font-bold shadow-md flex items-start justify-between space-x-2 animate-in fade-in ${
              notification.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            <span>{notification.text}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-white/80 hover:text-white font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Top 4 Quick Stat Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-white border border-slate-200/90 p-3.5 shadow-2xs space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-bold uppercase">
                  <Users className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Total Users</span>
                </div>
                <p className="text-xl font-black text-slate-900">{stats?.totalUsers ?? users.length}</p>
                <p className="text-[10px] text-slate-400">Registered on TaskMint</p>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200/90 p-3.5 shadow-2xs space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-bold uppercase">
                  <IndianRupee className="h-3.5 w-3.5 text-amber-500" />
                  <span>Pending Payouts</span>
                </div>
                <p className="text-xl font-black text-amber-600">
                  {formatInr(stats?.pendingPayoutsInr ?? 0)}
                </p>
                <p className="text-[10px] text-amber-600 font-bold">
                  {pendingWithdrawalsCount} Requests Awaiting
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200/90 p-3.5 shadow-2xs space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-bold uppercase">
                  <LifeBuoy className="h-3.5 w-3.5 text-rose-500" />
                  <span>Support Tickets</span>
                </div>
                <p className="text-xl font-black text-slate-900">{openTicketsCount}</p>
                <p className="text-[10px] text-rose-600 font-bold">Unresolved User Problems</p>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200/90 p-3.5 shadow-2xs space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] font-bold uppercase">
                  <Instagram className="h-3.5 w-3.5 text-pink-500" />
                  <span>SMM Orders</span>
                </div>
                <p className="text-xl font-black text-slate-900">{smmOrders.length}</p>
                <p className="text-[10px] text-slate-400">Instagram Views Delivered</p>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Quick Action Centers
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab("withdrawals")}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 hover:bg-amber-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-xs">
                      ₹
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-950">Review Pending Withdrawals</p>
                      <p className="text-[10px] text-amber-700">
                        {pendingWithdrawalsCount} user(s) waiting for UPI payouts
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-amber-700" />
                </button>

                <button
                  onClick={() => setActiveTab("support")}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/70 hover:bg-indigo-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-xs">
                      <LifeBuoy className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-950">Fix User Problems &amp; Tickets</p>
                      <p className="text-[10px] text-indigo-700">
                        {openTicketsCount} open problem tickets from users
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-indigo-700" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WITHDRAWALS & PAYOUTS */}
        {activeTab === "withdrawals" && (
          <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden space-y-3">
            <div className="p-3.5 border-b border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  UPI Payout Requests
                </h3>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                  {filteredWithdrawals.length} Found
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by UPI ID, name, or email..."
                  value={withdrawalSearch}
                  onChange={(e) => setWithdrawalSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
                {(["pending", "all", "paid", "rejected"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setWithdrawalFilter(st)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold capitalize transition-colors cursor-pointer ${
                      withdrawalFilter === st
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
            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto px-1">
              {filteredWithdrawals.length > 0 ? (
                filteredWithdrawals.map((w) => {
                  const isPending = w.status === "pending";

                  return (
                    <div key={w.id} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-base font-black text-slate-900">
                              ₹{w.amount_inr}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              ({w.coins} Coins)
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                w.wallet_type === "commission"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {w.wallet_type === "commission" ? "Commission" : "Earning"}
                            </span>
                          </div>

                          {/* UPI ID with 1-click Copy */}
                          <div className="flex items-center space-x-1.5 mt-1">
                            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 select-all">
                              {w.upi_id}
                            </span>
                            <button
                              onClick={() => handleCopy(w.upi_id)}
                              className="text-slate-400 hover:text-slate-700 p-1"
                              title="Copy UPI"
                            >
                              {copiedText === w.upi_id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-600 mt-1 font-medium">
                            {w.profile?.full_name || "User"} • {w.profile?.email || "No email"}
                          </p>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              w.status === "paid"
                                ? "bg-emerald-100 text-emerald-800"
                                : w.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {w.status}
                          </span>
                          <p className="text-[9px] text-slate-400 mt-1">{timeAgo(w.created_at)}</p>
                        </div>
                      </div>

                      {/* Pending Action Buttons */}
                      {isPending && (
                        <div className="flex items-center space-x-2 pt-1 border-t border-slate-100">
                          <button
                            onClick={() => handleWithdrawalAction(w.id, "paid")}
                            disabled={Boolean(actionLoading)}
                            className="flex-1 flex items-center justify-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 px-3 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Mark as Paid</span>
                          </button>

                          <button
                            onClick={() => handleWithdrawalAction(w.id, "reject")}
                            disabled={Boolean(actionLoading)}
                            className="flex-1 flex items-center justify-center space-x-1 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded-xl py-2 px-3 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Reject &amp; Refund</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No {withdrawalFilter} withdrawals found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: USER SUPPORT HELPDESK */}
        {activeTab === "support" && (
          <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden space-y-3">
            <div className="p-3.5 border-b border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  User Support Tickets
                </h3>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                  {filteredTickets.length} Tickets
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by ticket #, subject, or user email..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
                {(["open", "in_progress", "resolved", "all"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setTicketFilter(st)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold capitalize transition-colors cursor-pointer ${
                      ticketFilter === st
                        ? "bg-indigo-900 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Tickets List */}
            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto px-1">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((t) => {
                  const isReplying = replyTicketId === t.id;

                  return (
                    <div key={t.id} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              #{t.ticket_number}
                            </span>
                            <span className="text-[10px] bg-slate-100 font-bold text-slate-700 px-2 py-0.5 rounded-full uppercase">
                              {t.category}
                            </span>
                          </div>

                          <h4 className="text-xs font-black text-slate-900 mt-1">{t.subject}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            From: <strong className="text-slate-800">{t.profile?.full_name || "User"}</strong> (
                            {t.profile?.email || "No email"}) • Balance: {t.profile?.coins ?? 0} Coins
                          </p>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              t.status === "resolved"
                                ? "bg-emerald-100 text-emerald-800"
                                : t.status === "in_progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {t.status}
                          </span>
                          <p className="text-[9px] text-slate-400 mt-1">{timeAgo(t.created_at)}</p>
                        </div>
                      </div>

                      {/* User's Original Issue Message */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 whitespace-pre-wrap">
                        {t.message}
                      </div>

                      {/* Previous Admin Reply if exists */}
                      {t.admin_reply && (
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-950 space-y-0.5">
                          <p className="text-[10px] font-bold text-emerald-800">
                            Your Previous Reply ({t.admin_replied_at ? timeAgo(t.admin_replied_at) : "Sent"}):
                          </p>
                          <p className="whitespace-pre-wrap font-medium">{t.admin_reply}</p>
                        </div>
                      )}

                      {/* Action & Reply Box */}
                      {isReplying ? (
                        <div className="pt-2 space-y-2 border-t border-slate-100">
                          <textarea
                            value={ticketReplyText}
                            onChange={(e) => setTicketReplyText(e.target.value)}
                            placeholder="Type solution message for user (e.g. 'We verified your survey and credited 50 coins to your account')..."
                            rows={3}
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                          />

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setReplyTicketId(null);
                                setTicketReplyText("");
                              }}
                              className="py-1.5 px-3 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                            >
                              Cancel
                            </button>

                            <button
                              onClick={() => handleReplyTicket(t.id, "resolved")}
                              disabled={Boolean(actionLoading)}
                              className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer flex items-center justify-center space-x-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Send &amp; Mark Resolved</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 pt-1 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setReplyTicketId(t.id);
                              setTicketReplyText(t.admin_reply || "");
                            }}
                            className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>{t.admin_reply ? "Edit Reply" : "Reply to User"}</span>
                          </button>

                          {t.status !== "resolved" && (
                            <button
                              onClick={() => handleReplyTicket(t.id, "resolved")}
                              className="py-1.5 px-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs transition-colors"
                            >
                              Quick Resolve
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No {ticketFilter} support tickets found. All user problems resolved!
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: USERS & BALANCE CONTROLS */}
        {activeTab === "users" && (
          <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden space-y-3">
            <div className="p-3.5 border-b border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Registered Users
                </h3>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                  {filteredUsers.length} Users
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search user by name, email, phone, or code..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto px-1">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isBanned = Boolean(u.is_banned);

                  return (
                    <div key={u.id} className="p-3.5 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-black text-slate-900">
                              {u.full_name || "Unnamed Earner"}
                            </span>
                            {u.is_admin && (
                              <span className="bg-indigo-100 text-indigo-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                ADMIN
                              </span>
                            )}
                            {isBanned && (
                              <span className="bg-red-100 text-red-800 text-[9px] font-black px-1.5 py-0.2 rounded">
                                BANNED
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {u.email || "No email"} {u.phone ? `• ${u.phone}` : ""}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                            Ref: <strong>{u.referral_code}</strong>{" "}
                            {u.referred_by ? `(Referred by: ${u.referred_by})` : ""}
                          </p>
                        </div>

                        {/* Balance Chips */}
                        <div className="text-right space-y-1">
                          <div className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {formatCoins(u.coins)} Coins
                          </div>
                          <div className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {formatCoins(u.commission_coins ?? 0)} Comm.
                          </div>
                        </div>
                      </div>

                      {/* Action buttons for this user */}
                      <div className="flex items-center space-x-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setAdjustCoinModalUser(u);
                            setAdjustAmount("");
                            setAdjustReason("");
                          }}
                          className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-200"
                        >
                          <Coins className="h-3 w-3" />
                          <span>Adjust Coins</span>
                        </button>

                        <button
                          onClick={() => handleToggleBan(u)}
                          disabled={actionLoading === `ban_${u.id}`}
                          className={`py-1.5 px-3 rounded-lg text-[11px] font-bold border transition-colors ${
                            isBanned
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          }`}
                        >
                          {isBanned ? "Unban User" : "Ban User"}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No users found matching &ldquo;{userSearch}&rdquo;.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: INSTAGRAM SMM VIEWS ORDERS */}
        {activeTab === "smm" && (
          <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden space-y-3">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Instagram Views Store Orders
                </h3>
                <p className="text-[10px] text-slate-500">Connected to CheapSMMHub API v2 (#4483)</p>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                {smmOrders.length} Orders
              </span>
            </div>

            {/* Orders List */}
            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto px-1">
              {smmOrders.length > 0 ? (
                smmOrders.map((o) => (
                  <div key={o.id} className="p-3.5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-black text-slate-900">
                            #{o.provider_order_id}
                          </span>
                          <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-0.2 rounded border border-pink-200">
                            {o.quantity.toLocaleString()} Views
                          </span>
                        </div>

                        <a
                          href={o.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono text-blue-600 hover:underline flex items-center gap-1 mt-1 truncate max-w-[220px]"
                        >
                          <span>{o.link}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>

                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Charged: <strong>{o.charge_coins} Coins</strong> (₹{o.charge_inr})
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            o.status.toLowerCase().includes("completed")
                              ? "bg-emerald-100 text-emerald-800"
                              : o.status.toLowerCase().includes("canceled")
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {o.status}
                        </span>
                        <p className="text-[9px] text-slate-400 mt-1">{timeAgo(o.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500 text-[10px]">
                        Remains: <strong>{o.remains ?? "N/A"}</strong> • Start:{" "}
                        <strong>{o.start_count ?? "N/A"}</strong>
                      </span>

                      <button
                        onClick={() => handleSyncSmmOrder(o.id)}
                        disabled={actionLoading === `smm_${o.id}`}
                        className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center space-x-1"
                      >
                        <RefreshCw className={`h-3 w-3 ${actionLoading === `smm_${o.id}` ? "animate-spin" : ""}`} />
                        <span>Sync Provider</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No Instagram Views orders placed yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Adjust Coins Modal */}
      {adjustCoinModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="text-xs font-black text-slate-900">Adjust User Coins</h4>
                <p className="text-[10px] text-slate-500">
                  {adjustCoinModalUser.full_name || adjustCoinModalUser.email}
                </p>
              </div>
              <button
                onClick={() => setAdjustCoinModalUser(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustCoinsSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Wallet
                </label>
                <select
                  value={adjustWalletType}
                  onChange={(e) => setAdjustWalletType(e.target.value as "earning" | "commission")}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="earning">
                    Earning Wallet (Current: {adjustCoinModalUser.coins} Coins)
                  </option>
                  <option value="commission">
                    Commission Wallet (Current: {adjustCoinModalUser.commission_coins ?? 0} Coins)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Coins Change Amount (+ to Add, - to Deduct)
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 50 to credit or -20 to deduct"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Survey #482 credit compensation"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAdjustCoinModalUser(null)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === "adjust_coins"}
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-xs active:scale-95 disabled:opacity-50"
                >
                  Apply Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MobileContainer>
  );
}
