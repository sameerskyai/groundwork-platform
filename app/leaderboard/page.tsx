import type { Metadata } from 'next'
import { LeaderboardContent } from './LeaderboardContent'

export const metadata: Metadata = {
  title: 'Leaderboard',
  description:
    'The top 25 Laywork waitlist referrers. Bring your neighbors, climb the list, and earn Founders Program rewards.'
}

export default function LeaderboardPage() {
  return <LeaderboardContent />
}
