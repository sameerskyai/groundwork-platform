import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'
import { Footer } from '@/components/layout/Footer'

export const metadata = {
  title: 'Cost Guides & Education — Laywork',
  description: 'Honest guides to what home improvement actually costs. No sponsored content, no estimates that pad contractor margins.'
}

const ARTICLES = [
  {
    slug: 'kitchen-remodel-cost',
    category: 'Kitchen',
    title: 'What a kitchen remodel actually costs in 2025',
    excerpt: 'National averages are useless. Here\'s what real kitchen remodels cost, broken down by scope, region, and material choices — with data from jobs that actually got done.',
    readTime: '8 min',
    accent: 'var(--color-accent)'
  },
  {
    slug: 'hvac-replacement-cost',
    category: 'HVAC',
    title: 'HVAC replacement: what to expect and what fair looks like',
    excerpt: 'HVAC is one of the most commonly over-quoted jobs in home improvement. We break down what system size, brand, and labor actually cost — and what red flags look like.',
    readTime: '6 min',
    accent: 'var(--color-accent)'
  },
  {
    slug: 'bathroom-renovation-cost',
    category: 'Bathroom',
    title: 'Bathroom renovation costs: full gut vs. cosmetic refresh',
    excerpt: 'The difference between a $4k cosmetic bathroom refresh and a $22k full renovation — and how to figure out which one you actually need.',
    readTime: '7 min',
    accent: 'var(--color-accent)'
  },
  {
    slug: 'roof-replacement-cost',
    category: 'Roofing',
    title: 'Roof replacement: when you need it and what it costs',
    excerpt: 'Most homeowners wait too long. Here\'s how to tell if you need a full replacement vs. repair, and what each should cost per square foot.',
    readTime: '5 min',
    accent: 'var(--color-accent)'
  },
  {
    slug: 'diy-vs-hire',
    category: 'DIY Guide',
    title: 'DIY vs. hire: an honest breakdown by project type',
    excerpt: 'Some jobs are genuinely DIY-able. Others look DIY-able and will cost you twice as much to fix when you get in over your head. An honest guide to knowing the difference.',
    readTime: '10 min',
    accent: 'var(--color-accent)'
  },
  {
    slug: 'contractor-quotes-red-flags',
    category: 'Homeowner Guide',
    title: '7 red flags in contractor quotes (and what they mean)',
    excerpt: 'You got three quotes and they\'re all wildly different. Here\'s how to read a contractor quote, what suspiciously low prices actually signal, and how to protect yourself.',
    readTime: '6 min',
    accent: 'var(--color-accent)'
  }
]

export default function BlogPage() {
  return (
    <div style={{ background: 'var(--color-base-alt)', minHeight: '100vh' }}>
      <header style={{ background: 'var(--color-ink)', borderBottom: '1px solid color-mix(in srgb, var(--color-base) 6%, transparent)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><Wordmark size="sm" /></Link>
          <Link href="/signup?role=homeowner">
            <button style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--color-accent)', color: 'var(--color-base)', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Get my free estimate
            </button>
          </Link>
        </div>
      </header>

      {/* Header */}
      <section style={{ background: 'var(--color-ink)', padding: '72px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ color: 'var(--color-accent-on-dark)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            Cost guides & education
          </div>
          <h1 style={{ color: 'var(--color-base)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            What things actually cost.
          </h1>
          <p style={{ color: 'var(--color-line)', fontSize: 17, lineHeight: 1.7, maxWidth: 560 }}>
            No sponsored content. No estimates designed to make contractors look generous. Real data on what real projects cost, broken down so you can walk into any contractor conversation prepared.
          </p>
        </div>
      </section>

      {/* Articles */}
      <section style={{ padding: '72px 24px', background: 'var(--color-base-alt)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {/* UNLINKED 2026-07-27 (standards check §26, NAVIGATION): these six
                cards pointed at /blog/[slug], a route that does not exist -- six
                live 404s. No article body exists in the repo, so building the
                route would mean inventing the content. They render as
                non-interactive previews until the writing is real. */}
            {ARTICLES.map(a => (
              <div key={a.slug}>
                <article style={{
                  background: 'var(--color-base)', borderRadius: 16, border: '1px solid var(--color-line)',
                  padding: '28px', height: '100%', display: 'flex', flexDirection: 'column',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ background: `color-mix(in srgb, ${a.accent} 12%, var(--color-base))`, color: a.accent, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 100 }}>
                      {a.category}
                    </span>
                    <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>{a.readTime} read</span>
                  </div>
                  <h2 style={{ color: 'var(--color-ink)', fontSize: 18, fontWeight: 700, lineHeight: 1.35, marginBottom: 12, flex: 1 }}>
                    {a.title}
                  </h2>
                  <p style={{ color: 'var(--color-ink-2)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                    {a.excerpt}
                  </p>
                  {/* "Read more" removed with the link: an affordance that
                      looks clickable but is not is worse than none. */}
                  <p className="annotation">Coming soon</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '64px 24px', background: 'var(--color-ink)', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ color: 'var(--color-base)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Read enough? Get the actual number.
          </h2>
          <p style={{ color: 'var(--color-line)', fontSize: 16, marginBottom: 28 }}>
            Describe your specific project and get a real estimate from jobs in your ZIP code.
          </p>
          <Link href="/signup?role=homeowner">
            <button style={{ padding: '14px 28px', borderRadius: 10, background: 'var(--color-accent)', color: 'var(--color-base)', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Get my free estimate →
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
