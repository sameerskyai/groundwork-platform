-- Migration 013: Update profile role constraint to support admin
-- Status: WRITTEN, RENUMBERED, READY TO APPLY
-- The role column exists from migration 001, but needs constraint update

-- Update constraint: drop old, add new with admin support
ALTER TABLE profiles
DROP CONSTRAINT profiles_role_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check CHECK (role IN ('homeowner', 'property_manager', 'contractor', 'user', 'admin'));

-- Create index for admin queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
