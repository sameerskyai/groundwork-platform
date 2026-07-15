'use client'

import { useCallback, useEffect, useState } from 'react'

interface DemoSession {
  demo_mode: boolean
  admin_id?: string
  watermark: string
  timestamp: string
}

/**
 * Demo Mode Hook
 * Manages demo session state for founder viewing
 * Returns demo mode flag and functions to activate/deactivate
 */

export function useDemoMode() {
  const [demoSession, setDemoSession] = useState<DemoSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if demo mode is already active (from session storage)
  useEffect(() => {
    const stored = sessionStorage.getItem('demo_mode_session')
    if (stored) {
      try {
        setDemoSession(JSON.parse(stored))
      } catch {
        sessionStorage.removeItem('demo_mode_session')
      }
    }
  }, [])

  const activateDemoMode = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/demo/session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to activate demo mode (${response.status})`)
      }

      const session: DemoSession = await response.json()
      setDemoSession(session)
      sessionStorage.setItem('demo_mode_session', JSON.stringify(session))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deactivateDemoMode = useCallback(() => {
    setDemoSession(null)
    sessionStorage.removeItem('demo_mode_session')
  }, [])

  return {
    demoSession,
    isActive: demoSession?.demo_mode ?? false,
    isLoading,
    error,
    activate: activateDemoMode,
    deactivate: deactivateDemoMode
  }
}
