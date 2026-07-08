# Credentials & Config Reference

All credentials live in `/Users/ryanbaz/Desktop/renova-platform/.env.local`
Never commit that file. Never share it.

---

## Supabase (GroundWork project)

| Key | Location |
|-----|----------|
| Project URL | .env.local → NEXT_PUBLIC_SUPABASE_URL |
| Anon/Publishable key | .env.local → NEXT_PUBLIC_SUPABASE_ANON_KEY |
| Service Role key | .env.local → SUPABASE_SERVICE_ROLE_KEY |
| Dashboard | supabase.com/dashboard/project/dhmxxywdsdxzzcuezztv |
| Region | us-west-2 (West US Oregon) |
| Project ref | dhmxxywdsdxzzcuezztv |

## Anthropic (Claude API)

| Key | Location |
|-----|----------|
| API Key | .env.local → ANTHROPIC_API_KEY (currently blank — add before testing AI agents) |
| Get key | console.anthropic.com |
| Recommended model | claude-sonnet-4-6 |

## Stripe (payments — placeholder until ready)

| Key | Location |
|-----|----------|
| Secret key | .env.local → STRIPE_SECRET_KEY |
| Publishable key | .env.local → NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY |
| Webhook secret | .env.local → STRIPE_WEBHOOK_SECRET |
| Dashboard | dashboard.stripe.com |
| Status | Placeholder keys — replace with real ones when payments are needed |

---

## Supabase Personal Access Token

Used to run migrations via CLI. Stored nowhere in code — re-generate at supabase.com/dashboard/account/tokens if needed.

---

## Notes

- Email confirmation is DISABLED in Supabase auth — users are active immediately on signup
- RLS is enabled on all tables — each user only sees their own data
- Migrations live at `supabase/migrations/` — run via `supabase db push --linked`
