import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'
import { Footer } from '@/components/layout/Footer'

export const metadata = {
  title: 'About Groundwork',
  description: 'Why we built Groundwork — and who\'s building it.'
}

export default function AboutPage() {
  return (
    <div style={{ background: '#F7F5F1', minHeight: '100vh' }}>
      <header style={{ background: '#0C1118', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><Wordmark size="sm" /></Link>
          <Link href="/contact" style={{ color: '#6B8090', fontSize: 14, textDecoration: 'none' }}>
            Talk to us
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 740, margin: '0 auto', padding: '80px 24px' }}>

        <h1 style={{ color: '#12181F', fontSize: 44, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: 40 }}>
          Why we built this.
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: '#374151', fontSize: 17, lineHeight: 1.85 }}>
          <p>
            Every homeowner in America who needs work done gets ripped off, ghosted, or left guessing. Not because all contractors are bad actors — most aren&apos;t — but because the information has never been in the homeowner&apos;s hands.
          </p>
          <p>
            A contractor walks into your house knowing exactly what your job should cost. You have no idea. That&apos;s not a coincidence; it&apos;s been the structure of the industry for as long as the industry has existed. The contractor has decades of experience and thousands of data points. You have Google and your gut.
          </p>
          <p>
            And on the other side: honest contractors — the ones who show up on time, do the work they said they&apos;d do, and charge a fair price — spend half their time chasing quotes that go nowhere. Tire-kickers, people shopping nine contractors for the same job, homeowners who aren&apos;t actually ready to hire. Good contractors waste enormous time and energy competing on platforms that favor whoever has the most reviews, not whoever does the best work.
          </p>

          <div style={{ borderLeft: '3px solid #E8722C', paddingLeft: 24, margin: '8px 0', fontStyle: 'italic', color: '#12181F', fontSize: 19, fontWeight: 500, lineHeight: 1.7 }}>
            &ldquo;Groundwork exists to fix both sides of that at once, using real data instead of guesses, and letting AI run the parts that used to require a fifty-person team — so two people can build what used to take fifty.&rdquo;
          </div>

          <p>
            The way we fix it: every estimate on Groundwork comes from real completed jobs, not formulas or national averages. Every contractor is verified — license, insurance, real pricing data — before they can appear in a match. And the swipe mechanic means homeowners are always in control of who hears from them, which means contractors only hear from people who are genuinely interested.
          </p>
          <p>
            The data gets better with every job. Every project completion that goes through Groundwork sharpens the estimate for the next homeowner in that ZIP code. Every contractor who answers the pricing interview adds real labor rates to our cost database. The platform learns.
          </p>
          <p>
            We&apos;re a small team. We&apos;re building this because the problem is real, the technology is finally good enough to solve it, and we&apos;re tired of watching people get ripped off on the biggest purchases of their lives.
          </p>
        </div>

        <div style={{ marginTop: 60, padding: '32px', background: '#12181F', borderRadius: 20 }}>
          <h2 style={{ color: '#F7F5F1', fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Say hello</h2>
          <p style={{ color: '#6B8090', fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
            We read everything. Whether you&apos;re a homeowner who just got a terrible quote, a contractor who&apos;s frustrated with how the industry works, or someone who wants to know more about what we&apos;re building — reach out.
          </p>
          <a href="mailto:hello@groundworkapp.com" style={{ color: '#E8722C', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            hello@groundworkapp.com →
          </a>
        </div>
      </main>

      <Footer />
    </div>
  )
}
