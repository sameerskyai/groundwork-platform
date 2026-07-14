import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './styles/design-tokens.css'
import './globals.css'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Groundwork — Real estimates. Honest contractors.',
  description: 'Stop guessing what home improvement costs. Get an AI-powered estimate from real job data, then get matched with a vetted contractor who actually shows up.',
  openGraph: {
    title: 'Groundwork',
    description: 'Real estimates. Honest contractors. No guesswork.',
    type: 'website'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
