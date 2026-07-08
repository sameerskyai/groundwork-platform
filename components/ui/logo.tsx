// Groundwork plumb bob logo mark
// A plumb bob = the tool used to find true vertical — honest, exact, a real trade instrument
export function LogoMark({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* String */}
      <line x1="16" y1="0" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Bob — flattened hexagon body */}
      <path
        d="M16 7 L26 18 L22 30 L10 30 L6 18 Z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M16 7 L26 18 L22 30 L10 30 L6 18 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Point */}
      <path
        d="M10 30 L16 39 L22 30"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M10 30 L16 39 L22 30"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Wordmark({
  dark = false,
  size = 'md'
}: {
  dark?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const textSize = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg'
  const logoSize = size === 'lg' ? 'w-9 h-10' : size === 'sm' ? 'w-5 h-6' : 'w-7 h-8'
  const color = dark ? 'text-[#0A0908]' : 'text-[#EDE8DF]'
  const accent = dark ? 'text-[#BF7A3A]' : 'text-[#D4903F]'

  return (
    <div className={`flex items-center gap-2.5 ${color}`}>
      <LogoMark className={`${logoSize} ${accent}`} />
      <span className={`${textSize} font-bold tracking-tight`}>
        Groundwork
      </span>
    </div>
  )
}
