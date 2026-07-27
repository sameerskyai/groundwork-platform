import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Demo Session Endpoint (ADMIN-ONLY)
 * Returns service-role session for founder demo viewing (bypasses RLS)
 *
 * Security: Requires authenticated user with role='admin'
 * Non-admin or anon users → 403 Forbidden
 *
 * Usage: fetch('/api/demo/session', { method: 'POST' }) via authenticated session
 */

export async function POST(request: NextRequest) {
  try {
    // Get current session (server-side)
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    // Verify authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Not authenticated' },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Admin verified — return demo mode marker
    const adminClient = createAdminClient()

    return NextResponse.json({
      demo_mode: true,
      admin_id: session.user.id,
      watermark: 'FOUNDER DEMO VIEW',
      message: 'Viewing demo marketplace (demo rows visible, RLS bypassed via service role)',
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('Demo session error:', err)
    return NextResponse.json(
      { error: 'Failed to create demo session' },
      { status: 500 }
    )
  }
}
