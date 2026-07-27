'use client'

/**
 * Saved contractors.
 *
 * The empty state used to say "Save contractors from your matches to keep them
 * handy" and then offer only "Back to Dashboard" — a dead end that named the
 * action and then refused to provide it. It now sends you to the matches
 * screen, carrying the project id, which is where saving actually happens.
 */

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Bookmark, Trash2 } from 'lucide-react'
import { Notice, EmptyState, Loading, Avatar, PageHeader } from '../../_components/Feedback'
import { friendlyError, type FriendlyError } from '../../_lib/errors'

interface SavedContractor {
  id: string
  contractor_id: string
  contractor: {
    id: string
    business_name: string
    rating: number | null
    review_count: number | null
    verified_job_count: number | null
    years_in_business: number | null
    profiles: { avatar_url: string | null } | null
  }
}

function SavedContent() {
  const router = useRouter()
  const [contractors, setContractors] = useState<SavedContractor[]>([])
  const [projectId, setProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<FriendlyError | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const loadContractors = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const [{ data: savedData, error: savedError }, { data: proj }] = await Promise.all([
        supabase
          .from('saved_contractors')
          .select(`
            id,
            contractor_id,
            contractor:contractor_id(
              id, business_name, rating, review_count,
              verified_job_count, years_in_business, profiles(avatar_url)
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ])

      if (savedError) throw savedError
      setProjectId(proj?.id ?? null)
      setContractors((savedData || []) as unknown as SavedContractor[])
      setError(null)
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'We could not load your saved list',
          detail: 'Nothing has been removed — this is a problem reading the list. Reload the page to try again.'
        })
      )
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

      const { error: delError } = await supabase
        .from('saved_contractors')
        .delete()
        .eq('user_id', user.id)
        .eq('contractor_id', contractorId)

      if (delError) throw delError
      setContractors(prev => prev.filter(c => c.contractor_id !== contractorId))
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'We could not remove that contractor',
          detail: 'They are still on your list, so nothing changed. Try the bin icon again.'
        })
      )
    } finally {
      setRemoving(null)
    }
  }

  if (loading) return <Loading what="Loading your saved contractors" />

  return (
    <div style={{ background: 'var(--color-base)', minHeight: '100vh' }}>
      <PageHeader
        back={{ href: '/homeowner', label: 'Dashboard' }}
        title="Saved contractors"
        trailing={<span className="annotation tabular">{contractors.length}</span>}
      />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-4) var(--space-3)' }}>
        {error && (
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <Notice error={error} />
          </div>
        )}

        {contractors.length === 0 ? (
          <EmptyState
            glyph={<Bookmark style={{ width: 22, height: 22 }} />}
            title="Nothing saved yet"
            why="This is your shortlist — contractors you bookmarked while going through matches, so you can compare them side by side before saying yes to anyone."
            action={
              projectId
                ? { label: 'Go to your matches', href: `/homeowner/matches?project=${projectId}` }
                : { label: 'Start an estimate first', href: '/homeowner/estimate' }
            }
            secondary={{ label: 'Back to dashboard', href: '/homeowner' }}
          />
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {contractors.map(saved => {
              const c = saved.contractor
              const facts = [
                c.rating != null ? `${c.rating.toFixed(1)} rating` : null,
                c.review_count != null ? `${c.review_count} reviews` : null,
                c.verified_job_count != null ? `${c.verified_job_count} verified jobs` : null,
                c.years_in_business != null ? `${c.years_in_business} yrs` : null
              ].filter(Boolean)

              return (
                <li
                  key={saved.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    border: '1px solid var(--color-line)',
                    borderRadius: 'var(--radius-card)',
                    padding: 'var(--space-2)'
                  }}
                >
                  <Avatar name={c.business_name} src={c.profiles?.avatar_url} size={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 'var(--type-3)', fontWeight: 600, color: 'var(--color-ink)' }}>
                      {c.business_name}
                    </p>
                    <p className="annotation" style={{ margin: 0 }}>
                      {facts.length ? facts.join(' · ') : 'New to Laywork'}
                    </p>
                  </div>
                  <Link href={`/contractors/${c.id}`} className="btn-secondary" style={{ textDecoration: 'none' }}>
                    View
                  </Link>
                  <button
                    onClick={() => handleRemove(c.id)}
                    disabled={removing === c.id}
                    className="btn-secondary"
                    aria-label={`Remove ${c.business_name} from saved`}
                    style={{ cursor: 'pointer', opacity: removing === c.id ? 0.5 : 1 }}
                  >
                    <Trash2 style={{ width: 15, height: 15 }} aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function SavedPage() {
  return (
    <Suspense fallback={<Loading what="Loading your saved contractors" />}>
      <SavedContent />
    </Suspense>
  )
}
