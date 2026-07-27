import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null
function client() {
  if (!_client) _client = new Anthropic()
  return _client
}

export interface ContractorCandidate {
  id: string
  businessName: string
  trades: string[]
  rating: number
  reviewCount: number
  yearsInBusiness: number
  responseRate: number
  subscriptionTier: string
  pricingRange?: { low: number; high: number }
  distanceMiles: number
}

export interface ProjectContext {
  description: string
  trade: string
  budgetMin?: number
  budgetMax?: number
  estimateLow?: number
  estimateHigh?: number
  zipCode: string
}

export interface RankedMatch {
  contractorId: string
  score: number
  reasoning: string
}

// Ranks pre-filtered contractors by fit score using AI judgment
export async function runMatchRankerAgent(
  project: ProjectContext,
  candidates: ContractorCandidate[]
): Promise<RankedMatch[]> {
  if (!candidates.length) return []

  const candidateList = candidates.map((c, i) =>
    `${i + 1}. ID: ${c.id} | ${c.businessName} | Rating: ${c.rating}/5 (${c.reviewCount} reviews) | ${c.yearsInBusiness}yrs | Response: ${c.responseRate}% | Tier: ${c.subscriptionTier} | Distance: ${c.distanceMiles}mi | Price range: ${c.pricingRange ? `$${c.pricingRange.low}–$${c.pricingRange.high}` : 'not specified'}`
  ).join('\n')

  const response = await client().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    system: `You are CraftMatch's matching engine. Score contractor candidates for a project on a 0–1 scale.
Return ONLY valid JSON array: [{"contractorId": "uuid", "score": 0.0-1.0, "reasoning": "one sentence"}]
Ranking factors (weight order): budget fit > trade specialization > rating > response rate > distance > subscription tier
Growth tier contractors get slight priority in ranking when scores are close.
Return all candidates ranked, highest score first.`,
    messages: [{
      role: 'user',
      content: `Project: ${project.description}
Trade needed: ${project.trade}
Budget: ${project.budgetMin ? `$${project.budgetMin}–$${project.budgetMax}` : 'not specified'}
AI estimate: ${project.estimateLow ? `$${project.estimateLow}–$${project.estimateHigh}` : 'not run yet'}
ZIP: ${project.zipCode}

Contractor candidates:
${candidateList}

Rank them.`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return candidates.map(c => ({ contractorId: c.id, score: 0.5, reasoning: 'Default rank' }))

  return JSON.parse(jsonMatch[0]) as RankedMatch[]
}
