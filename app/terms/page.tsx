import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'
import { Footer } from '@/components/layout/Footer'

export const metadata = {
  title: 'Terms of Service — Groundwork',
  description: 'Terms of Service for Groundwork, the contractor matching platform.'
}

const SECTIONS = [
  {
    title: '1. Agreement to Terms',
    body: `By accessing or using Groundwork ("the Platform," "we," "us"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.

These Terms apply to all users: homeowners, contractors, and property managers. By creating an account, you represent that you are at least 18 years of age and have the legal authority to enter into these Terms.`
  },
  {
    title: '2. Description of Service',
    body: `Groundwork is a two-sided marketplace that:
• Provides AI-generated cost estimates for home improvement projects based on real job-cost data
• Matches homeowners with licensed, insured contractors in their area
• Facilitates secure messaging between homeowners and contractors
• Processes payments for estimate unlocks and contractor subscription tiers

We are a technology platform, not a contractor. We do not perform construction services and are not responsible for the quality of work performed by contractors found through our platform.`
  },
  {
    title: '3. User Accounts',
    body: `You are responsible for maintaining the confidentiality of your account credentials. You agree to:
• Provide accurate, current, and complete information during registration
• Update your information to keep it accurate and current
• Notify us immediately of any unauthorized access to your account
• Not share your password or account access with any third party

We reserve the right to terminate accounts that violate these Terms or that we determine, in our sole discretion, are being used fraudulently.`
  },
  {
    title: '4. Homeowner Terms',
    body: `Homeowners may use the Platform to:
• Submit project descriptions and receive AI-generated cost estimates
• Browse and match with contractors
• Communicate with matched contractors via in-platform messaging
• Leave verified reviews upon project completion

Cost estimates are AI-generated from real job-cost data and should be used as a reference range. Actual project costs may vary based on site conditions, material availability, and other factors. Groundwork does not guarantee any specific cost outcome.

You agree not to share contractor contact information outside the Platform until you have formally engaged with that contractor.`
  },
  {
    title: '5. Contractor Terms',
    body: `Contractors who list on Groundwork must:
• Hold a valid contractor's license for the trade(s) they offer in all jurisdictions where they operate
• Carry general liability insurance at minimum industry-standard coverage levels
• Provide accurate information about their qualifications, experience, and service area
• Maintain their subscription in good standing to receive job requests

Groundwork verifies license and insurance status at signup. You are responsible for maintaining compliance with all applicable licensing and insurance requirements and notifying us promptly of any lapse or change.

Contractors may not solicit homeowners outside the Platform for jobs that originated on Groundwork.`
  },
  {
    title: '6. Payments and Billing',
    body: `Homeowners: certain features, including full itemized estimate breakdowns, require a one-time unlock payment processed via Stripe. Payments are non-refundable except where required by applicable law.

Contractors: subscription fees are billed monthly. You may cancel at any time; your access continues through the end of the current billing period. No refunds are issued for partial months.

All payments are processed by Stripe. Groundwork does not store full credit card numbers. By providing payment information, you agree to Stripe's Terms of Service.`
  },
  {
    title: '7. Intellectual Property',
    body: `The Platform, including its design, code, AI models, and content, is owned by Groundwork and protected by applicable intellectual property law. You may not copy, modify, or distribute any part of the Platform without our written consent.

Content you submit (project descriptions, photos, reviews) remains yours. By submitting it, you grant Groundwork a non-exclusive, royalty-free license to use it to operate and improve the Platform, including to train and improve our AI models (in anonymized, aggregated form).`
  },
  {
    title: '8. Prohibited Conduct',
    body: `You agree not to:
• Post false, misleading, or fraudulent content
• Harass, threaten, or abuse other users
• Attempt to circumvent the Platform's matching or payment systems
• Use the Platform for any unlawful purpose
• Reverse-engineer or attempt to extract source code from the Platform
• Use automated tools to scrape, crawl, or index Platform content without our consent`
  },
  {
    title: '9. Disclaimers',
    body: `THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

We do not warrant that the Platform will be uninterrupted, error-free, or free of harmful components. We make no warranty regarding the accuracy of AI-generated estimates — these are reference ranges based on available data, not binding quotes.

We are not responsible for the conduct of contractors found through the Platform. Any contract for construction services is between you and the contractor directly.`
  },
  {
    title: '10. Limitation of Liability',
    body: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, GROUNDWORK'S LIABILITY TO YOU FOR ANY CAUSE OF ACTION SHALL BE LIMITED TO THE GREATER OF (A) $100 OR (B) THE AMOUNT YOU PAID TO GROUNDWORK IN THE 12 MONTHS PRECEDING THE CLAIM.

IN NO EVENT SHALL GROUNDWORK BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.`
  },
  {
    title: '11. Dispute Resolution',
    body: `Any disputes arising under these Terms shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except that either party may seek injunctive relief in court for intellectual property or confidentiality violations.

You waive your right to participate in class action lawsuits or class-wide arbitration.`
  },
  {
    title: '12. Governing Law',
    body: `These Terms are governed by the laws of the State of Maryland, without regard to conflict of law principles.`
  },
  {
    title: '13. Changes to These Terms',
    body: `We may update these Terms from time to time. We will notify you of material changes by email or by prominent notice on the Platform. Continued use after the effective date of changes constitutes acceptance of the new Terms.`
  },
  {
    title: '14. Contact',
    body: `Questions about these Terms? Contact us at hello@groundworkapp.com or through our Contact page.`
  }
]

export default function TermsPage() {
  return (
    <div style={{ background: '#F7F5F1', minHeight: '100vh' }}>
      <header style={{ background: '#0C1118', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><Wordmark size="sm" /></Link>
          <Link href="/contact" style={{ color: '#6B8090', fontSize: 14, textDecoration: 'none' }}>
            Questions? Contact us
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ color: '#12181F', fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Terms of Service
          </h1>
          <p style={{ color: '#6B7280', fontSize: 15 }}>
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {SECTIONS.map(s => (
            <div key={s.title}>
              <h2 style={{ color: '#12181F', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{s.title}</h2>
              <div style={{ color: '#374151', fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {s.body}
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
