import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null
function client() {
  if (!_client) _client = new Anthropic()
  return _client
}

// Natural language interface to admin dashboard data
export async function runAdminAgent(
  question: string,
  data: Record<string, unknown>
): Promise<string> {
  const response = await client().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: `You are CraftMatch's admin analytics agent. Answer questions about platform metrics in 1-3 sentences.
Be specific with numbers. Flag anomalies. Suggest actions when trends are negative.
Format numbers cleanly (e.g. $12,400 MRR, not 12400).`,
    messages: [{
      role: 'user',
      content: `Question: ${question}

Current platform data:
${JSON.stringify(data, null, 2)}`
    }]
  })

  return response.content[0].type === 'text' ? response.content[0].text : 'Unable to analyze data.'
}
