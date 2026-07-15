'use client'

import { AlertTriangle } from 'lucide-react'

/**
 * Demo Mode Watermark
 * Displays at top of viewport when viewing demo marketplace
 * Visual indicator for founder that RLS is bypassed and demo data is visible
 */

export function DemoModeWatermark() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between gap-4" style={{
      backgroundColor: 'rgba(140, 80, 50, 0.08)',
      borderBottom: '1px solid rgba(140, 80, 50, 0.2)',
      backdropFilter: 'blur(8px)'
    }}>
      <div className="flex items-center gap-3 flex-1">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-brand)' }} />
        <div className="text-sm">
          <span className="font-semibold" style={{ color: 'var(--color-brand)' }}>
            🎭 Demo Mode
          </span>
          <span className="ml-3" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Viewing demo marketplace data
          </span>
        </div>
      </div>
    </div>
  )
}
