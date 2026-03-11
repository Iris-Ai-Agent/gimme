import { Button } from './Button'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-cream">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold mb-1 text-masters-green">{title}</h3>
      <p className="text-sm text-text-secondary max-w-xs mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
