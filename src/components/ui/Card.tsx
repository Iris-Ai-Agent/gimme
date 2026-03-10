import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated'
}

export function Card({ variant = 'default', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl p-4
        ${variant === 'elevated'
          ? 'bg-white dark:bg-night-card shadow-lg'
          : 'bg-white dark:bg-night-card border border-rough dark:border-night-border'
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
