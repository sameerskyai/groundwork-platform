import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null
function client() {
  if (!_client) _client = new Anthropic()
  return _client
}

/**
 * THE match score scale. 0–1, three decimals.
 *
 * There is exactly one scale in this codebase and this is it. It is dictated by
 * the column the score is persisted to — `matches.match_score DECIMAL(4,3)`
 * (001_initial.sql:222) — which physically cannot hold a 0–100 percentage
 * beyond 9.999. The two 0–100 implementations that used to exist
 * (`lib/agents/match-scorer.ts` and `POST /api/projects/[id]/score`) were
 * deleted rather than converted, because neither persisted anything and
 * neither had a caller.
 *
 * Multiply by 100 for display only. Never store a percentage.
 */
export const MATCH_SCORE_SCALE = { min: 0, max: 1, decimals: 3 } as const

/**
 * THE compatibility gate: 0.80 on the 0–1 scale = the marketed "80% match".
 * Enforced server-side in `GET /api/projects/[id]/candidates` and again in the
 * UI query at `app/(dashboard)/homeowner/matches/page.tsx` (`.gte(0.8)`).
 * The UI keeps a literal instead of importing this constant on purpose:
 * importing from this module would pull the Anthropic SDK into the client
 * bundle.
 */
export const MATCH_THRESHOLD = 0.8

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

export interface HomeownerPreferences {
  preferred_budget?: number | null
  preferred_timeline?: string | null
  preferred_style?: string | null
  experience_level_preference?: string | null
}

export interface ProjectContext {
  description: string
  trade: string
  budgetMin?: number
  budgetMax?: number
  estimateLow?: number
  estimateHigh?: number
  zipCode: string
  /**
   * Optional. Comes from `homeowner_preferences`, which does not exist in the
   * live database yet — the table is written as migration 042 and is pending a
   * founder apply. Callers pass `undefined` until then and the prompt simply
   * omits the section.
   */
  preferences?: HomeownerPreferences | null
}

export interface RankedMatch {
  contractorId: string
  score: number
  reasoning: string
}

// Clamp anything the model returns into the one legal scale. A model that
// answers "85" instead of "0.85" must not be able to write 85 into a
// DECIMAL(4,3) column (numeric overflow) or sail past the 0.8 gate.
function normalizeScore(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw))
  if (!Number.isFinite(n)) return 0
  const asUnit = n > 1 ? n / 100 : n
  return Math.min(1, Math.max(0, Math.round(asUnit * 1000) / 1000))
}

/**
 * Degraded-mode scorer. Used when the model call fails — expired key, no
 * credit, rate limit, malformed output.
 *
 * This exists because matching is a marketed feature and an upstream billing
 * or availability problem should not silently return "no contractors match
 * your project" to a homeowner who has three qualified pros a mile away. The
 * old behaviour was an unhandled throw, a 500, and an empty screen.
 *
 * Weights sum to 1 and are deliberately conservative:
 *   0.35 proximity      — 1 at the doorstep, 0 at the edge of the contractor's
 *                         own declared service radius
 *   0.35 track record   — rating/5 when rated; verified job count when not yet
 *                         rated; 0.5 (the no-information midpoint) for a
 *                         contractor with neither, which is every contractor
 *                         in a cold-start marketplace
 *   0.15 tenure         — years in business, saturating at 15
 *   0.15 responsiveness — response rate
 *
 * Trade match is not a term: it is a hard filter upstream, so every candidate
 * reaching this function already has it.
 */
export function deterministicRank(
  candidates: ContractorCandidate[],
  radiusByCandidate?: Map<string, number>
): RankedMatch[] {
  return candidates
    .map(c => {
      const radius = radiusByCandidate?.get(c.id) ?? 25
      const proximity = 1 - Math.min(1, c.distanceMiles / Math.max(1, radius))
      const trackRecord = c.rating > 0
        ? c.rating / 5
        : c.reviewCount > 0
          ? Math.min(1, c.reviewCount / 10)
          : 0.5
      const tenure = Math.min(1, c.yearsInBusiness / 15)
      const responsiveness = Math.min(1, c.responseRate / 100)

      const score = Math.round(
        (0.35 * proximity + 0.35 * trackRecord + 0.15 * tenure + 0.15 * responsiveness) * 1000
      ) / 1000

      return {
        contractorId: c.id,
        score: Math.min(1, Math.max(0, score)),
        reasoning: `Scored without AI ranking (model unavailable): ${c.distanceMiles} mi away inside a ${radius} mi service area, ${c.yearsInBusiness} years in business, ${c.rating > 0 ? `${c.rating}/5 across ${c.reviewCount} reviews` : 'no reviews yet'}.`
      }
    })
    .sort((a, b) => b.score - a.score)
}

// Ranks pre-filtered contractors by fit score using AI judgment.
// Returns scores on the 0–1 scale, highest first.
export async function runMatchRankerAgent(
  project: ProjectContext,
  candidates: ContractorCandidate[],
  radiusByCandidate?: Map<string, number>
): Promise<RankedMatch[]> {
  if (!candidates.length) return []

  const candidateList = candidates.map((c, i) =>
    `${i + 1}. ID: ${c.id} | ${c.businessName} | Rating: ${c.rating}/5 (${c.reviewCount} reviews) | ${c.yearsInBusiness}yrs | Response: ${c.responseRate}% | Tier: ${c.subscriptionTier} | Distance: ${c.distanceMiles}mi | Price range: ${c.pricingRange ? `$${c.pricingRange.low}–$${c.pricingRange.high}` : 'not specified'}`
  ).join('\n')

  const prefs = project.preferences
  const prefLine = prefs
    ? `\nHomeowner preferences: budget ${prefs.preferred_budget ?? 'unspecified'}, timeline ${prefs.preferred_timeline ?? 'unspecified'}, style ${prefs.preferred_style ?? 'unspecified'}, experience level ${prefs.experience_level_preference ?? 'unspecified'}`
    : ''

  const response = await client().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    system: `You are Laywork's matching engine. Score contractor candidates for a project on a 0–1 scale.
Return ONLY valid JSON array: [{"contractorId": "uuid", "score": 0.0-1.0, "reasoning": "one sentence"}]
Scores are decimals between 0 and 1 — 0.85 means an 85% match. Never return a number above 1.
Ranking factors (weight order): budget fit > trade specialization > rating > response rate > distance > subscription tier
Growth tier contractors get slight priority in ranking when scores are close.
Only score 0.80 or higher when the contractor is genuinely a strong fit — 0.80 is the gate below which a homeowner never sees the contractor at all.
Return all candidates ranked, highest score first.`,
    messages: [{
      role: 'user',
      content: `Project: ${project.description}
Trade needed: ${project.trade}
Budget: ${project.budgetMin ? `$${project.budgetMin}–$${project.budgetMax}` : 'not specified'}
AI estimate: ${project.estimateLow ? `$${project.estimateLow}–$${project.estimateHigh}` : 'not run yet'}
ZIP: ${project.zipCode}${prefLine}

Contractor candidates:
${candidateList}

Rank them.`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return candidates.map(c => ({ contractorId: c.id, score: 0.5, reasoning: 'Default rank' }))

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    return candidates.map(c => ({ contractorId: c.id, score: 0.5, reasoning: 'Default rank' }))
  }
  if (!Array.isArray(parsed)) {
    return candidates.map(c => ({ contractorId: c.id, score: 0.5, reasoning: 'Default rank' }))
  }

  const validIds = new Set(candidates.map(c => c.id))
  return (parsed as Record<string, unknown>[])
    .filter(m => validIds.has(String(m?.contractorId)))
    .map(m => ({
      contractorId: String(m.contractorId),
      score: normalizeScore(m.score),
      reasoning: typeof m.reasoning === 'string' ? m.reasoning : ''
    }))
    .sort((a, b) => b.score - a.score)
}
