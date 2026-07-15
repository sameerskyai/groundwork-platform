'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/logo'
import { zipToLatLng } from '@/lib/geo'

function SignupForm() {
  const searchParams = useSearchParams()
  const defaultRole = (searchParams.get('role') as 'homeowner' | 'contractor') ?? 'homeowner'

  const [role, setRole] = useState<'homeowner' | 'contractor' | 'property_manager'>(defaultRole)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError || !authData.user) {
      setError(authError?.message ?? 'Signup failed')
      setLoading(false)
      return
    }

    const coords = zip ? await zipToLatLng(zip) : null

    await supabase.from('profiles').insert({
      id: authData.user.id,
      role,
      full_name: fullName,
      email,
      zip_code: zip,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      onboarding_complete: false
    })

    if (role === 'contractor') {
      await supabase.from('contractor_profiles').insert({
        user_id: authData.user.id,
        zip_code: zip,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null
      })
    }

    router.push('/onboarding')
  }

  const roles = [
    { value: 'homeowner', label: 'Homeowner', desc: 'I need work done' },
    { value: 'contractor', label: 'Contractor', desc: 'I do the work' },
    { value: 'property_manager', label: 'Property Manager', desc: 'I manage properties' }
  ] as const

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--color-surface-primary)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex justify-center mb-8">
            <Wordmark size="lg" />
          </Link>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-inverse)' }}>Create your account</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Get started in under 2 minutes</p>
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: 'var(--color-surface-secondary)', borderColor: 'var(--color-border-strong)' }}>
          {/* Role picker */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {roles.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className="p-3 rounded-xl text-left transition-all"
                style={{
                  border: role === r.value ? '2px solid #BF7A3A' : '2px solid #2A2825',
                  background: role === r.value ? 'var(--color-surface-primary)' : 'transparent'
                }}
              >
                <div className="text-xs font-semibold" style={{ color: 'var(--color-text-inverse)' }}>{r.label}</div>
                <div className="text-[10px] mt-0.5 leading-tight" style={{ color: 'var(--color-text-tertiary)' }}>{r.desc}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            {[
              { label: 'Full name', type: 'text', value: fullName, set: setFullName, placeholder: 'Your name', required: true },
              { label: 'Email', type: 'email', value: email, set: setEmail, placeholder: 'you@example.com', required: true },
              { label: 'Password', type: 'password', value: password, set: setPassword, placeholder: '8+ characters', required: true },
              { label: 'ZIP code', type: 'text', value: zip, set: setZip, placeholder: '10001', required: false }
            ].map(f => (
              <div key={f.label}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#C4BDB3' }}>{f.label}</label>
                <input
                  type={f.type}
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  required={f.required}
                  minLength={f.type === 'password' ? 8 : undefined}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#BF7A3A]"
                  style={{ background: 'var(--color-surface-primary)', border: '1px solid #2A2825', color: 'var(--color-text-inverse)' }}
                  placeholder={f.placeholder}
                />
              </div>
            ))}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" size="lg" disabled={loading} className="w-full mt-1">
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-tertiary)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--color-brand)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface-primary)' }} />}>
      <SignupForm />
    </Suspense>
  )
}
