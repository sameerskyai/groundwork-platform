import { ImageResponse } from 'next/og'

// ImageResponse cannot read CSS custom properties, so literal token values are
// used here with their token names (logged exception — see plan Global Constraints).

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFFFFF' /* token: --color-base */
        }}
      >
        {/* Plumb-bob mark from components/ui/logo.tsx */}
        <svg
          width="23"
          height="29"
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
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Point */}
          <path
            d="M10 30 L16 39 L22 30"
            stroke="#1A5490" /* token: --color-accent */
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
