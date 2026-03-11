import { forwardRef, type InputHTMLAttributes } from 'react'

type InputSize = 'sm' | 'md'

const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ inputSize = 'md', className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-xl border border-rough dark:border-night-border bg-white dark:bg-night-card focus:outline-none focus:ring-2 focus:ring-masters-green/50 transition-shadow ${sizeStyles[inputSize]} ${className}`}
      {...props}
    />
  ),
)

Input.displayName = 'Input'
