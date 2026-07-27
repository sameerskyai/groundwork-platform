import { describe, it, expect } from 'vitest'
import { formatCurrency, formatRange } from '@/lib/utils'

describe('formatCurrency', () => {
  it('formats whole dollars without cents', () => {
    expect(formatCurrency(1000)).toBe('$1,000')
  })

  it('rounds down to nearest dollar', () => {
    expect(formatCurrency(1234.56)).toBe('$1,235')
  })

  it('handles small amounts', () => {
    expect(formatCurrency(5)).toBe('$5')
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0')
  })

  it('handles large amounts with thousands separator', () => {
    expect(formatCurrency(50000)).toBe('$50,000')
  })

  it('handles hundreds of thousands', () => {
    expect(formatCurrency(250000)).toBe('$250,000')
  })

  it('handles millions', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000')
  })
})

describe('formatRange', () => {
  it('formats range with dash separator', () => {
    expect(formatRange(1000, 5000)).toBe('$1,000 – $5,000')
  })

  it('handles identical low and high', () => {
    expect(formatRange(2000, 2000)).toBe('$2,000 – $2,000')
  })

  it('formats large ranges', () => {
    expect(formatRange(50000, 100000)).toBe('$50,000 – $100,000')
  })

  it('handles small ranges', () => {
    expect(formatRange(500, 1500)).toBe('$500 – $1,500')
  })

  it('formats zero to something', () => {
    expect(formatRange(0, 5000)).toBe('$0 – $5,000')
  })

  it('handles rounding in range display', () => {
    expect(formatRange(1234.56, 5678.90)).toBe('$1,235 – $5,679')
  })
})
