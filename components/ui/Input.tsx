import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`px-3 py-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] transition-colors duration-[var(--duration-normal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:border-transparent disabled:bg-[var(--color-surface-tertiary)] disabled:opacity-50 ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-[var(--color-error)]">{error}</span>}
        {helperText && !error && (
          <span className="text-xs text-[var(--color-text-tertiary)]">{helperText}</span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
