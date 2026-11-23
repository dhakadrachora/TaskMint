-- TaskMint: Supabase Database Schema
-- Mobile-First Get-Paid-To (GPT) Survey & Micro-Task Web App

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  coins INT NOT NULL DEFAULT 10,
  commission_coins INT NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by TEXT,
  last_checkin TIMESTAMPTZ,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure phone & commission_coins columns exist if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS commission_coins INT NOT NULL DEFAULT 0;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- 2. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trans_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('survey', 'checkin', 'referral', 'signup_bonus', 'withdrawal', 'refund')),
  amount_coins INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'reversed', 'pending', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_trans_id ON public.transactions(trans_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- 3. WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  upi_id TEXT NOT NULL,
  coins INT NOT NULL CHECK (coins > 0),
  amount_inr NUMERIC(10, 2) NOT NULL CHECK (amount_inr > 0),
  wallet_type TEXT NOT NULL DEFAULT 'earning' CHECK (wallet_type IN ('earning', 'commission')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure wallet_type column exists if table was already created
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS wallet_type TEXT NOT NULL DEFAULT 'earning';

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON public.withdrawals(created_at DESC);

-- 4. ATOMIC FUNCTION: increment_coins
-- Safely increments or decrements user self-earning coins atomically with row lock
CREATE OR REPLACE FUNCTION public.increment_coins(user_uuid UUID, coin_amount INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_bal INT;
  new_bal INT;
BEGIN
  -- Lock row for update
  SELECT coins INTO current_bal
  FROM public.profiles
  WHERE id = user_uuid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found: %', user_uuid;
  END IF;

  -- Ensure balance does not drop below 0
  IF (current_bal + coin_amount) < 0 THEN
    RAISE EXCEPTION 'Insufficient coins: current balance %, requested change %', current_bal, coin_amount;
  END IF;

  UPDATE public.profiles
  SET coins = coins + coin_amount
  WHERE id = user_uuid
  RETURNING coins INTO new_bal;

  RETURN new_bal;
END;
$$;

-- 5. ATOMIC FUNCTION: increment_commission_coins
-- Safely increments or decrements referral commission coins atomically with row lock
CREATE OR REPLACE FUNCTION public.increment_commission_coins(user_uuid UUID, coin_amount INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_bal INT;
  new_bal INT;
BEGIN
  -- Lock row for update
  SELECT commission_coins INTO current_bal
  FROM public.profiles
  WHERE id = user_uuid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found: %', user_uuid;
  END IF;

  -- Ensure balance does not drop below 0
  IF (current_bal + coin_amount) < 0 THEN
    RAISE EXCEPTION 'Insufficient commission coins: current balance %, requested change %', current_bal, coin_amount;
  END IF;

  UPDATE public.profiles
  SET commission_coins = commission_coins + coin_amount
  WHERE id = user_uuid
  RETURNING commission_coins INTO new_bal;

  RETURN new_bal;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_coins(UUID, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_commission_coins(UUID, INT) TO authenticated, service_role;

-- 6. FUNCTION & TRIGGER: on_auth_user_created
-- Generates a 6-character alphanumeric referral code and credits 10 coins (₹1) signup bonus
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_ref_code TEXT;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- removed ambiguous I, O, 0, 1
  code_exists BOOLEAN := TRUE;
  referrer_code TEXT;
  referrer_exists BOOLEAN := FALSE;
  i INT;
BEGIN
  -- Generate unique 6-character uppercase referral code
  WHILE code_exists LOOP
    new_ref_code := '';
    FOR i IN 1..6 LOOP
      new_ref_code := new_ref_code || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
    END LOOP;

    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_ref_code) INTO code_exists;
  END LOOP;

  -- Extract referral code from user metadata if provided
  referrer_code := NULLIF(TRIM(UPPER(COALESCE(NEW.raw_user_meta_data->>'referred_by', ''))), '');

  IF referrer_code IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = referrer_code) INTO referrer_exists;
    IF NOT referrer_exists THEN
      referrer_code := NULL;
    END IF;
  END IF;

  -- Insert profile with 10 signup bonus coins and 0 commission coins
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    avatar_url,
    coins,
    commission_coins,
    referral_code,
    referred_by,
    is_admin,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    10,
    0,
    new_ref_code,
    referrer_code,
    FALSE,
    NOW()
  );

  -- Log 10 coins signup bonus transaction
  INSERT INTO public.transactions (
    user_id,
    trans_id,
    type,
    amount_coins,
    status
  ) VALUES (
    NEW.id,
    'signup_' || NEW.id || '_' || floor(extract(epoch from now())),
    'signup_bonus',
    10,
    'completed'
  );

  RETURN NEW;
END;
$$;
$$;

-- Create auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Transactions Policies
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Service role can insert/update transactions"
  ON public.transactions FOR ALL
  USING (auth.role() = 'service_role' OR public.is_admin());

-- Withdrawals Policies
CREATE POLICY "Users can view own withdrawals"
  ON public.withdrawals FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own withdrawals"
  ON public.withdrawals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update withdrawals"
  ON public.withdrawals FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
