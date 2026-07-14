'use client'

import { useDemoMode } from './DemoModeProvider'

/**
 * Demo mode toggle button
 * Use in dev/admin controls
 * TODO: Wire to database flag when DB credentials available
 */
export function DemoModeToggle() {
  const { isDemoMode, toggleDemoMode } = useDemoMode()

  return (
    <button
      onClick={toggleDemoMode}
      style={{
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        borderRadius: '0.375rem',
        border: '1px solid',
        cursor: 'pointer',
        transition: 'all 200ms',
        backgroundColor: isDemoMode ? 'rgba(255, 193, 7, 0.2)' : 'transparent',
        borderColor: isDemoMode ? '#f59e0b' : '#d1d5db',
        color: isDemoMode ? '#f59e0b' : '#6b7280'
      }}
      title="Toggle demo mode (watermark will appear/disappear)"
    >
      {isDemoMode ? '🟡 Demo Mode ON' : 'Demo Mode'}
    </button>
  )
}

/**
 * DB-Dependent Demo Mode Logic (WRITTEN BUT NOT IMPLEMENTED)
 *
 * When database is available:
 *
 * 1. Add 'is_demo' boolean column to profiles table
 * 2. On auth.getUser(), check profile.is_demo flag
 * 3. Set isDemoMode context based on that flag
 * 4. RLS policy: Ensure demo users can only see demo data
 *
 * SQL Migration:
 *
 * ALTER TABLE profiles ADD COLUMN is_demo BOOLEAN DEFAULT false;
 *
 * RLS Policy:
 *
 * CREATE POLICY "Demo users see demo data" ON matches
 * USING (
 *   CASE WHEN (SELECT is_demo FROM profiles WHERE id = auth.uid())
 *   THEN EXISTS (SELECT 1 FROM matches WHERE is_demo = true)
 *   ELSE is_demo = false
 *   END
 * );
 */
