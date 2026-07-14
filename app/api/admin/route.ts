import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { runAdminAgent } from '@/lib/agents'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createAdminClient()

    // Aggregate real-time stats for admin dashboard
    const [
      { count: totalUsers },
      { count: totalContractors },
      { count: activeSubscriptions },
      { count: totalProjects },
      { count: totalMatches },
      { data: recentProjects },
      { data: tierBreakdown }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('contractor_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('contractor_profiles').select('*', { count: 'exact', head: true }).eq('subscription_active', true),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'matched'),
      supabase.from('projects').select('zip_code, ai_project_type, created_at').order('created_at', { ascending: false }).limit(20),
      supabase.from('contractor_profiles').select('subscription_tier').eq('subscription_active', true)
    ])

    const freeTier = tierBreakdown?.filter(c => c.subscription_tier === 'free').length ?? 0
    const paidTier = tierBreakdown?.filter(c => c.subscription_tier === 'paid_unlimited').length ?? 0
    const estimatedMRR = paidTier * 49

    return NextResponse.json({
      stats: {
        totalUsers,
        totalContractors,
        activeSubscriptions,
        totalProjects,
        totalMatches,
        estimatedMRR,
        freeTierContractors: freeTier,
        paidTierContractors: paidTier
      },
      recentProjects
    })
  } catch (err) {
    console.error('Admin stats error:', err)
    return NextResponse.json({ error: 'Stats failed' }, { status: 500 })
  }
}

// Natural language admin query
export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json()
    const supabase = await createAdminClient()

    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: activeContractors } = await supabase.from('contractor_profiles').select('*', { count: 'exact', head: true }).eq('subscription_active', true)
    const { count: totalProjects } = await supabase.from('projects').select('*', { count: 'exact', head: true })
    const { count: totalMatches } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'matched')

    const answer = await runAdminAgent(question, {
      totalUsers,
      activeContractors,
      totalProjects,
      totalMatches
    })

    return NextResponse.json({ answer })
  } catch (err) {
    console.error('Admin agent error:', err)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }
}
