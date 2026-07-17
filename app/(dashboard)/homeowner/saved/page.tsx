'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, MessageCircle, Trash2 } from 'lucide-react'

interface SavedContractor {
  id: string
  contractor_id: string
  contractor: {
    id: string
    business_name: string
    rating: number
    review_count: number
    verified_job_count: number
    years_in_business: number
    profiles: {
      avatar_url: string | null
    } | null
  }
}

function SavedContent() {
  const router = useRouter()
  const [contractors, setContractors] = useState<SavedContractor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)

  const loadContractors = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: savedData, error: savedError } = await supabase
        .from('saved_contractors')
        .select(`
          id,
          contractor_id,
          contractor:contractor_id(
            id,
            business_name,
            rating,
            review_count,
            verified_job_count,
            years_in_business,
            profiles(avatar_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (savedError) throw savedError
      setContractors((savedData || []) as unknown as SavedContractor[])
    } catch (err: any) {
      setError(err.message || 'Failed to load saved contractors')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadContractors()
  }, [loadContractors])

  const handleRemove = async (contractorId: string) => {
    setRemoving(contractorId)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('saved_contractors')
        .delete()
        .eq('user_id', user.id)
        .eq('contractor_id', contractorId)

      setContractors(prev => prev.filter(c => c.contractor_id !== contractorId))
    } catch (err: any) {
      setError(err.message || 'Failed to remove contractor')
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading saved contractors...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'var(--color-surface-primary)', minHeight: '100vh' }}>
      <header style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: '1rem 1.5rem'
      }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/homeowner" style={{ color: 'var(--color-text-secondary)' }} className="hover:opacity-80">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 style={{
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-text-primary)',
            flex: 1
          }}>
            Saved Contractors
          </h1>
          <span style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-tertiary)'
          }}>
            {contractors.length}
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <Card className="p-4 mb-6" style={{ borderColor: 'var(--color-error)', borderWidth: '1px' }}>
            <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>
              {error}
            </p>
          </Card>
        )}

        {contractors.length === 0 ? (
          <Card variant="accent" className="p-12 text-center">
            <h2 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-sm)'
            }}>
              No saved contractors yet
            </h2>
            <p style={{
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-lg)'
            }}>
              Save contractors from your matches to keep them handy
            </p>
            <Link href="/homeowner">
              <Button>Back to Dashboard</Button>
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {contractors.map(saved => {
              const c = saved.contractor
              return (
                <Card key={saved.id} variant="interactive">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      {c.profiles?.avatar_url && (
                        <img
                          src={c.profiles.avatar_url}
                          alt={c.business_name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <h3 style={{
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--weight-bold)',
                          color: 'var(--color-text-primary)',
                          marginBottom: 'var(--space-xs)'
                        }}>
                          {c.business_name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
                          <span className="flex items-center gap-1">
                            ⭐ {c.rating.toFixed(1)} ({c.review_count})
                          </span>
                          <span>• {c.verified_job_count} verified jobs</span>
                          <span>• {c.years_in_business}yrs exp</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Link href={`/contractors/${c.id}`}>
                        <Button size="sm" variant="secondary">
                          View
                        </Button>
                      </Link>
                      <button
                        onClick={() => handleRemove(c.id)}
                        disabled={removing === c.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-xs)',
                          padding: 'var(--space-sm) var(--space-md)',
                          backgroundColor: 'var(--color-surface-secondary)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-lg)',
                          color: 'var(--color-text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 200ms',
                          opacity: removing === c.id ? 0.5 : 1
                        }}
                        className="hover:opacity-80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SavedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    }>
      <SavedContent />
    </Suspense>
  )
}
