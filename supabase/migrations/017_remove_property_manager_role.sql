-- Migration 017: Remove 'property_manager' from profile role constraint
-- Status: NEW
-- Reason: Property manager tier has been removed from product roadmap

-- Drop old constraint (supports homeowner, property_manager, contractor, user, admin)
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add corrected constraint (removes property_manager)
ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check CHECK (role IN ('homeowner', 'contractor', 'user', 'admin'));

-- Update any existing property_manager rows to homeowner
UPDATE profiles SET role = 'homeowner' WHERE role = 'property_manager';
