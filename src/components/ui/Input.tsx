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
      className={`w-full rounded-xl border border-[#E8E3DA] bg-white focus:outline-none focus:border-[#2D4A3E] text-[#2D4A3E] placeholder:text-[#8A8578]/50 transition-all ${sizeStyles[inputSize]} ${className}`}
      {...props}
    />
  ),
)

Input.displayName = 'Input'
