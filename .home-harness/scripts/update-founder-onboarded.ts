/**
 * Update existing founder.demo account to mark as onboarded
 * Workaround for seed data that's already in the database
 * Run: npx tsx scripts/update-founder-onboarded.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables required')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateFounderOnboarded() {
  console.log('\n📝 Updating founder.demo account...\n')

  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, onboarding_complete')
      .eq('email', 'founder.demo@example.com')
      .single()

    if (fetchError) {
      console.error(`  ❌ Error finding founder account: ${fetchError.message}`)
      return
    }

    if (!profile) {
      console.log('  ℹ️  Founder account not found. Skipping update.')
      return
    }

    if (profile.onboarding_complete) {
      console.log('  ✓ Founder account already marked as onboarded.')
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ onboarding_complete: true })
      .eq('id', profile.id)

    if (updateError) {
      console.error(`  ❌ Update failed: ${updateError.message}`)
      return
    }

    console.log('  ✓ Founder account updated: onboarding_complete = true')
    console.log(`     Email: ${profile.email}`)

  } catch (err: any) {
    console.error(`\n  ❌ Error: ${err.message}`)
    process.exit(1)
  }
}

updateFounderOnboarded()
