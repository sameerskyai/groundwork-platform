'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FeedCard, type FeedEntry } from './FeedCard'
import { MapPin, ExternalLink } from 'lucide-react'

interface FeedSectionProps {
  zipCode: string
}

export function FeedSection({ zipCode }: FeedSectionProps) {
  const [entries, setEntries] = useState<FeedEntry[]>([])
  const [belowThreshold, setBelowThreshold] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!zipCode) return
    fetch(`/api/feed?zip=${zipCode}&limit=5`)
      .then(r => r.json())
      .then(data => {
        setEntries(data.entries ?? [])
        setBelowThreshold(data.belowThreshold ?? false)
        setExpanded(data.expanded ?? false)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [zipCode])

  if (loading) return (
    <div className="mt-10">
      <div className="h-5 w-40 bg-gray-100 rounded animate-pulse mb-4" />
      <div className="h-32 bg-gray-50 rounded-2xl animate-pulse" />
    </div>
  )

  if (belowThreshold || !entries.length) return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-[#FF6B35]" />
        Your neighborhood
      </h2>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
        <p className="text-sm text-gray-500">
          No verified jobs nearby yet — Groundwork is just getting started in your area.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Complete your first project to be the first in your neighborhood.
        </p>
      </div>
    </div>
  )

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#FF6B35]" />
          Recent jobs near {expanded ? 'your area' : zipCode}
        </h2>
        <Link
          href={`/feed/${zipCode}`}
          className="text-sm text-[#FF6B35] font-medium flex items-center gap-1 hover:underline"
        >
          See all <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {entries.map(e => <FeedCard key={e.id} entry={e} />)}
      </div>
    </div>
  )
}
