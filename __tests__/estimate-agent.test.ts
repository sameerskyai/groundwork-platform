import { describe, it, expect, beforeAll } from 'vitest'
import { runEstimateAgent } from '@/lib/agents/estimate-agent'

describe('Estimate Agent E2E', {
  timeout: 30000
}, () => {
  beforeAll(() => {
    // Force set the API key for this test
    process.env.ANTHROPIC_API_KEY = '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'

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not set')
    }
  })

  it('should generate estimate for 3 bathrooms modernization', { timeout: 30000 }, async () => {
    const result = await runEstimateAgent({
      description: '3 bathrooms, 2000s design, modernize with vinyl',
      zipCode: '20155'
    })

    expect(result).toBeDefined()
    expect(result.projectType).toBeDefined()
    expect(result.estimateLow).toBeGreaterThan(0)
    expect(result.estimateHigh).toBeGreaterThan(result.estimateLow)
    expect(result.lineItems).toBeDefined()
    expect(result.lineItems.length).toBeGreaterThan(0)
    expect(result.reasoning).toBeDefined()
    expect(result.confidence).toMatch(/high|medium|low/)

    console.log('\n=== ESTIMATE OUTPUT ===')
    console.log(`Project Type: ${result.projectType}`)
    console.log(`Scope: ${result.scope}`)
    console.log(`Estimate Range: $${result.estimateLow.toLocaleString()} - $${result.estimateHigh.toLocaleString()}`)
    console.log(`Labor: $${result.laborEstimate.toLocaleString()}`)
    console.log(`Materials: $${result.materialsEstimate.toLocaleString()}`)
    console.log(`Confidence: ${result.confidence}`)
    console.log(`Reasoning: ${result.reasoning}`)
    console.log('\nLine Items:')
    result.lineItems.forEach(item => {
      console.log(`  - ${item.item}: $${item.low.toLocaleString()} - $${item.high.toLocaleString()}`)
    })
  })
})
