"use client";

import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SupportTicket } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export function SupportSection() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState("withdrawal");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [formAlert, setFormAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT_URL || "https://t.me/taskmint_support";

  const loadTickets = async () => {
    try {
      const res = await fetch("/api/support/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error("Failed to fetch tickets", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormAlert(null);

    if (!subject.trim() || !message.trim()) {
      setFormAlert({ type: "error", text: "Please fill in both subject and description." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFormAlert({
          type: "success",
          text: data.message || "Ticket submitted! Admin will resolve it shortly.",
        });
        setSubject("");
        setMessage("");
        await loadTickets();
        setTimeout(() => {
          setShowModal(false);
          setFormAlert(null);
        }, 2000);
      } else {
        setFormAlert({ type: "error", text: data.error || "Failed to submit ticket." });
      }
    } catch {
      setFormAlert({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <LifeBuoy className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              24/7 Help &amp; Problem Support
            </h3>
            <p className="text-[10px] text-slate-500">Report any issue directly to our Admin</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Official Telegram Quick Link */}
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-3 rounded-xl bg-sky-50/70 border border-sky-200/80 hover:bg-sky-50 transition-colors"
      >
        <div className="flex items-center space-x-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-white shadow-xs">
            <Send className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-sky-950">Official Telegram Channel &amp; Support</p>
            <p className="text-[10px] text-sky-700">Instant updates &amp; live community help</p>
          </div>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-sky-600" />
      </a>

      {/* User's Previous Tickets List */}
      <div>
        <div className="flex items-center justify-between py-1 border-b border-slate-100 mb-2">
          <span className="text-[11px] font-bold text-slate-700">Your Support Tickets</span>
          <span className="text-[10px] text-slate-500">{tickets.length} Total</span>
        </div>

        {loading ? (
          <div className="text-center py-4 text-xs text-slate-400">Loading tickets...</div>
        ) : tickets.length > 0 ? (
          <div className="space-y-2">
            {tickets.map((t) => {
              const isExpanded = expandedTicketId === t.id;
              const hasReply = Boolean(t.admin_reply);

              return (
                <div
                  key={t.id}
                  className="rounded-xl border border-slate-200/80 p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                >
                  <div
                    onClick={() => setExpandedTicketId(isExpanded ? null : t.id)}
                    className="flex items-start justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-[11px] font-black text-slate-900">
                          #{t.ticket_number}
                        </span>
                        <span
                          className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase ${
                            t.status === "resolved"
                              ? "bg-emerald-100 text-emerald-800"
                              : t.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-0.5 line-clamp-1">
                        {t.subject}
                      </p>
                      <p className="text-[10px] text-slate-400">{timeAgo(t.created_at)}</p>
                    </div>

                    <div className="flex items-center space-x-1.5 text-slate-400">
                      {hasReply && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                          Admin Replied
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {/* Expanded View with Full Message and Admin Reply */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-200/60 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Your Message:</span>
                        <p className="text-slate-700 whitespace-pre-wrap mt-0.5 bg-white p-2.5 rounded-lg border border-slate-200">
                          {t.message}
                        </p>
                      </div>

                      {hasReply ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 space-y-1">
                          <div className="flex items-center space-x-1 text-emerald-800 font-bold text-[11px]">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Official Admin Response:</span>
                          </div>
                          <p className="text-emerald-950 font-medium whitespace-pre-wrap">
                            {t.admin_reply}
                          </p>
                          {t.admin_replied_at && (
                            <p className="text-[9px] text-emerald-600 pt-0.5">
                              Replied {timeAgo(t.admin_replied_at)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Admin has received your ticket and is investigating.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center py-3 text-xs text-slate-400">
            No active support tickets. Click &ldquo;New Ticket&rdquo; if you face any problem!
          </p>
        )}
      </div>

      {/* New Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <LifeBuoy className="h-4 w-4 text-emerald-600" />
                <h4 className="text-sm font-black text-slate-900">Submit Support Ticket</h4>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formAlert && (
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold ${
                  formAlert.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {formAlert.text}
              </div>
            )}

            <form onSubmit={handleSubmitTicket} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Issue Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="withdrawal">💸 Withdrawal / UPI Payout Issue</option>
                  <option value="survey">🏆 Survey Coins Not Credited</option>
                  <option value="views">👁️ Instagram Views Issue</option>
                  <option value="account">🔐 Account / Password / Login Issue</option>
                  <option value="other">💬 Other Query / Feedback</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Subject / Summary
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. UPI withdrawal ₹50 pending since yesterday"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Problem Description
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue with full details (UPI ID, date, or Reel link) so admin can fix it quickly..."
                  rows={4}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-xs hover:brightness-105 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
