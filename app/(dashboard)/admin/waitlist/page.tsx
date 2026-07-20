'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WaitlistStats {
  total: number
  today: number
  founding_500: number
  top_referrer: any
  utm_breakdown: Record<string, number>
}

export default function WaitlistAdminPage() {
  const [stats, setStats] = useState<WaitlistStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadStats() {
      try {
        // Total signups
        const { count: total } = await supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true })
          .eq('is_demo', false)

        // Today's signups
        const today = new Date().toISOString().split('T')[0]
        const { count: todayCount } = await supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true })
          .eq('is_demo', false)
          .gte('created_at', today + 'T00:00:00')

        // Founding 500 count
        const { count: founding500 } = await supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true })
          .eq('founding_500', true)
          .eq('is_demo', false)

        // Top referrer
        const { data: topReferrers } = await supabase
          .from('waitlist')
          .select('name, verified_referral_count')
          .eq('is_demo', false)
          .order('verified_referral_count', { ascending: false })
          .limit(1)

        setStats({
          total: total || 0,
          today: todayCount || 0,
          founding_500: founding500 || 0,
          top_referrer: topReferrers?.[0],
          utm_breakdown: {}
        })
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Waitlist Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
          <p style={{ color: 'var(--color-text-tertiary)' }} className="text-sm mb-2">Total Signups</p>
          <p className="text-3xl font-bold">{stats?.total || 0}</p>
        </div>

        <div className="p-6 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
          <p style={{ color: 'var(--color-text-tertiary)' }} className="text-sm mb-2">Today</p>
          <p className="text-3xl font-bold">{stats?.today || 0}</p>
        </div>

        <div className="p-6 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
          <p style={{ color: 'var(--color-text-tertiary)' }} className="text-sm mb-2">Founding 500</p>
          <p className="text-3xl font-bold">{stats?.founding_500 || 0}</p>
        </div>

        <div className="p-6 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
          <p style={{ color: 'var(--color-text-tertiary)' }} className="text-sm mb-2">Spots Remaining</p>
          <p className="text-3xl font-bold">{Math.max(0, 500 - (stats?.founding_500 || 0))}</p>
        </div>
      </div>

      {stats?.top_referrer && (
        <div className="p-6 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
          <h2 className="font-bold mb-2">Top Referrer</h2>
          <p>{stats.top_referrer.name}: {stats.top_referrer.verified_referral_count} referrals</p>
        </div>
      )}
    </div>
  )
}
