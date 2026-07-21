-- Migration 034: grant anon the INSERT privilege migration 032 always intended
--
-- Migration 032 created the "Anyone can sign up" RLS policy
-- (FOR INSERT WITH CHECK (true)) but only ever granted the base table-level
-- INSERT privilege to `authenticated`, never to `anon`. RLS policies narrow
-- what a GRANT already allows -- they don't substitute for the GRANT itself.
-- Found 2026-07-21 while running __tests__/waitlist-security.test.ts live:
-- an anon-key INSERT failed with 42501 "permission denied for table
-- waitlist" regardless of Prefer header, confirming this was never granted.
--
-- Does not affect the current production signup flow (app/api/waitlist/
-- route.ts uses the service-role key, which bypasses grants entirely) --
-- this closes the gap between stated intent and actual grants for any
-- future direct anon-key usage, and is what the test suite expects.

GRANT INSERT ON waitlist TO anon;
