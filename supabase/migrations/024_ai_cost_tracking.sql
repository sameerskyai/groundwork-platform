-- KILL 12: AI COST CAP & TRACKING
-- Track API call costs and enforce free tier limits

CREATE TABLE IF NOT EXISTS ai_api_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL CHECK (call_type IN ('estimate', 'match_scoring', 'other')),
  provider TEXT NOT NULL DEFAULT 'anthropic',
  model TEXT NOT NULL,
  input_tokens INT,
  output_tokens INT,
  total_cost_cents INT NOT NULL DEFAULT 0,
  response_cached BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_demo BOOLEAN DEFAULT false
);

-- Track monthly usage per user (for free tier enforcement)
CREATE TABLE IF NOT EXISTS user_monthly_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: "2026-07"
  estimate_calls_count INT DEFAULT 0,
  total_tokens_used INT DEFAULT 0,
  total_cost_cents INT DEFAULT 0,
  is_demo BOOLEAN DEFAULT false,
  UNIQUE(user_id, month_year, is_demo)
);

-- Cost limits by tier
CREATE TABLE IF NOT EXISTS cost_limits (
  tier TEXT PRIMARY KEY,
  monthly_estimate_calls_limit INT NOT NULL,
  monthly_cost_limit_cents INT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Initialize cost limits
INSERT INTO cost_limits (tier, monthly_estimate_calls_limit, monthly_cost_limit_cents) VALUES
  ('free', 3, 500), -- $5.00 monthly limit
  ('pro', 100, 10000), -- $100 monthly limit
  ('enterprise', NULL, NULL)
ON CONFLICT (tier) DO NOTHING;

-- Function to log API call and check free tier limit
CREATE OR REPLACE FUNCTION log_api_call(
  p_user_id UUID,
  p_call_type TEXT,
  p_model TEXT,
  p_input_tokens INT,
  p_output_tokens INT,
  p_cost_cents INT
) RETURNS JSONB AS $$
DECLARE
  v_current_month TEXT;
  v_estimate_calls_this_month INT;
  v_user_tier TEXT;
  v_calls_limit INT;
  v_cost_limit_cents INT;
BEGIN
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');

  -- Get user tier (assume 'free' for now, can expand to check subscription)
  v_user_tier := 'free';

  -- Get limits
  SELECT monthly_estimate_calls_limit, monthly_cost_limit_cents
    INTO v_calls_limit, v_cost_limit_cents
    FROM cost_limits WHERE tier = v_user_tier;

  -- Log the call
  INSERT INTO ai_api_calls (
    user_id, call_type, model, input_tokens, output_tokens, total_cost_cents
  ) VALUES (p_user_id, p_call_type, p_model, p_input_tokens, p_output_tokens, p_cost_cents);

  -- Update monthly usage
  INSERT INTO user_monthly_api_usage (
    user_id, month_year, estimate_calls_count, total_tokens_used, total_cost_cents
  ) VALUES (
    p_user_id, v_current_month,
    CASE WHEN p_call_type = 'estimate' THEN 1 ELSE 0 END,
    COALESCE(p_input_tokens, 0) + COALESCE(p_output_tokens, 0),
    p_cost_cents
  )
  ON CONFLICT (user_id, month_year, is_demo) DO UPDATE SET
    estimate_calls_count = CASE WHEN p_call_type = 'estimate' THEN estimate_calls_count + 1 ELSE estimate_calls_count END,
    total_tokens_used = total_tokens_used + COALESCE(p_input_tokens, 0) + COALESCE(p_output_tokens, 0),
    total_cost_cents = total_cost_cents + p_cost_cents;

  -- Check limits
  SELECT estimate_calls_count INTO v_estimate_calls_this_month
    FROM user_monthly_api_usage
    WHERE user_id = p_user_id AND month_year = v_current_month;

  IF v_calls_limit IS NOT NULL AND v_estimate_calls_this_month > v_calls_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'free_tier_limit_exceeded',
      'message', 'You have reached your monthly estimate limit (' || v_calls_limit || ' per month). Upgrade to Pro to continue.',
      'calls_used', v_estimate_calls_this_month,
      'calls_limit', v_calls_limit
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'calls_remaining', v_calls_limit - v_estimate_calls_this_month
  );
END;
$$ LANGUAGE plpgsql;

-- RLS: Users can only see their own API costs
ALTER TABLE ai_api_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_monthly_api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_api_calls"
  ON ai_api_calls FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_view_own_monthly_usage"
  ON user_monthly_api_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Index for cost reporting
CREATE INDEX idx_ai_api_calls_user_created ON ai_api_calls(user_id, created_at DESC);
CREATE INDEX idx_monthly_usage_user_month ON user_monthly_api_usage(user_id, month_year DESC);
