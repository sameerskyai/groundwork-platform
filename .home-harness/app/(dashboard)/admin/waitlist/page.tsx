import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import WaitlistAdminDashboard from './dashboard'

export default async function WaitlistAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  // Service-role client bypasses RLS -- safe here because the role check
  // above already gated this route. Raw waitlist SELECT is not exposed to
  // anon/authenticated roles (see migration 033).
  const admin = createAdminClient()

  const [totalRes, todayRes, founding500Res, topReferrersRes, utmRowsRes, referredRes] = await Promise.all([
    admin.from('waitlist').select('*', { count: 'exact', head: true }).eq('is_demo', false),
    admin.from('waitlist').select('*', { count: 'exact', head: true }).eq('is_demo', false)
      .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00'),
    admin.from('waitlist').select('*', { count: 'exact', head: true }).eq('founding_500', true).eq('is_demo', false),
    admin.from('waitlist').select('name, verified_referral_count').eq('is_demo', false)
      .order('verified_referral_count', { ascending: false }).limit(1),
    admin.from('waitlist').select('utm_source').eq('is_demo', false).not('utm_source', 'is', null),
    admin.from('waitlist').select('*', { count: 'exact', head: true }).eq('is_demo', false).not('referrer_id', 'is', null)
  ])

  // A failed analytics query must not silently render as a 0 count or an
  // empty breakdown -- that reports wrong numbers as if they were real.
  for (const res of [totalRes, todayRes, founding500Res, topReferrersRes, utmRowsRes, referredRes]) {
    if (res.error) {
      throw new Error(`Waitlist admin analytics query failed: ${res.error.message}`)
    }
  }

  const total = totalRes.count
  const utmBreakdown: Record<string, number> = {}
  for (const row of utmRowsRes.data ?? []) {
    const source = row.utm_source as string
    utmBreakdown[source] = (utmBreakdown[source] ?? 0) + 1
  }

  const kFactor = total && total > 0 ? (referredRes.count ?? 0) / total : 0

  return (
    <WaitlistAdminDashboard
      stats={{
        total: total || 0,
        today: todayRes.count || 0,
        founding_500: founding500Res.count || 0,
        top_referrer: topReferrersRes.data?.[0] ?? null,
        utm_breakdown: utmBreakdown,
        k_factor: kFactor
      }}
    />
  )
}
