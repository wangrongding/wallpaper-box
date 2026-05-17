import { rangeInputClassName } from '../constants'
import type { NumberSliderFieldProps } from '../types'
import { clamp, formatSteppedValue, getStepperStep } from '../utils'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'

export default function NumberSliderField({ disabled, label, max, min, onChange, step = 1, suffix = '', value }: NumberSliderFieldProps) {
  const normalizedMax = Math.max(min, max)
  const boundedValue = clamp(value, min, normalizedMax)
  const stepperStep = getStepperStep(step)
  const formattedValue = formatSteppedValue(boundedValue, stepperStep)

  function changeByStep(direction: -1 | 1) {
    const nextValue = clamp(boundedValue + direction * stepperStep, min, normalizedMax)
    onChange(formatSteppedValue(nextValue, stepperStep))
  }

  return (
    <div className={cn('block rounded-md bg-white/[0.025] px-2 py-2 transition-colors hover:bg-white/[0.045]', disabled && 'opacity-55')}>
      <div className='mb-1.5 flex items-center justify-between gap-2'>
        <div className='min-w-0'>
          <span className='block text-[12px] font-medium text-[var(--text-secondary)]'>{label}</span>
          <span className='mt-0.5 block truncate text-[11px] text-[var(--text-tertiary)]'>
            {min}-{normalizedMax}
            {suffix}
          </span>
        </div>
        <div className='flex h-7 w-[104px] shrink-0 overflow-hidden rounded-md border border-white/10 bg-black/20'>
          <button
            type='button'
            aria-label={`${label} 减少 ${stepperStep}`}
            disabled={disabled || boundedValue <= min}
            className='flex w-7 items-center justify-center text-[var(--text-tertiary)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text-secondary)] disabled:pointer-events-none disabled:opacity-35'
            onClick={() => changeByStep(-1)}
          >
            <Minus className='h-3 w-3' />
          </button>
          <Input
            type='text'
            inputMode='decimal'
            value={formattedValue}
            disabled={disabled}
            className='h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-1 text-center text-[12px] shadow-none focus-visible:ring-0'
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                changeByStep(1)
              }

              if (event.key === 'ArrowDown') {
                event.preventDefault()
                changeByStep(-1)
              }
            }}
          />
          <button
            type='button'
            aria-label={`${label} 增加 ${stepperStep}`}
            disabled={disabled || boundedValue >= normalizedMax}
            className='flex w-7 items-center justify-center text-[var(--text-tertiary)] transition-colors hover:bg-white/[0.06] hover:text-[var(--text-secondary)] disabled:pointer-events-none disabled:opacity-35'
            onClick={() => changeByStep(1)}
          >
            <Plus className='h-3 w-3' />
          </button>
        </div>
      </div>

      <input
        type='range'
        min={min}
        max={normalizedMax}
        step={stepperStep}
        value={boundedValue}
        disabled={disabled}
        className={rangeInputClassName}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
