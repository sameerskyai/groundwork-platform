import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const DEMO_HOMEOWNER_EMAIL = 'founder.demo@groundwork.local'
const DEMO_HOMEOWNER_PASSWORD = 'demo@1234'
const DEMO_CONTRACTOR_EMAIL = 'contractor.demo@groundwork.local'
const DEMO_CONTRACTOR_PASSWORD = 'demo@1234'

export async function POST(request: Request) {
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
    const { data: existingHomeowner } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', DEMO_HOMEOWNER_EMAIL)
      .single()

    if (existingHomeowner) {
      return NextResponse.json({
        success: true,
        message: 'Demo data already seeded'
      })
    }

    // Sign up demo homeowner
    const { data: homeownerSignup, error: homeownerSignupError } = await supabase.auth.signUp({
      email: DEMO_HOMEOWNER_EMAIL,
      password: DEMO_HOMEOWNER_PASSWORD
    })

    if (homeownerSignupError) throw homeownerSignupError

    const homeownerId = homeownerSignup.user!.id

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

    // Sign up demo contractor
    const { data: contractorSignup, error: contractorSignupError } = await supabase.auth.signUp({
      email: DEMO_CONTRACTOR_EMAIL,
      password: DEMO_CONTRACTOR_PASSWORD
    })

    if (contractorSignupError) throw contractorSignupError

    const contractorId = contractorSignup.user!.id

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
