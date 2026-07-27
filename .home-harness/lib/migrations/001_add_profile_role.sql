-- Migration: Add role field to profiles table
-- Status: WRITTEN BUT NOT APPLIED (requires Supabase credentials)
-- Run this in Supabase SQL editor when admin enforcement is ready

-- Add role column if not exists
ALTER TABLE profiles
ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'contractor'));

-- Create index for admin queries
CREATE INDEX idx_profiles_role ON profiles(role);

-- Update existing rows (if any) to ensure role is set
UPDATE profiles SET role = 'user' WHERE role IS NULL;
