import { cn } from '@/lib/utils'
import * as React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'focus-visible:border-[var(--accent-primary)]/50 focus-visible:ring-[var(--accent-primary)]/20 flex h-9 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-glass)] px-3 py-1 text-[13px] text-[var(--text-primary)] shadow-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
