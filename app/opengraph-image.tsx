import { ImageResponse } from 'next/og'

// ImageResponse cannot read CSS custom properties, so literal token values are
// used here with their token names (logged exception — see plan Global Constraints).

export const runtime = 'nodejs'
export const alt =
  'Laywork — Stop gambling on contractors. Free AI renovation estimates. Contractors matched at 80%+ compatibility. Northern Virginia first.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#FFFFFF' /* token: --color-base */
        }}
      >
        {/* Logo row: plumb-bob mark + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Plumb-bob mark from components/ui/logo.tsx */}
          <svg
            width="56"
            height="70"
            viewBox="0 0 32 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* String */}
            <line
              x1="16"
              y1="0"
              x2="16"
              y2="6"
              stroke="#1A5490" /* token: --color-accent */
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Bob — flattened hexagon body */}
            <path
              d="M16 7 L26 18 L22 30 L10 30 L6 18 Z"
              stroke="#1A5490" /* token: --color-accent */
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Point */}
            <path
              d="M10 30 L16 39 L22 30"
              stroke="#1A5490" /* token: --color-accent */
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <div
            style={{
              display: 'flex',
              fontSize: '48px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#0A0A0A' /* token: --color-ink */
            }}
          >
            Laywork
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            marginTop: '64px',
            fontSize: '84px',
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: '#0A0A0A' /* token: --color-ink */
          }}
        >
          Stop gambling on contractors.
        </div>

        {/* Thin rule */}
        <div
          style={{
            display: 'flex',
            marginTop: '48px',
            width: '160px',
            height: '2px',
            background: '#D6DEE7' /* token: --color-line */
          }}
        />

        {/* Subline */}
        <div
          style={{
            display: 'flex',
            marginTop: '40px',
            fontSize: '34px',
            fontWeight: 400,
            lineHeight: 1.3,
            color: '#6B7280' /* token: --color-text-muted */
          }}
        >
          Free AI renovation estimates. Contractors matched at 80%+ compatibility.
          Northern Virginia first.
        </div>
      </div>
    ),
    { ...size }
  )
}
