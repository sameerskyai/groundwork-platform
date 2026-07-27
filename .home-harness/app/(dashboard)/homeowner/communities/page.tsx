'use client'

/**
 * Your neighbourhood (one community per ZIP).
 *
 * Two things were wrong here and both are fixed:
 *
 * 1. The page threw the literal string "No ZIP code found. Complete onboarding
 *    first." at the user. Root cause (FEATURE_INVENTORY.md, Security Finding 2)
 *    is that `properties` has no INSERT policy, so the onboarding insert fails
 *    silently and the row never exists. We cannot add the policy from here
 *    (no migrations in this pass -- the exact SQL is reported instead), so the
 *    page now falls back to `profiles.zip_code`, which onboarding DOES write
 *    successfully. If neither exists the user gets plain language and a link
 *    to the one screen that can fix it.
 *
 * 2. member_count / post_count are not columns on `communities` (005). They are
 *    computed with count queries.
 */

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Users } from 'lucide-react'
import { Notice, EmptyState, Loading, PageHeader } from '../../_components/Feedback'
import { friendlyError, type FriendlyError } from '../../_lib/errors'

interface Community {
  id: string
  name: string
  zip_code: string
  member_count: number
  post_count: number
}

function CommunitiesContent() {
  const router = useRouter()
  const [community, setCommunity] = useState<Community | null>(null)
  const [noZip, setNoZip] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<FriendlyError | null>(null)

  const loadCommunity = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Prefer the property row; fall back to the profile, which onboarding
      // always writes. is_demo isolation (WARP.md §14) hides demo rows from
      // OTHER users, never from their owner, so we do not filter it here.
      const [{ data: propertyData }, { data: profileData }] = await Promise.all([
        supabase
          .from('properties')
          .select('zip_code')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase.from('profiles').select('zip_code').eq('id', user.id).maybeSingle()
      ])

      const zip = propertyData?.zip_code ?? profileData?.zip_code ?? null
      if (!zip) {
        setNoZip(true)
        setLoading(false)
        return
      }

      const { data: communityData, error: commError } = await supabase
        .from('communities')
        .select('id, name, zip_code')
        .eq('zip_code', zip)
        .limit(1)
        .maybeSingle()

      if (commError) throw commError

      let row = communityData
      if (!row) {
        // RLS requires creator_id = auth.uid().
        const { data: newComm, error: createError } = await supabase
          .from('communities')
          .insert({ zip_code: zip, name: `ZIP ${zip} Neighbourhood`, creator_id: user.id })
          .select('id, name, zip_code')
          .single()
        if (createError) throw createError
        row = newComm
      }

      // Ensure membership; a duplicate here is success, not failure.
      const { error: memberError } = await supabase
        .from('community_members')
        .insert({ community_id: row.id, user_id: user.id })
      if (memberError && memberError.code !== '23505') throw memberError

      const [{ count: memberCount }, { count: postCount }] = await Promise.all([
        supabase.from('community_members').select('id', { count: 'exact', head: true }).eq('community_id', row.id),
        supabase.from('community_posts').select('id', { count: 'exact', head: true }).eq('community_id', row.id)
      ])

      setCommunity({ ...row, member_count: memberCount ?? 0, post_count: postCount ?? 0 })
      setError(null)
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'We could not open your neighbourhood',
          detail: 'This is on our side, not yours. Reload the page — if it keeps happening, your dashboard still works normally in the meantime.'
        })
      )
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadCommunity()
  }, [loadCommunity])

  if (loading) return <Loading what="Finding your neighbourhood" />

  return (
    <div style={{ background: 'var(--color-base)', minHeight: '100vh' }}>
      <PageHeader back={{ href: '/homeowner', label: 'Dashboard' }} title="Your neighbourhood" />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-4) var(--space-3)' }}>
        {error && (
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <Notice error={error} />
          </div>
        )}

        {noZip && (
          <EmptyState
            glyph={<MapPin style={{ width: 22, height: 22 }} />}
            title="We do not know where you live yet"
            why="Neighbourhoods are grouped by ZIP code, so we cannot put you in one until we have yours. It takes one field, and we only ever show your ZIP — never your street address."
            action={{ label: 'Add your ZIP code', href: '/onboarding' }}
            secondary={{ label: 'Back to dashboard', href: '/homeowner' }}
          />
        )}

        {community && (
          <>
            <div
              style={{
                background: 'var(--color-base-alt)',
                border: '1px solid var(--color-line)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-3)'
              }}
            >
              <p className="annotation" style={{ marginBottom: 'var(--space-1)' }}>
                ZIP {community.zip_code}
              </p>
              <h2
                style={{
                  margin: '0 0 var(--space-2) 0',
                  fontSize: 'var(--type-5)',
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                  letterSpacing: 'var(--tracking-display)'
                }}
              >
                {community.name}
              </h2>

              <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                {[
                  { label: 'Neighbours', value: community.member_count },
                  { label: 'Discussions', value: community.post_count }
                ].map(stat => (
                  <div key={stat.label}>
                    <div
                      className="tabular"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--type-5)',
                        fontWeight: 600,
                        color: 'var(--color-accent)'
                      }}
                    >
                      {stat.value}
                    </div>
                    <div className="annotation">{stat.label}</div>
                  </div>
                ))}
              </div>

              <Link href={`/homeowner/communities/${community.id}`} className="btn-primary" style={{ textDecoration: 'none' }}>
                <Users style={{ width: 15, height: 15, marginRight: 8 }} aria-hidden="true" />
                Open the discussion
              </Link>
            </div>

            <div
              style={{
                border: '1px solid var(--color-line)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-3)'
              }}
            >
              <h3 className="annotation" style={{ marginBottom: 'var(--space-1)' }}>
                What this is for
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--type-3)',
                  lineHeight: 'var(--leading-body)',
                  color: 'var(--color-ink-2)'
                }}
              >
                Homeowners in ZIP {community.zip_code} comparing notes: who they hired, what it
                actually cost, and what they would do differently. Contractors cannot read this —
                it is neighbours only, by design.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function CommunitiesPage() {
  return (
    <Suspense fallback={<Loading what="Finding your neighbourhood" />}>
      <CommunitiesContent />
    </Suspense>
  )
}
