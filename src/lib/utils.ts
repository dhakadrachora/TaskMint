import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 100 Coins = 10 INR (10 Coins = 1 INR)
export function coinsToInr(coins: number): number {
  return Number((coins / 10).toFixed(2));
}

export function inrToCoins(inr: number): number {
  return Math.round(inr * 10);
}

export function formatCoins(coins: number | null | undefined): string {
  if (coins === null || coins === undefined) return "0";
  return new Intl.NumberFormat("en-IN").format(coins);
}

export function formatInr(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "₹0";
  return `₹${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

export function validateUpiId(upiId: string): boolean {
  // Common UPI format: username@bank / mobile@upi
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId.trim());
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}
