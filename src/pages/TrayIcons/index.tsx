import TrayIconPanel from '@/pages/Setting/TrayIconPanel'
import { AppWindowMac } from 'lucide-react'

export default function TrayIcons() {
  return (
    <div className='animate-fade-in-up mx-auto max-w-7xl px-1 pb-8 pt-2'>
      <div className='mb-5 flex flex-wrap items-end justify-between gap-4'>
        <div className='flex min-w-0 items-center gap-3'>
          <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_35%_20%,rgba(251,191,36,0.20),transparent_42%),linear-gradient(135deg,rgba(56,189,248,0.18),rgba(255,255,255,0.04))] text-sky-100 shadow-[0_18px_50px_rgba(2,6,23,0.25)]'>
            <AppWindowMac className='h-5 w-5' />
          </div>
          <div className='min-w-0'>
            <h1 className='font-display text-2xl font-semibold text-[var(--text-primary)]'>菜单栏动态图标</h1>
            <p className='mt-1 text-[13px] text-[var(--text-tertiary)]'>管理 RunCat 动画帧、导入自定义图标，并实时预览菜单栏效果</p>
          </div>
        </div>
      </div>

      <TrayIconPanel />
    </div>
  )
}
