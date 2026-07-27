'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { zipToLatLng } from '@/lib/geo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { formatRange } from '@/lib/utils'
import { Upload, Zap, ChevronRight } from 'lucide-react'
import { Notice, PageHeader } from '../../_components/Feedback'
import { friendlyError, type FriendlyError } from '../../_lib/errors'

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
  const [error, setError] = useState<FriendlyError | null>(null)
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
      setError({
        title: 'That file type will not upload',
        detail: 'Photos need to be JPEG, PNG, WebP or GIF. Pick different files and try again — a screenshot of a photo works fine.'
      })
      return
    }

    // Validate max 3 files
    if (files.length > 3) {
      setError({
        title: 'That is more than three photos',
        detail: 'Three is the limit, because the estimator reads them all closely. Choose the three that show the space best.'
      })
      return
    }

    setError(null)
    setUploading(true)
    setPhotos(files)
    const urls = await uploadPhotos(files)
    setPhotoUrls(urls)
    setUploading(false)
  }

  async function handleEstimate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Geocode the ZIP before inserting. Contractor matching filters on
      // distance, so a project with no lat/lng matches nobody, forever --
      // and this flow is the only way a real project gets created. It used
      // to insert without coordinates, which is why matching returned empty
      // for every genuine user. `/api/projects` already did this; nothing
      // called it. Failure here is not fatal: the candidates route backfills
      // from zip_code on first read.
      const coords = await zipToLatLng(zip)

      // Create the project record first -- the estimate is attached to it.
      const { data: project, error: projectError } = await supabase.from('projects').insert({
        user_id: user.id,
        description,
        zip_code: zip,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        photo_urls: photoUrls
      }).select().single()

      if (projectError) throw projectError

      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, photoUrls, zipCode: zip, projectId: project?.id })
      })

      if (!res.ok) {
        // The API's own error string is a developer message. Never show it.
        setError({
          title: 'The estimator could not finish',
          detail: 'Your description was saved, so nothing needs retyping. Press "Get my estimate" again — if it fails twice, try again in a few minutes.'
        })
        setLoading(false)
        return
      }

      const data = await res.json()
      setEstimate(data.estimate)
      setProjectId(project?.id ?? null)
    } catch (err) {
      setError(
        friendlyError(err, {
          title: 'We could not start your estimate',
          detail: 'Everything you typed is still on screen. Check your connection and press the button again.'
        })
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen [background-color:var(--color-base)]">
      <PageHeader back={{ href: '/homeowner', label: 'Dashboard' }} title="Get an estimate" />

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

              {error && <Notice error={error} />}

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
              {/* Never interpolate a null id -- ?project=null is what made the
                  matches page bounce people back to the dashboard (BUG #5).
                  The label says matches, so it goes to matches. */}
              <Link href={projectId ? `/homeowner/matches?project=${projectId}` : '/homeowner/matches'}>
                <Button size="lg" className="w-full">
                  Find my matches
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <p className="annotation" style={{ textAlign: 'center', marginTop: 'var(--space-1)' }}>
                Adding a budget first raises your match scores ·{' '}
                <Link
                  href={projectId ? `/homeowner/budget?project=${projectId}` : '/homeowner/budget'}
                  style={{ color: 'var(--color-accent)' }}
                >
                  set a budget
                </Link>
              </p>
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
