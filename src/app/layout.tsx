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
  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#webapp`,
        name: "TaskMint",
        url: siteUrl,
        description:
          "India's #1 micro-rewards platform to earn real UPI cash and free Instagram views by watching short ads, claiming daily streak bonuses, and referring friends.",
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
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "What is TaskMint and how does it work?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "TaskMint is a 100% free Indian rewards platform where users earn virtual coins by watching 15-second sponsor ads, claiming daily check-in streaks, and referring friends. Coins can be redeemed for real cash via UPI (Google Pay, PhonePe, Paytm) or exchanged for real Instagram video views.",
            },
          },
          {
            "@type": "Question",
            name: "How can I earn real money or UPI cash on TaskMint?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "You can earn coins every day by: 1) Claiming the Daily Check-in (+2 Coins), 2) Watching 15-second sponsor ads (+1 Coin per ad), and 3) Referring friends. Once your balance reaches 100 Coins (₹10), you can instantly withdraw directly to your UPI ID.",
            },
          },
          {
            "@type": "Question",
            name: "How do I get free Instagram views with TaskMint?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "In TaskMint, navigate to the Views section. Paste your public Instagram Reel or video URL, choose your desired quantity (1,000 to 50,000 views), and pay using your earned coins. Real views are delivered directly to your video within 1 to 24 hours.",
            },
          },
          {
            "@type": "Question",
            name: "Is TaskMint free to join?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, TaskMint is 100% free with zero investment. You can get started immediately with just your name, no complex passwords or bank details required upfront.",
            },
          },
          {
            "@type": "Question",
            name: "What is the minimum withdrawal amount on TaskMint?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The minimum withdrawal is just ₹10 (100 coins) directly transferred to Google Pay, PhonePe, or Paytm UPI.",
            },
          },
        ],
      },
      {
        "@type": "HowTo",
        "@id": `${siteUrl}/#howto`,
        name: "How to Earn Real Cash and Free Instagram Views on TaskMint",
        description: "Step-by-step guide to earning reward coins and converting them into real UPI cash or Instagram views.",
        step: [
          {
            "@type": "HowToStep",
            name: "Join TaskMint for Free",
            text: "Open https://taskmint-iota.vercel.app and enter your name to start earning instantly with a signup bonus.",
          },
          {
            "@type": "HowToStep",
            name: "Collect Coins Daily",
            text: "Claim daily check-ins (+2 Coins) and watch 15-second short sponsored ads (+1 Coin per view).",
          },
          {
            "@type": "HowToStep",
            name: "Redeem for Views or UPI Cash",
            text: "Use your coins in the Views tab for real Instagram views or withdraw directly to your UPI ID in the Wallet tab.",
          },
        ],
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
        />
        <script
          src="https://quge5.com/88/tag.min.js"
          data-zone="315488"
          async
          data-cfasync="false"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(){});
                });
              }
            `,
          }}
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
