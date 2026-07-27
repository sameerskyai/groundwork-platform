'use client'

import React, { createContext, useState, useCallback } from 'react'

interface DemoModeContextType {
  isDemoMode: boolean
  toggleDemoMode: () => void
}

export const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined)

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false)

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode(prev => !prev)
  }, [])

  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode }}>
      {isDemoMode && <DemoModeWatermark />}
      {children}
    </DemoModeContext.Provider>
  )
}

/**
 * Demo mode watermark overlay
 * Shows on every screen when demo mode is active
 */
function DemoModeWatermark() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 9999,
        padding: '0.75rem 1rem',
        backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
        border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
        borderRadius: '0.5rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'var(--color-accent)',
        letterSpacing: '0.05em',
        pointerEvents: 'none'
      }}
    >
      DEMO MODE
    </div>
  )
}

/**
 * Hook to access demo mode context
 */
export function useDemoMode() {
  const context = React.useContext(DemoModeContext)
  if (!context) {
    throw new Error('useDemoMode must be used within DemoModeProvider')
  }
  return context
}
