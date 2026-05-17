import type { RenderedSpriteFrame } from '../types'
import { cn } from '@/lib/utils'

type SpriteSheetFramesProps = {
  onToggleFrame: (index: number) => void
  renderedFrames: RenderedSpriteFrame[]
}

export default function SpriteSheetFrames({ onToggleFrame, renderedFrames }: SpriteSheetFramesProps) {
  return (
    <div className='min-w-0 px-4 py-4'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <p className='text-[13px] font-medium text-[var(--text-secondary)]'>裁剪帧</p>
        <span className='text-[12px] text-[var(--text-tertiary)]'>点击缩略图启用或跳过</span>
      </div>

      {renderedFrames.length ? (
        <div className='flex gap-2 overflow-x-auto pb-1'>
          {renderedFrames.map((frame) => (
            <button
              key={frame.index}
              type='button'
              className={cn(
                'relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-black/25 p-1 transition-all',
                frame.enabled ? 'border-sky-300/60 bg-sky-400/5 shadow-[0_0_0_1px_rgba(56,189,248,0.18)]' : 'border-white/[0.06] opacity-45',
              )}
              onClick={() => onToggleFrame(frame.index)}
            >
              <img
                src={frame.dataUrl}
                alt={`frame-${frame.index + 1}`}
                className='max-h-full max-w-full object-contain [image-rendering:pixelated]'
              />
              <span className='absolute left-1 top-1 rounded bg-black/70 px-1 text-[10px] text-white'>{frame.index + 1}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className='flex h-20 items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/10 text-[12px] text-[var(--text-tertiary)]'>
          选择合图后会显示裁剪结果
        </div>
      )}
    </div>
  )
}
