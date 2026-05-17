import type { ImageInfo, SpriteFrameRect } from '../types'
import { ImagePlus } from 'lucide-react'
import { useEffect, useRef } from 'react'

type SpriteSheetCanvasProps = {
  frameRects: SpriteFrameRect[]
  imageInfo: ImageInfo | null
  onPickFile: () => void
  previewScale: number
  sourceImage: HTMLImageElement | null
}

export default function SpriteSheetCanvas({ frameRects, imageInfo, onPickFile, previewScale, sourceImage }: SpriteSheetCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageInfo || !sourceImage) {
      return
    }

    const dpr = window.devicePixelRatio || 1
    const displayWidth = Math.max(1, Math.round(imageInfo.width * previewScale))
    const displayHeight = Math.max(1, Math.round(imageInfo.height * previewScale))

    canvas.width = Math.round(displayWidth * dpr)
    canvas.height = Math.round(displayHeight * dpr)
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    ctx.setTransform(previewScale * dpr, 0, 0, previewScale * dpr, 0, 0)
    ctx.clearRect(0, 0, imageInfo.width, imageInfo.height)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(sourceImage, 0, 0)

    frameRects.forEach((frame) => {
      if (!frame.inside) {
        ctx.fillStyle = 'rgba(239,68,68,0.16)'
        ctx.strokeStyle = 'rgba(248,113,113,0.95)'
      } else if (frame.enabled) {
        ctx.fillStyle = 'rgba(56,189,248,0.10)'
        ctx.strokeStyle = 'rgba(56,189,248,0.95)'
      } else {
        ctx.fillStyle = 'rgba(15,23,42,0.54)'
        ctx.strokeStyle = 'rgba(148,163,184,0.55)'
      }

      ctx.lineWidth = Math.max(1 / previewScale, 0.5)
      ctx.fillRect(frame.x, frame.y, frame.width, frame.height)
      ctx.strokeRect(frame.x + 0.5 / previewScale, frame.y + 0.5 / previewScale, frame.width - 1 / previewScale, frame.height - 1 / previewScale)

      ctx.fillStyle = frame.enabled ? 'rgba(226,232,240,0.92)' : 'rgba(148,163,184,0.82)'
      ctx.font = `${Math.max(7, 10 / previewScale)}px sans-serif`
      ctx.fillText(String(frame.index + 1), frame.x + 4 / previewScale, frame.y + 12 / previewScale)
    })
  }, [frameRects, imageInfo, previewScale, sourceImage])

  return (
    <div className='min-w-0 border-b border-white/[0.06] xl:border-b-0 xl:border-r'>
      <div className='flex min-h-[460px] items-center justify-center overflow-auto bg-[linear-gradient(45deg,rgba(148,163,184,0.055)_25%,transparent_25%),linear-gradient(-45deg,rgba(148,163,184,0.055)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,rgba(148,163,184,0.055)_75%),linear-gradient(-45deg,transparent_75%,rgba(148,163,184,0.055)_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0] p-5'>
        {imageInfo ? (
          <div className='rounded-lg border border-white/10 bg-black/20 p-2 shadow-[0_16px_45px_rgba(2,6,23,0.28)]'>
            <canvas ref={canvasRef} className='max-w-full rounded-md [image-rendering:pixelated]' />
          </div>
        ) : (
          <button
            type='button'
            className='flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/15 bg-black/15 px-10 py-12 text-[var(--text-tertiary)] transition-colors hover:border-sky-300/30 hover:bg-sky-400/5 hover:text-[var(--text-secondary)]'
            onClick={onPickFile}
          >
            <ImagePlus className='h-8 w-8' />
            <span className='text-[13px]'>选择一张 sprite sheet</span>
          </button>
        )}
      </div>
    </div>
  )
}
