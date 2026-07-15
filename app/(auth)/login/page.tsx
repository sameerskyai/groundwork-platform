'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

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
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-inverse)' }}>Welcome back</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Sign in to your account</p>
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: 'var(--color-surface-secondary)', borderColor: 'var(--color-border-strong)' }}>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {[
              { label: 'Email', type: 'email', value: email, set: setEmail, placeholder: 'you@example.com' },
              { label: 'Password', type: 'password', value: password, set: setPassword, placeholder: '••••••••' }
            ].map(f => (
              <div key={f.label}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#C4BDB3' }}>{f.label}</label>
                <input
                  type={f.type}
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF7A3A]"
                  style={{ background: 'var(--color-surface-primary)', border: '1px solid #2A2825', color: 'var(--color-text-inverse)' }}
                  placeholder={f.placeholder}
                />
              </div>
            ))}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" size="lg" disabled={loading} className="w-full mt-1">
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
            <Link
              href="/forgot-password"
              className="text-center text-sm hover:underline"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Forgot password?
            </Link>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-tertiary)' }}>
          No account?{' '}
          <Link href="/signup" className="font-medium hover:underline" style={{ color: 'var(--color-brand)' }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  )
}
