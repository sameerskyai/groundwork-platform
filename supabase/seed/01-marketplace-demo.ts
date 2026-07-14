/**
 * Idempotent marketplace seed script
 * Safe to run from any state: checks for existing demo data, purges if found, then seeds fresh
 * Run: npx tsx supabase/seed/01-marketplace-demo.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables required')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Seed specifications
const HOMEOWNER_SPECS = [
  {
    email: 'sarah.demo@example.com',
    name: 'Sarah Chen',
    zip_code: '22201',
    lat: 38.8816,
    lng: -77.1043,
    subscription_tier: '$20' as const,
    verified_referral_count: 2
  },
  {
    email: 'james.demo@example.com',
    name: 'James Wilson',
    zip_code: '22202',
    lat: 38.8950,
    lng: -77.0800,
    subscription_tier: '$20' as const,
    verified_referral_count: 7
  },
  {
    email: 'emma.demo@example.com',
    name: 'Emma Rodriguez',
    zip_code: '22203',
    lat: 38.8700,
    lng: -77.0950,
    subscription_tier: '$10_referral' as const,
    verified_referral_count: 10
  }
]

const CONTRACTOR_SPECS = [
  {
    email: 'alex.demo@example.com',
    business_name: "Alex's Home Repair",
    zip_code: '22201',
    lat: 38.8816,
    lng: -77.1043,
    service_radius_miles: 15,
    subscription_tier: 'paid_unlimited' as const,
    rating: 4.3,
    verified_job_count: 12
  },
  {
    email: 'mike.demo@example.com',
    business_name: 'Premium Kitchen & Bath',
    zip_code: '22202',
    lat: 38.8950,
    lng: -77.0800,
    service_radius_miles: 20,
    subscription_tier: 'paid_unlimited' as const,
    rating: 4.7,
    verified_job_count: 28
  },
  {
    email: 'carlos.demo@example.com',
    business_name: 'Budget Repairs Inc',
    zip_code: '22203',
    lat: 38.8700,
    lng: -77.0950,
    service_radius_miles: 10,
    subscription_tier: 'free' as const,
    rating: 3.8,
    verified_job_count: 5
  }
]

export async function seedMarketplace() {
  console.log('🌱 Seeding marketplace (idempotent)...\n')

  try {
    // ============================================================
    // 1. Check for existing demo data
    // ============================================================
    console.log('  [Step 1] Checking for existing demo data...')
    const { data: existingDemo, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_demo', true)
      .limit(1)

    if (checkError) throw checkError

    if (existingDemo && existingDemo.length > 0) {
      console.log('  Found existing demo data. Purging...')

      // Purge existing demo data
      const { data: purgeResult, error: purgeError } = await supabase.rpc(
        'purge_demo_data',
        { confirm_token: 'PURGE_DEMO_DATA' }
      )

      if (purgeError) throw new Error(`Purge failed: ${purgeError.message}`)

      const result = purgeResult[0]
      console.log(`    ✓ Purged: ${result.purged_records} records`)

      if (result.orphaned_records > 0) {
        console.warn(`    ⚠️  Warning: ${result.orphaned_records} orphaned records detected`)
      }
    }

    // ============================================================
    // 2. Create auth users (auth-first UUIDs)
    // ============================================================
    console.log('\n  [Step 2] Creating homeowner auth users...')
    const homeownerMap = new Map<string, string>()

    for (const spec of HOMEOWNER_SPECS) {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: spec.email,
        password: `demo_${spec.email.split('@')[0]}`,
        email_confirm: true,
        user_metadata: {
          is_demo: 'true',
          name: spec.name,
          type: 'homeowner'
        }
      })

      if (authError) throw new Error(`Auth user creation failed for ${spec.email}: ${authError.message}`)
      homeownerMap.set(spec.email, authUser.user.id)
    }
    console.log(`    ✓ ${homeownerMap.size} homeowner auth users created`)

    console.log('  [Step 2b] Creating contractor auth users...')
    const contractorMap = new Map<string, string>()

    for (const spec of CONTRACTOR_SPECS) {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: spec.email,
        password: `demo_${spec.email.split('@')[0]}`,
        email_confirm: true,
        user_metadata: {
          is_demo: 'true',
          business_name: spec.business_name,
          type: 'contractor'
        }
      })

      if (authError) throw new Error(`Auth user creation failed for ${spec.email}: ${authError.message}`)
      contractorMap.set(spec.email, authUser.user.id)
    }
    console.log(`    ✓ ${contractorMap.size} contractor auth users created`)

    // ============================================================
    // 3. Insert profiles
    // ============================================================
    console.log('\n  [Step 3] Inserting homeowner profiles...')
    const homeownerProfiles = HOMEOWNER_SPECS.map(spec => ({
      id: homeownerMap.get(spec.email),
      email: spec.email,
      full_name: spec.name,
      zip_code: spec.zip_code,
      lat: spec.lat,
      lng: spec.lng,
      subscription_tier: spec.subscription_tier,
      subscription_active: true,
      verified_referral_count: spec.verified_referral_count,
      is_demo: true,
      role: 'homeowner' as const
    }))

    const { error: homeownerError } = await supabase.from('profiles').insert(homeownerProfiles)
    if (homeownerError) throw homeownerError
    console.log(`    ✓ ${homeownerProfiles.length} homeowner profiles inserted`)

    console.log('  [Step 3b] Inserting contractor profiles (main table)...')
    const contractorMainProfiles = CONTRACTOR_SPECS.map(spec => ({
      id: contractorMap.get(spec.email),
      full_name: spec.business_name,
      email: spec.email,
      zip_code: spec.zip_code,
      lat: spec.lat,
      lng: spec.lng,
      is_demo: true,
      role: 'contractor' as const
    }))

    const { error: contractorMainError } = await supabase.from('profiles').insert(contractorMainProfiles)
    if (contractorMainError) throw contractorMainError
    console.log(`    ✓ ${contractorMainProfiles.length} contractor profiles inserted into main table`)

    console.log('  [Step 3c] Inserting contractor profiles (specialist table)...')
    const contractorProfiles = CONTRACTOR_SPECS.map(spec => ({
      id: crypto.randomUUID(),
      user_id: contractorMap.get(spec.email),
      business_name: spec.business_name,
      service_radius_miles: spec.service_radius_miles,
      subscription_tier: spec.subscription_tier,
      subscription_active: true,
      rating: spec.rating,
      is_demo: true
    }))

    const { error: contractorError } = await supabase
      .from('contractor_profiles')
      .insert(contractorProfiles)
    if (contractorError) throw contractorError
    console.log(`    ✓ ${contractorProfiles.length} contractor profiles inserted`)

    console.log('\n✅ Marketplace seeding complete (idempotent)\n')
    console.log(`  📊 Seeded:`)
    console.log(`     • ${homeownerMap.size} homeowners (auth + profile)`)
    console.log(`     • ${contractorMap.size} contractors (auth + profile)`)
    console.log(`     • All accounts marked is_demo=true for isolation`)
  } catch (err) {
    console.error('❌ Seeding failed:', err)
    process.exit(1)
  }
}

// Run if invoked directly
if (require.main === module) {
  seedMarketplace()
}
