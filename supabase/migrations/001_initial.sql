-- ============================================================
-- CRAFTMATCH PLATFORM — INITIAL SCHEMA
-- All location routing via ZIP/lat-long only. No hardcoded regions.
-- ============================================================

-- Trades taxonomy (config table — add trades without code changes)
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO trades (name, slug, description, icon) VALUES
  ('General Contractor', 'general-contractor', 'Full-scale renovations, additions, and remodels', 'hammer'),
  ('HVAC', 'hvac', 'Heating, ventilation, and air conditioning', 'wind'),
  ('Plumbing', 'plumbing', 'Pipes, fixtures, water heaters, drains', 'droplets'),
  ('Electrical', 'electrical', 'Wiring, panels, outlets, lighting', 'zap'),
  ('Roofing', 'roofing', 'Roof replacement, repair, and inspection', 'home'),
  ('Flooring', 'flooring', 'Hardwood, tile, carpet, vinyl installation', 'layout'),
  ('Painting', 'painting', 'Interior and exterior painting', 'paintbrush'),
  ('Landscaping', 'landscaping', 'Lawn care, design, and installation', 'tree'),
  ('Windows & Doors', 'windows-doors', 'Installation and replacement', 'square'),
  ('Handyman', 'handyman', 'General repairs and small projects', 'wrench');

-- Trade-specific onboarding questions (config table — no code changes to add questions)
CREATE TABLE trade_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  field_key TEXT NOT NULL, -- e.g. "kitchen_sqft_rate"
  unit TEXT, -- e.g. "per sqft", "per hour", "flat rate"
  input_type TEXT DEFAULT 'range', -- range | flat | hourly
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true
);

INSERT INTO trade_questions (trade_id, question, field_key, unit, input_type, display_order) VALUES
  -- General Contractor
  ((SELECT id FROM trades WHERE slug='general-contractor'), 'What do you typically charge per square foot for a kitchen remodel?', 'kitchen_sqft_rate', 'per sqft', 'range', 1),
  ((SELECT id FROM trades WHERE slug='general-contractor'), 'What is your typical range for a full bathroom renovation?', 'bathroom_reno_range', 'flat rate', 'range', 2),
  ((SELECT id FROM trades WHERE slug='general-contractor'), 'What is your standard day rate for a crew?', 'crew_day_rate', 'per day', 'flat', 3),
  ((SELECT id FROM trades WHERE slug='general-contractor'), 'What is your typical range for a home addition per square foot?', 'addition_sqft_rate', 'per sqft', 'range', 4),
  -- HVAC
  ((SELECT id FROM trades WHERE slug='hvac'), 'What is your standard service call rate?', 'service_call_rate', 'flat rate', 'flat', 1),
  ((SELECT id FROM trades WHERE slug='hvac'), 'What is the typical cost to replace a residential HVAC unit?', 'unit_replacement_range', 'flat rate', 'range', 2),
  ((SELECT id FROM trades WHERE slug='hvac'), 'What do you charge per hour for labor?', 'hourly_rate', 'per hour', 'hourly', 3),
  ((SELECT id FROM trades WHERE slug='hvac'), 'What is your typical range for ductwork installation?', 'ductwork_range', 'flat rate', 'range', 4),
  -- Plumbing
  ((SELECT id FROM trades WHERE slug='plumbing'), 'What is your standard service call rate?', 'service_call_rate', 'flat rate', 'flat', 1),
  ((SELECT id FROM trades WHERE slug='plumbing'), 'What do you charge per hour for labor?', 'hourly_rate', 'per hour', 'hourly', 2),
  ((SELECT id FROM trades WHERE slug='plumbing'), 'What is your typical range to replace a water heater?', 'water_heater_range', 'flat rate', 'range', 3),
  ((SELECT id FROM trades WHERE slug='plumbing'), 'What is your typical range for a full bathroom plumbing rough-in?', 'bathroom_roughin_range', 'flat rate', 'range', 4),
  -- Electrical
  ((SELECT id FROM trades WHERE slug='electrical'), 'What is your standard service call rate?', 'service_call_rate', 'flat rate', 'flat', 1),
  ((SELECT id FROM trades WHERE slug='electrical'), 'What do you charge per hour for labor?', 'hourly_rate', 'per hour', 'hourly', 2),
  ((SELECT id FROM trades WHERE slug='electrical'), 'What is your typical range to upgrade an electrical panel?', 'panel_upgrade_range', 'flat rate', 'range', 3),
  ((SELECT id FROM trades WHERE slug='electrical'), 'What do you charge per outlet for installation?', 'outlet_rate', 'per outlet', 'flat', 4),
  -- Roofing
  ((SELECT id FROM trades WHERE slug='roofing'), 'What do you charge per square (100 sqft) for shingle replacement?', 'shingle_per_square', 'per square', 'flat', 1),
  ((SELECT id FROM trades WHERE slug='roofing'), 'What is your typical range for a full roof replacement on a 2,000 sqft home?', 'full_replacement_range', 'flat rate', 'range', 2),
  ((SELECT id FROM trades WHERE slug='roofing'), 'What do you charge for a roof inspection?', 'inspection_rate', 'flat rate', 'flat', 3),
  -- Flooring
  ((SELECT id FROM trades WHERE slug='flooring'), 'What do you charge per square foot to install hardwood flooring?', 'hardwood_sqft_rate', 'per sqft', 'flat', 1),
  ((SELECT id FROM trades WHERE slug='flooring'), 'What do you charge per square foot to install tile?', 'tile_sqft_rate', 'per sqft', 'flat', 2),
  ((SELECT id FROM trades WHERE slug='flooring'), 'What do you charge per square foot to install carpet?', 'carpet_sqft_rate', 'per sqft', 'flat', 3),
  -- Painting
  ((SELECT id FROM trades WHERE slug='painting'), 'What do you charge per square foot for interior painting?', 'interior_sqft_rate', 'per sqft', 'flat', 1),
  ((SELECT id FROM trades WHERE slug='painting'), 'What do you charge per square foot for exterior painting?', 'exterior_sqft_rate', 'per sqft', 'flat', 2),
  ((SELECT id FROM trades WHERE slug='painting'), 'What is your typical range to paint an average-sized room?', 'room_range', 'flat rate', 'range', 3),
  -- Landscaping
  ((SELECT id FROM trades WHERE slug='landscaping'), 'What do you charge per hour for lawn maintenance?', 'maintenance_hourly', 'per hour', 'hourly', 1),
  ((SELECT id FROM trades WHERE slug='landscaping'), 'What is your typical range for a full landscape design and installation?', 'full_install_range', 'flat rate', 'range', 2),
  -- Windows & Doors
  ((SELECT id FROM trades WHERE slug='windows-doors'), 'What is your typical cost to install a standard window?', 'window_install_rate', 'per window', 'flat', 1),
  ((SELECT id FROM trades WHERE slug='windows-doors'), 'What is your typical cost to install an exterior door?', 'door_install_rate', 'per door', 'flat', 2),
  -- Handyman
  ((SELECT id FROM trades WHERE slug='handyman'), 'What do you charge per hour?', 'hourly_rate', 'per hour', 'hourly', 1),
  ((SELECT id FROM trades WHERE slug='handyman'), 'What is your minimum service call charge?', 'minimum_charge', 'flat rate', 'flat', 2);

-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('homeowner', 'property_manager', 'contractor')),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  zip_code TEXT,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contractor profiles
CREATE TABLE contractor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT,
  bio TEXT, -- AI-generated from interview answers
  license_number TEXT,
  license_verified BOOLEAN DEFAULT false,
  insured BOOLEAN DEFAULT false,
  bonded BOOLEAN DEFAULT false,
  years_in_business INTEGER,
  service_radius_miles INTEGER DEFAULT 25,
  portfolio_urls TEXT[], -- photo URLs
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  response_rate INTEGER DEFAULT 100, -- percentage
  subscription_tier TEXT CHECK (subscription_tier IN ('standard', 'growth')) DEFAULT 'standard',
  subscription_active BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  daily_leads_used INTEGER DEFAULT 0,
  daily_leads_reset_at DATE DEFAULT CURRENT_DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contractor ↔ Trades (many-to-many)
CREATE TABLE contractor_trades (
  contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  PRIMARY KEY (contractor_id, trade_id)
);

-- Contractor pricing answers (structured, filterable)
CREATE TABLE contractor_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES trades(id),
  field_key TEXT NOT NULL,
  value_low DECIMAL(10,2),
  value_high DECIMAL(10,2),
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (contractor_id, trade_id, field_key)
);

-- Cost data table (proprietary asset — append real job data continuously)
CREATE TABLE cost_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_type TEXT NOT NULL,
  trade_id UUID REFERENCES trades(id),
  zip_code TEXT,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  region_label TEXT, -- generic label only, never hardcoded city/state logic
  cost_low DECIMAL(10,2) NOT NULL,
  cost_high DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL, -- 'per sqft', 'per unit', 'flat'
  source TEXT, -- 'renova_job', 'contractor_interview', 'completed_match'
  source_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Homeowner projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT NOT NULL,
  trade_id UUID REFERENCES trades(id),
  zip_code TEXT NOT NULL,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  photo_urls TEXT[],
  -- AI classification results
  ai_project_type TEXT,
  ai_scope TEXT, -- 'small' | 'medium' | 'large'
  ai_estimate_low DECIMAL(10,2),
  ai_estimate_high DECIMAL(10,2),
  ai_labor_estimate DECIMAL(10,2),
  ai_materials_estimate DECIMAL(10,2),
  ai_reasoning TEXT,
  -- Paywall
  estimate_paid BOOLEAN DEFAULT false,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matched', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscription tiers config (change tiers without code deploy)
CREATE TABLE subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  price_monthly DECIMAL(10,2) NOT NULL,
  daily_lead_cap INTEGER NOT NULL,
  features JSONB DEFAULT '[]',
  stripe_price_id TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO subscription_tiers (name, slug, price_monthly, daily_lead_cap, features) VALUES
  ('Standard', 'standard', 79.00, 5, '["Up to 5 leads/day", "Public profile", "Basic analytics"]'),
  ('Growth', 'growth', 149.00, 20, '["Up to 20 leads/day", "Priority placement", "Advanced analytics", "Featured badge"]');

-- Matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  -- Swipe states
  homeowner_swiped_at TIMESTAMPTZ, -- when homeowner requested
  contractor_swiped_at TIMESTAMPTZ, -- when contractor accepted
  matched_at TIMESTAMPTZ, -- when both confirmed = chat unlocks
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contractor_review', 'matched', 'declined', 'expired')),
  -- AI match score
  match_score DECIMAL(4,3),
  match_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, contractor_id)
);

-- Messages (tied to match)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID UNIQUE REFERENCES matches(id),
  contractor_id UUID REFERENCES contractor_profiles(id),
  reviewer_id UUID REFERENCES profiles(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  final_price DECIMAL(10,2), -- confirmed job cost for cost_data
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Property manager portfolios
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit_count INTEGER DEFAULT 1,
  zip_codes TEXT[],
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_contractor_profiles_zip ON contractor_profiles(subscription_active);
CREATE INDEX idx_profiles_zip ON profiles(zip_code);
CREATE INDEX idx_projects_zip ON projects(zip_code);
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_matches_project ON matches(project_id);
CREATE INDEX idx_matches_contractor ON matches(contractor_id);
CREATE INDEX idx_messages_match ON messages(match_id);
CREATE INDEX idx_cost_data_zip ON cost_data(zip_code);
CREATE INDEX idx_cost_data_type ON cost_data(project_type);
CREATE INDEX idx_contractor_pricing_contractor ON contractor_pricing(contractor_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: users see their own
CREATE POLICY "users_own_profile" ON profiles FOR ALL USING (auth.uid() = id);
-- Contractor profiles: public read, owner write
CREATE POLICY "contractor_profiles_public_read" ON contractor_profiles FOR SELECT USING (true);
CREATE POLICY "contractor_profiles_owner_write" ON contractor_profiles FOR ALL USING (auth.uid() = user_id);
-- Projects: owner full access
CREATE POLICY "projects_owner" ON projects FOR ALL USING (auth.uid() = user_id);
-- Matches: both parties can read
CREATE POLICY "matches_parties" ON matches FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM projects WHERE id = project_id) OR
  auth.uid() = (SELECT user_id FROM contractor_profiles WHERE id = contractor_id)
);
-- Messages: match participants only
CREATE POLICY "messages_participants" ON messages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM matches m
    JOIN projects p ON p.id = m.project_id
    JOIN contractor_profiles cp ON cp.id = m.contractor_id
    WHERE m.id = match_id
    AND (auth.uid() = p.user_id OR auth.uid() = cp.user_id)
  )
);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER contractor_profiles_updated_at BEFORE UPDATE ON contractor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
