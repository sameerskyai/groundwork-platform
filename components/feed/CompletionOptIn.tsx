'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, X } from 'lucide-react'

interface CompletionOptInProps {
  projectId: string
  zipCode: string
  onDone: () => void
}

// Shown exactly once, right after a project is marked complete + receipt verified.
// This is the only place homeowners are asked about sharing — not buried in settings.
export function CompletionOptIn({ projectId, zipCode, onDone }: CompletionOptInProps) {
  const [step, setStep] = useState<'prompt' | 'street' | 'done'>('prompt')
  const [streetLabel, setStreetLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function respond(optIn: boolean, street?: string) {
    setSubmitting(true)
    await fetch('/api/feed', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, optIn, streetLabel: street ?? null })
    })
    setSubmitting(false)
    setStep('done')
    // Give a moment so the user sees the confirmation before the parent clears it
    setTimeout(onDone, 1500)
  }

  if (step === 'done') {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
        <p className="text-sm font-medium text-green-700">Thanks — your project has been recorded.</p>
      </div>
    )
  }

  if (step === 'street') {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-1">Add a street name? (optional)</h3>
        <p className="text-sm text-gray-500 mb-4">
          We&apos;ll show your street name only — never your full address or last name.
          If you skip this, we&apos;ll just show your neighborhood area.
        </p>
        <input
          type="text"
          value={streetLabel}
          onChange={e => setStreetLabel(e.target.value)}
          placeholder="e.g. Oak Street"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] mb-4"
        />
        <div className="flex gap-3">
          <Button size="sm" onClick={() => respond(true, streetLabel || undefined)} disabled={submitting} className="flex-1">
            {submitting ? 'Saving...' : 'Share to feed'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => respond(true, undefined)} disabled={submitting}>
            Skip street name
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">Share this project with your neighborhood?</h3>
          <p className="text-sm text-gray-500 mb-4">
            Help neighbors see real completed projects near them. Your name and exact address are never shown —
            only your neighborhood area, the project type, and the approximate cost range.
            The contractor&apos;s name will be credited.
          </p>
          <div className="flex gap-3">
            <Button size="sm" onClick={() => setStep('street')} disabled={submitting} className="flex-1">
              Yes, share it
            </Button>
            <Button size="sm" variant="secondary" onClick={() => respond(false)} disabled={submitting}>
              No thanks
            </Button>
          </div>
        </div>
        <button
          onClick={() => respond(false)}
          className="text-gray-300 hover:text-gray-500 transition-colors mt-0.5"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
