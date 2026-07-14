-- ============================================================
-- 009 — Referral System
-- Referral counter, verification logic, and $10/mo price switch
-- ============================================================

-- Referral tables already created in migration 008
-- This migration adds logic and triggers for automatic price switching

-- Function: increment referral count and check for $10/mo switch
CREATE OR REPLACE FUNCTION activate_referral(referral_id UUID)
RETURNS VOID AS $$
DECLARE
  referrer_id UUID;
  new_count INT;
BEGIN
  -- Get referral details
  SELECT r.referrer_id INTO referrer_id
  FROM referrals r
  WHERE r.id = referral_id;

  IF referrer_id IS NULL THEN
    RAISE EXCEPTION 'Referral not found: %', referral_id;
  END IF;

  -- Mark referral as activated
  UPDATE referrals SET activated_at = now()
  WHERE id = referral_id;

  -- Increment verified referral count
  UPDATE profiles
  SET verified_referral_count = verified_referral_count + 1
  WHERE id = referrer_id
  RETURNING verified_referral_count INTO new_count;

  -- Check if we hit 10 referrals (trigger price switch)
  IF new_count = 10 THEN
    UPDATE profiles
    SET subscription_tier = '$10_referral'
    WHERE id = referrer_id
      AND subscription_tier != '$10_referral';

    -- In production: trigger Stripe webhook to update price
    -- For now, just mark in DB
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger on referrals.activated_at update
CREATE OR REPLACE FUNCTION check_referral_switch()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.activated_at IS NOT NULL AND OLD.activated_at IS NULL THEN
    PERFORM activate_referral(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS referral_activation_trigger ON referrals;
CREATE TRIGGER referral_activation_trigger
AFTER UPDATE ON referrals
FOR EACH ROW
EXECUTE FUNCTION check_referral_switch();

-- RLS: enable on referrals and referral_abuse_checks
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_abuse_checks ENABLE ROW LEVEL SECURITY;

-- Allow users to view their referrals
DROP POLICY IF EXISTS "referrals_user_view" ON referrals;
CREATE POLICY "referrals_user_view" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

DROP POLICY IF EXISTS "abuse_checks_user_view" ON referral_abuse_checks;
CREATE POLICY "abuse_checks_user_view" ON referral_abuse_checks
  FOR SELECT USING (auth.uid() = referred_id);
