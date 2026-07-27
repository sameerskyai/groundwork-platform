import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './styles/design-tokens.css'
import './globals.css'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Laywork — Stop gambling on contractors.',
    template: '%s — Laywork'
  },
  description:
    'Free AI renovation estimates. Contractors matched at 80%+ compatibility. Northern Virginia first.',
  openGraph: {
    title: 'Laywork — Stop gambling on contractors.',
    description:
      'Free AI renovation estimates. Contractors matched at 80%+ compatibility. Northern Virginia first.',
    type: 'website',
    siteName: 'Laywork'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Laywork — Stop gambling on contractors.',
    description:
      'Free AI renovation estimates. Contractors matched at 80%+ compatibility. Northern Virginia first.'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
