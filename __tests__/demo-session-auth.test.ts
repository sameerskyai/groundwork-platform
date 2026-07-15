/**
 * Demo Session Security Tests
 * Verifies /api/demo/session requires role='admin'
 *
 * REQUIRES: Dev server running on localhost:3000 (npm run dev)
 * This is an integration test that makes HTTP requests to the API
 *
 * Run: npm run dev (in another terminal) → npm test -- __tests__/demo-session-auth.test.ts
 * Excluded from standard test suite (test:live-db) because it needs running server
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  throw new Error('Supabase environment variables required')
}

describe('Demo Session Security (/api/demo/session)', () => {
  let serviceRoleClient: any
  let anonClient: any
  let normalUserEmail: string
  let normalUserPassword: string
  let adminUserEmail: string
  let adminUserPassword: string

  beforeAll(async () => {
    console.log('\n[Setup] Creating test fixtures...\n')

    serviceRoleClient = createClient(supabaseUrl, supabaseServiceKey)
    anonClient = createClient(supabaseUrl, supabaseAnonKey)

    const timestamp = Date.now()
    normalUserEmail = `test-normal-${timestamp}@test.example.com`
    normalUserPassword = 'test_password_normal'
    adminUserEmail = `test-admin-${timestamp}@test.example.com`
    adminUserPassword = 'test_password_admin'

    // Create normal user (role='homeowner')
    const { data: normalUser } = await serviceRoleClient.auth.admin.createUser({
      email: normalUserEmail,
      password: normalUserPassword,
      email_confirm: true,
      user_metadata: { is_demo: 'false', test_fixture: 'true', type: 'homeowner' }
    })

    await serviceRoleClient.from('profiles').insert({
      id: normalUser.user.id,
      email: normalUserEmail,
      full_name: 'Test Normal User',
      role: 'homeowner',
      is_demo: false
    })

    console.log(`    ✓ Normal user created: ${normalUserEmail} (role: homeowner)`)

    // Create admin user (role='admin')
    const { data: adminUserData, error: adminCreateError } = await serviceRoleClient.auth.admin.createUser({
      email: adminUserEmail,
      password: adminUserPassword,
      email_confirm: true,
      user_metadata: { is_demo: 'false', test_fixture: 'true', type: 'admin' }
    })

    if (adminCreateError || !adminUserData?.user) {
      throw new Error(`Failed to create admin user: ${adminCreateError?.message}`)
    }

    const adminUser = adminUserData.user

    await serviceRoleClient.from('profiles').insert({
      id: adminUser.id,
      email: adminUserEmail,
      full_name: 'Test Admin User',
      role: 'admin',
      is_demo: false
    })

    console.log(`    ✓ Admin user created: ${adminUserEmail} (role: admin)\n`)
  })

  // TEST 1: Anon user gets 401
  it('should reject anon user with 401 (not authenticated)', async () => {
    console.log('  [Test 1] Anon user → 401 Unauthorized...')

    const response = await fetch('http://localhost:3000/api/demo/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toMatch(/Unauthorized|Not authenticated/i)

    console.log('    ✓ Anon user rejected with 401')
  })

  // TEST 2: Normal user gets 403
  it('should reject normal user with 403 (forbidden)', async () => {
    console.log('  [Test 2] Normal user (homeowner) → 403 Forbidden...')

    // Sign in as normal user
    const { data: { session } } = await anonClient.auth.signInWithPassword({
      email: normalUserEmail,
      password: normalUserPassword
    })

    expect(session).toBeDefined()
    expect(session.access_token).toBeDefined()

    // Try to access demo session
    const response = await fetch('http://localhost:3000/api/demo/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    })

    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error).toMatch(/Forbidden|Admin role required/i)

    console.log('    ✓ Normal user rejected with 403 (admin role required)')
  })

  // TEST 3: Admin user gets 200 with demo_mode
  it('should allow admin user and return demo_mode flag', async () => {
    console.log('  [Test 3] Admin user → 200 with demo_mode flag...')

    // Sign in as admin user
    const { data: { session } } = await anonClient.auth.signInWithPassword({
      email: adminUserEmail,
      password: adminUserPassword
    })

    expect(session).toBeDefined()
    expect(session.access_token).toBeDefined()

    // Access demo session
    const response = await fetch('http://localhost:3000/api/demo/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.demo_mode).toBe(true)
    expect(body.watermark).toBe('FOUNDER DEMO VIEW')
    expect(body.admin_id).toBeDefined()

    console.log('    ✓ Admin user granted demo session with demo_mode=true')
  })
})
