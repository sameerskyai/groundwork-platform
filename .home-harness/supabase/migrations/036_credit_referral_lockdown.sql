-- Migration 036: actually restrict credit_referral() to service_role
--
-- Migration 035's `REVOKE EXECUTE ON FUNCTION credit_referral(UUID) FROM
-- PUBLIC` did not achieve what it looked like it would. Found live: after
-- applying 035, an anon-key call to credit_referral() still succeeded
-- (200, not the expected 401/permission-denied).
--
-- Root cause: this Supabase project has a schema-level default privilege
-- rule -- `ALTER DEFAULT PRIVILEGES ... GRANT EXECUTE ON FUNCTIONS TO
-- anon, authenticated` -- that Supabase applies to the public schema on
-- project creation. That's a separate, named-role grant issued at the
-- moment any new function is created in `public`, completely independent
-- of the PUBLIC pseudo-role. Revoking from PUBLIC never touches it.
-- REVOKE ... FROM PUBLIC only undoes the *implicit* grant Postgres itself
-- gives on function creation -- it was never the thing making this
-- callable by anon here.

REVOKE EXECUTE ON FUNCTION credit_referral(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION credit_referral(UUID) FROM authenticated;

-- service_role grant from migration 035 is unaffected by the above and
-- still stands; re-asserted here for clarity/idempotency.
GRANT EXECUTE ON FUNCTION credit_referral(UUID) TO service_role;
