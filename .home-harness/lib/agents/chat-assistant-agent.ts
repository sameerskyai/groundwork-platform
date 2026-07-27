import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null
function client() {
  if (!_client) _client = new Anthropic()
  return _client
}

export interface ChatContext {
  projectDescription: string
  projectType: string
  estimateRange?: { low: number; high: number }
  contractorName: string
  contractorTrades: string[]
  priorMessages: { role: 'homeowner' | 'contractor'; content: string }[]
  currentUserRole: 'homeowner' | 'contractor'
  userMessage: string
}

// Suggests smart replies to keep conversations moving toward booked jobs
export async function runChatAssistantAgent(ctx: ChatContext): Promise<string[]> {
  const history = ctx.priorMessages.slice(-6).map(m =>
    `${m.role === 'homeowner' ? 'Homeowner' : 'Contractor'}: ${m.content}`
  ).join('\n')

  const response = await client().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: `You are CraftMatch's conversation assistant. Suggest 2-3 short, natural reply options to help ${ctx.currentUserRole}s move conversations toward booked jobs.
Return ONLY valid JSON array of strings: ["reply 1", "reply 2", "reply 3"]
Replies should be natural, not robotic. Under 20 words each.
For homeowners: help them get a firm quote, timeline, and next step.
For contractors: help them qualify the project and propose a site visit or quote.`,
    messages: [{
      role: 'user',
      content: `Project: ${ctx.projectDescription} (${ctx.projectType})
Estimate: ${ctx.estimateRange ? `$${ctx.estimateRange.low}–$${ctx.estimateRange.high}` : 'not run'}
Contractor: ${ctx.contractorName} (${ctx.contractorTrades.join(', ')})

Recent conversation:
${history}

Latest message from ${ctx.currentUserRole}: "${ctx.userMessage}"

Suggest replies for the ${ctx.currentUserRole}.`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  return JSON.parse(jsonMatch[0]) as string[]
}
