'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/logo'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  // 'checking' while we establish the recovery session from the email link,
  // 'ready' once a session exists, 'invalid' if the link is expired/used.
  const [linkState, setLinkState] = useState<'checking' | 'ready' | 'invalid'>('checking')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function establishSession() {
      // detectSessionInUrl normally consumes the ?code= from the email link
      // automatically; getSession() reflects the result once it has.
      const { data: { session } } = await supabase.auth.getSession()
      if (session) { if (!cancelled) setLinkState('ready'); return }

      // Fallback: exchange the code manually if auto-detection didn't run.
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!cancelled) setLinkState(error ? 'invalid' : 'ready')
        return
      }
      if (!cancelled) setLinkState('invalid')
    }

    establishSession()
    return () => { cancelled = true }
  }, [searchParams])

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Same post-login routing as the sign-in page
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_complete')
      .eq('id', data.user.id)
      .single()

    if (!profile?.onboarding_complete) {
      router.push('/onboarding')
    } else if (profile.role === 'contractor') {
      router.push('/contractor')
    } else {
      router.push('/homeowner')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--color-surface-primary)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex justify-center mb-8">
            <Wordmark size="lg" />
          </Link>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-inverse)' }}>Set a new password</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Choose something you&apos;ll remember</p>
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: 'var(--color-surface-secondary)', borderColor: 'var(--color-border-strong)' }}>
          {linkState === 'checking' && (
            <p className="text-sm" style={{ color: '#C4BDB3' }}>Verifying your reset link...</p>
          )}

          {linkState === 'invalid' && (
            <div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#C4BDB3' }}>
                This reset link is invalid or has expired. Reset links only work once and
                expire after a short time.
              </p>
              <Link href="/forgot-password">
                <Button size="lg" className="w-full">Request a new link</Button>
              </Link>
            </div>
          )}

          {linkState === 'ready' && (
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              {[
                { label: 'New password', value: password, set: setPassword, placeholder: '8+ characters' },
                { label: 'Confirm password', value: confirm, set: setConfirm, placeholder: 'Same again' }
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#C4BDB3' }}>{f.label}</label>
                  <input
                    type="password"
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF7A3A]"
                    style={{ background: 'var(--color-surface-primary)', border: '1px solid #2A2825', color: 'var(--color-text-inverse)' }}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button type="submit" size="lg" disabled={loading} className="w-full mt-1">
                {loading ? 'Saving...' : 'Set new password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface-primary)' }} />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
