import type { ImageInfo } from '../types'
import { Button } from '@/components/ui/button'
import { Save, Scissors, Upload } from 'lucide-react'

type SpriteSheetHeaderProps = {
  activeFrameCount: number
  canImportFrames: boolean
  imageInfo: ImageInfo | null
  importing: boolean
  invalidFrameCount: number
  onImport: () => void
  onPickFile: () => void
  renderError: string
  totalFrameCount: number
}

export default function SpriteSheetHeader({
  activeFrameCount,
  canImportFrames,
  imageInfo,
  importing,
  invalidFrameCount,
  onImport,
  onPickFile,
  renderError,
  totalFrameCount,
}: SpriteSheetHeaderProps) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3'>
      <div className='flex min-w-0 items-center gap-3'>
        <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-[var(--accent-primary)] ring-1 ring-sky-300/15'>
          <Scissors className='h-4 w-4' />
        </div>
        <div className='min-w-0'>
          <p className='text-[14px] font-semibold text-[var(--text-primary)]'>从合图拆帧</p>
          <div className='mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-tertiary)]'>
            <span>{imageInfo ? imageInfo.name : '未选择图片'}</span>
            {imageInfo && <span className='rounded-full bg-white/[0.06] px-2 py-0.5'>{`${imageInfo.width} x ${imageInfo.height}`}</span>}
            {imageInfo && (
              <span className='rounded-full bg-sky-400/10 px-2 py-0.5 text-sky-200/80'>{`${activeFrameCount}/${totalFrameCount} 帧启用`}</span>
            )}
            {invalidFrameCount > 0 && <span className='rounded-full bg-red-400/10 px-2 py-0.5 text-red-200'>{invalidFrameCount} 帧超出范围</span>}
            {renderError && <span className='rounded-full bg-red-400/10 px-2 py-0.5 text-red-200'>{renderError}</span>}
          </div>
        </div>
      </div>

      <div className='flex shrink-0 gap-2'>
        <Button variant='outline' size='sm' onClick={onPickFile}>
          <Upload className='mr-1.5 h-3.5 w-3.5' />
          选择合图
        </Button>
        <Button size='sm' loading={importing} disabled={!canImportFrames} onClick={onImport}>
          {!importing && <Save className='mr-1.5 h-3.5 w-3.5' />}
          保存图标
        </Button>
      </div>
    </div>
  )
}
