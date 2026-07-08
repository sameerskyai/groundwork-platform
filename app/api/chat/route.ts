import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runChatAssistantAgent } from '@/lib/agents'

// Send a message
export async function POST(req: NextRequest) {
  try {
    const { matchId, content } = await req.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify match is active and user is a participant
    const { data: match } = await supabase
      .from('matches')
      .select(`
        *,
        projects(user_id, description, ai_project_type, ai_estimate_low, ai_estimate_high),
        contractor_profiles(user_id, business_name, contractor_trades(trades(name)))
      `)
      .eq('id', matchId)
      .eq('status', 'matched')
      .single()

    if (!match) return NextResponse.json({ error: 'Match not found or not active' }, { status: 404 })

    const project = match.projects as any
    const contractor = match.contractor_profiles as any
    const isHomeowner = user.id === project.user_id
    const isContractor = user.id === contractor.user_id
    if (!isHomeowner && !isContractor) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
    }

    // Insert message
    const { data: message } = await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: user.id,
      content
    }).select().single()

    // Get recent messages for context
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('*, profiles(role)')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(6)

    const priorMessages = (recentMessages ?? []).reverse().map((m: any) => ({
      role: m.profiles?.role === 'contractor' ? 'contractor' as const : 'homeowner' as const,
      content: m.content
    }))

    // Generate smart reply suggestions
    const tradeNames = contractor.contractor_trades?.map((ct: any) => ct.trades?.name).filter(Boolean) ?? []
    const suggestions = await runChatAssistantAgent({
      projectDescription: project.description,
      projectType: project.ai_project_type ?? 'Project',
      estimateRange: project.ai_estimate_low
        ? { low: project.ai_estimate_low, high: project.ai_estimate_high }
        : undefined,
      contractorName: contractor.business_name,
      contractorTrades: tradeNames,
      priorMessages,
      currentUserRole: isHomeowner ? 'homeowner' : 'contractor',
      userMessage: content
    })

    return NextResponse.json({ message, suggestions })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'Message failed' }, { status: 500 })
  }
}

// Get messages for a match
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const matchId = searchParams.get('matchId')
    if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: messages } = await supabase
      .from('messages')
      .select('*, profiles(full_name, avatar_url)')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    // Mark as read
    await supabase.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('match_id', matchId)
      .neq('sender_id', user.id)
      .is('read_at', null)

    return NextResponse.json({ messages })
  } catch (err) {
    console.error('Fetch messages error:', err)
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  }
}
