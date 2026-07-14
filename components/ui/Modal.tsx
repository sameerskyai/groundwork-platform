import React from 'react'
import { X } from 'lucide-react'
import { Button } from './button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  actions?: { label: string; onClick: () => void; variant?: 'primary' | 'secondary' }[]
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg'
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ isOpen, onClose, title, children, size = 'md', actions }, ref) => {
    if (!isOpen) return null

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)'
        }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div
          ref={ref}
          className={`${sizeClasses[size]} w-full mx-4 rounded-lg shadow-xl`}
          style={{
            backgroundColor: 'var(--color-surface-primary)',
            border: '1px solid var(--color-border)'
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded hover:opacity-70 transition-opacity"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6" style={{ color: 'var(--color-text-primary)' }}>
            {children}
          </div>

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div
              className="flex gap-3 p-6 border-t justify-end"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {actions.map((action, idx) => (
                <Button
                  key={idx}
                  size="md"
                  variant={action.variant ?? 'secondary'}
                  onClick={() => {
                    action.onClick()
                    onClose()
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
)

Modal.displayName = 'Modal'
