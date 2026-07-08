'use client'

import Link from 'next/link'
import { Wordmark } from '@/components/ui/logo'

const NAV = {
  Platform: [
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'For Homeowners', href: '/for-homeowners' },
    { label: 'For Contractors', href: '/for-contractors' },
    { label: 'For Property Managers', href: '/for-property-managers' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Neighborhood Feed', href: '/feed/00000' }
  ],
  Trust: [
    { label: 'Contractor Verification', href: '/trust' },
    { label: 'How Estimates Work', href: '/how-it-works#estimates' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' }
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog & Cost Guides', href: '/blog' },
    { label: 'Contact & Support', href: '/contact' }
  ]
}

const SOCIAL = [
  { label: 'Instagram', href: 'https://instagram.com/groundworkapp', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  )},
  { label: 'TikTok', href: 'https://tiktok.com/@groundworkapp', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.78a8.18 8.18 0 0 0 4.78 1.52V6.82a4.85 4.85 0 0 1-1.01-.13z"/>
    </svg>
  )},
  { label: 'Facebook', href: 'https://facebook.com/groundworkapp', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )},
  { label: 'YouTube', href: 'https://youtube.com/@groundworkapp', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )}
]

export function Footer() {
  return (
    <footer style={{ background: '#0C1118', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="col-span-2">
            <Wordmark size="md" />
            <p style={{ color: '#4A6070', fontSize: 14, lineHeight: 1.7, marginTop: 16, maxWidth: 280 }}>
              Real estimates from real job data. Matched to contractors who show up. Built so homeowners stop getting ripped off.
            </p>
            <p style={{ color: '#3A5060', fontSize: 13, marginTop: 12 }}>
              hello@groundworkapp.com
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              {SOCIAL.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  aria-label={s.label}
                  style={{
                    color: '#4A6070',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 36, height: 36,
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'color 0.15s, background 0.15s'
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = '#E8722C'
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(232,114,44,0.1)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = '#4A6070'
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(NAV).map(([group, links]) => (
            <div key={group}>
              <h3 style={{ color: '#F7F5F1', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
                {group}
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} style={{ color: '#4A6070', fontSize: 14, textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#E8722C'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#4A6070'}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <p style={{ color: '#2A3A48', fontSize: 13 }}>
            © {new Date().getFullYear()} Groundwork. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Contact', href: '/contact' }
            ].map(l => (
              <Link key={l.href} href={l.href}
                style={{ color: '#2A3A48', fontSize: 13, textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
