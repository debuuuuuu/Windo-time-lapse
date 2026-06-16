import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useFocusTrap(dialogRef, open)

  // Focus the cancel button by default (safer default)
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => cancelRef.current?.focus())
    }
  }, [open])

  // Keyboard: Escape = cancel
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="confirm-dialog-backdrop"
        aria-hidden="true"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="confirm-dialog"
      >
        <div className="confirm-dialog-icon-wrap" aria-hidden="true">
          <AlertTriangle
            className={`w-6 h-6 ${danger ? 'text-red-400' : 'text-amber-400'}`}
          />
        </div>

        <h2 id="confirm-title" className="confirm-dialog-title">
          {title}
        </h2>

        <p id="confirm-message" className="confirm-dialog-message">
          {message}
        </p>

        <div className="confirm-dialog-actions">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="dock-btn dock-btn-ghost flex-1"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`dock-btn flex-1 ${danger ? 'dock-btn-stop' : 'dock-btn-primary'}`}
            autoFocus={false}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  )
}
