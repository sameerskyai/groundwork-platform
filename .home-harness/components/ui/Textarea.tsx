import React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] resize-none ${className}`}
          style={{
            backgroundColor: 'var(--color-surface-primary)',
            color: 'var(--color-text-primary)',
            borderColor: error ? 'var(--color-error)' : 'var(--color-border)'
          }}
          {...props}
        />
        {error && (
          <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
