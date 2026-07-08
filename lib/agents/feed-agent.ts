import Anthropic from '@anthropic-ai/sdk'
import { bucketCost, buildDefaultCopy, buildOptedInCopy } from '@/lib/feed'

let _client: Anthropic | null = null
function client() {
  if (!_client) _client = new Anthropic()
  return _client
}

export interface FeedEntryInput {
  projectTypeLabel: string      // "bathroom remodel"
  tradeCategory: string         // "Plumbing"
  zipCode: string
  neighborhoodLabel: string     // "Oak Park" or "60302" — never full address
  streetLabel?: string          // only if homeowner opted in
  costLow: number
  costHigh: number
  daysToComplete: number | null
  contractorBusinessName: string
  homeownerOptedIn: boolean
}

export interface FeedEntryOutput {
  copyLine: string
  costRangeLabel: string
  projectTypeLabel: string      // normalized/cleaned version
  tradeCategory: string
}

// Writes the natural-language feed copy for a completed verified job.
// Keeps all copy factual — no marketing fluff, no superlatives.
export async function runFeedAgent(input: FeedEntryInput): Promise<FeedEntryOutput> {
  const costRangeLabel = bucketCost(input.costLow, input.costHigh)
  const locationContext = input.homeownerOptedIn && input.streetLabel
    ? `Street (opted in): ${input.streetLabel}`
    : `Neighborhood/area: ${input.neighborhoodLabel}`

  const response = await client().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: `You write short, factual, one-sentence feed entries for CraftMatch — a contractor marketplace.
These appear in a public neighborhood activity feed showing real completed jobs.
Tone: conversational but neutral. Never use superlatives like "amazing," "incredible," or "best."
Rules:
- Never include exact dollar amounts — only the provided cost range label
- Never include homeowner name, last name, or full street address
- Always end with a period
- One sentence only, 25–40 words max
- Mention the contractor business name naturally if it fits without sounding promotional
- Return ONLY valid JSON: {"copyLine": "string", "projectTypeLabel": "string"}
  projectTypeLabel should be a clean, lowercase human-readable label (e.g. "kitchen remodel" not "KITCHEN_REMODEL")`,
    messages: [{
      role: 'user',
      content: `Project type: ${input.projectTypeLabel}
Trade: ${input.tradeCategory}
${locationContext}
Cost range: ${costRangeLabel}
Days to complete: ${input.daysToComplete ?? 'unknown'}
Contractor: ${input.contractorBusinessName}
Homeowner opted into named post: ${input.homeownerOptedIn}

Write the feed entry.`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    // Safe fallback — never fail silently with wrong data
    const fallbackCopy = input.homeownerOptedIn && input.streetLabel
      ? buildOptedInCopy(input.streetLabel, input.neighborhoodLabel, input.projectTypeLabel, costRangeLabel, input.daysToComplete)
      : buildDefaultCopy(input.neighborhoodLabel, input.projectTypeLabel, costRangeLabel, input.daysToComplete)

    return {
      copyLine: fallbackCopy,
      costRangeLabel,
      projectTypeLabel: input.projectTypeLabel.toLowerCase(),
      tradeCategory: input.tradeCategory
    }
  }

  const parsed = JSON.parse(jsonMatch[0])
  return {
    copyLine: parsed.copyLine,
    costRangeLabel,
    projectTypeLabel: parsed.projectTypeLabel ?? input.projectTypeLabel.toLowerCase(),
    tradeCategory: input.tradeCategory
  }
}
