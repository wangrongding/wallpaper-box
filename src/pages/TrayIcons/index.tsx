import TrayIconPanel from '@/pages/Setting/TrayIconPanel'
import { AppWindowMac } from 'lucide-react'

export default function TrayIcons() {
  return (
    <div className='animate-fade-in-up mx-auto max-w-6xl py-4'>
      <div className='mb-6 flex items-center gap-3'>
        <div className='from-[var(--accent-primary)]/20 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br to-sky-600/10 text-[var(--accent-primary)]'>
          <AppWindowMac className='h-5 w-5' />
        </div>
        <div>
          <h1 className='font-display text-xl font-semibold text-[var(--text-primary)]'>菜单栏动态图标</h1>
          <p className='text-[13px] text-[var(--text-tertiary)]'>预览、切换和导入菜单栏动画帧</p>
        </div>
      </div>

      <TrayIconPanel />
    </div>
  )
}
