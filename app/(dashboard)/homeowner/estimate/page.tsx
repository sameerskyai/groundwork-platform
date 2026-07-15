'use client'

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

    // Validate file types (MEDIUM security: S4)
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const invalidFiles = files.filter(f => !validMimeTypes.includes(f.type))
    if (invalidFiles.length > 0) {
      setError('Only JPEG, PNG, WebP, and GIF images are allowed')
      return
    }

    // Validate max 3 files
    if (files.length > 3) {
      setError('Maximum 3 photos allowed')
      return
    }

    setError('')
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
    <div className="min-h-screen [background-color:var(--color-surface-primary)]">
      <header style={{
        backgroundColor: 'var(--color-surface-secondary)',
        borderBottom: '1px solid var(--color-border)',
        padding: '1rem 1.5rem'
      }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/homeowner" className="[color:var(--color-text-secondary)] hover:opacity-80 transition-opacity">
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
              <div className="w-8 h-8 rounded-[var(--radius-md)] [background-color:var(--color-brand-lighter)] flex items-center justify-center">
                <Zap className="w-4 h-4 [color:var(--color-brand)]" />
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
                <label className="block [font-size:var(--text-sm)] font-medium [color:var(--color-text-primary)] mb-[var(--space-sm)]">
                  What do you need done?
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  rows={5}
                  maxLength={2000}
                  className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] [font-size:var(--text-sm)] [color:var(--color-text-primary)] [background-color:var(--color-surface-primary)] [font-family:var(--font-sans)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
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
                <label className="flex flex-col items-center justify-center gap-[var(--space-md)] rounded-[var(--radius-md)] p-[var(--space-xl)] cursor-pointer [background-color:var(--color-surface-secondary)] border-2 border-dashed border-[var(--color-border)] transition-[border-color,background-color] duration-[var(--duration-normal)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-lighter)]">
                  <Upload className="w-6 h-6 [color:var(--color-text-tertiary)]" />
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    {uploading ? 'Uploading...' : photos.length ? `${photos.length} photo(s) selected` : 'Upload up to 3 photos'}
                  </span>
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotoChange} />
                </label>
              </div>

              {error && <p className="[color:var(--color-error)] [font-size:var(--text-sm)]">{error}</p>}

              <Button type="submit" size="lg" disabled={loading || uploading} className="w-full">
                {loading ? 'Analyzing...' : 'Get my estimate'}
                <Zap className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </Card>
        ) : (
          <div className="flex flex-col gap-6 animate-in fade-in duration-500" style={{ animationDelay: "0ms" }}>
            {/* Estimate card */}
            <Card variant="default">
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-info)', marginBottom: 'var(--space-sm)' }}>
                {estimate.projectType}
              </div>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-sm)' }}>
                {formatRange(estimate.estimateLow, estimate.estimateHigh)}
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                {estimate.scope} scope · {estimate.confidence} confidence
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-xl)' }}>
                {estimate.reasoning}
              </p>

              {/* Full itemized breakdown */}
              <div className="[background-color:var(--color-surface-secondary)] rounded-[var(--radius-lg)] p-[var(--space-lg)]">
                <h3 style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-lg)' }}>
                  Itemized breakdown
                </h3>
                {estimate.lineItems.map(li => (
                  <div key={li.item} className="flex justify-between [font-size:var(--text-sm)] py-[var(--space-md)] border-b border-[var(--color-border)] [color:var(--color-text-primary)] last:border-0">
                    <span>{li.item}</span>
                    <span style={{ fontWeight: 'var(--weight-medium)' }}>{formatRange(li.low, li.high)}</span>
                  </div>
                ))}
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
              className="[font-size:var(--text-sm)] [color:var(--color-text-secondary)] bg-transparent border-none cursor-pointer text-center transition-colors duration-[var(--duration-normal)] hover:text-[var(--color-text-primary)]"
            >
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
