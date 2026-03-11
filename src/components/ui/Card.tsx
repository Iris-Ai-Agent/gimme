import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated'
  interactive?: boolean
}

export function Card({ variant = 'default', interactive, className = '', children, ...props }: CardProps) {
  return (
    <div
      {...props}
      {...(interactive ? {
        role: 'button' as const,
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
          if ((e.key === 'Enter' || e.key === ' ') && props.onClick) {
            e.preventDefault()
            props.onClick(e as any)
          }
        },
      } : {})}
      className={`
        rounded-2xl p-4
        ${variant === 'elevated'
          ? 'bg-white dark:bg-night-card shadow-lg'
          : 'bg-white dark:bg-night-card border border-rough dark:border-night-border'
        }
        ${interactive ? 'focus-visible:ring-2 focus-visible:ring-masters-green focus-visible:ring-offset-2' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
