# TaskMint 🪙📱

**TaskMint** is a production-ready, mobile-first Get-Paid-To (GPT) Survey & Micro-Task Web Application built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase**. It is 100% deployable on Vercel's free tier without requiring a custom domain.

---

## ✨ Features

- **Mobile App Look & Feel**: Center-aligned mobile container on desktop (`max-w-md mx-auto min-h-screen bg-slate-50 shadow-xl`), edge-to-edge on mobile devices, with a fixed 4-tab bottom navigation bar (`Earn`, `Refer`, `Wallet`, `Profile`).
- **Standard Currency System**: `100 Coins = ₹10 INR` (`10 Coins = ₹1 INR`). Both Coins and INR values are consistently displayed.
- **Authentication & Referral Capture**:
  - Secure "Continue with Google" sign-in via Supabase OAuth.
  - Automatic `?ref=CODE` referral code capture from URL query parameters.
- **Earn Dashboard (`/`)**:
  - Glowing balance card with live coin balance & real cash valuation.
  - **Daily Check-in**: Awards `+10 Coins` every 24 hours with live countdown timer and confetti animations.
  - **CPX Research Offerwall**: Securely embedded iframe with server-generated MD5 signature (`md5(userId + "-" + CPX_SECURE_HASH)`), loading skeleton, and anti-fraud honesty tip banner.
- **Refer & Earn (`/refer`)**:
  - Unique 6-character referral code and link (`${origin}/login?ref=CODE`).
  - 1-click Copy to clipboard and direct **Share on WhatsApp** integration.
  - **10% Lifetime Commission** on every survey completed by referred friends.
  - Detailed referral statistics and commission payout ledger.
- **Wallet & Instant UPI Withdrawals (`/wallet`)**:
  - Real-time UPI VPA validation (`username@bank` or `mobile@upi`).
  - Preset payout options: `₹50 (500 Coins)`, `₹100 (1000 Coins)`, `₹250 (2500 Coins)`.
  - **Tiered Minimum Rules**: First withdrawal threshold is `500 Coins (₹50)`; subsequent withdrawals require `1000 Coins (₹100)`.
  - Atomically locks and deducts coins with instant database rollback on error.
  - Tabbed history for **Withdrawals** (Pending, Paid, Rejected badges) and **Earnings**.
- **Admin Management Panel (`/admin`)**:
  - Protected route restricted to `profile.is_admin === true`.
  - Metrics cards: Total Registered Users, Total Coins Distributed, Pending Payouts (`₹`).
  - Payout moderation table with 1-click **"Mark as Paid"** and **"Reject & Refund"** (which automatically returns coins to the user via atomic PostgreSQL RPC).
- **CPX S2S Postback Webhook (`/api/postback/cpx`)**:
  - Validates cryptographic MD5 signature `md5(trans_id + "-" + CPX_SECURE_HASH)`.
  - **70/30 Split**: Converts USD earnings ($1 USD = 1000 Coins base) into 70% user coins and 30% platform margin.
  - Automatic duplicate transaction protection (idempotent `trans_id`).
  - Automatically awards 10% commission to the referrer if applicable.
  - Supports status `2` reversals / chargebacks.
- **Legal Compliance Pages (`/privacy` & `/terms`)**:
  - Professional, comprehensive privacy policy and terms explicitly tailored for CPX Research publisher approval.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server & Client Components)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **Backend / Database**: Supabase (PostgreSQL, Row Level Security, RPC Functions, Database Triggers)
- **Auth**: Supabase Auth (Google OAuth)
- **Icons**: Lucide React
- **Animations / Confetti**: Canvas Confetti

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase Database
1. Create a free project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open `supabase_schema.sql` in this repo, copy its contents, and run it.
4. Enable **Google Provider** under **Authentication -> Providers -> Google**:
   - Provide your Google Client ID and Secret from Google Cloud Console.
   - Add your redirect URL: `https://<your-project-id>.supabase.co/auth/v1/callback`.

### 3. Setup Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_CPX_APP_ID=your_cpx_app_id
CPX_SECURE_HASH=your_cpx_secure_hash_secret
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser (or use mobile responsive preview mode).

### 5. Verify Production Build
```bash
npm run build
```

---

## 🌐 Deploy to Vercel (Free Tier)

1. Push this repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your `TaskMint` repository.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_CPX_APP_ID`
   - `CPX_SECURE_HASH`
5. Click **Deploy**. Your app will be live on `https://<your-project>.vercel.app`!
6. In your Supabase Dashboard:
   - Navigate to **Authentication -> URL Configuration**.
   - Set **Site URL** to `https://<your-project>.vercel.app`.
   - Add `https://<your-project>.vercel.app/**` to **Redirect URLs**.
7. In your CPX Research Publisher Dashboard:
   - Set Postback URL to: `https://<your-project>.vercel.app/api/postback/cpx?status={status}&trans_id={trans_id}&user_id={ext_user_id}&amount_usd={amount_usd}&hash={secure_hash}`.

---

## 🛡️ Setting up an Admin User

To grant a user administrative privileges:
1. Sign up on the app with your Google account.
2. In Supabase **Table Editor**, open the `profiles` table.
3. Set `is_admin = TRUE` for your user row.
4. Refresh the app: an "Admin" badge will appear in your header and profile, giving you access to `/admin`.
