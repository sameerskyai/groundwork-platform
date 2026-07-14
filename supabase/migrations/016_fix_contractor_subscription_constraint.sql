-- Migration 016: Fix contractor_profiles subscription_tier constraint
-- Status: NEW
-- Fixes: Drop old constraint, update old values, add correct constraint

-- Drop old constraint first (so we can update values)
ALTER TABLE contractor_profiles
DROP CONSTRAINT IF EXISTS contractor_profiles_subscription_tier_check;

-- Update old subscription tier values to new ones
UPDATE contractor_profiles SET subscription_tier = 'free' WHERE subscription_tier = 'standard';
UPDATE contractor_profiles SET subscription_tier = 'paid_unlimited' WHERE subscription_tier = 'growth';
-- Set any NULL to 'free' (sensible default)
UPDATE contractor_profiles SET subscription_tier = 'free' WHERE subscription_tier IS NULL;

-- Add correct constraint
ALTER TABLE contractor_profiles
ADD CONSTRAINT contractor_profiles_subscription_tier_check CHECK (subscription_tier IN ('free', 'paid_unlimited'));
