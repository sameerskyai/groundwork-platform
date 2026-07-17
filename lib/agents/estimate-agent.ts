import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null
function client() {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not set in environment. Add to .env.local: ANTHROPIC_API_KEY=sk_...')
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

export interface EstimateInput {
  description: string
  photoUrls?: string[]
  zipCode: string
  trade?: string
  costData?: CostDataPoint[]
}

export interface CostDataPoint {
  project_type: string
  cost_low: number
  cost_high: number
  unit: string
  source_date: string
}

export interface EstimateResult {
  projectType: string
  trade: string
  scope: 'small' | 'medium' | 'large'
  estimateLow: number
  estimateHigh: number
  laborEstimate: number
  materialsEstimate: number
  lineItems: { item: string; low: number; high: number }[]
  reasoning: string
  confidence: 'high' | 'medium' | 'low'
}

export async function runEstimateAgent(input: EstimateInput): Promise<EstimateResult> {
  const costContext = input.costData?.length
    ? `Available regional cost data:\n${input.costData.map(d =>
        `- ${d.project_type}: $${d.cost_low}–$${d.cost_high} ${d.unit} (data from ${d.source_date})`
      ).join('\n')}`
    : 'No local cost data available — use national averages with wider range.'

  const messages: Anthropic.MessageParam[] = []

  // Add photos if provided
  if (input.photoUrls?.length) {
    const imageContent: Anthropic.ContentBlockParam[] = input.photoUrls.slice(0, 3).map(url => ({
      type: 'image' as const,
      source: { type: 'url' as const, url }
    }))
    imageContent.push({
      type: 'text',
      text: `Project description: ${input.description}\nZIP code: ${input.zipCode}\n${costContext}`
    })
    messages.push({ role: 'user', content: imageContent })
  } else {
    messages.push({
      role: 'user',
      content: `Project description: ${input.description}\nZIP code: ${input.zipCode}\n${costContext}`
    })
  }

  const response = await client().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: `You are Groundwork's construction cost analyst. You provide range-based estimates based on project descriptions, photos, and regional cost patterns.

CRITICAL: Use statistical framing. Provide ranges, not verdicts. Every estimate is an approximation.

Return ONLY valid JSON with this exact structure:
{
  "projectType": "string (e.g. Kitchen Remodel)",
  "trade": "string (one of: general-contractor, hvac, plumbing, electrical, roofing, flooring, painting, landscaping, windows-doors, handyman)",
  "scope": "small|medium|large",
  "estimateLow": number,
  "estimateHigh": number,
  "laborEstimate": number,
  "materialsEstimate": number,
  "lineItems": [{"item": "string", "low": number, "high": number}],
  "reasoning": "string (2-3 sentences explaining the estimate range and key variables)",
  "confidence": "high|medium|low"
}

Rules:
- Use regional cost data when available. Fall back to national averages if not.
- Ranges should reflect typical variation in your area (±20% variance is normal)
- Reasoning must explain WHY the range is wide: unknown dimensions, regional labor costs, material choices, etc.
- Use language like "typically ranges from," "comparable projects in [ZIP]," "homes like yours"
- Never say "you need"; say "homes in your area typically replace at [age], yours is at [age]"
- laborEstimate + materialsEstimate should roughly sum to mid-point of estimate range
- lineItems should have 3-6 specific cost components with realistic variance
- confidence is "high" if description is detailed + photos available, "medium" if moderate detail, "low" if vague or missing key info
- Disclaimer appended by UI: "This is an estimate based on description and regional data. Not a professional inspection or quote."`,
    messages
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Estimate agent returned invalid response')

  return JSON.parse(jsonMatch[0]) as EstimateResult
}
