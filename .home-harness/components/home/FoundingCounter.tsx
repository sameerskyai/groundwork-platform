'use client'

import { useEffect, useState } from 'react'
import { MeasuredNumber } from '@/components/drawing'

/**
 * Live founding counter — REAL DATA ONLY (DESIGN_SYSTEM.md §05).
 *
 * Renders solely from /api/waitlist/stats, which returns
 * get_waitlist_public_stats(). If the fetch fails, is slow, or the shape is
 * not what we expect, this component renders NOTHING. There is no fallback
 * number, no "reasonable default", no placeholder. A fabricated count on a
 * page whose whole argument is "numbers you can check" would be the one
 * unrecoverable lie.
 */
export function FoundingCounter() {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    fetch('/api/waitlist/stats')
      .then(response => (response.ok ? response.json() : null))
      .then((data: { spots_remaining?: unknown } | null) => {
        if (!active) return
        if (data && typeof data.spots_remaining === 'number') {
          setRemaining(data.spots_remaining)
        }
      })
      .catch(() => {
        /* silent: no data means no element */
      })

    return () => {
      active = false
    }
  }, [])

  if (remaining === null) return null

  return <MeasuredNumber value={`${remaining}`} label="OF 500 REMAINING" />
}
