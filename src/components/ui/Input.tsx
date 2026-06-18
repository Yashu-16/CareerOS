'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, ...props },
  ref
) {
  const inputId = id || props.name
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-label text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'w-full border rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white',
          'placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all',
          error
            ? 'border-danger focus:ring-red-200 focus:border-danger'
            : 'border-gray-200 focus:ring-primary-300 focus:border-primary-600',
          props.disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed opacity-75',
          className
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="text-danger text-xs mt-1">{error}</p>}
      {!error && hint && <p className="text-gray-500 text-xs mt-1">{hint}</p>}
    </div>
  )
})
