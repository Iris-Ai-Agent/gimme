import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variantStyles: Record<Variant, string> = {
  primary: 'bg-masters-green text-white hover:bg-masters-dark active:bg-[#003D2A]',
  secondary: 'bg-gold text-night hover:bg-gold-light active:bg-[#B09850]',
  ghost: 'bg-transparent text-masters-green hover:bg-rough dark:text-gold dark:hover:bg-night-border',
  danger: 'bg-birdie-red text-white hover:bg-red-700 active:bg-red-800',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3.5 text-lg',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={`
        inline-flex items-center justify-center rounded-xl font-semibold
        tap-target transition-all duration-150
        focus-visible:ring-2 focus-visible:ring-masters-green focus-visible:ring-offset-2
        disabled:opacity-50 disabled:pointer-events-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
