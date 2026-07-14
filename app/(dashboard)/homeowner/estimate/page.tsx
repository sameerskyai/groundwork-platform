'use client'

import '@/app/styles/design-tokens.css'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { formatRange } from '@/lib/utils'
import { ArrowLeft, Upload, Zap, ChevronRight } from 'lucide-react'

interface EstimateResult {
  projectType: string
  scope: string
  estimateLow: number
  estimateHigh: number
  laborEstimate: number
  materialsEstimate: number
  lineItems: { item: string; low: number; high: number }[]
  reasoning: string
  confidence: string
}

export default function EstimatePage() {
  const [description, setDescription] = useState('')
  const [zip, setZip] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [estimate, setEstimate] = useState<EstimateResult | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  async function uploadPhotos(files: File[]): Promise<string[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const urls: string[] = []
    for (const file of files.slice(0, 3)) {
      const path = `${user.id}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('project-photos').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('project-photos').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    return urls
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    setPhotos(files)
    const urls = await uploadPhotos(files)
    setPhotoUrls(urls)
    setUploading(false)
  }

  async function handleEstimate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Create project record first
    const { data: project } = await supabase.from('projects').insert({
      user_id: user.id,
      description,
      zip_code: zip,
      photo_urls: photoUrls
    }).select().single()

    const res = await fetch('/api/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, photoUrls, zipCode: zip, projectId: project?.id })
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Estimate failed')
      setLoading(false)
      return
    }

    setEstimate(data.estimate)
    setProjectId(project?.id ?? null)
    setLoading(false)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <header style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: '1rem 1.5rem'
      }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/homeowner" style={{ color: 'var(--color-text-secondary)' }} className="hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
            Get an estimate
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {!estimate ? (
          <Card variant="default" className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-brand-lighter)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap className="w-4 h-4" style={{ color: 'var(--color-brand)' }} />
              </div>
              <div>
                <h2 style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)' }}>
                  Describe your project
                </h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  AI estimate in under 30 seconds
                </p>
              </div>
            </div>

            <form onSubmit={handleEstimate} className="flex flex-col gap-4">
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-medium)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-sm)'
                }}>
                  What do you need done?
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-primary)',
                    backgroundColor: 'var(--color-surface-primary)',
                    fontFamily: 'var(--font-sans)',
                    resize: 'none'
                  }}
                  className="focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                  placeholder="e.g. I need my 200 sqft kitchen completely remodeled — new cabinets, countertops, tile backsplash, and new flooring."
                />
              </div>

              <Input
                label="ZIP code"
                type="text"
                value={zip}
                onChange={e => setZip(e.target.value)}
                required
                pattern="[0-9]{5}"
                placeholder="10001"
              />

              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-medium)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-md)'
                }}>
                  Photos <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 'var(--weight-regular)' }}>(optional)</span>
                </label>
                <label style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-md)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-xl)',
                  cursor: 'pointer',
                  backgroundColor: 'var(--color-surface-secondary)',
                  border: `2px dashed var(--color-border)`,
                  transition: `border-color var(--duration-normal), background-color var(--duration-normal)`
                }} className="hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-lighter)]">
                  <Upload className="w-6 h-6" style={{ color: 'var(--color-text-tertiary)' }} />
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    {uploading ? 'Uploading...' : photos.length ? `${photos.length} photo(s) selected` : 'Upload up to 3 photos'}
                  </span>
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotoChange} />
                </label>
              </div>

              {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>{error}</p>}

              <Button type="submit" size="lg" disabled={loading || uploading} className="w-full">
                {loading ? 'Analyzing...' : 'Get my estimate'}
                <Zap className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Estimate card */}
            <Card variant="default">
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-info)', marginBottom: 'var(--space-sm)' }}>
                {estimate.projectType}
              </div>
              <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
                {formatRange(estimate.estimateLow, estimate.estimateHigh)}
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                {estimate.scope} scope · {estimate.confidence} confidence
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-xl)' }}>
                {estimate.reasoning}
              </p>

              {/* Locked line items CTA */}
              <div style={{
                backgroundColor: 'var(--color-surface-tertiary)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-lg)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backdropFilter: 'blur(2px)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <p style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
                    Full itemized breakdown
                  </p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                    Labor vs. materials + {estimate.lineItems.length} line items
                  </p>
                  <Button size="sm">Unlock for $9.99</Button>
                </div>
                <div style={{ opacity: 0.15 }}>
                  {estimate.lineItems.map(li => (
                    <div key={li.item} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 'var(--text-sm)',
                      padding: 'var(--space-md) 0',
                      borderBottom: '1px solid var(--color-border)'
                    }} className="last:border-0">
                      <span>{li.item}</span>
                      <span style={{ fontWeight: 'var(--weight-medium)' }}>{formatRange(li.low, li.high)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Find contractors CTA */}
            <Card variant="accent">
              <h3 style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
                Find contractors for this project
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                Send your project to vetted pros in your area. They review it — you pick who to talk to.
              </p>
              <Link href={`/homeowner/matches?project=${projectId}`}>
                <Button size="lg" className="w-full">
                  Find my matches
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </Card>

            <button
              onClick={() => setEstimate(null)}
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'center',
                transition: `color var(--duration-normal)`
              }}
              className="hover:text-[var(--color-text-primary)]"
            >
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
