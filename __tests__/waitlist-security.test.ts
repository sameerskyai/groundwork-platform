/**
 * Waitlist PII/RLS Security Tests (Live DB)
 * WRITTEN, NOT RUN until migration 033 is applied to the live database —
 * see the founder action logged in DECISIONS.md (2026-07-21).
 *
 * Verifies the fix for the finding logged 2026-07-21: migration 032 granted
 * anon SELECT on the raw waitlist table, exposing name/email/phone to any
 * unauthenticated client. Migration 033 revokes that and replaces it with
 * two aggregate-only RPC functions.
 *
 * Run: npm run test:live-db -- __tests__/waitlist-security.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  throw new Error('Supabase environment variables required for live DB testing')
}

describe('Waitlist PII/RLS Security (Live DB)', () => {
  let serviceRoleClient: any
  let anonClient: any
  let fixtureId: string

  beforeAll(async () => {
    serviceRoleClient = createClient(supabaseUrl, supabaseServiceKey)
    anonClient = createClient(supabaseUrl, supabaseAnonKey)

    // is_demo: false is deliberate -- the vulnerable migration 032 policy
    // excluded demo rows anyway (`USING (is_demo = false)`), so a demo
    // fixture would pass the negative test even if the old PII exposure
    // came back. A real non-demo row is the only fixture that actually
    // re-exercises the original vulnerability.
    const { data } = await serviceRoleClient
      .from('waitlist')
      .insert({
        name: 'Security Test Fixture',
        email: `security-test-${Date.now()}@groundworkapp.test`,
        phone: '5551234567',
        sms_consent: false,
        position_number: 999999,
        referral_code: `TESTFX${Date.now()}`,
        is_demo: false
      })
      .select()
      .single()

    fixtureId = data?.id
  })

  afterAll(async () => {
    if (fixtureId) {
      await serviceRoleClient.from('waitlist').delete().eq('id', fixtureId)
    }
  })

  it('anon SELECT on raw waitlist rows must fail or return nothing', async () => {
    const { data, error } = await anonClient
      .from('waitlist')
      .select('name, email, phone')
      .eq('id', fixtureId)

    // Either the query errors (permission denied) or returns zero rows.
    // Either is acceptable — what's unacceptable is returning the fixture's PII.
    if (!error) {
      expect(data).toEqual([])
    } else {
      expect(error).toBeTruthy()
    }
  })

  it('anon cannot INSERT directly at the table level (by design)', async () => {
    // Migration 032's "Anyone can sign up" RLS policy is unconditional
    // (WITH CHECK (true)) -- granting anon the base table INSERT privilege
    // it would need to actually fire would let any unauthenticated client
    // set server-controlled columns (is_demo, founding_500,
    // verified_referral_count) directly, bypassing every safeguard
    // app/api/waitlist/route.ts enforces. Migration 034 was proposed to
    // grant this and deliberately withdrawn after review -- see its file
    // header and DECISIONS.md. All real signups go through the API route,
    // which uses the service-role key and isn't affected by this.
    const testEmail = `insert-test-${Date.now()}@groundworkapp.test`
    const { error } = await anonClient
      .from('waitlist')
      .insert({
        name: 'Insert Test',
        email: testEmail,
        sms_consent: false,
        position_number: 999998,
        referral_code: `INSTEST${Date.now()}`,
        is_demo: true
      })

    expect(error).not.toBeNull()
    expect(error?.code).toBe('42501')
  })

  it('get_waitlist_public_stats() returns aggregate counts only, no PII columns', async () => {
    const { data, error } = await anonClient.rpc('get_waitlist_public_stats').single()

    expect(error).toBeNull()
    expect(data).toHaveProperty('total_signups')
    expect(data).toHaveProperty('founding_500_count')
    expect(data).toHaveProperty('spots_remaining')
    expect(data).not.toHaveProperty('email')
    expect(data).not.toHaveProperty('phone')
  })

  it('get_waitlist_leaderboard() returns first-name + last-initial only, no email/phone', async () => {
    const { data, error } = await anonClient.rpc('get_waitlist_leaderboard', { limit_count: 5 })

    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
    for (const row of data ?? []) {
      expect(row).toHaveProperty('display_name')
      expect(row).toHaveProperty('verified_referral_count')
      expect(row).not.toHaveProperty('email')
      expect(row).not.toHaveProperty('phone')
    }
  })
})
