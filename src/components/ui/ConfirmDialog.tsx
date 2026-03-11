import { useEffect, useRef } from 'react'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  description: string
  confirmText?: string
  confirmVariant?: 'primary' | 'danger'
}

export function ConfirmDialog({
  open, onConfirm, onCancel, title, description,
  confirmText = 'Confirm', confirmVariant = 'danger',
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      // Focus cancel button when dialog opens
      setTimeout(() => cancelRef.current?.focus(), 0)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'Tab') return
    const focusable = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[]
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  if (!open) return null

  return (
    <div ref={dialogRef} className="fixed inset-0 z-[200] flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onCancel} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-cream rounded-t-2xl p-6 space-y-4 animate-slide-up safe-bottom">
        <h2 id="confirm-title" className="text-lg font-bold text-masters-green">{title}</h2>
        <p className="text-sm text-text-secondary">{description}</p>
        <div className="flex gap-3 pt-2">
          <Button ref={cancelRef} variant="ghost" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button ref={confirmRef} variant={confirmVariant} onClick={onConfirm} className="flex-1">{confirmText}</Button>
        </div>
      </div>
    </div>
  )
}
