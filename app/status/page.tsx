import type { Metadata } from 'next'
import { HomeNav } from '@/components/home/HomeNav'
import { HomeFooter } from '@/components/home/HomeFooter'
import { StatusContent } from './StatusContent'

export const metadata: Metadata = {
  title: 'Check your status',
  description:
    'Look up your Laywork waitlist position, Founding Member progress, and referral link with your referral code.'
}

export default function StatusPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-base)]">
      <HomeNav />
      <StatusContent />
      <HomeFooter />
    </div>
  )
}
