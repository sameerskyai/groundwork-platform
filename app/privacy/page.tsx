import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'
import { Footer } from '@/components/layout/Footer'

export const metadata = {
  title: 'Privacy Policy — Groundwork',
  description: 'How Groundwork collects, uses, and protects your data.'
}

const SECTIONS = [
  {
    title: 'What this policy covers',
    body: `This Privacy Policy describes how Groundwork ("we," "us") collects, uses, stores, and shares information about you when you use our platform. It applies to all users: homeowners, contractors, and property managers.

We built Groundwork on a simple principle: your data is used to run Groundwork, not to make money off you separately. We do not sell your personal data. Ever.`
  },
  {
    title: 'What we collect',
    body: `**Account data:** Name, email address, password (hashed, never stored in plaintext), and your role (homeowner/contractor/property manager).

**Location data:** ZIP code, and if you permit it, approximate latitude/longitude derived from your ZIP code. We use this only to match you with nearby contractors and to localize cost estimates. We never collect your GPS location.

**Project data:** Project descriptions, photos you upload, and cost estimates generated. Photos are stored in encrypted cloud storage (Supabase Storage). We use project data to generate estimates, match contractors, and — in anonymized, aggregated form — to improve our cost database.

**Contractor-provided data:** Trade information, pricing ranges, license numbers, and insurance documentation. This is used to verify contractors, build their profiles, and power our matching system.

**Payment data:** We use Stripe to process payments. Groundwork does not store full credit card numbers. We receive transaction records (amounts, dates, outcomes) for billing purposes.

**Usage data:** Pages visited, features used, and interactions with the platform. This is used to improve the product. We do not sell usage data to advertisers.

**Messages:** Messages sent between homeowners and contractors are stored to provide the messaging feature and to enforce our usage policies. We do not read individual messages routinely; we may review them to investigate reported abuse.`
  },
  {
    title: 'How we use your data',
    body: `• To provide and improve Groundwork's core features (estimates, matching, profiles, messaging)
• To verify contractor licenses and insurance status
• To generate AI-powered cost estimates — your project data (without identifying information) contributes to the cost database that makes estimates more accurate over time
• To communicate with you about your account, matches, and platform updates
• To process payments and maintain billing records
• To enforce our Terms of Service and investigate reported violations
• To comply with legal obligations

We do not use your data for advertising. We do not build advertising profiles.`
  },
  {
    title: 'Photos and project uploads',
    body: `Photos you upload are stored in encrypted cloud storage. They are used to:
• Help AI agents generate more accurate estimates
• Display on your project card for matched contractors to review

Photos are not publicly accessible by default. Only matched contractors can view project photos associated with a match. If you delete your project or account, we will delete associated photos within 30 days.`
  },
  {
    title: 'Address data',
    body: `Your full street address is never required to use Groundwork. We ask for your ZIP code, which we convert to approximate coordinates (via a third-party geocoding service) for distance-based matching. Your ZIP code is visible to matched contractors — your full address is not shared until you choose to share it directly via messaging.

If you complete a project and opt into our Neighborhood Feed, we publish only your neighborhood or intersection (not your full address) along with anonymized job details.`
  },
  {
    title: 'Who we share data with',
    body: `**Matched contractors:** When you accept a contractor match, that contractor can see your project description, photos, and ZIP code. Your full name and contact information are not automatically shared — you control that through messaging.

**Service providers:** We use third-party services to operate the platform:
• Supabase — database and file storage (data hosted in the US)
• Stripe — payment processing
• Anthropic — AI-powered features (project descriptions and photos may be sent to Anthropic's API; we rely on Anthropic's Privacy Policy for their handling of API data)
• Zippopotam.us — ZIP code to coordinate lookup (ZIP codes only, no personal data)

We require all service providers to handle your data only as directed by us and to maintain appropriate security measures.

**Legal requirements:** We may disclose data if required by law, court order, or to protect the rights, property, or safety of Groundwork users.

**We do not sell your data.** We do not share data with advertisers, data brokers, or marketing companies.`
  },
  {
    title: 'Data retention',
    body: `• Active account data is retained while your account is open
• If you delete your account, we delete your personal data within 30 days, except where we are required to retain it for legal or billing purposes
• Anonymized, aggregated cost data (stripped of any identifying information) may be retained indefinitely as part of our cost database
• Message logs may be retained for up to 90 days after account deletion for safety/abuse investigation purposes`
  },
  {
    title: 'Your rights',
    body: `You have the right to:
• Access the personal data we hold about you
• Request correction of inaccurate data
• Request deletion of your account and associated personal data
• Request a copy of your data in a portable format
• Opt out of non-essential communications

To exercise these rights, contact us at hello@groundworkapp.com.

If you are a California resident, you have additional rights under CCPA, including the right to know what categories of personal information we collect and to opt out of sale (we do not sell personal information). Contact us to make a CCPA request.`
  },
  {
    title: 'Security',
    body: `We use industry-standard security practices including:
• HTTPS encryption for all data in transit
• Encrypted storage for sensitive data including passwords (bcrypt) and files
• Row-level security on our database so users can only access their own data
• Regular security review of our infrastructure

No system is perfectly secure. If you discover a security vulnerability, please contact us at hello@groundworkapp.com before publicly disclosing it.`
  },
  {
    title: 'Children',
    body: `Groundwork is not directed at or intended for use by anyone under 18. We do not knowingly collect personal information from minors. If we become aware that a minor has provided us with personal information, we will delete it promptly.`
  },
  {
    title: 'Changes to this policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of material changes by email or by prominent notice on the platform. The date at the top of this page reflects the most recent update.`
  },
  {
    title: 'Contact',
    body: `Privacy questions or requests: hello@groundworkapp.com\n\nOr write to us at:\nGroundwork\nAttn: Privacy\nhello@groundworkapp.com`
  }
]

export default function PrivacyPage() {
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EDFAF3', border: '1px solid #B7EDD4', borderRadius: 100, padding: '4px 12px', marginBottom: 16 }}>
            <span style={{ fontSize: 14 }}>🔒</span>
            <span style={{ color: '#2E8B57', fontSize: 12, fontWeight: 700 }}>Your data is never sold</span>
          </div>
          <h1 style={{ color: '#12181F', fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Privacy Policy
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
