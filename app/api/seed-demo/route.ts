import { NextResponse } from 'next/server'

/**
 * DEPRECATED: /api/seed-demo endpoint
 *
 * Use supabase/seed/01-marketplace-demo.ts instead (canonical seed system).
 * The canonical seed uses service role auth (correct), is idempotent,
 * and creates a full 40+25 marketplace with all required demo data.
 *
 * This endpoint was never functional (anon key cannot INSERT to profiles with RLS).
 * Removed 2026-07-17 to avoid data confusion.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: Request) {
  return NextResponse.json(
    {
      error: 'Gone',
      message: 'This endpoint is deprecated. Use: npx tsx supabase/seed/01-marketplace-demo.ts',
      seed_account: 'founder.demo@example.com / FounderDemo123!',
      canonical_seed: 'supabase/seed/01-marketplace-demo.ts'
    },
    { status: 410 }
  )
}

/**
 * OLD IMPLEMENTATION (REMOVED)
 *
 * The following code was removed because it:
 * 1. Uses anon-level Supabase client for admin operations (wrong)
 * 2. Profile INSERTs fail against RLS policies
 * 3. Error handling masks real errors as "User already registered"
 * 4. Never successfully created demo data
 * 5. Duplicates functionality of proven canonical seed system
 *
 * Replaced with 410 Gone response pointing to canonical seed.
 *
 * export async function POST_REMOVED(request: Request) {
  // Dev-only: check for auth token in header or env variable
  const authToken = request.headers.get('x-seed-token')
  const devToken = process.env.SEED_DEMO_TOKEN

  if (!devToken || authToken !== devToken) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: SEED_DEMO_TOKEN required' },
      { status: 401 }
    )
  }

  try {
    const supabase = await createClient()

    // Check if demo data already exists
    const { data: existingHomeowner, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', DEMO_HOMEOWNER_EMAIL)
      .maybeSingle()

    if (existingHomeowner && !profileError) {
      return NextResponse.json({
        success: true,
        message: 'Demo data already seeded'
      })
    }

    // Sign up demo homeowner (or get existing account)
    const { data: homeownerSignup, error: homeownerSignupError } = await supabase.auth.signUp({
      email: DEMO_HOMEOWNER_EMAIL,
      password: DEMO_HOMEOWNER_PASSWORD
    })

    let homeownerId: string

    if (homeownerSignupError) {
      // Account might already exist; try signing in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: DEMO_HOMEOWNER_EMAIL,
        password: DEMO_HOMEOWNER_PASSWORD
      })
      if (signInError) {
        console.error('Homeowner signup AND signin failed:', homeownerSignupError, signInError)
        throw signInError
      }
      homeownerId = signInData.user?.id || ''
      if (!homeownerId) throw new Error('Failed to get homeowner ID from signin')
    } else {
      homeownerId = homeownerSignup.user?.id || ''
      if (!homeownerId) throw new Error('Failed to get homeowner ID from signup')
    }

    // Create homeowner profile
    await supabase.from('profiles').update({
      user_segment: 'homeowner',
      is_demo: true
    }).eq('id', homeownerId)

    // Create property
    const { data: property } = await supabase
      .from('properties')
      .insert({
        owner_id: homeownerId,
        zip_code: '20155',
        label: 'Demo Home',
        is_demo: true
      })
      .select()
      .single()

    // Create project
    const { data: project } = await supabase
      .from('projects')
      .insert({
        property_id: property!.id,
        title: 'Kitchen Renovation',
        description: 'Complete kitchen modernization with new cabinets and appliances',
        status: 'active',
        budget_low: 25000,
        budget_high: 45000,
        is_demo: true
      })
      .select()
      .single()

    // Create project steps
    const steps = [
      { title: 'Planning & Assessment', desc: 'Define scope and requirements' },
      { title: 'Permits & Approvals', desc: 'Obtain necessary permits' },
      { title: 'Design Phase', desc: 'Finalize design and materials' },
      { title: 'Contractor Selection', desc: 'Hire and contract contractor' },
      { title: 'Budget Approval', desc: 'Approve final budget and timeline' },
      { title: 'Materials Ordering', desc: 'Order all required materials' },
      { title: 'Prep & Demolition', desc: 'Prepare space and remove old elements' },
      { title: 'Installation', desc: 'Main construction work' },
      { title: 'Inspections', desc: 'Pass required inspections' },
      { title: 'Finishing & Paint', desc: 'Final touches and finishes' },
      { title: 'Testing & Walkthrough', desc: 'Test all systems and review work' },
      { title: 'Project Closeout', desc: 'Final payment and warranty setup' }
    ]

    for (let i = 0; i < steps.length; i++) {
      await supabase.from('project_steps').insert({
        project_id: project!.id,
        step_number: i + 1,
        title: steps[i].title,
        description: steps[i].desc,
        completed: i < 3 // First 3 steps are completed for demo
      })
    }

    // Sign up demo contractor (or get existing account)
    const { data: contractorSignup, error: contractorSignupError } = await supabase.auth.signUp({
      email: DEMO_CONTRACTOR_EMAIL,
      password: DEMO_CONTRACTOR_PASSWORD
    })

    let contractorId: string

    if (contractorSignupError) {
      // Account might already exist; try signing in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: DEMO_CONTRACTOR_EMAIL,
        password: DEMO_CONTRACTOR_PASSWORD
      })
      if (signInError) {
        console.error('Contractor signup AND signin failed:', contractorSignupError, signInError)
        throw signInError
      }
      contractorId = signInData.user?.id || ''
      if (!contractorId) throw new Error('Failed to get contractor ID from signin')
    } else {
      contractorId = contractorSignup.user?.id || ''
      if (!contractorId) throw new Error('Failed to get contractor ID from signup')
    }

    // Create contractor profile
    await supabase.from('contractor_profiles').insert({
      user_id: contractorId,
      business_name: 'Elite Kitchen Contractors',
      rating: 4.8,
      review_count: 47,
      verified_job_count: 18,
      years_in_business: 8,
      bio: 'Specializing in luxury kitchen and bathroom renovations. Licensed, insured, and bonded.',
      is_demo: true
    })

    // Update contractor profile
    await supabase.from('profiles').update({
      user_segment: 'contractor',
      is_demo: true
    }).eq('id', contractorId)

    // Create match
    const { data: match } = await supabase
      .from('matches')
      .insert({
        project_id: project!.id,
        contractor_id: contractorId,
        homeowner_id: homeownerId,
        match_score: 0.92,
        match_reasoning: 'Elite Kitchen Contractors has extensive experience with kitchen renovations and highly rated reviews.',
        status: 'matched',
        is_demo: true
      })
      .select()
      .single()

    // Create conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .insert({
        homeowner_id: homeownerId,
        contractor_id: contractorId,
        match_id: match!.id,
        is_demo: true
      })
      .select()
      .single()

    // Create demo messages
    const messages = [
      {
        conversation_id: conversation!.id,
        sender_id: contractorId,
        sender_type: 'contractor',
        content: 'Hi! We\'re very interested in your kitchen project. Would love to discuss your vision!',
        is_demo: true
      },
      {
        conversation_id: conversation!.id,
        sender_id: homeownerId,
        sender_type: 'homeowner',
        content: 'Thanks for reaching out! We\'re looking for a team that can start in the next 2 months.',
        is_demo: true
      }
    ]

    for (const msg of messages) {
      await supabase.from('messages').insert(msg)
    }

    // Save contractor for later reference
    await supabase.from('saved_contractors').insert({
      user_id: homeownerId,
      contractor_id: contractorId,
      is_demo: true
    })

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      homeowner: {
        email: DEMO_HOMEOWNER_EMAIL,
        password: DEMO_HOMEOWNER_PASSWORD
      },
      contractor: {
        email: DEMO_CONTRACTOR_EMAIL,
        password: DEMO_CONTRACTOR_PASSWORD
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to seed demo data'
    }, { status: 500 })
  }
}
 */
