-- ============================================================
-- 010 — Referral Activation Logic
-- Functions and triggers for automatic price switching at 10 verified referrals
-- Tables created in migration 009; RLS policies in 009 and 012
-- ============================================================

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

-- Note: RLS policies created in migration 009
