import type { Metadata } from 'next'
import { FoundersContent } from './FoundersContent'

export const metadata: Metadata = {
  title: 'The Founders Program',
  description:
    'The first 500 on the Laywork waitlist become Founding Members automatically — or earn it with 3 verified referrals from any position. Rewards at 3, 5, and 10 referrals, and first access at launch, in waves.'
}

export default function FoundersPage() {
  return <FoundersContent />
}
