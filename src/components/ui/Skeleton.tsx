interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-rough dark:bg-night-border ${className}`}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl p-4 bg-white dark:bg-night-card border border-rough dark:border-night-border space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="px-4 pt-6 max-w-lg mx-auto space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )
}
