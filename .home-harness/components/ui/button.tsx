import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold transition-colors duration-[var(--duration-normal)] focus-visible:outline-none focus-visible:ring-[var(--outline-width)] focus-visible:ring-[var(--outline-color)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--color-brand-solid)] text-[var(--color-text-inverse)] hover:bg-[var(--color-interactive-active)]',
        secondary: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-tertiary)]',
        tertiary: 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-strong)]',
        ghost: 'text-[var(--color-brand)] hover:bg-[var(--color-brand-lighter)]',
      },
      size: {
        sm: 'h-8 px-3.5 text-sm rounded-md',
        md: 'h-10 px-4 text-base rounded-md',
        lg: 'h-12 px-6 text-base rounded-lg',
      }
    },
    defaultVariants: { variant: 'primary', size: 'md' }
  }
)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
