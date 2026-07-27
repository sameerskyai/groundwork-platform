import { describe, it, expect } from 'vitest'

describe('Trivial Test Suite', () => {
  it('should pass a simple assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('should verify string equality', () => {
    expect('hello').toBe('hello')
  })

  it('should verify array contents', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr[0]).toBe(1)
  })
})
