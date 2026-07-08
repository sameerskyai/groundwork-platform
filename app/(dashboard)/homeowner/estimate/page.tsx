'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/homeowner" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-gray-900">Get an estimate</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {!estimate ? (
          <form onSubmit={handleEstimate} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#FF6B35]" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Describe your project</h2>
                <p className="text-xs text-gray-500">AI estimate in under 30 seconds</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What do you need done?
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] resize-none"
                  placeholder="e.g. I need my 200 sqft kitchen completely remodeled — new cabinets, countertops, tile backsplash, and new flooring. Gutting everything down to the studs."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP code</label>
                <input
                  type="text"
                  value={zip}
                  onChange={e => setZip(e.target.value)}
                  required
                  pattern="[0-9]{5}"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                  placeholder="10001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos <span className="text-gray-400 font-normal">(optional — improves accuracy)</span>
                </label>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-[#FF6B35] transition-colors">
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {uploading ? 'Uploading...' : photos.length ? `${photos.length} photo(s) selected` : 'Upload up to 3 photos'}
                  </span>
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotoChange} />
                </label>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <Button type="submit" size="lg" disabled={loading || uploading} className="w-full">
                {loading ? 'Analyzing your project...' : 'Get my estimate'}
                <Zap className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Estimate card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="text-xs font-medium text-[#FF6B35] mb-1">{estimate.projectType}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {formatRange(estimate.estimateLow, estimate.estimateHigh)}
              </h2>
              <p className="text-sm text-gray-500 mb-4">{estimate.scope} scope · {estimate.confidence} confidence</p>
              <p className="text-sm text-gray-700 leading-relaxed mb-5">{estimate.reasoning}</p>

              {/* Locked line items CTA */}
              <div className="bg-gray-50 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute inset-0 backdrop-blur-[2px] bg-white/60 flex flex-col items-center justify-center z-10 rounded-xl">
                  <p className="font-bold text-gray-900 mb-1">Full itemized breakdown</p>
                  <p className="text-sm text-gray-500 mb-3">Labor vs. materials + {estimate.lineItems.length} line items</p>
                  <Button size="sm">Unlock for $9.99</Button>
                </div>
                <div className="opacity-20">
                  {estimate.lineItems.map(li => (
                    <div key={li.item} className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                      <span>{li.item}</span>
                      <span className="font-medium">{formatRange(li.low, li.high)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Find contractors CTA */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-1">Find contractors for this project</h3>
              <p className="text-sm text-gray-500 mb-4">
                Send your project to vetted pros in your area. They review it — you pick who to talk to.
              </p>
              <Link href={`/homeowner/matches?project=${projectId}`}>
                <Button size="lg" className="w-full">
                  Find my matches
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <button
              onClick={() => setEstimate(null)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors text-center"
            >
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
