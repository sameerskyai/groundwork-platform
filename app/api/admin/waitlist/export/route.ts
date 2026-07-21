import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin-check'

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('waitlist')
      .select('position_number, name, email, phone, sms_consent, referral_code, verified_referral_count, founding_member, founding_500, utm_source, utm_medium, utm_campaign, created_at')
      .eq('is_demo', false)
      .order('position_number', { ascending: true })

    if (error) {
      throw error
    }

    const columns = ['position_number', 'name', 'email', 'phone', 'sms_consent', 'referral_code', 'verified_referral_count', 'founding_member', 'founding_500', 'utm_source', 'utm_medium', 'utm_campaign', 'created_at']
    const header = columns.join(',')
    const rows = (data ?? []).map(row => columns.map(col => csvEscape((row as Record<string, unknown>)[col])).join(','))
    const csv = [header, ...rows].join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="waitlist-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (err) {
    const status = (err as any).status === 403 ? 403 : 500
    const message = (err as any).status === 403 ? 'Forbidden' : 'Export failed'
    console.error('Waitlist export error:', err)
    return NextResponse.json({ error: message }, { status })
  }
}
