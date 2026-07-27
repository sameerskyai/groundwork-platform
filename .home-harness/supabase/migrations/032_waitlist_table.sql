-- Migration 032: Waitlist table for growth + referral mechanics

CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  position_number BIGINT NOT NULL DEFAULT 0,
  referral_code TEXT NOT NULL UNIQUE,
  referrer_id UUID,
  verified_referral_count INT NOT NULL DEFAULT 0,
  founding_member BOOLEAN NOT NULL DEFAULT FALSE,
  backstory_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  homeowner_plus_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  founding_500 BOOLEAN NOT NULL DEFAULT FALSE,
  sms_consent BOOLEAN NOT NULL DEFAULT FALSE,
  sms_consent_language TEXT,
  sms_consent_timestamp TIMESTAMP WITH TIME ZONE,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  ip_address TEXT,
  user_agent TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (verified_referral_count >= 0)
);

CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_phone ON waitlist(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_waitlist_referral_code ON waitlist(referral_code);
CREATE INDEX idx_waitlist_position ON waitlist(position_number);
CREATE INDEX idx_waitlist_created_at ON waitlist(created_at DESC);
CREATE INDEX idx_waitlist_verified_referral_count ON waitlist(verified_referral_count DESC);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can INSERT
CREATE POLICY "Anyone can sign up" ON waitlist FOR INSERT WITH CHECK (true);

-- Policy: Can read only non-demo rows
CREATE POLICY "Can read public data" ON waitlist AS RESTRICTIVE FOR SELECT USING (is_demo = false);

-- Grants
GRANT SELECT, INSERT ON waitlist TO authenticated;
GRANT SELECT ON waitlist TO anon;
GRANT ALL ON waitlist TO service_role;
