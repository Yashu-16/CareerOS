'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-gray-900 hover:bg-primary-700 focus:ring-2 focus:ring-primary-300',
  secondary:
    'bg-white text-primary-700 border border-primary-300 hover:bg-primary-50',
  danger: 'bg-danger text-white hover:bg-red-700',
  ghost: 'text-gray-700 hover:bg-gray-100',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-body-sm',
  md: 'px-4 py-2.5 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all',
        'disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
})
