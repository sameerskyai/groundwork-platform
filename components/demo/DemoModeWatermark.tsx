'use client'

import { AlertTriangle } from 'lucide-react'

/**
 * Demo Mode Watermark
 * Displays at top of viewport when viewing demo marketplace
 * Visual indicator for founder that RLS is bypassed and demo data is visible
 */

export function DemoModeWatermark() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
      <div className="text-sm text-amber-900">
        <span className="font-semibold">🎭 FOUNDER DEMO MODE</span>
        <span className="ml-2 text-amber-800">
          Viewing demo marketplace (demo rows visible, RLS bypassed)
        </span>
      </div>
    </div>
  )
}
