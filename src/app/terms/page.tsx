import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, AlertOctagon, IndianRupee, ShieldCheck } from "lucide-react";
import { MobileContainer } from "@/components/MobileContainer";

export const metadata = {
  title: "Terms of Service - TaskMint",
  description: "Terms and conditions governing the use of TaskMint and its survey rewards program.",
};

export default function TermsPage() {
  return (
    <MobileContainer className="pb-12 bg-white">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3.5 flex items-center space-x-3">
        <Link
          href="/profile"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-sm font-bold text-slate-900">Terms of Service</h1>
          <p className="text-[10px] text-slate-500">Last Revised: November 2025</p>
        </div>
      </header>

      {/* Terms Content */}
      <div className="p-5 text-slate-700 text-xs leading-relaxed space-y-6">
        <div>
          <div className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] font-bold mb-2">
            <FileText className="h-3.5 w-3.5 text-emerald-600" />
            <span>TaskMint Platform Agreement</span>
          </div>
          <p>
            By creating an account or accessing <strong>TaskMint</strong>, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            1. Eligibility &amp; User Accounts
          </h2>
          <p>
            Users must be at least 16 years of age. Each individual is permitted strictly one (1) account. You agree to sign in using your genuine Google account. Providing fictitious demographic details or operating multiple accounts constitutes a material breach of these terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <IndianRupee className="h-4 w-4 text-emerald-600" />
            2. Virtual Currency (Coins) &amp; Payout Terms
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Valuation:</strong> Virtual Coins within TaskMint are calculated at <strong>100 Coins = ₹10 INR</strong> (10 Coins = ₹1 INR).</li>
            <li><strong>Withdrawal Thresholds:</strong> The minimum threshold for your initial withdrawal is <strong>500 Coins (₹50)</strong>. All subsequent withdrawals require a minimum threshold of <strong>1000 Coins (₹100)</strong>.</li>
            <li><strong>Disbursement Method:</strong> Payouts are made exclusively to valid Indian Unified Payments Interface (UPI) handles. Ensure your UPI ID is active and correctly formatted.</li>
            <li><strong>Processing Timeline:</strong> Withdrawals are typically reviewed and dispatched within 24 to 72 business hours.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            3. CPX Research Survey Rules &amp; Postbacks
          </h2>
          <p>
            Surveys are served by third-party research partner CPX Research. Coin rewards are credited via automated Server-to-Server (S2S) postbacks following successful completion.
          </p>
          <p>
            If a survey provider rejects or reverses a completion due to speeding, contradictory answers, or fraud (Chargeback status), TaskMint reserves the right to deduct the corresponding coins from your balance.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <AlertOctagon className="h-4 w-4 text-red-500" />
            4. Prohibited Activities &amp; Forfeiture
          </h2>
          <p>The following will result in permanent account termination and forfeiture of all accumulated coins:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Using VPNs, proxies, residential relays, or identity masking software.</li>
            <li>Employing automated macros, bots, or browser extension scripts.</li>
            <li>Self-referring or creating ghost accounts to claim referral commissions.</li>
            <li>Submitting gibberish or nonsensical survey answers.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">
            5. Modifications &amp; Termination
          </h2>
          <p>
            TaskMint reserves the right to alter reward rates, withdrawal minimums, or discontinue features at its sole discretion upon reasonable advance notice.
          </p>
        </section>
      </div>
    </MobileContainer>
  );
}
