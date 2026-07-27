import React from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ value, onChange, options, placeholder = 'Select...', disabled = false }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 pr-10 appearance-none rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
          style={{
            backgroundColor: 'var(--color-surface-primary)',
            color: 'var(--color-text-primary)',
            borderColor: 'var(--color-border)'
          }}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--color-text-secondary)' }}
        />
      </div>
    )
  }
)

Select.displayName = 'Select'
