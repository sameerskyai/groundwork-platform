import React from 'react'

interface AvatarProps {
  src?: string
  alt: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getColorFromName(name: string): string {
  const colors = [
    'oklch(58% 0.25 265)',  // Brand blue
    'oklch(60% 0.18 340)',  // Purple
    'oklch(55% 0.20 20)',   // Red
    'oklch(50% 0.22 140)',  // Green
    'oklch(65% 0.15 50)',   // Orange
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, name = 'User', size = 'md' }, ref) => {
    const initials = getInitials(name)
    const bgColor = getColorFromName(name)

    return (
      <div
        ref={ref}
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium overflow-hidden flex-shrink-0`}
        style={{
          backgroundColor: src ? 'transparent' : bgColor,
          color: src ? undefined : 'white'
        }}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'
