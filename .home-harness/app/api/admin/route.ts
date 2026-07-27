import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin-check'

export async function GET(req: NextRequest) {
  try {
    // Enforce admin role
    await requireAdmin()

    const supabase = createAdminClient()

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
    const status = (err as any).status === 403 ? 403 : 500
    const message = (err as any).status === 403 ? 'Forbidden' : 'Stats failed'
    console.error('Admin stats error:', err)
    return NextResponse.json({ error: message }, { status })
  }
}
