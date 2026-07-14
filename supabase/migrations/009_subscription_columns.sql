-- ============================================================
-- 009 — Subscription Columns
-- Add subscription tiers and billing state to profiles and contractor_profiles
-- Homeowner: $20/mo base, $10/mo at 10 verified referrals
-- Contractor: Freemium (1 lead/week free) or $49/mo unlimited
-- ============================================================

-- Add subscription columns to profiles (homeowners)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT CHECK (subscription_tier IN ('free', '$20', '$10_referral')),
  ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_renews_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS verified_referral_count INTEGER DEFAULT 0;

-- Add subscription columns to contractor_profiles (contractors)
ALTER TABLE contractor_profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT CHECK (subscription_tier IN ('free', 'paid_unlimited')),
  ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_renews_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create referrals table (for tracking referral count)
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (referrer_id, referred_id)
);

-- Track device/email fingerprints for anti-abuse verification
CREATE TABLE IF NOT EXISTS referral_abuse_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referred_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  device_fingerprint TEXT,
  email_domain TEXT,
  payment_method_hash TEXT,
  referrer_id UUID REFERENCES profiles(id),
  passed_verification BOOLEAN DEFAULT false,
  verification_timestamp TIMESTAMPTZ DEFAULT now(),
  is_demo BOOLEAN NOT NULL DEFAULT false
);

-- INDEXES for subscription and referral queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_active ON profiles(subscription_active);
CREATE INDEX IF NOT EXISTS idx_profiles_verified_referral_count ON profiles(verified_referral_count);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_subscription_active ON contractor_profiles(subscription_active);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_activated ON referrals(activated_at) WHERE activated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referral_abuse_checks_referred ON referral_abuse_checks(referred_id);

-- RLS: Enable and set basic policies (demo isolation RLS added in migration 012)
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_abuse_checks ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own referrals
CREATE POLICY "referrals_user_view" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "abuse_checks_user_view" ON referral_abuse_checks
  FOR SELECT USING (auth.uid() = referred_id);
