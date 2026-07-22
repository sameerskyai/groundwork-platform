'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Users } from 'lucide-react'

interface Community {
  id: string
  zip_code: string
  member_count: number
  post_count: number
  created_at: string
}

function CommunitiesContent() {
  const router = useRouter()
  const [userZip, setUserZip] = useState<string | null>(null)
  const [community, setCommunity] = useState<Community | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCommunity = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get user's ZIP from properties. is_demo isolation (WARP.md §14) is
      // for hiding demo rows from OTHER users, not the owner's own data --
      // filtering is_demo=false here meant a demo account (e.g. the founder
      // walkthrough user) could never find its own property.
      const { data: propertyData, error: propError } = await supabase
        .from('properties')
        .select('zip_code')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (propError && propError.code !== 'PGRST116') throw propError

      const zip = propertyData?.zip_code
      if (!zip) throw new Error('No ZIP code found. Complete onboarding first.')

      setUserZip(zip)

      // Get or create community for this ZIP. member_count/post_count aren't
      // real columns on `communities` (migration 005) -- they're computed
      // below via count queries against community_members/community_posts.
      const { data: communityData, error: commError } = await supabase
        .from('communities')
        .select('id, zip_code, created_at')
        .eq('zip_code', zip)
        .single()

      let communityId: string
      let communityRow: { id: string; zip_code: string; created_at: string }

      if (commError && commError.code === 'PGRST116') {
        // Community doesn't exist, create it. RLS requires creator_id = auth.uid().
        const { data: newComm, error: createError } = await supabase
          .from('communities')
          .insert({
            zip_code: zip,
            name: `ZIP ${zip} Community`,
            creator_id: user.id
          })
          .select('id, zip_code, created_at')
          .single()

        if (createError) throw createError
        communityRow = newComm
        communityId = newComm.id
      } else if (commError) {
        throw commError
      } else {
        communityRow = communityData
        communityId = communityData.id
      }

      // Ensure user is a member (ignore duplicate key errors)
      const { error: memberError } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: user.id
        })

      if (memberError && memberError.code !== '23505') throw memberError

      const { count: memberCount } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)

      const { count: postCount } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)

      setCommunity({ ...communityRow, member_count: memberCount ?? 0, post_count: postCount ?? 0 })
    } catch (err: any) {
      setError(err.message || 'Failed to load community')
    } finally {
      setLoading(false)
    }
  }, [router, community?.id])

  useEffect(() => {
    loadCommunity()
  }, [loadCommunity])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading community...</p>
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
            Your Community
          </h1>
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

        {community && (
          <div>
            <Card variant="interactive" className="p-8 mb-6 text-center">
              <Users style={{
                width: '3rem',
                height: '3rem',
                margin: '0 auto var(--space-md)',
                color: 'var(--color-brand)'
              }} />
              <h2 style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-xs)'
              }}>
                ZIP {community.zip_code}
              </h2>
              <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-lg)'
              }}>
                {community.member_count} members · {community.post_count} posts
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-md)',
                marginBottom: 'var(--space-lg)'
              }}>
                <div style={{
                  padding: 'var(--space-lg)',
                  backgroundColor: 'var(--color-surface-secondary)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <div style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 'var(--weight-bold)',
                    color: 'var(--color-brand)',
                    marginBottom: 'var(--space-xs)'
                  }}>
                    {community.member_count}
                  </div>
                  <div style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Neighbors
                  </div>
                </div>
                <div style={{
                  padding: 'var(--space-lg)',
                  backgroundColor: 'var(--color-surface-secondary)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <div style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 'var(--weight-bold)',
                    color: 'var(--color-brand)',
                    marginBottom: 'var(--space-xs)'
                  }}>
                    {community.post_count}
                  </div>
                  <div style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Discussions
                  </div>
                </div>
              </div>

              <Link href={`/homeowner/communities/${community.id}`}>
                <Button className="w-full">
                  View Community
                </Button>
              </Link>
            </Card>

            <Card className="p-6">
              <h3 style={{
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-md)'
              }}>
                About this community
              </h3>
              <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--leading-relaxed)'
              }}>
                Connect with homeowners and contractors in your ZIP code. Share renovation ideas, ask for recommendations, and discuss home improvement projects with your neighbors.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CommunitiesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-800 mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    }>
      <CommunitiesContent />
    </Suspense>
  )
}
