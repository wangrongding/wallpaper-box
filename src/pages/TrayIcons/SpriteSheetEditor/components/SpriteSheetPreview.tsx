import type { RenderedSpriteFrame } from '../types'
import { Play } from 'lucide-react'

type SpriteSheetPreviewProps = {
  activeFrameCount: number
  fps: number
  previewFrame: RenderedSpriteFrame | null
}

export default function SpriteSheetPreview({ activeFrameCount, fps, previewFrame }: SpriteSheetPreviewProps) {
  return (
    <div className='border-t border-white/[0.06] bg-black/[0.12] p-4 lg:border-l lg:border-t-0'>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <span className='flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.06] text-[var(--text-tertiary)]'>
            <Play className='h-4 w-4' />
          </span>
          <p className='text-[13px] font-medium text-[var(--text-secondary)]'>动画预览</p>
        </div>
        <span className='rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-[var(--text-tertiary)]'>{`${fps} FPS`}</span>
      </div>
      <div className='flex h-32 items-center justify-center rounded-lg border border-white/[0.06] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_58%),rgba(2,6,23,0.38)]'>
        {previewFrame ? (
          <img src={previewFrame.dataUrl} alt='sprite animation preview' className='max-h-28 max-w-28 object-contain [image-rendering:pixelated]' />
        ) : (
          <span className='text-[12px] text-[var(--text-tertiary)]'>暂无预览</span>
        )}
      </div>
      <p className='mt-3 text-right text-[12px] text-[var(--text-tertiary)]'>{activeFrameCount ? `${activeFrameCount} 帧循环` : '0 帧'}</p>
    </div>
  )
}
