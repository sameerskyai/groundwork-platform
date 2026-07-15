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
    // Realistic referral distribution: most 0-3, a few hit 10+ (for $10_referral tier)
    let referralCount = 0;
    const rand = Math.random();
    if (rand > 0.85) referralCount = 10 + Math.floor(Math.random() * 5); // 10-15: 15% of users
    else if (rand > 0.6) referralCount = Math.floor(Math.random() * 3); // 0-2: 25% of users
    else referralCount = Math.floor(Math.random() * 2); // 0-1: 60% of users

    return {
      email: `homeowner${i+1}.demo@example.com`,
      name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
      zip_code: zip,
      lat: baseLat + (Math.random() * 0.01 - 0.005),
      lng: baseLng + (Math.random() * 0.01 - 0.005),
      subscription_tier: tiers[i % 3],
      verified_referral_count: referralCount
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

    // ============================================================
    // 4. Create projects (~30, one per 1-2 homeowners)
    // ============================================================
    console.log('\n  [Step 4] Creating projects...')
    const trades = await supabase.from('trades').select('id, slug');
    const tradeIds = (trades.data || []).reduce((acc: Record<string, string>, t: any) => {
      acc[t.slug] = t.id;
      return acc;
    }, {});

    // Realistic project titles and descriptions
    const projectTemplates = [
      { title: 'Kitchen remodel — 200 sqft, full gut', desc: 'Full renovation including new cabinets, countertops, flooring, and backsplash. Need contractor with experience in mid-century homes.' },
      { title: 'Roof replacement after storm damage', desc: 'Tree fell on roof during last week\'s storm. Homeowners insurance approved repair. Need quick turnaround.' },
      { title: 'Second floor bathroom addition', desc: 'Converting bedroom closet into full bath. Includes plumbing and electrical. Need experienced general contractor.' },
      { title: 'Master bedroom hardwood refinishing', desc: '800 sqft of original 1970s hardwood. Refinish and repair cupping.' },
      { title: 'Basement finishing — media room + storage', desc: 'Damp basement, need waterproofing first, then drywall and flooring for media area.' },
      { title: 'HVAC system replacement (3-ton)', desc: 'Current system 25 years old, AC not working. Need efficient replacement.' },
      { title: 'Whole house rewiring (pre-1980 aluminum)', desc: 'Unsafe aluminum wiring throughout. Replacing with copper, all outlets grounded.' },
      { title: 'Deck restoration and expansion', desc: 'Existing 12x16 pressure-treated deck rotting. Expand to 12x24 with composite boards.' },
      { title: 'Plumbing: New water line and sump pump', desc: 'Main water line cracked, plus basement flooding issues. Complete overhaul.' },
      { title: 'Vinyl siding replacement (2-story, 2,400 sqft)', desc: 'Original siding failing. Want energy-efficient replacement with new trim.' },
    ];

    const projectSpecs = Array.from({ length: 30 }, (_, i) => {
      const homeownerEmail = HOMEOWNER_SPECS[i % HOMEOWNER_SPECS.length].email;
      const tradeKeys = Object.keys(tradeIds);
      const template = projectTemplates[i % projectTemplates.length];
      return {
        user_id: homeownerMap.get(homeownerEmail),
        title: template.title,
        description: template.desc,
        trade_id: tradeIds[tradeKeys[i % tradeKeys.length]],
        zip_code: HOMEOWNER_SPECS[i % HOMEOWNER_SPECS.length].zip_code,
        lat: HOMEOWNER_SPECS[i % HOMEOWNER_SPECS.length].lat,
        lng: HOMEOWNER_SPECS[i % HOMEOWNER_SPECS.length].lng,
        budget_min: 5000 + Math.random() * 10000,
        budget_max: 15000 + Math.random() * 35000,
        status: 'active' as const,
        is_demo: true
      };
    });

    const projectRes = await supabase.from('projects').insert(projectSpecs).select('id');
    const projectIds = projectRes.data?.map(p => p.id) || [];
    console.log(`    ✓ ${projectIds.length} projects created`);

    // ============================================================
    // 5. Create matches (~40, mix of ≥80 and <80)
    // ============================================================
    console.log('  [Step 5] Creating matches...');
    const matches = Array.from({ length: 40 }, (_, i) => {
      const projectId = projectIds[i % projectIds.length];
      const contractorId = contractorProfiles[i % contractorProfiles.length].id;
      const score = i % 3 === 0 ? 0.65 + Math.random() * 0.14 : 0.80 + Math.random() * 0.20; // 65-79% or 80-100%
      return {
        project_id: projectId,
        contractor_id: contractorId,
        match_score: Math.round(score * 1000) / 1000,
        match_reasoning: `Demo match: ${score >= 0.80 ? 'Strong fit' : 'Marginal fit'} based on trade and location`,
        status: Math.random() > 0.7 ? 'matched' : 'pending',
        is_demo: true
      };
    });

    const { error: matchError } = await supabase.from('matches').insert(matches);
    if (matchError) throw matchError;
    console.log(`    ✓ ${matches.length} matches created (mix of ≥80 and <80)`);

    // ============================================================
    // 6. Create reviews (~20, on contractors)
    // ============================================================
    console.log('  [Step 6] Creating reviews...');

    // Get created matches from DB to use real IDs
    const { data: createdMatches } = await supabase
      .from('matches')
      .select('id, contractor_id')
      .eq('is_demo', true)
      .limit(20);

    // Realistic review content
    const reviewTemplates = [
      'Amazing work! Marcus cleaned up after himself every day and finished 2 days ahead of schedule. Highly recommend.',
      'Professional from start to finish. Clear communication about costs and timeline. Work quality is excellent.',
      'Tony was responsive to all our questions and made tweaks without upselling. Fair pricing, good work.',
      'Got three quotes, picked Raj. He was the most thorough in his assessment and delivered exactly what he promised.',
      'Very experienced crew. They knew how to handle the old wiring safely. Took time to explain everything.',
      'Emily gave honest feedback that we didn\'t need the most expensive option. Saved us money and still great results.',
      'Fast turnaround without cutting corners. Work passed inspection on first try. Would rehire immediately.',
      'Professional team, minimal disruption to our lives. They arrived on time every morning and stayed late to finish.',
      'Quality work at a fair price. The attention to detail on the finishing work really shows.',
      'Very knowledgeable about building code. Helped us avoid a mistake that would have cost more later.',
      'Impressed with the cleanup. Most contractors leave a mess, but they swept everything daily.',
      'Has all the right tools and experience. Didn\'t have to hire additional subcontractors.',
      'Fair estimate, delivered on time, friendly crew. Would recommend to anyone.',
      'Handled a scope change smoothly and professionally. Good communication throughout.',
      'Excellent craftsmanship. The work looks better than we imagined.',
      'Answered all my questions during walkthrough. No surprises, no change orders.',
      'Very punctual and respectful of our home. Left the space clean each day.',
      'Expert at problem-solving when we discovered issues during the work.',
      'Competitive pricing and high-quality work. Hard to find that combination.',
      'Straightforward guy. Does what he says he\'ll do.',
    ];

    const reviews = (createdMatches || []).map((match, i) => {
      const homeownerEmail = HOMEOWNER_SPECS[i % HOMEOWNER_SPECS.length].email;
      const rating = Math.random() > 0.2 ? 4 + Math.random() : 3 + Math.random(); // More 4-5 stars
      return {
        match_id: match.id,
        contractor_id: match.contractor_id,
        reviewer_id: homeownerMap.get(homeownerEmail),
        rating: Math.ceil(rating),
        content: reviewTemplates[i % reviewTemplates.length],
        final_price: Math.round((Math.random() * 40000) + 5000),
        is_demo: true
      };
    });

    if (reviews.length > 0) {
      const { error: reviewError } = await supabase.from('reviews').insert(reviews);
      if (reviewError) throw reviewError;
    }
    console.log(`    ✓ ${reviews.length} reviews created`);

    // ============================================================
    // 7. Create referrals (matching verified_referral_count)
    // ============================================================
    console.log('  [Step 7] Creating referrals...');
    const referrals: any[] = [];
    HOMEOWNER_SPECS.forEach((spec, idx) => {
      const referrerId = homeownerMap.get(spec.email);
      for (let i = 0; i < spec.verified_referral_count; i++) {
        const refIdx = (idx + i + 1) % HOMEOWNER_SPECS.length;
        const referredId = homeownerMap.get(HOMEOWNER_SPECS[refIdx].email);
        if (referrerId !== referredId) {
          referrals.push({
            referrer_id: referrerId,
            referred_id: referredId,
            activated_at: new Date().toISOString(),
            is_demo: true
          });
        }
      }
    });

    if (referrals.length > 0) {
      const { error: refError } = await supabase.from('referrals').insert(referrals);
      if (refError) throw refError;
    }
    console.log(`    ✓ ${referrals.length} referrals created`);

    // ============================================================
    // 8. Create admin demo user for founder demo-mode access
    // ============================================================
    console.log('\n  [Step 8] Creating admin demo user...')

    const adminEmail = 'founder.demo@example.com'
    // SECURITY: Plaintext password acceptable ONLY because this account
    // can ONLY access is_demo=true rows via RLS policies. No write/delete/update
    // access. If compromised, attacker sees demo data only; no user data exposure.
    const adminPassword = 'FounderDemo123!'

    // Check if admin user already exists
    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', adminEmail)
      .limit(1)

    if (!existingAdmin || existingAdmin.length === 0) {
      const { data: adminUserData, error: adminError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          is_demo: 'true',
          name: 'Founder Demo',
          type: 'admin'
        }
      })

      if (adminError || !adminUserData?.user) throw new Error(`Admin user creation failed: ${adminError?.message}`)

      await supabase.from('profiles').insert({
        id: adminUserData.user.id,
        email: adminEmail,
        full_name: 'Founder Demo',
        role: 'admin',
        is_demo: true,
        onboarding_complete: true
      })

      console.log(`    ✓ Admin user created: ${adminEmail}`)
      console.log(`       Password: ${adminPassword}`)
    } else {
      console.log(`    ✓ Admin user already exists: ${adminEmail}`)
    }

    console.log('\n✅ Marketplace seeding complete (idempotent)\n')
    console.log(`  📊 Seeded:`)
    console.log(`     • ${homeownerMap.size} homeowners (auth + profile)`)
    console.log(`     • ${contractorMap.size} contractors (auth + profile)`)
    console.log(`     • ${projectIds.length} projects`)
    console.log(`     • ${matches.length} matches (mix ≥80% and <80% for gate testing)`)
    console.log(`     • ${reviews.length} reviews`)
    console.log(`     • ${referrals.length} referrals`)
    console.log(`     • 1 admin demo user (founder.demo@example.com)`)
    console.log(`     • All data marked is_demo=true for isolation`)
    console.log(`\n  🔑 Demo Admin Credentials:`)
    console.log(`     Email: founder.demo@example.com`)
    console.log(`     Password: FounderDemo123!`)
  } catch (err) {
    console.error('❌ Seeding failed:', err)
    process.exit(1)
  }
}

// Run if invoked directly
if (require.main === module) {
  seedMarketplace()
}
