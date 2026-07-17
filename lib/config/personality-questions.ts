/**
 * Personality Questions Config v2.2 (APPROVED)
 * Final approved text — DO NOT MODIFY without founder approval
 * Questions randomize option order per user at runtime
 * Trait mapping calculated server-side only
 */

export interface PersonalityQuestion {
  id: string
  question: string
  answers: Array<{ value: string; text: string }>
  trait: string
}

export const HOMEOWNER_QUESTIONS: PersonalityQuestion[] = [
  {
    id: 'q1',
    question: 'The last time a contractor discovered an issue mid-project and proposed adding cost to fix it, how did you actually handle it?',
    answers: [
      { value: 'A', text: 'I asked for an explanation and got more bids before deciding' },
      { value: 'B', text: 'I trusted their judgment and told them to do it if it was necessary' },
      { value: 'C', text: 'I negotiated the price or asked if we could scope it differently' },
      { value: 'D', text: 'I told them to proceed but had them document the extra cost' }
    ],
    trait: 'autonomy'
  },
  {
    id: 'q2',
    question: 'When you hire someone for a job that\'ll take a few weeks, what do you actually prefer?',
    answers: [
      { value: 'A', text: 'They only call/text if something\'s wrong' },
      { value: 'B', text: 'Weekly check-in, I call them if I need something' },
      { value: 'C', text: 'Regular updates + photos, a couple times a week' },
      { value: 'D', text: 'Daily contact—I want to see what\'s happening' }
    ],
    trait: 'communication'
  },
  {
    id: 'q3',
    question: 'A neighbor\'s kitchen contractor showed up 2 hours late without calling. The neighbor left a 1-star review saying they don\'t respect people\'s time. You think that review is:',
    answers: [
      { value: 'A', text: 'Harsh—things happen, the work was good' },
      { value: 'B', text: 'Fair—no excuse for not calling ahead' },
      { value: 'C', text: 'Depends—was the final work worth the wait?' },
      { value: 'D', text: 'Too focused on one incident, contractor is still solid overall' }
    ],
    trait: 'delegation'
  },
  {
    id: 'q4',
    question: 'Your contractor finds hidden structural damage and shows you two paths: finish on your $30K budget by using lower-grade repairs, OR add $7K for materials that\'ll last 25 years instead of 8 years. What\'s your first instinct?',
    answers: [
      { value: 'A', text: 'Do the $30K version—budget was the deal' },
      { value: 'B', text: 'Do the $37K version—I didn\'t want to cheap out' },
      { value: 'C', text: 'I don\'t have a gut reaction—want to see the full breakdown' },
      { value: 'D', text: 'Something in between—maybe $33K if we cut somewhere else' }
    ],
    trait: 'flexibility'
  },
  {
    id: 'q5',
    question: 'During a project, your contractor spots a better way to do something than what you originally planned. How do you actually want them to handle it?',
    answers: [
      { value: 'A', text: 'They should stop and ask me first—I want to understand the change before it happens' },
      { value: 'B', text: 'They should do it if it makes the project better, but tell me about it afterward' },
      { value: 'C', text: 'They should do what they think is right—I hired them for their expertise' },
      { value: 'D', text: 'It depends on what kind of change it is—some things I want control over, others I don\'t' }
    ],
    trait: 'conflict'
  }
]

export const CONTRACTOR_QUESTIONS: PersonalityQuestion[] = [
  {
    id: 'c1',
    question: 'Last time you discovered a hidden issue mid-job and proposed adding cost, how did the homeowner actually react?',
    answers: [
      { value: 'A', text: 'They asked for a breakdown and time to think about it' },
      { value: 'B', text: 'They trusted my judgment and approved it quickly' },
      { value: 'C', text: 'They negotiated or asked if there was a workaround' },
      { value: 'D', text: 'They approved but wanted detailed documentation of the change' }
    ],
    trait: 'accommodation'
  },
  {
    id: 'c2',
    question: 'When you\'re on a job, how often do homeowners actually want to hear from you?',
    answers: [
      { value: 'A', text: 'Radio silence—they just want it done' },
      { value: 'B', text: 'Weekly check-in or they call when curious' },
      { value: 'C', text: 'They want photos and updates a couple times a week' },
      { value: 'D', text: 'Constant—they\'re on-site or texting daily' }
    ],
    trait: 'communication'
  },
  {
    id: 'c3',
    question: 'A homeowner criticizes a detail that won\'t affect function (like grout color not being perfectly uniform) even though the work is solid. You think they\'re:',
    answers: [
      { value: 'A', text: 'Right to call it out—they\'re paying for quality' },
      { value: 'B', text: 'Being difficult over details that don\'t matter' },
      { value: 'C', text: 'Reasonable if they mentioned it upfront, but this was never discussed' },
      { value: 'D', text: 'Depends on the cost to fix' }
    ],
    trait: 'perfectionism'
  },
  {
    id: 'c4',
    question: 'Mid-job, the homeowner wants to change materials (same cost) to something different than planned. You:',
    answers: [
      { value: 'A', text: 'Go along with it—they\'re paying' },
      { value: 'B', text: 'Push back—changes mid-job create delays' },
      { value: 'C', text: 'Agree only if they sign a change order' },
      { value: 'D', text: 'Depends on how far along we are' }
    ],
    trait: 'flexibility'
  },
  {
    id: 'c5',
    question: 'During a project, you spot a better way to do something than the original plan. How do you actually handle it?',
    answers: [
      { value: 'A', text: 'I ask the homeowner first—I want their buy-in before I change anything' },
      { value: 'B', text: 'I do it and explain the change to them after, so they understand the improvement' },
      { value: 'C', text: 'I do what I think is right based on my expertise and experience' },
      { value: 'D', text: 'It depends on the type of change—some things I discuss first, others I just execute' }
    ],
    trait: 'autonomy'
  }
]

/**
 * Randomize option order for a specific user/question combo (deterministic)
 * Same user gets same randomization every time (hash-based)
 */
export function getRandomizedQuestion(
  question: PersonalityQuestion,
  userId: string
): PersonalityQuestion {
  // Hash user + question ID to get a seed
  const seed = hashString(`${userId}:${question.id}`)
  const randomIndices = shuffleWithSeed([0, 1, 2, 3], seed)

  return {
    ...question,
    answers: randomIndices.map(i => question.answers[i])
  }
}

/**
 * Calculate trait vector from responses (server-side only)
 * No trait mapping visible to client
 */
export function calculateTraitVector(responses: Record<string, string>): Record<string, number> {
  const traits: Record<string, number> = {
    autonomy: 0.5,
    communication: 0.5,
    delegation: 0.5,
    flexibility: 0.5,
    conflict: 0.5,
    accommodation: 0.5,
    perfectionism: 0.5
  }

  // Simple scoring: A/B = 0.3, C/D = 0.7 (can be refined per question)
  for (const [key, value] of Object.entries(responses)) {
    const questionNum = parseInt(key.replace(/\D/g, ''))
    const answer = value

    // Map answer to score
    if (answer === 'A' || answer === 'B') {
      // Conservative/structured answer
      const question = [...HOMEOWNER_QUESTIONS, ...CONTRACTOR_QUESTIONS].find(
        q => q.id === key
      )
      if (question) {
        traits[question.trait] = 0.3
      }
    } else if (answer === 'C' || answer === 'D') {
      // Flexible/exploratory answer
      const question = [...HOMEOWNER_QUESTIONS, ...CONTRACTOR_QUESTIONS].find(
        q => q.id === key
      )
      if (question) {
        traits[question.trait] = 0.7
      }
    }
  }

  return traits
}

// ===== HELPERS =====

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

function shuffleWithSeed(array: number[], seed: number): number[] {
  const arr = [...array]
  let random = seed % 100000 / 100000 // Convert seed to 0-1

  for (let i = arr.length - 1; i > 0; i--) {
    random = (random * 9301 + 49297) % 233280 // Linear congruential generator
    const j = Math.floor((random / 233280) * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }

  return arr
}
