import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskMint - Complete Surveys & Micro-Tasks to Earn Real Cash",
  description: "Join TaskMint to complete paid CPX surveys, daily check-ins, and refer friends to earn coins instantly redeemable to UPI cash.",
  keywords: ["TaskMint", "GPT App", "Earn Money", "Surveys", "UPI Cash", "CPX Research", "Micro tasks"],
  authors: [{ name: "TaskMint Team" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10B981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-100 antialiased flex flex-col items-center justify-start"
      >
        {children}
      </body>
    </html>
  );
}
