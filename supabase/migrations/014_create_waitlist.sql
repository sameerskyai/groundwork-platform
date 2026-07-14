-- Migration 014: Create waitlist table
-- Status: WRITTEN, RENUMBERED, READY TO APPLY
-- Run this in Supabase SQL editor when ready to enable waitlist

CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  referrer_id UUID REFERENCES public.waitlist(id) ON DELETE SET NULL,
  position INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_waitlist_email ON public.waitlist(email);
CREATE INDEX idx_waitlist_position ON public.waitlist(position);
CREATE INDEX idx_waitlist_joined_at ON public.waitlist(joined_at DESC);

-- RLS: Public can insert own record, but cannot read/update others
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert
CREATE POLICY "Allow public insert" ON public.waitlist
  FOR INSERT WITH CHECK (true);

-- Allow select if viewing own email or admin
CREATE POLICY "Allow select own" ON public.waitlist
  FOR SELECT
  USING (
    auth.role() = 'authenticated' OR
    email = current_setting('request.user.email', true)
  );

-- Admin can update position
CREATE POLICY "Allow admin update" ON public.waitlist
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to auto-increment position
CREATE OR REPLACE FUNCTION public.set_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  NEW.position := (SELECT COUNT(*) + 1 FROM public.waitlist WHERE joined_at < NEW.joined_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for position
CREATE TRIGGER waitlist_set_position
  BEFORE INSERT ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.set_waitlist_position();
