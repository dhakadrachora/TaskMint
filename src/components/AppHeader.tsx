"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Shield, User as UserIcon } from "lucide-react";
import { CoinBadge } from "./CoinBadge";
import { Profile } from "@/lib/types";

interface AppHeaderProps {
  profile: Profile | null;
}

export function AppHeader({ profile }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5 fill-white/20" />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-lg font-black tracking-tight text-slate-900">Task<span className="text-emerald-600">Mint</span></span>
              {profile?.is_admin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center space-x-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.2 hover:bg-indigo-200"
                  title="Admin Dashboard"
                >
                  <Shield className="h-2.5 w-2.5 mr-0.5" />
                  <span>Admin</span>
                </Link>
              )}
            </div>
            <p className="text-[10px] font-medium text-slate-500 leading-none">Micro-Tasks & Surveys</p>
          </div>
        </Link>

        {/* Right side: Coins Pill & Avatar */}
        <div className="flex items-center space-x-2.5">
          <Link href="/wallet" className="hover:opacity-95 transition-opacity">
            <CoinBadge coins={profile?.coins ?? 0} showInr={true} size="sm" />
          </Link>

          <Link
            href="/profile"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 border-2 border-emerald-500/50 overflow-hidden text-slate-700 hover:ring-2 hover:ring-emerald-400 transition-all"
            title="Profile"
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.full_name || "Profile"}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserIcon className="h-4 w-4 text-slate-600" />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
