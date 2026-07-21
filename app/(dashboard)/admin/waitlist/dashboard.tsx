'use client'

interface WaitlistStats {
  total: number
  today: number
  founding_500: number
  top_referrer: { name: string; verified_referral_count: number } | null
  utm_breakdown: Record<string, number>
  k_factor: number
}

export default function WaitlistAdminDashboard({ stats }: { stats: WaitlistStats }) {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Waitlist Admin</h1>
        <a
          href="/api/admin/waitlist/export"
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--color-brand)', color: 'white' }}
        >
          Export CSV
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
          <p style={{ color: 'var(--color-text-tertiary)' }} className="text-sm mb-2">Total Signups</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>

        <div className="p-6 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
          <p style={{ color: 'var(--color-text-tertiary)' }} className="text-sm mb-2">Today</p>
          <p className="text-3xl font-bold">{stats.today}</p>
        </div>

        <div className="p-6 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
          <p style={{ color: 'var(--color-text-tertiary)' }} className="text-sm mb-2">Founding 500</p>
          <p className="text-3xl font-bold">{stats.founding_500}</p>
        </div>

        <div className="p-6 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
          <p style={{ color: 'var(--color-text-tertiary)' }} className="text-sm mb-2">Spots Remaining</p>
          <p className="text-3xl font-bold">{Math.max(0, 500 - stats.founding_500)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
          <p style={{ color: 'var(--color-text-tertiary)' }} className="text-sm mb-2">K-Factor (referred / total)</p>
          <p className="text-3xl font-bold">{stats.k_factor.toFixed(2)}</p>
        </div>

        {stats.top_referrer && (
          <div className="p-6 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
            <p style={{ color: 'var(--color-text-tertiary)' }} className="text-sm mb-2">Top Referrer</p>
            <p className="text-lg font-bold">{stats.top_referrer.name}: {stats.top_referrer.verified_referral_count} referrals</p>
          </div>
        )}
      </div>

      <div className="p-6 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
        <h2 className="font-bold mb-4">Signups by UTM Source</h2>
        {Object.keys(stats.utm_breakdown).length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No UTM-tagged signups yet.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(stats.utm_breakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([source, count]) => (
                <div key={source} className="flex items-center justify-between text-sm">
                  <span>{source}</span>
                  <span className="font-mono font-bold">{count}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
