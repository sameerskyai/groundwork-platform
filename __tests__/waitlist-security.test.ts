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

    const { data } = await serviceRoleClient
      .from('waitlist')
      .insert({
        name: 'Security Test Fixture',
        email: `security-test-${Date.now()}@groundworkapp.test`,
        phone: '5551234567',
        sms_consent: false,
        position_number: 999999,
        referral_code: `TESTFX${Date.now()}`,
        is_demo: true
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
      .limit(1)

    // Either the query errors (permission denied) or returns zero rows.
    // Either is acceptable — what's unacceptable is returning PII.
    if (!error) {
      expect(data).toEqual([])
    } else {
      expect(error).toBeTruthy()
    }
  })

  it('anon can still INSERT a new signup', async () => {
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

    expect(error).toBeNull()

    // Clean up via service role (anon can't read/delete its own row)
    await serviceRoleClient.from('waitlist').delete().eq('email', testEmail)
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
