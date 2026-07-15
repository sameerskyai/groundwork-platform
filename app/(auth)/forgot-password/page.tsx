'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--color-surface-primary)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex justify-center mb-8">
            <Wordmark size="lg" />
          </Link>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-inverse)' }}>Reset your password</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            {sent ? 'Check your inbox' : "We'll email you a reset link"}
          </p>
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: 'var(--color-surface-secondary)', borderColor: 'var(--color-border-strong)' }}>
          {sent ? (
            <p className="text-sm leading-relaxed" style={{ color: '#C4BDB3' }}>
              If an account exists for <span style={{ color: 'var(--color-text-inverse)' }}>{email}</span>, a password
              reset link is on its way. The link expires after a short time — if it does,
              just request a new one.
            </p>
          ) : (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#C4BDB3' }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF7A3A]"
                  style={{ background: 'var(--color-surface-primary)', border: '1px solid #2A2825', color: 'var(--color-text-inverse)' }}
                  placeholder="you@example.com"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button type="submit" size="lg" disabled={loading} className="w-full mt-1">
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-tertiary)' }}>
          Remembered it?{' '}
          <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--color-brand)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
