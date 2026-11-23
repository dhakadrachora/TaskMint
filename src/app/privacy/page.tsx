import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, AlertTriangle, CheckCircle } from "lucide-react";
import { MobileContainer } from "@/components/MobileContainer";

export const metadata = {
  title: "Privacy Policy - TaskMint",
  description: "Official Privacy Policy for TaskMint GPT platform and CPX Research survey partnership.",
};

export default function PrivacyPage() {
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
          <h1 className="text-sm font-bold text-slate-900">Privacy Policy</h1>
          <p className="text-[10px] text-slate-500">Effective Date: November 2025</p>
        </div>
      </header>

      {/* Policy Content */}
      <div className="p-5 text-slate-700 text-xs leading-relaxed space-y-6">
        <div>
          <div className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] font-bold mb-2">
            <Shield className="h-3.5 w-3.5 text-emerald-600" />
            <span>TaskMint Privacy Standards</span>
          </div>
          <p>
            Welcome to <strong>TaskMint</strong> (&quot;TaskMint&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). We respect your privacy and are committed to protecting your personal data in compliance with international privacy laws and data protection standards.
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-emerald-600" />
            1. Information We Collect
          </h2>
          <p>To provide micro-task opportunities and process cash disbursements, we collect:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>Authentication Data:</strong> Name, email address, and avatar URL securely supplied through Google OAuth sign-in.</li>
            <li><strong>Financial Identifier:</strong> Virtual Payment Address (UPI ID) provided voluntarily by you solely for payouts.</li>
            <li><strong>Technical &amp; Device Data:</strong> IP address, browser type, operating system, and approximate country geolocation for security and fraud prevention.</li>
            <li><strong>Task Engagement:</strong> Timestamps of survey clicks, completed survey IDs, and transaction ledger logs.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-emerald-600" />
            2. Partnership with CPX Research
          </h2>
          <p>
            TaskMint partners with <strong>CPX Research</strong> (operated by Make Opinion GmbH, Berlin, Germany) to display paid research surveys.
          </p>
          <p>
            When you interact with the CPX Research Offerwall, a pseudo-anonymized User ID along with a secure cryptographic MD5 signature is transmitted to CPX Research to prevent tampering and match surveys tailored to your demographic.
          </p>
          <p>
            CPX Research may utilize cookies, local storage, and demographic profiling to match surveys. Please consult the <a href="https://cpx-research.com" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline font-semibold">CPX Research Privacy Policy</a> for additional disclosures.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            3. Anti-Fraud &amp; Anti-VPN Policy
          </h2>
          <p>
            Market research relies on accurate, authentic human respondents. To maintain partner compliance:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>The use of VPNs (Virtual Private Networks), residential proxies, Tor, or hosting IP addresses is strictly prohibited.</li>
            <li>Automated scripts, bots, emulators, or multiple accounts operated by a single person are subject to immediate suspension.</li>
            <li>Inconsistent or fraudulent survey answers result in automatic disqualification by CPX algorithms.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            4. Data Retention &amp; Deletion
          </h2>
          <p>
            We retain your profile and transaction records only as long as necessary to maintain your account and meet regulatory payout auditing obligations. You may request permanent deletion of your account and data at any time by contacting our support team.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">
            5. Contact Us
          </h2>
          <p>
            For privacy inquiries, data deletion requests, or support, please reach out via our official Telegram channel or email <span className="font-mono text-emerald-700">support@taskmint.app</span>.
          </p>
        </section>
      </div>
    </MobileContainer>
  );
}
