import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runInterviewAgent, runProfileBuilderAgent } from '@/lib/agents'

export async function POST(req: NextRequest) {
  try {
    const { answers, contractorId } = await req.json()
    // answers: [{ question, field_key, unit, raw_input, trade_id, trade_name }]
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Run interview agent on each answer to extract structured pricing
    const structuredAnswers = await Promise.all(
      answers.map(async (a: any) => {
        const parsed = await runInterviewAgent({
          tradeName: a.trade_name,
          question: a.question,
          fieldKey: a.field_key,
          unit: a.unit,
          rawAnswer: a.raw_input
        })
        return { ...parsed, trade_id: a.trade_id }
      })
    )

    // Store structured pricing
    await supabase.from('contractor_pricing').upsert(
      structuredAnswers.map(a => ({
        contractor_id: contractorId,
        trade_id: a.trade_id,
        field_key: a.field_key,
        value_low: a.value_low,
        value_high: a.value_high,
        unit: a.unit
      })),
      { onConflict: 'contractor_id,trade_id,field_key' }
    )

    // Seed cost_data from contractor interview answers (builds the moat in new markets)
    const { data: contractor } = await supabase
      .from('contractor_profiles')
      .select('*, profiles(zip_code, lat, lng)')
      .eq('id', contractorId)
      .single()

    if (contractor?.profiles) {
      const profile = contractor.profiles as any
      await supabase.from('cost_data').insert(
        structuredAnswers
          .filter(a => a.value_low && a.value_high)
          .map(a => ({
            project_type: a.field_key.replace(/_/g, ' '),
            trade_id: a.trade_id,
            zip_code: profile.zip_code,
            lat: profile.lat,
            lng: profile.lng,
            cost_low: a.value_low,
            cost_high: a.value_high,
            unit: a.unit,
            source: 'contractor_interview',
            source_date: new Date().toISOString().split('T')[0]
          }))
      )
    }

    // Run profile builder agent to write bio from interview data
    const { data: trades } = await supabase
      .from('contractor_trades')
      .select('trades(name)')
      .eq('contractor_id', contractorId)

    const tradeNames = trades?.map((t: any) => t.trades.name) ?? []

    const profileOutput = await runProfileBuilderAgent({
      businessName: contractor?.business_name ?? 'Our Business',
      trades: tradeNames,
      yearsInBusiness: contractor?.years_in_business ?? 1,
      pricingAnswers: structuredAnswers.map(a => ({
        question: answers.find((q: any) => q.field_key === a.field_key)?.question ?? a.field_key,
        value_low: a.value_low,
        value_high: a.value_high,
        unit: a.unit
      })),
      serviceArea: contractor?.profiles ? (contractor.profiles as any).zip_code : ''
    })

    // Update contractor profile with AI-written bio
    await supabase.from('contractor_profiles').update({
      bio: profileOutput.bio
    }).eq('id', contractorId)

    return NextResponse.json({ success: true, profile: profileOutput, structuredAnswers })
  } catch (err) {
    console.error('Interview agent error:', err)
    return NextResponse.json({ error: 'Interview processing failed' }, { status: 500 })
  }
}
