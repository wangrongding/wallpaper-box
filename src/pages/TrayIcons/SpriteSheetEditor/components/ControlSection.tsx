import type { ReactNode } from 'react'

type ControlSectionProps = {
  children: ReactNode
  icon: ReactNode
  title: string
}

export default function ControlSection({ children, icon, title }: ControlSectionProps) {
  return (
    <section className='border-b border-white/[0.06] px-4 py-4 last:border-b-0'>
      <div className='mb-3 flex items-center gap-2'>
        <span className='flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.06] text-[var(--text-tertiary)]'>{icon}</span>
        <p className='text-[13px] font-medium text-[var(--text-secondary)]'>{title}</p>
      </div>
      {children}
    </section>
  )
}
