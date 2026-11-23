"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Users, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    label: "Earn",
    href: "/",
    icon: Sparkles,
  },
  {
    label: "Refer",
    href: "/refer",
    icon: Users,
  },
  {
    label: "Wallet",
    href: "/wallet",
    icon: Wallet,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-3 py-1.5">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 group active:scale-95",
                  isActive
                    ? "text-emerald-600 font-bold"
                    : "text-slate-500 hover:text-slate-900 font-medium"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-lg transition-transform",
                    isActive
                      ? "bg-emerald-50 text-emerald-600 scale-110 shadow-sm"
                      : "group-hover:scale-105"
                  )}
                >
                  <Icon className={cn("h-5 w-5 transition-colors", isActive ? "stroke-[2.5]" : "stroke-2")} />
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight">
                  {item.label}
                </span>
                {isActive && (
                  <span className="h-1 w-4 rounded-full bg-emerald-500 mt-0.5" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
