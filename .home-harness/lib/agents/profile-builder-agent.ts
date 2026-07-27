import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null
function client() {
  if (!_client) _client = new Anthropic()
  return _client
}

export interface ProfileInput {
  businessName: string
  trades: string[]
  yearsInBusiness: number
  pricingAnswers: { question: string; value_low: number; value_high: number; unit: string }[]
  serviceArea: string
}

export interface ProfileOutput {
  bio: string
  headline: string
  specialties: string[]
}

// Writes a compelling contractor bio from their interview answers — no manual writing needed
export async function runProfileBuilderAgent(input: ProfileInput): Promise<ProfileOutput> {
  const pricingContext = input.pricingAnswers.map(a =>
    `- ${a.question}: $${a.value_low}${a.value_low !== a.value_high ? `–$${a.value_high}` : ''} ${a.unit}`
  ).join('\n')

  const response = await client().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: `You are CraftMatch's profile writer. Write honest, professional contractor bios from their pricing data.
Return ONLY valid JSON: {"bio": "string (2-3 sentences)", "headline": "string (under 10 words)", "specialties": ["string", "string", "string"]}
- Bio should sound like a real person wrote it, not a marketing brochure
- Mention trades, experience, and service area naturally
- Headline is the one-line pitch
- Specialties are 3 specific things they excel at based on their pricing data`,
    messages: [{
      role: 'user',
      content: `Business: ${input.businessName}
Trades: ${input.trades.join(', ')}
Years in business: ${input.yearsInBusiness}
Service area ZIP: ${input.serviceArea}
Pricing answers:
${pricingContext}

Write their profile.`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Profile builder agent failed')

  return JSON.parse(jsonMatch[0]) as ProfileOutput
}
