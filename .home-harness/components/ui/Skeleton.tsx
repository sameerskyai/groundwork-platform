import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circle' | 'rect'
  width?: string | number
  height?: string | number
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className = '', variant = 'rect', width = '100%', height = '1rem' }, ref) => {
    const styles: React.CSSProperties = {
      backgroundColor: 'var(--color-surface-secondary)',
      borderRadius: variant === 'circle' ? '50%' : 'var(--radius-md)',
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    }

    return <div ref={ref} className={className} style={styles} />
  }
)

Skeleton.displayName = 'Skeleton'

export const SkeletonCard = React.forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className="p-4 space-y-4">
    <Skeleton height={12} />
    <div className="space-y-2">
      <Skeleton height={4} className="w-5/6" />
      <Skeleton height={4} className="w-4/6" />
    </div>
  </div>
))

SkeletonCard.displayName = 'SkeletonCard'

export const SkeletonAvatar = React.forwardRef<HTMLDivElement>((_, ref) => (
  <Skeleton ref={ref} variant="circle" width={40} height={40} />
))

SkeletonAvatar.displayName = 'SkeletonAvatar'
