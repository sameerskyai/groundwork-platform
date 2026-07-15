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
    system: `You are CraftMatch's expert construction cost estimator. You analyze project descriptions and photos to provide accurate, itemized cost estimates.

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
  "reasoning": "string (2-3 sentences explaining the estimate)",
  "confidence": "high|medium|low"
}

Rules:
- Use regional cost data when available. Fall back to national averages if not.
- estimateLow and estimateHigh should be realistic market rates, not worst/best case
- laborEstimate + materialsEstimate should roughly sum to mid-point of estimate range
- lineItems should have 3-6 specific cost components
- confidence is "high" if description is detailed, "medium" if moderate, "low" if vague`,
    messages
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Estimate agent returned invalid response')

  return JSON.parse(jsonMatch[0]) as EstimateResult
}
