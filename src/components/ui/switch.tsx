import { cn } from '@/lib/utils'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import * as React from 'react'

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  label?: string
}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(({ className, label, ...props }, ref) => (
  <label className='inline-flex cursor-pointer items-center gap-2'>
    <SwitchPrimitives.Root
      className={cn(
        'focus-visible:ring-[var(--accent-primary)]/50 data-[state=checked]:border-[var(--accent-primary)]/30 peer inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer items-center rounded-full border border-[var(--border-default)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40 data-[state=checked]:bg-[var(--accent-primary)] data-[state=unchecked]:bg-[var(--bg-glass-active)]',
        className,
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block h-[16px] w-[16px] rounded-full shadow-sm ring-0 transition-all duration-200 data-[state=checked]:translate-x-[16px] data-[state=unchecked]:translate-x-[1px] data-[state=checked]:bg-[var(--bg-deep)] data-[state=unchecked]:bg-[var(--text-tertiary)]',
        )}
      />
    </SwitchPrimitives.Root>
    {label && <span className='select-none text-[13px] text-[var(--text-secondary)]'>{label}</span>}
  </label>
))
Switch.displayName = 'Switch'

export { Switch }
