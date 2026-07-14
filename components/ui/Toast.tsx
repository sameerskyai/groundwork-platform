import React, { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  type: ToastType
  message: string
  onClose: () => void
  duration?: number
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info
}

const colors = {
  success: { bg: 'var(--color-success-light)', border: 'var(--color-success)', text: 'var(--color-success)' },
  error: { bg: 'var(--color-error-light)', border: 'var(--color-error)', text: 'var(--color-error)' },
  info: { bg: 'var(--color-info-light)', border: 'var(--color-info)', text: 'var(--color-info)' }
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ type, message, onClose, duration = 4000 }, ref) => {
    const Icon = icons[type]
    const color = colors[type]

    useEffect(() => {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }, [onClose, duration])

    return (
      <div
        ref={ref}
        className="fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg"
        style={{
          backgroundColor: color.bg,
          borderColor: color.border,
          maxWidth: '400px',
          animation: 'slideIn 0.3s ease-out'
        }}
      >
        <Icon className="w-5 h-5 flex-shrink-0" style={{ color: color.text }} />
        <p className="flex-1" style={{ color: color.text }}>
          {message}
        </p>
        <button
          onClick={onClose}
          className="p-1 hover:opacity-70 transition-opacity"
          aria-label="Close toast"
        >
          <X className="w-4 h-4" style={{ color: color.text }} />
        </button>
      </div>
    )
  }
)

Toast.displayName = 'Toast'
