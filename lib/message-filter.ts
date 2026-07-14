/**
 * Message Filtering
 * Basic profanity and spam detection for chat messages
 * Used to flag messages for moderation review, not auto-block
 */

export interface FilterResult {
  passed: boolean // true if message is safe
  flags: string[] // array of detected issues
  severity: 'none' | 'warn' | 'block'
  reason: string
}

// Basic profanity list (expandable)
const PROFANITY_PATTERNS = [
  /\b(damn|hell)\b/gi,
  /\bshut\s?up\b/gi,
  /\bstop\s?it\b/gi
]

// Spam patterns
const SPAM_PATTERNS = [
  /https?:\/\/[^\s]+/gi, // URLs (links often spam)
  /viagra|cialis|casino|lottery/gi // common spam terms
]

// Harassment patterns
const HARASSMENT_PATTERNS = [
  /\b(idiot|stupid|loser)\b/gi,
  /you (suck|'re trash)/gi
]

/**
 * Filter a message for content issues
 * Returns: passed (boolean), flags (array), severity level
 */
export function filterMessage(message: string): FilterResult {
  const flags: string[] = []
  let severity: FilterResult['severity'] = 'none'

  if (!message || message.trim().length === 0) {
    return {
      passed: true,
      flags: [],
      severity: 'none',
      reason: 'Message empty or whitespace'
    }
  }

  // Check profanity
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(message)) {
      flags.push('profanity_detected')
      severity = 'warn'
      break
    }
  }

  // Check harassment
  for (const pattern of HARASSMENT_PATTERNS) {
    if (pattern.test(message)) {
      flags.push('harassment_detected')
      severity = 'block'
      break
    }
  }

  // Check spam
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(message)) {
      flags.push('spam_detected')
      severity = 'warn'
      break
    }
  }

  // Check for excessive caps (>50% of message)
  const caps = (message.match(/[A-Z]/g) || []).length
  const letters = (message.match(/[a-zA-Z]/g) || []).length
  if (letters > 10 && caps / letters > 0.5) {
    flags.push('excessive_caps')
  }

  // Check for excessive punctuation (>20% of message is punctuation marks)
  const punct = (message.match(/[!?]/g) || []).length
  if (message.length > 10 && punct / message.length > 0.2) {
    flags.push('excessive_punctuation')
  }

  const passed = severity === 'none'
  const reason =
    severity === 'none'
      ? 'Message passed all checks'
      : severity === 'warn'
        ? 'Message flagged for review (warning level)'
        : 'Message flagged for review (block level)'

  return {
    passed,
    flags,
    severity,
    reason
  }
}

/**
 * Sanitize a message by removing flagged patterns
 * Used to display safe version while keeping original in DB
 */
export function sanitizeMessage(message: string, severity: FilterResult['severity']): string {
  if (severity === 'none') return message

  let sanitized = message

  // Replace profanity with asterisks
  for (const pattern of PROFANITY_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match) => '*'.repeat(match.length))
  }

  // Remove URLs
  for (const pattern of SPAM_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[link removed]')
  }

  return sanitized
}

/**
 * Batch filter multiple messages
 */
export function filterMessages(messages: string[]): FilterResult[] {
  return messages.map(filterMessage)
}
