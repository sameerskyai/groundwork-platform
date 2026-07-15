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

export interface ClassificationResult {
  trade: string
  projectType: string
  urgency: 'emergency' | 'soon' | 'flexible'
  complexity: 'simple' | 'moderate' | 'complex'
  flagged: boolean
  flagReason?: string
}

// Classifies incoming homeowner projects for routing and matching
export async function runProjectClassifierAgent(description: string): Promise<ClassificationResult> {
  const response = await client().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: `You are CraftMatch's project intake classifier. Classify homeowner project descriptions.
Return ONLY valid JSON:
{
  "trade": "one of: general-contractor|hvac|plumbing|electrical|roofing|flooring|painting|landscaping|windows-doors|handyman",
  "projectType": "string (e.g. Kitchen Remodel, AC Replacement)",
  "urgency": "emergency|soon|flexible",
  "complexity": "simple|moderate|complex",
  "flagged": boolean,
  "flagReason": "string or null"
}
Flag projects that seem fraudulent, dangerous, or outside the platform's scope.
Urgency: emergency = safety issue or no heat/water, soon = within weeks, flexible = whenever.`,
    messages: [{ role: 'user', content: `Classify this project: "${description}"` }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Classifier agent failed')

  return JSON.parse(jsonMatch[0]) as ClassificationResult
}
