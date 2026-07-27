import { describe, it, expect } from 'vitest'
import { filterMessage, sanitizeMessage, filterMessages } from '@/lib/message-filter'

describe('Message Filter', () => {
  describe('filterMessage', () => {
    it('should pass normal messages', () => {
      const result = filterMessage('I need a new kitchen cabinet installed')
      expect(result.passed).toBe(true)
      expect(result.flags).toHaveLength(0)
      expect(result.severity).toBe('none')
    })

    it('should detect profanity and set severity to warn', () => {
      const result = filterMessage('This damn project is taking too long')
      expect(result.passed).toBe(false)
      expect(result.flags).toContain('profanity_detected')
      expect(result.severity).toBe('warn')
    })

    it('should detect harassment and set severity to block', () => {
      const result = filterMessage('You are stupid and should quit')
      expect(result.passed).toBe(false)
      expect(result.flags).toContain('harassment_detected')
      expect(result.severity).toBe('block')
    })

    it('should detect spam URLs and set severity to warn', () => {
      const result = filterMessage('Check this out https://example.com/spam')
      expect(result.passed).toBe(false)
      expect(result.flags).toContain('spam_detected')
      expect(result.severity).toBe('warn')
    })

    it('should detect spam keywords', () => {
      const result = filterMessage('Buy cheap viagra here!')
      expect(result.passed).toBe(false)
      expect(result.flags).toContain('spam_detected')
    })

    it('should detect excessive caps', () => {
      const result = filterMessage('THIS IS ALL CAPS AND ANNOYING')
      expect(result.flags).toContain('excessive_caps')
    })

    it('should detect excessive punctuation', () => {
      const result = filterMessage('Why would you do that!!!!!????? This makes no sense!!!')
      expect(result.flags).toContain('excessive_punctuation')
    })

    it('should handle empty/whitespace messages', () => {
      const result1 = filterMessage('')
      expect(result1.passed).toBe(true)

      const result2 = filterMessage('   ')
      expect(result2.passed).toBe(true)
    })

    it('should handle case-insensitive detection', () => {
      const result = filterMessage('this DAMN project')
      expect(result.flags).toContain('profanity_detected')
    })
  })

  describe('sanitizeMessage', () => {
    it('should return original message if severity is none', () => {
      const msg = 'Hello, how are you?'
      const result = sanitizeMessage(msg, 'none')
      expect(result).toBe(msg)
    })

    it('should mask profanity', () => {
      const msg = 'This damn thing'
      const result = sanitizeMessage(msg, 'warn')
      expect(result).toContain('****')
      expect(result).not.toContain('damn')
    })

    it('should remove URLs', () => {
      const msg = 'Check https://example.com for more'
      const result = sanitizeMessage(msg, 'warn')
      expect(result).toContain('[link removed]')
      expect(result).not.toContain('https')
    })
  })

  describe('filterMessages (batch)', () => {
    it('should filter multiple messages', () => {
      const messages = [
        'Hello contractor',
        'This damn project',
        'When can you start?'
      ]
      const results = filterMessages(messages)

      expect(results).toHaveLength(3)
      expect(results[0].passed).toBe(true)
      expect(results[1].passed).toBe(false)
      expect(results[2].passed).toBe(true)
    })

    it('should preserve order in batch results', () => {
      const messages = [
        'Good morning',
        'You are stupid',
        'Can you help?',
        'Buy viagra'
      ]
      const results = filterMessages(messages)

      expect(results[0].passed).toBe(true)
      expect(results[1].passed).toBe(false)
      expect(results[2].passed).toBe(true)
      expect(results[3].passed).toBe(false)
    })
  })

  describe('Filter accuracy', () => {
    it('should not flag legitimate messages with "up" in them', () => {
      const result = filterMessage('Can you help me set up this installation?')
      expect(result.flags).not.toContain('harassment_detected')
    })

    it('should allow contractor-relevant language', () => {
      const messages = [
        'Can you come by tomorrow at 10am?',
        'I need 5000 square feet painted',
        'What is your hourly rate?',
        'Can you provide a quote?'
      ]
      const results = filterMessages(messages)
      results.forEach(r => {
        expect(r.severity).toBe('none')
      })
    })
  })
})
