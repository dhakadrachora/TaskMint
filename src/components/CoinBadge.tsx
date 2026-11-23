import React from "react";
import { Coins } from "lucide-react";
import { formatCoins, coinsToInr, formatInr, cn } from "@/lib/utils";

interface CoinBadgeProps {
  coins: number | null | undefined;
  showInr?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CoinBadge({ coins = 0, showInr = true, size = "md", className }: CoinBadgeProps) {
  const safeCoins = coins ?? 0;
  const inr = coinsToInr(safeCoins);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3.5 py-1.5 gap-2 font-semibold",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 font-medium shadow-sm transition-transform active:scale-95",
        sizeClasses[size],
        className
      )}
    >
      <div className="flex items-center justify-center rounded-full bg-amber-500 text-white p-0.5 shadow-sm animate-pulse">
        <Coins className={iconSizes[size]} />
      </div>
      <span className="font-bold text-amber-950">{formatCoins(safeCoins)}</span>
      <span className="text-amber-700 font-semibold text-[0.85em]">Coins</span>
      {showInr && (
        <>
          <span className="text-amber-300 font-normal">|</span>
          <span className="text-emerald-700 font-bold">{formatInr(inr)}</span>
        </>
      )}
    </div>
  );
}
