import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { runFeedAgent } from '@/lib/agents'
import { bucketCost } from '@/lib/feed'
import { zipToLatLng, haversineDistanceMiles } from '@/lib/geo'

// GET /api/feed?zip=60302&limit=20
// Public — no auth required. Powers both the dashboard section and the public page.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const zip = searchParams.get('zip')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)

    if (!zip || !/^\d{5}$/.test(zip)) {
      return NextResponse.json({ error: 'Valid 5-digit ZIP required' }, { status: 400 })
    }

    // Use service role for feed_config read (bypasses RLS on that table)
    const supabase = await createAdminClient()

    // Load config
    const { data: config } = await supabase
      .from('feed_config')
      .select('min_jobs_per_zip, zip_radius_fallback_miles')
      .eq('id', 1)
      .single()

    const minJobs = config?.min_jobs_per_zip ?? 3
    const fallbackRadiusMiles = config?.zip_radius_fallback_miles ?? 10

    // Try exact ZIP first
    const { data: exactEntries, count: exactCount } = await supabase
      .from('feed_entries')
      .select(`
        *,
        contractor_profiles(id, business_name, subscription_tier, feed_suppressed, rating, review_count)
      `, { count: 'exact' })
      .eq('zip_code', zip)
      .eq('published', true)
      .order('completion_date', { ascending: false })
      .limit(limit)

    // If above the density threshold, return exact ZIP results
    if ((exactCount ?? 0) >= minJobs) {
      return NextResponse.json({
        entries: filterSuppressed(exactEntries ?? []),
        zip,
        expanded: false,
        count: exactCount,
        belowThreshold: false
      })
    }

    // Below threshold — try expanding to nearby ZIPs using lat/lng bounding box
    const coords = await zipToLatLng(zip)
    if (!coords) {
      return NextResponse.json({
        entries: [],
        zip,
        expanded: false,
        count: 0,
        belowThreshold: true
      })
    }

    // Approximate bounding box for radius expansion (1 degree lat ≈ 69 miles)
    const latDelta = fallbackRadiusMiles / 69
    const lngDelta = fallbackRadiusMiles / (69 * Math.cos(coords.lat * Math.PI / 180))

    const { data: expandedEntries, count: expandedCount } = await supabase
      .from('feed_entries')
      .select(`
        *,
        contractor_profiles(id, business_name, subscription_tier, feed_suppressed, rating, review_count)
      `, { count: 'exact' })
      .eq('published', true)
      .gte('lat', coords.lat - latDelta)
      .lte('lat', coords.lat + latDelta)
      .gte('lng', coords.lng - lngDelta)
      .lte('lng', coords.lng + lngDelta)
      .order('completion_date', { ascending: false })
      .limit(limit)

    const belowThreshold = (expandedCount ?? 0) < minJobs

    return NextResponse.json({
      entries: filterSuppressed(expandedEntries ?? []),
      zip,
      expanded: true,
      count: expandedCount,
      belowThreshold
    })
  } catch (err) {
    console.error('Feed GET error:', err)
    return NextResponse.json({ error: 'Feed unavailable' }, { status: 500 })
  }
}

// POST /api/feed — mark a project complete + verified, trigger feed entry generation
// This is the sole trigger point — called when a receipt is uploaded and verified.
// Body: { projectId, receiptUrl, finalCostLow, finalCostHigh, daysToComplete }
export async function POST(req: NextRequest) {
  try {
    const { projectId, receiptUrl, finalCostLow, finalCostHigh, daysToComplete } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Load project — must be owned by the caller
    const { data: project } = await supabase
      .from('projects')
      .select(`
        *,
        trades(name, slug)
      `)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    if (project.status === 'completed') return NextResponse.json({ error: 'Already completed' }, { status: 409 })

    const now = new Date()
    const completionDate = now.toISOString().split('T')[0]

    // Mark project complete + store verified receipt
    await supabase.from('projects').update({
      status: 'completed',
      receipt_url: receiptUrl,
      receipt_verified: true,
      completed_at: now.toISOString(),
      days_to_complete: daysToComplete ?? null,
      final_cost_low: finalCostLow ?? project.ai_estimate_low,
      final_cost_high: finalCostHigh ?? project.ai_estimate_high
    }).eq('id', projectId)

    // Append to cost_data moat — real confirmed job cost
    const adminClient = await createAdminClient()
    if (project.lat && project.lng) {
      await adminClient.from('cost_data').insert({
        project_type: project.ai_project_type ?? project.description.slice(0, 60),
        trade_id: project.trade_id,
        zip_code: project.zip_code,
        lat: project.lat,
        lng: project.lng,
        cost_low: finalCostLow ?? project.ai_estimate_low,
        cost_high: finalCostHigh ?? project.ai_estimate_high,
        unit: 'flat',
        source: 'completed_match',
        source_date: completionDate
      })
    }

    // Return the opt-in prompt data to the client — the UI shows the yes/no prompt.
    // Actual feed entry is only created after the homeowner responds (see PATCH below).
    return NextResponse.json({
      success: true,
      projectId,
      promptOptIn: true,  // signal to client to show the opt-in prompt
      completionDate
    })
  } catch (err) {
    console.error('Feed POST error:', err)
    return NextResponse.json({ error: 'Completion failed' }, { status: 500 })
  }
}

// PATCH /api/feed — homeowner responds to opt-in prompt, feed entry is generated
// Body: { projectId, optIn: boolean, streetLabel?: string }
export async function PATCH(req: NextRequest) {
  try {
    const { projectId, optIn, streetLabel } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Load project with all fields needed for feed entry
    const { data: project } = await supabase
      .from('projects')
      .select(`
        *,
        trades(name)
      `)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .eq('receipt_verified', true)
      .single()

    if (!project) return NextResponse.json({ error: 'No verified completed project found' }, { status: 404 })

    // Record the homeowner's decision on the project
    await supabase.from('projects').update({
      homeowner_opted_into_feed: optIn
    }).eq('id', projectId)

    // Find the matched contractor for this project
    const adminClient = await createAdminClient()
    const { data: match } = await adminClient
      .from('matches')
      .select('contractor_id, contractor_profiles(business_name, feed_suppressed, user_id)')
      .eq('project_id', projectId)
      .eq('status', 'matched')
      .order('matched_at', { ascending: false })
      .limit(1)
      .single()

    const contractor = match?.contractor_profiles as any
    const contractorSuppressed = contractor?.feed_suppressed ?? false
    const contractorId = match?.contractor_id ?? null

    const costLow = project.final_cost_low ?? project.ai_estimate_low ?? 0
    const costHigh = project.final_cost_high ?? project.ai_estimate_high ?? 0
    const tradeCategory = (project.trades as any)?.name ?? project.ai_project_type ?? 'Home Improvement'
    const projectTypeLabel = project.ai_project_type ?? project.description.slice(0, 40)
    const neighborhoodLabel = project.zip_code  // minimum fallback; real neighborhood lookup is a future enrichment

    // Run the AI feed agent to write the copy
    const feedOutput = await runFeedAgent({
      projectTypeLabel,
      tradeCategory,
      zipCode: project.zip_code,
      neighborhoodLabel,
      streetLabel: optIn ? (streetLabel ?? undefined) : undefined,
      costLow,
      costHigh,
      daysToComplete: project.days_to_complete,
      contractorBusinessName: contractor?.business_name ?? 'a local contractor',
      homeownerOptedIn: optIn
    })

    // Write the feed entry — only if there's a contractor and they're not suppressed
    const feedEntry = await adminClient.from('feed_entries').insert({
      project_id: projectId,
      contractor_id: contractorSuppressed ? null : contractorId,
      zip_code: project.zip_code,
      lat: project.lat,
      lng: project.lng,
      trade_category: feedOutput.tradeCategory,
      project_type_label: feedOutput.projectTypeLabel,
      cost_range_label: feedOutput.costRangeLabel,
      completion_date: project.completed_at ? project.completed_at.split('T')[0] : new Date().toISOString().split('T')[0],
      days_to_complete: project.days_to_complete,
      homeowner_opted_in: optIn,
      street_label: optIn ? (streetLabel ?? null) : null,
      neighborhood_label: neighborhoodLabel,
      copy_line: feedOutput.copyLine,
      published: true
    }).select().single()

    return NextResponse.json({ success: true, entry: feedEntry.data })
  } catch (err) {
    console.error('Feed PATCH error:', err)
    return NextResponse.json({ error: 'Feed entry creation failed' }, { status: 500 })
  }
}

// Filter out entries where the contractor has their feed_suppressed flag set
function filterSuppressed(entries: any[]): any[] {
  return entries.map(e => {
    const cp = e.contractor_profiles
    if (cp?.feed_suppressed) {
      return { ...e, contractor_profiles: null }
    }
    return e
  })
}
