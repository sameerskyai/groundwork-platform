import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'
import { Footer } from '@/components/layout/Footer'
import { ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Cost Guides & Education — Groundwork',
  description: 'Honest guides to what home improvement actually costs. No sponsored content, no estimates that pad contractor margins.'
}

const ARTICLES = [
  {
    slug: 'kitchen-remodel-cost',
    category: 'Kitchen',
    title: 'What a kitchen remodel actually costs in 2025',
    excerpt: 'National averages are useless. Here\'s what real kitchen remodels cost, broken down by scope, region, and material choices — with data from jobs that actually got done.',
    readTime: '8 min',
    accent: '#E8722C'
  },
  {
    slug: 'hvac-replacement-cost',
    category: 'HVAC',
    title: 'HVAC replacement: what to expect and what fair looks like',
    excerpt: 'HVAC is one of the most commonly over-quoted jobs in home improvement. We break down what system size, brand, and labor actually cost — and what red flags look like.',
    readTime: '6 min',
    accent: '#4A6B8A'
  },
  {
    slug: 'bathroom-renovation-cost',
    category: 'Bathroom',
    title: 'Bathroom renovation costs: full gut vs. cosmetic refresh',
    excerpt: 'The difference between a $4k cosmetic bathroom refresh and a $22k full renovation — and how to figure out which one you actually need.',
    readTime: '7 min',
    accent: '#2E8B57'
  },
  {
    slug: 'roof-replacement-cost',
    category: 'Roofing',
    title: 'Roof replacement: when you need it and what it costs',
    excerpt: 'Most homeowners wait too long. Here\'s how to tell if you need a full replacement vs. repair, and what each should cost per square foot.',
    readTime: '5 min',
    accent: '#E8722C'
  },
  {
    slug: 'diy-vs-hire',
    category: 'DIY Guide',
    title: 'DIY vs. hire: an honest breakdown by project type',
    excerpt: 'Some jobs are genuinely DIY-able. Others look DIY-able and will cost you twice as much to fix when you get in over your head. An honest guide to knowing the difference.',
    readTime: '10 min',
    accent: '#4A6B8A'
  },
  {
    slug: 'contractor-quotes-red-flags',
    category: 'Homeowner Guide',
    title: '7 red flags in contractor quotes (and what they mean)',
    excerpt: 'You got three quotes and they\'re all wildly different. Here\'s how to read a contractor quote, what suspiciously low prices actually signal, and how to protect yourself.',
    readTime: '6 min',
    accent: '#2E8B57'
  }
]

export default function BlogPage() {
  return (
    <div style={{ background: '#F7F5F1', minHeight: '100vh' }}>
      <header style={{ background: '#0C1118', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><Wordmark size="sm" /></Link>
          <Link href="/signup?role=homeowner">
            <button style={{ padding: '10px 20px', borderRadius: 8, background: '#E8722C', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Get my free estimate
            </button>
          </Link>
        </div>
      </header>

      {/* Header */}
      <section style={{ background: '#12181F', padding: '72px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ color: '#E8722C', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            Cost guides & education
          </div>
          <h1 style={{ color: '#F7F5F1', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            What things actually cost.
          </h1>
          <p style={{ color: '#6B8090', fontSize: 17, lineHeight: 1.7, maxWidth: 560 }}>
            No sponsored content. No estimates designed to make contractors look generous. Real data on what real projects cost, broken down so you can walk into any contractor conversation prepared.
          </p>
        </div>
      </section>

      {/* Articles */}
      <section style={{ padding: '72px 24px', background: '#F7F5F1' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {ARTICLES.map(a => (
              <Link key={a.slug} href={`/blog/${a.slug}`} style={{ textDecoration: 'none' }}>
                <article style={{
                  background: '#fff', borderRadius: 16, border: '1px solid #E8E4DE',
                  padding: '28px', height: '100%', display: 'flex', flexDirection: 'column',
                  cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ background: `${a.accent}15`, color: a.accent, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 100 }}>
                      {a.category}
                    </span>
                    <span style={{ color: '#9CA3AF', fontSize: 12 }}>{a.readTime} read</span>
                  </div>
                  <h2 style={{ color: '#12181F', fontSize: 18, fontWeight: 700, lineHeight: 1.35, marginBottom: 12, flex: 1 }}>
                    {a.title}
                  </h2>
                  <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                    {a.excerpt}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: a.accent, fontSize: 13, fontWeight: 600 }}>
                    Read more <ArrowRight style={{ width: 14, height: 14 }} />
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '64px 24px', background: '#12181F', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ color: '#F7F5F1', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Read enough? Get the actual number.
          </h2>
          <p style={{ color: '#6B8090', fontSize: 16, marginBottom: 28 }}>
            Describe your specific project and get a real estimate from jobs in your ZIP code.
          </p>
          <Link href="/signup?role=homeowner">
            <button style={{ padding: '14px 28px', borderRadius: 10, background: '#E8722C', color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Get my free estimate →
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
