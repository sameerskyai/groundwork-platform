import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 tracking-tight',
  {
    variants: {
      variant: {
        primary: 'bg-[#BF7A3A] text-[#F4F0E8] hover:bg-[#D4903F] focus-visible:ring-[#BF7A3A] rounded-xl shadow-sm',
        dark: 'bg-[#0A0908] text-[#EDE8DF] hover:bg-[#161513] rounded-xl',
        secondary: 'bg-[#F4F0E8] text-[#0A0908] hover:bg-[#EDE8DF] rounded-xl border border-[#DDD8CE]',
        ghost: 'text-[#7A756E] hover:text-[#0A0908] hover:bg-[#F4F0E8] rounded-xl',
        outline: 'border-2 border-[#BF7A3A] text-[#BF7A3A] hover:bg-[#BF7A3A] hover:text-[#F4F0E8] rounded-xl',
        'outline-cream': 'border border-[#EDE8DF]/30 text-[#EDE8DF] hover:bg-[#EDE8DF]/10 rounded-xl',
      },
      size: {
        sm: 'h-8 px-3.5 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-5 text-[15px]',
        xl: 'h-13 px-7 text-base',
      }
    },
    defaultVariants: { variant: 'primary', size: 'md' }
  }
)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
