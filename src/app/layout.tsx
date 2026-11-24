import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://taskmint-iota.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TaskMint - Watch Ads & Earn Real UPI Cash Online India",
    template: "%s | TaskMint Rewards",
  },
  description:
    "TaskMint is India's leading micro-rewards web app. Watch short 15-second sponsor ads, claim daily streak bonuses, and refer friends to earn real cash instantly redeemable directly to your UPI ID (GPay, PhonePe, Paytm).",
  keywords: [
    "TaskMint",
    "Watch Ads and Earn Money",
    "Watch Ads Earn UPI Cash",
    "Daily Checkin Earn Money",
    "Online Earning App India",
    "Real Cash Rewards App",
    "Best GPT Site India",
    "Earn Free UPI Cash",
    "Instagram Views Store Cheap",
    "Adsterra Rewarded Ads",
    "Paisa Kamane Wala Web App",
  ],
  authors: [{ name: "TaskMint Official Team", url: siteUrl }],
  creator: "TaskMint",
  publisher: "TaskMint",
  applicationName: "TaskMint",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    title: "TaskMint - Watch Ads & Earn Real UPI Cash Online India",
    description:
      "Earn real money daily by watching short sponsored ads, daily check-ins, and inviting friends. Instant payout directly to your UPI ID!",
    siteName: "TaskMint",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskMint - Watch Ads & Earn Real UPI Cash",
    description: "Earn real cash every day. Instant withdrawal to GPay, PhonePe & Paytm UPI.",
  },
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TaskMint",
    url: siteUrl,
    description:
      "Mobile-first micro-rewards platform to earn real cash via sponsored ads, daily check-ins, and referrals.",
    applicationCategory: "FinanceApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "1480",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-100 antialiased flex flex-col items-center justify-start"
      >
        {children}
      </body>
    </html>
  );
}
