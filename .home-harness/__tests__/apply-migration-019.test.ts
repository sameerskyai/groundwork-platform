/**
 * Migration 019 Application & Verification Test
 * Applies RLS policy fixes and verifies they work correctly
 * Run: npm run test:live-db -- __tests__/apply-migration-019.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  throw new Error('Supabase environment variables required')
}

describe('Migration 019: Fix Demo RLS Allow Own Row', () => {
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

  beforeAll(async () => {
    console.log('\n[Migration 019] Applying RLS policy updates...\n')

    // Apply all 7 policy updates via service role (bypasses RLS)
    const policies = [
      {
        table: 'profiles',
        policy: 'demo_isolation_profiles',
        using: 'is_demo = false OR id = auth.uid()'
      },
      {
        table: 'contractor_profiles',
        policy: 'demo_isolation_contractors',
        using: 'is_demo = false OR user_id = auth.uid()'
      },
      {
        table: 'projects',
        policy: 'demo_isolation_projects',
        using: 'is_demo = false OR homeowner_id = auth.uid()'
      },
      {
        table: 'matches',
        policy: 'demo_isolation_matches',
        using: 'is_demo = false OR project_id IN (SELECT id FROM projects WHERE homeowner_id = auth.uid()) OR contractor_id = auth.uid()'
      },
      {
        table: 'reviews',
        policy: 'demo_isolation_reviews',
        using: 'is_demo = false OR reviewer_id = auth.uid() OR reviewee_id = auth.uid()'
      },
      {
        table: 'community_posts',
        policy: 'demo_isolation_community_posts',
        using: 'is_demo = false OR author_id = auth.uid()'
      },
      {
        table: 'referrals',
        policy: 'demo_isolation_referrals',
        using: 'is_demo = false OR referrer_id = auth.uid() OR referree_id = auth.uid()'
      }
    ]

    for (const { table, policy, using } of policies) {
      const dropSql = `DROP POLICY IF EXISTS "${policy}" ON ${table};`
      const createSql = `CREATE POLICY "${policy}" ON ${table} AS RESTRICTIVE FOR SELECT USING (${using});`

      // Note: Supabase JS client doesn't support raw SQL execution
      // These policies should be applied via:
      // 1. Supabase Dashboard SQL Editor, OR
      // 2. supabase db push (CLI), OR
      // 3. Direct PostgreSQL connection with psql/psycopg2
      console.log(`  Policy ${table}...`)
      console.log(`    DROP: ${dropSql}`)
      console.log(`    CREATE: ${createSql}\n`)
    }

    console.log('[⚠️ Note] Policies above require manual application via Supabase SQL Editor')
    console.log('[📝 Link] https://app.supabase.com/project/dhmxxywdsdxzzcuezztv/sql/new\n')
  })

  it('verifies founder can read own profile (after RLS fix)', async () => {
    // This test will PASS if migration 019 is applied
    // It will FAIL if migration 019 is not applied (founder blocked by RLS)

    const anonClient = createClient(supabaseUrl, supabaseAnonKey)

    // Sign in as founder
    const { data: authData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: 'founder.demo@example.com',
      password: 'FounderDemo123!'
    })

    expect(signInError).toBeNull()
    expect(authData.user).toBeDefined()

    if (!authData.session) {
      throw new Error('Sign in failed')
    }

    // Create authenticated client
    const founderClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    })

    // Try to read own profile
    const { data: profile, error: readError } = await founderClient
      .from('profiles')
      .select('id, email, is_demo, onboarding_complete')
      .eq('id', authData.user.id)
      .single()

    if (readError) {
      console.error(`\n  ❌ MIGRATION 019 NOT APPLIED: ${readError.message}`)
      console.error(`     RLS policy still blocking founder from reading own profile`)
      console.error(`     Apply migration 019 at: https://app.supabase.com/project/dhmxxywdsdxzzcuezztv/sql/new`)
      throw new Error('RLS policy not fixed — founder cannot read own profile')
    }

    console.log(`  ✓ Founder CAN read own profile:`)
    console.log(`     Email: ${profile?.email}`)
    console.log(`     is_demo: ${profile?.is_demo}`)
    console.log(`     onboarding_complete: ${profile?.onboarding_complete}`)

    expect(profile).toBeDefined()
    expect(profile?.is_demo).toBe(true)
    expect(profile?.onboarding_complete).toBe(true)
  })

  it('verifies demo rows still blocked from OTHER users', async () => {
    // Ensure the RLS fix doesn't break demo isolation
    // Other users still cannot see is_demo=true rows

    const anonClient = createClient(supabaseUrl, supabaseAnonKey)

    // Create a real (non-demo) user
    const testEmail = `test_${Date.now()}@example.com`
    const testPassword = `Test123!${Date.now()}`

    const { data: newUserData, error: signupError } = await anonClient.auth.signUp({
      email: testEmail,
      password: testPassword
    })

    if (signupError) {
      throw new Error(`Test user signup failed: ${signupError.message}`)
    }

    if (!newUserData.user) {
      throw new Error('Test user not created')
    }

    // Create profile for test user (non-demo)
    const { error: profileError } = await serviceClient
      .from('profiles')
      .insert({
        id: newUserData.user.id,
        email: testEmail,
        full_name: 'Test User',
        role: 'homeowner',
        is_demo: false // Not a demo user
      })

    if (profileError) {
      throw new Error(`Profile creation failed: ${profileError.message}`)
    }

    // Sign in as test user
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (signInError || !signInData.session) {
      throw new Error('Test user sign in failed')
    }

    // Create authenticated client for test user
    const testUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${signInData.session.access_token}`
        }
      }
    })

    // Try to query demo profiles (should return 0 rows due to RESTRICTIVE RLS)
    const { data: demoProfiles, error: queryError } = await testUserClient
      .from('profiles')
      .select('id, email, is_demo')
      .eq('is_demo', true)

    if (queryError) {
      throw new Error(`Query failed: ${queryError.message}`)
    }

    console.log(`  ✓ Demo isolation holds:`)
    console.log(`     Non-demo user sees ${demoProfiles?.length ?? 0} demo profiles (expected: 0)`)

    expect(demoProfiles).toBeDefined()
    expect(demoProfiles?.length).toBe(0)

    // Cleanup: delete test user
    await serviceClient.auth.admin.deleteUser(newUserData.user.id)
  })
})
