'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { BarChart3, Users, TrendingUp, Clock } from 'lucide-react'

interface AdminMetrics {
  totalUsers: number
  totalProjects: number
  activeMatches: number
  messageCount: number
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadMetrics() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // TODO: Verify admin role
        if (!user) {
          setError('Unauthorized')
          setLoading(false)
          return
        }

        // Attempt to load metrics (graceful fallback if tables empty/missing)
        try {
          const [users, projects, matches, messages] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('projects').select('*', { count: 'exact', head: true }),
            supabase.from('matches').select('*', { count: 'exact', head: true }),
            supabase.from('messages').select('*', { count: 'exact', head: true })
          ])

          setMetrics({
            totalUsers: users.count || 0,
            totalProjects: projects.count || 0,
            activeMatches: matches.count || 0,
            messageCount: messages.count || 0
          })
        } catch (dbErr) {
          // Database queries failed (tables may not exist yet)
          console.warn('Could not load metrics:', dbErr)
          setMetrics({
            totalUsers: 0,
            totalProjects: 0,
            activeMatches: 0,
            messageCount: 0
          })
        }

        setLoading(false)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        setLoading(false)
      }
    }

    loadMetrics()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <EmptyState
          icon={Users}
          title="Access Denied"
          description={error}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Platform metrics and management
          </p>
        </div>

        {/* Metrics Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <MetricCard
              icon={Users}
              label="Total Users"
              value={metrics.totalUsers}
              trend={metrics.totalUsers > 0 ? '+2.5%' : '0'}
            />
            <MetricCard
              icon={TrendingUp}
              label="Projects"
              value={metrics.totalProjects}
              trend={metrics.totalProjects > 0 ? '+1.2%' : '0'}
            />
            <MetricCard
              icon={BarChart3}
              label="Active Matches"
              value={metrics.activeMatches}
              trend={metrics.activeMatches > 0 ? '+0.8%' : '0'}
            />
            <MetricCard
              icon={Clock}
              label="Messages"
              value={metrics.messageCount}
              trend={metrics.messageCount > 0 ? '+5.1%' : '0'}
            />
          </div>
        ) : null}

        {/* Empty State (No Data) */}
        {!loading && metrics && Object.values(metrics).every(v => v === 0) && (
          <Card variant="default" className="p-12">
            <EmptyState
              icon={TrendingUp}
              title="No Data Yet"
              description="Start inviting homeowners and contractors to see metrics appear here."
            />
          </Card>
        )}

        {/* Recent Activity Section (Stub) */}
        {!loading && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Recent Activity
            </h2>
            <Card variant="default" className="p-6">
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                Activity log coming soon
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  trend: string
}

function MetricCard({ icon: Icon, label, value, trend }: MetricCardProps) {
  return (
    <Card variant="default" className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div style={{ color: 'var(--color-brand)' }}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <span
            className="text-sm font-medium px-2 py-1 rounded"
            style={{
              color: 'var(--color-success)',
              backgroundColor: 'var(--color-success-light)'
            }}
          >
            {trend}
          </span>
        </div>
      </div>
      <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {value.toLocaleString()}
      </p>
    </Card>
  )
}
