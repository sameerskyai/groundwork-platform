import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null
function client() {
  if (!_client) _client = new Anthropic()
  return _client
}

export interface InterviewAnswer {
  field_key: string
  value_low: number
  value_high: number
  unit: string
  raw_input: string
}

export interface InterviewInput {
  tradeName: string
  question: string
  fieldKey: string
  unit: string
  rawAnswer: string
}

// Parses free-text contractor answer into structured numeric range
export async function runInterviewAgent(input: InterviewInput): Promise<InterviewAnswer> {
  const response = await client().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: `You are a data extraction agent for CraftMatch. Extract structured pricing from contractor answers.
Return ONLY valid JSON: {"value_low": number, "value_high": number, "unit": "string"}
- If a single value is given, set both low and high to that value
- Remove $ signs and commas
- Convert ranges like "$50-75" to {"value_low": 50, "value_high": 75}
- Unit should match the question context exactly`,
    messages: [{
      role: 'user',
      content: `Trade: ${input.tradeName}
Question: ${input.question}
Expected unit: ${input.unit}
Contractor answered: "${input.rawAnswer}"

Extract the structured pricing.`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Interview agent failed to parse answer')

  const parsed = JSON.parse(jsonMatch[0])
  return {
    field_key: input.fieldKey,
    value_low: parsed.value_low,
    value_high: parsed.value_high,
    unit: parsed.unit || input.unit,
    raw_input: input.rawAnswer
  }
}
