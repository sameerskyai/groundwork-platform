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

// Seed specifications: generate 40 homeowners + 25 contractors programmatically
const generateHomeownerSpecs = () => {
  const zips = ['22201', '22202', '22203', '22204', '22205', '22206', '22207', '22209', '22210', '22211'];
  const coords: Record<string, [number, number]> = {
    '22201': [38.8816, -77.1043],
    '22202': [38.8950, -77.0800],
    '22203': [38.8700, -77.0950],
    '22204': [38.8550, -77.1100],
    '22205': [38.8900, -77.0950],
    '22206': [38.8750, -77.0850],
    '22207': [38.8600, -77.1000],
    '22209': [38.8850, -77.0750],
    '22210': [38.8700, -77.1150],
    '22211': [38.8950, -77.1050],
  };
  const firstNames = ['Sarah', 'James', 'Emma', 'Michael', 'Jessica', 'David', 'Lisa', 'Robert', 'Jennifer', 'William', 'Patricia', 'Charles', 'Barbara', 'Joseph', 'Mary', 'Thomas', 'Linda', 'Christopher', 'Sandra', 'Daniel', 'Ashley', 'Matthew', 'Dorothy', 'Anthony', 'Nancy', 'Mark', 'Karen', 'Donald', 'Carol', 'Steven', 'Diane', 'Paul', 'Julie', 'Andrew', 'Joyce', 'Joshua', 'Evelyn', 'Kenneth', 'Lauren', 'Steven'];
  const lastNames = ['Chen', 'Wilson', 'Rodriguez', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  const tiers = ['free', '$20', '$10_referral'] as const;

  return Array.from({ length: 40 }, (_, i) => {
    const zip = zips[i % zips.length];
    const [baseLat, baseLng] = coords[zip];
    return {
      email: `homeowner${i+1}.demo@example.com`,
      name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
      zip_code: zip,
      lat: baseLat + (Math.random() * 0.01 - 0.005),
      lng: baseLng + (Math.random() * 0.01 - 0.005),
      subscription_tier: tiers[i % 3],
      verified_referral_count: Math.floor(Math.random() * 15)
    };
  });
};

const generateContractorSpecs = () => {
  const zips = ['22201', '22202', '22203', '22204', '22205', '22206', '22207', '22209', '22210', '22211'];
  const coords: Record<string, [number, number]> = {
    '22201': [38.8816, -77.1043],
    '22202': [38.8950, -77.0800],
    '22203': [38.8700, -77.0950],
    '22204': [38.8550, -77.1100],
    '22205': [38.8900, -77.0950],
    '22206': [38.8750, -77.0850],
    '22207': [38.8600, -77.1000],
    '22209': [38.8850, -77.0750],
    '22210': [38.8700, -77.1150],
    '22211': [38.8950, -77.1050],
  };
  const trades = ['General Contractor', 'HVAC Specialist', 'Plumber', 'Electrician', 'Roofer', 'Carpenter', 'Mason', 'Painter', 'Locksmith', 'Handyman'];
  const tiers = ['free', 'paid_unlimited'] as const;

  return Array.from({ length: 25 }, (_, i) => {
    const zip = zips[i % zips.length];
    const [baseLat, baseLng] = coords[zip];
    const rating = 3.5 + Math.random() * 1.5;
    return {
      email: `contractor${i+1}.demo@example.com`,
      business_name: `${trades[i % trades.length]} - Demo ${i+1}`,
      zip_code: zip,
      lat: baseLat + (Math.random() * 0.01 - 0.005),
      lng: baseLng + (Math.random() * 0.01 - 0.005),
      service_radius_miles: Math.floor(10 + Math.random() * 20),
      subscription_tier: tiers[i % 2],
      rating: Math.round(rating * 10) / 10,
      verified_job_count: Math.floor(Math.random() * 50)
    };
  });
};

const HOMEOWNER_SPECS = generateHomeownerSpecs();
const CONTRACTOR_SPECS = generateContractorSpecs();

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
