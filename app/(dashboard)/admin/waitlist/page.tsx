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

  const { count: total } = await admin
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
    .eq('is_demo', false)

  const today = new Date().toISOString().split('T')[0]
  const { count: todayCount } = await admin
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
    .eq('is_demo', false)
    .gte('created_at', today + 'T00:00:00')

  const { count: founding500 } = await admin
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
    .eq('founding_500', true)
    .eq('is_demo', false)

  const { data: topReferrers } = await admin
    .from('waitlist')
    .select('name, verified_referral_count')
    .eq('is_demo', false)
    .order('verified_referral_count', { ascending: false })
    .limit(1)

  const { data: utmRows } = await admin
    .from('waitlist')
    .select('utm_source')
    .eq('is_demo', false)
    .not('utm_source', 'is', null)

  const utmBreakdown: Record<string, number> = {}
  for (const row of utmRows ?? []) {
    const source = row.utm_source as string
    utmBreakdown[source] = (utmBreakdown[source] ?? 0) + 1
  }

  const { count: referredCount } = await admin
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
    .eq('is_demo', false)
    .not('referrer_id', 'is', null)

  const kFactor = total && total > 0 ? (referredCount ?? 0) / total : 0

  return (
    <WaitlistAdminDashboard
      stats={{
        total: total || 0,
        today: todayCount || 0,
        founding_500: founding500 || 0,
        top_referrer: topReferrers?.[0] ?? null,
        utm_breakdown: utmBreakdown,
        k_factor: kFactor
      }}
    />
  )
}
