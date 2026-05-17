import SpriteSheetCanvas from './components/SpriteSheetCanvas'
import SpriteSheetFrames from './components/SpriteSheetFrames'
import SpriteSheetHeader from './components/SpriteSheetHeader'
import SpriteSheetPreview from './components/SpriteSheetPreview'
import SpriteSheetSidebar from './components/SpriteSheetSidebar'
import { initialGridSettings, initialTransparentSettings } from './constants'
import { detectSpriteGridFromPixels, inferSpriteName, renderSpriteFrames } from './sprite-sheet'
import type { GridNumberKey, ImageInfo, RenderedSpriteFrame, SpriteFrameRect, SpriteSheetEditorProps, TrayIconMutationResponse } from './types'
import { clamp, readInteger, readNumber } from './utils'
import { ipcRenderer } from '@/lib/electron-runtime'
import type { ChangeEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

export default function SpriteSheetEditor({ onImported }: SpriteSheetEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef('')
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null)
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null)
  const [iconName, setIconName] = useState('')
  const [gridSettings, setGridSettings] = useState(initialGridSettings)
  const [transparentSettings, setTransparentSettings] = useState(initialTransparentSettings)
  const [disabledFrameIndexes, setDisabledFrameIndexes] = useState<Set<number>>(() => new Set())
  const [renderedFrames, setRenderedFrames] = useState<RenderedSpriteFrame[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)
  const [renderError, setRenderError] = useState('')
  const [importing, setImporting] = useState(false)

  const imageWidth = imageInfo?.width || 512
  const imageHeight = imageInfo?.height || 512
  const frameWidthMax = Math.max(1, imageWidth)
  const frameHeightMax = Math.max(1, imageHeight)
  const offsetXMax = Math.max(0, imageWidth - 1)
  const offsetYMax = Math.max(0, imageHeight - 1)
  const gapMax = Math.max(64, Math.min(512, Math.max(imageWidth, imageHeight)))
  const maxGridFrames = Math.max(1, gridSettings.columns * gridSettings.rows)

  const frameRects = useMemo(() => {
    if (!imageInfo) {
      return []
    }

    return Array.from({ length: clamp(gridSettings.frameCount, 1, maxGridFrames) }, (_, index) => {
      const column = index % gridSettings.columns
      const row = Math.floor(index / gridSettings.columns)
      const x = gridSettings.offsetX + column * (gridSettings.frameWidth + gridSettings.gapX)
      const y = gridSettings.offsetY + row * (gridSettings.frameHeight + gridSettings.gapY)
      const inside = x >= 0 && y >= 0 && x + gridSettings.frameWidth <= imageInfo.width && y + gridSettings.frameHeight <= imageInfo.height

      return {
        enabled: !disabledFrameIndexes.has(index),
        height: gridSettings.frameHeight,
        index,
        inside,
        width: gridSettings.frameWidth,
        x,
        y,
      } satisfies SpriteFrameRect
    })
  }, [disabledFrameIndexes, gridSettings, imageInfo, maxGridFrames])

  const activeRenderedFrames = useMemo(() => renderedFrames.filter((frame) => frame.enabled), [renderedFrames])
  const canImportFrames = frameRects.some((frame) => frame.inside && frame.enabled)
  const invalidFrameCount = frameRects.filter((frame) => !frame.inside).length
  const previewFrame = activeRenderedFrames.length ? activeRenderedFrames[previewIndex % activeRenderedFrames.length] : null
  const previewScale = useMemo(() => {
    if (!imageInfo) {
      return 1
    }

    return Math.min(2.5, Math.max(0.15, Math.min(560 / imageInfo.width, 420 / imageInfo.height)))
  }, [imageInfo])

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function updateGridNumber(key: GridNumberKey, value: string, min: number, max: number) {
    setGridSettings((current) => ({
      ...current,
      [key]: readInteger(value, current[key], min, max),
    }))
  }

  function updateGridDecimal(key: GridNumberKey, value: string, min: number, max: number) {
    setGridSettings((current) => ({
      ...current,
      [key]: readNumber(value, current[key], min, max),
    }))
  }

  function applyAutoGrid() {
    if (!sourceImage) {
      return
    }

    const guessedGrid = detectSpriteGridFromPixels(sourceImage)
    setGridSettings((current) => ({
      ...current,
      ...guessedGrid,
    }))
    setDisabledFrameIndexes(new Set())
  }

  function clearObjectUrl() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = ''
    }
  }

  function clearSprite() {
    clearObjectUrl()
    setImageInfo(null)
    setSourceImage(null)
    setRenderedFrames([])
    setRenderError('')
    setDisabledFrameIndexes(new Set())
  }

  function handleSpriteFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    clearObjectUrl()
    const objectUrl = URL.createObjectURL(file)
    objectUrlRef.current = objectUrl

    const image = new window.Image()
    image.onload = () => {
      const nextImageInfo = {
        height: image.naturalHeight,
        name: file.name,
        width: image.naturalWidth,
      }
      const guessedGrid = detectSpriteGridFromPixels(image)

      setImageInfo(nextImageInfo)
      setSourceImage(image)
      setIconName((current) => current || inferSpriteName(file.name))
      setGridSettings((current) => ({
        ...current,
        ...guessedGrid,
        fps: current.fps,
      }))
      setTransparentSettings(initialTransparentSettings)
      setDisabledFrameIndexes(new Set())
      setRenderError('')
    }
    image.onerror = () => {
      clearSprite()
      toast.error('无法读取这张合图')
    }
    image.src = objectUrl
  }

  function toggleFrame(index: number) {
    setDisabledFrameIndexes((current) => {
      const next = new Set(current)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }

      return next
    })
  }

  async function handleImportSprite() {
    if (!sourceImage || !imageInfo) {
      toast.warning('先选择一张合图')
      return
    }

    let nextRenderedFrames: RenderedSpriteFrame[]
    try {
      nextRenderedFrames = renderSpriteFrames(sourceImage, frameRects, transparentSettings)
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成帧预览失败'
      setRenderError(message)
      toast.error(message)
      return
    }

    const framesForImport = nextRenderedFrames.filter((frame) => frame.enabled)
    setRenderedFrames(nextRenderedFrames)

    if (!framesForImport.length) {
      toast.warning('至少保留一帧用于导入')
      return
    }

    setImporting(true)

    try {
      const response = (await ipcRenderer.invoke('import-tray-icon-set-from-sprite', {
        frames: framesForImport.map((frame) => ({
          dataUrl: frame.dataUrl,
          fileName: frame.fileName,
        })),
        metadata: {
          fps: gridSettings.fps,
        },
        name: iconName,
      })) as TrayIconMutationResponse

      if (!response?.success) {
        toast.error(response?.message || '导入合图帧失败')
        return
      }

      await onImported?.()
      toast.success('合图帧已导入为自定义动态图标')
    } finally {
      setImporting(false)
    }
  }

  useEffect(() => {
    setGridSettings((current) => {
      const nextFrameCount = clamp(current.frameCount, 1, maxGridFrames)
      return nextFrameCount === current.frameCount ? current : { ...current, frameCount: nextFrameCount }
    })
  }, [maxGridFrames])

  useEffect(() => {
    if (!sourceImage) {
      setRenderedFrames([])
      return
    }

    const timer = window.setTimeout(() => {
      try {
        setRenderedFrames(renderSpriteFrames(sourceImage, frameRects, transparentSettings))
        setRenderError('')
      } catch (error) {
        setRenderedFrames([])
        setRenderError(error instanceof Error ? error.message : '生成帧预览失败')
      }
    }, 80)

    return () => {
      window.clearTimeout(timer)
    }
  }, [frameRects, sourceImage, transparentSettings])

  useEffect(() => {
    if (!activeRenderedFrames.length) {
      setPreviewIndex(0)
      return
    }

    const frameDuration = Math.max(16, Math.round(1000 / gridSettings.fps))
    const timer = window.setInterval(() => {
      setPreviewIndex((current) => (current + 1) % activeRenderedFrames.length)
    }, frameDuration)

    return () => {
      window.clearInterval(timer)
    }
  }, [activeRenderedFrames.length, gridSettings.fps])

  useEffect(() => {
    return () => {
      clearObjectUrl()
    }
  }, [])

  return (
    <div className='overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_12%_0%,rgba(56,189,248,0.12),transparent_28%),linear-gradient(180deg,rgba(9,14,26,0.98),rgba(8,12,22,0.95))] shadow-[0_24px_80px_rgba(2,6,23,0.22)]'>
      <SpriteSheetHeader
        activeFrameCount={activeRenderedFrames.length}
        canImportFrames={canImportFrames}
        imageInfo={imageInfo}
        importing={importing}
        invalidFrameCount={invalidFrameCount}
        onImport={() => {
          void handleImportSprite()
        }}
        onPickFile={openFilePicker}
        renderError={renderError}
        totalFrameCount={renderedFrames.length}
      />

      <input ref={fileInputRef} type='file' accept='.png,.jpg,.jpeg,.webp,image/*' className='hidden' onChange={handleSpriteFileChange} />

      <div className='grid xl:grid-cols-[minmax(0,1fr)_360px]'>
        <SpriteSheetCanvas
          frameRects={frameRects}
          imageInfo={imageInfo}
          onPickFile={openFilePicker}
          previewScale={previewScale}
          sourceImage={sourceImage}
        />

        <SpriteSheetSidebar
          frameHeightMax={frameHeightMax}
          frameWidthMax={frameWidthMax}
          gapMax={gapMax}
          gridSettings={gridSettings}
          iconName={iconName}
          imageLoaded={Boolean(imageInfo)}
          maxGridFrames={maxGridFrames}
          offsetXMax={offsetXMax}
          offsetYMax={offsetYMax}
          onApplyAutoGrid={applyAutoGrid}
          onGridDecimalChange={updateGridDecimal}
          onGridNumberChange={updateGridNumber}
          onIconNameChange={setIconName}
          onTransparentColorChange={(value) => setTransparentSettings((current) => ({ ...current, color: value }))}
          onTransparentEnabledChange={(value) => setTransparentSettings((current) => ({ ...current, enabled: value }))}
          onTransparentToleranceChange={(value) =>
            setTransparentSettings((current) => ({ ...current, tolerance: readInteger(value, current.tolerance, 0, 80) }))
          }
          transparentSettings={transparentSettings}
        />
      </div>

      <div className='grid border-t border-white/[0.06] lg:grid-cols-[minmax(0,1fr)_260px]'>
        <SpriteSheetFrames renderedFrames={renderedFrames} onToggleFrame={toggleFrame} />
        <SpriteSheetPreview activeFrameCount={activeRenderedFrames.length} fps={gridSettings.fps} previewFrame={previewFrame} />
      </div>
    </div>
  )
}
