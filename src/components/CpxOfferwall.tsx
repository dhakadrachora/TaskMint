"use client";

import React, { useState, useEffect } from "react";
import { Info, ExternalLink, ShieldAlert, Sparkles, RefreshCw, CheckCircle } from "lucide-react";
import { Profile } from "@/lib/types";

interface CpxOfferwallProps {
  profile: Profile | null;
}

interface CpxConfig {
  userId: string;
  email: string;
  appId: string;
  md5Hash: string;
  configured: boolean;
}

export function CpxOfferwall({ profile }: CpxOfferwallProps) {
  const [config, setConfig] = useState<CpxConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    async function fetchCpxConfig() {
      try {
        const res = await fetch("/api/cpx-hash");
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (err) {
        console.error("Failed to load CPX config", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCpxConfig();
  }, []);

  // Compute CPX URL
  const iframeUrl =
    config && config.appId
      ? `https://offers.cpx-research.com/index.php?app_id=${encodeURIComponent(
          config.appId
        )}&ext_user_id=${encodeURIComponent(
          config.userId
        )}&secure_hash=${encodeURIComponent(
          config.md5Hash
        )}&username=${encodeURIComponent(config.email)}`
      : "";

  return (
    <div className="space-y-3">
      {/* Honesty Tip Banner */}
      <div className="rounded-xl bg-amber-50 border border-amber-200/90 p-3.5 text-xs text-amber-900 shadow-xs flex items-start space-x-2.5">
        <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-950">Survey Honesty Guidelines</p>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            Survey partners verify your responses using automated fraud detection. Answer honestly, avoid VPNs/proxies, and never rush through questions to prevent account suspension.
          </p>
        </div>
      </div>

      {/* Main Offerwall Container */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-sm">
        {/* Offerwall Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-black text-xs shadow-xs">
              CPX
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">CPX Research Offerwall</h4>
              <p className="text-[10px] text-slate-500">Live verified paid surveys</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            <CheckCircle className="h-3 w-3 text-emerald-600" />
            <span>Instant Credit</span>
          </div>
        </div>

        {/* Content area */}
        <div className="relative min-h-[560px] w-full bg-slate-50">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 p-6 bg-white z-10">
              <div className="h-8 w-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-slate-500">Connecting to CPX Research...</p>
            </div>
          )}

          {!loading && config && config.configured && (
            <>
              {!iframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-6 bg-white z-10">
                  <div className="w-full space-y-3 animate-pulse">
                    <div className="h-16 bg-slate-100 rounded-xl" />
                    <div className="h-16 bg-slate-100 rounded-xl" />
                    <div className="h-16 bg-slate-100 rounded-xl" />
                    <div className="h-16 bg-slate-100 rounded-xl" />
                  </div>
                  <p className="text-xs text-slate-400 font-medium">Loading available surveys...</p>
                </div>
              )}
              <iframe
                src={iframeUrl}
                title="CPX Research Paid Surveys"
                className="w-full h-[620px] border-0"
                onLoad={() => setIframeLoaded(true)}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
              />
            </>
          )}

          {/* No Surveys Available Notice -> Direct to Adsterra Ads */}
          {!loading && (!config || !config.configured) && (
            <div className="p-6 flex flex-col items-center text-center justify-center min-h-[380px] space-y-3.5">
              <div className="h-14 w-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900">
                  Surveys Updating for Your Region
                </h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  No third-party surveys are currently matching your demographic. Surveys refresh automatically every 24 hours.
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-200/90 p-3.5 text-xs text-amber-900 max-w-xs text-left space-y-1.5">
                <p className="font-bold text-amber-950 flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Earn Active Now: Watch Ads</span>
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  You can earn instant coins right now by viewing 15-second sponsored ads above. Each ad credits immediately!
                </p>
              </div>

              <button
                onClick={() => {
                  window.scrollTo({ top: 120, behavior: "smooth" });
                }}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                Go to Watch Ads &amp; Earn ↑
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
