import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runEstimateAgent, runProjectClassifierAgent } from '@/lib/agents'
import { zipToLatLng, findNearestCostData } from '@/lib/geo'

export async function POST(req: NextRequest) {
  try {
    const { description, photoUrls, zipCode, projectId } = await req.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Step 1: Classify project (AI agent)
    const classification = await runProjectClassifierAgent(description)
    if (classification.flagged) {
      return NextResponse.json({ error: 'Project flagged: ' + classification.flagReason }, { status: 400 })
    }

    // Step 2: Find regional cost data (with fallback to nearest)
    const coords = await zipToLatLng(zipCode)
    let costData: any[] = []

    if (coords) {
      // Try local data first
      const { data: localData } = await supabase
        .from('cost_data')
        .select('*')
        .eq('project_type', classification.projectType)
        .eq('zip_code', zipCode)
        .order('source_date', { ascending: false })
        .limit(10)

      if (localData?.length) {
        costData = localData
      } else {
        // Fall back to all data for this project type — find nearest by lat/long
        const { data: allData } = await supabase
          .from('cost_data')
          .select('*')
          .eq('project_type', classification.projectType)
          .not('lat', 'is', null)
          .order('source_date', { ascending: false })
          .limit(100)

        if (allData?.length) {
          const nearest = findNearestCostData(coords.lat, coords.lng, allData)
          if (nearest) costData = [nearest]
        }
      }
    }

    // Step 3: Run estimate agent
    const estimate = await runEstimateAgent({
      description,
      photoUrls,
      zipCode,
      trade: classification.trade,
      costData
    })

    // Step 4: Update project with AI results
    if (projectId) {
      await supabase.from('projects').update({
        ai_project_type: estimate.projectType,
        ai_scope: estimate.scope,
        ai_estimate_low: estimate.estimateLow,
        ai_estimate_high: estimate.estimateHigh,
        ai_labor_estimate: estimate.laborEstimate,
        ai_materials_estimate: estimate.materialsEstimate,
        ai_reasoning: estimate.reasoning,
        trade_id: (await supabase.from('trades').select('id').eq('slug', estimate.trade).single()).data?.id
      }).eq('id', projectId).eq('user_id', user.id)
    }

    // Step 5: Store contractor interview data back into cost_data (compounds the moat)
    if (coords) {
      await supabase.from('cost_data').insert({
        project_type: estimate.projectType,
        zip_code: zipCode,
        lat: coords.lat,
        lng: coords.lng,
        cost_low: estimate.estimateLow,
        cost_high: estimate.estimateHigh,
        unit: 'flat',
        source: 'estimate_engine',
        source_date: new Date().toISOString().split('T')[0]
      })
    }

    return NextResponse.json({
      classification,
      estimate,
      // Wide range shown free; full breakdown gated behind Stripe
      freeRange: { low: estimate.estimateLow, high: estimate.estimateHigh },
      // Full itemized breakdown — only returned after payment confirmed
      fullBreakdown: null
    })
  } catch (err) {
    console.error('Estimate agent error:', err)
    return NextResponse.json({ error: 'Estimate failed' }, { status: 500 })
  }
}
