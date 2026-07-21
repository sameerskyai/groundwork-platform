import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin-check'

function csvEscape(value: unknown): string {
  let str = value === null || value === undefined ? '' : String(value)
  // Prevent spreadsheet formula injection: Excel/Sheets evaluate any cell
  // starting with =, +, -, or @, and waitlist name/UTM values are user-
  // controlled. Prefixing with an apostrophe forces literal-text display.
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`
  }
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
    const isForbidden = typeof err === 'object' && err !== null && 'status' in err && (err as { status: unknown }).status === 403
    console.error('Waitlist export error:', err)
    return NextResponse.json(
      { error: isForbidden ? 'Forbidden' : 'Export failed' },
      { status: isForbidden ? 403 : 500 }
    )
  }
}
