import type { RenderedSpriteFrame, SpriteFrameRect, TransparentSettings } from './types'
import { clamp } from './utils'

type BackgroundProfile = {
  b: number
  g: number
  r: number
  tolerance: number
  transparent: boolean
}

type PixelRun = {
  end: number
  length: number
  start: number
}

type AxisDetection = {
  count: number
  gap: number
  offset: number
  size: number
}

type PixelBounds = {
  area: number
  bottom: number
  height: number
  left: number
  right: number
  top: number
  width: number
}

export function inferSpriteName(fileName: string) {
  return (
    fileName
      .replace(/\.[^.]+$/g, '')
      .replace(/[_\-\s]*(sprite|sheet|spritesheet)$/i, '')
      .replace(/[^\w\u4e00-\u9fa5.-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-.]+|[-.]+$/g, '')
      .trim() || 'sprite-icon'
  )
}

function guessGrid(width: number, height: number) {
  const commonFrameCounts = [16, 8, 12, 24, 32, 4, 6, 10, 20, 64]
  let best = {
    columns: 1,
    frameCount: 1,
    frameHeight: height,
    frameWidth: width,
    rows: 1,
    score: Number.POSITIVE_INFINITY,
  }

  for (let columns = 1; columns <= 24; columns += 1) {
    for (let rows = 1; rows <= 24; rows += 1) {
      const frameWidth = width / columns
      const frameHeight = height / rows
      const frameCount = columns * rows
      const squareScore = Math.abs(Math.log(frameWidth / frameHeight)) * 20
      const commonFrameScore = Math.min(...commonFrameCounts.map((count) => (Math.abs(frameCount - count) / count) * 5))
      const integerCellPenalty = (frameWidth % 1 === 0 ? 0 : 0.35) + (frameHeight % 1 === 0 ? 0 : 0.35)
      const tinyCellPenalty = frameWidth < 8 || frameHeight < 8 ? 50 : 0
      const score = squareScore + commonFrameScore + integerCellPenalty + tinyCellPenalty

      if (score < best.score) {
        best = {
          columns,
          frameCount,
          frameHeight,
          frameWidth,
          rows,
          score,
        }
      }
    }
  }

  return {
    columns: best.columns,
    frameCount: best.frameCount,
    frameHeight: best.frameHeight,
    frameWidth: best.frameWidth,
    gapX: 0,
    gapY: 0,
    offsetX: 0,
    offsetY: 0,
    rows: best.rows,
  }
}

function getMedian(values: number[]) {
  if (!values.length) {
    return 0
  }

  const sortedValues = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sortedValues.length / 2)

  return sortedValues.length % 2 === 0 ? (sortedValues[middle - 1] + sortedValues[middle]) / 2 : sortedValues[middle]
}

function getImageDataFromImage(sourceImage: HTMLImageElement) {
  const width = sourceImage.naturalWidth
  const height = sourceImage.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    return null
  }

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(sourceImage, 0, 0)

  return ctx.getImageData(0, 0, width, height)
}

function getPixelIndex(width: number, x: number, y: number) {
  return (y * width + x) * 4
}

function getColorBucket(r: number, g: number, b: number) {
  return `${r >> 3}:${g >> 3}:${b >> 3}`
}

function getBackgroundProfile(imageData: ImageData): BackgroundProfile {
  const { data, height, width } = imageData
  const stride = Math.max(1, Math.floor(Math.min(width, height) / 160))
  const buckets = new Map<string, { b: number; count: number; g: number; r: number }>()
  let transparentSamples = 0
  let sampleCount = 0

  function samplePixel(x: number, y: number) {
    const index = getPixelIndex(width, x, y)
    const alpha = data[index + 3]
    sampleCount += 1

    if (alpha <= 16) {
      transparentSamples += 1
      return
    }

    const r = data[index]
    const g = data[index + 1]
    const b = data[index + 2]
    const key = getColorBucket(r, g, b)
    const bucket = buckets.get(key) || { b: 0, count: 0, g: 0, r: 0 }
    bucket.count += 1
    bucket.r += r
    bucket.g += g
    bucket.b += b
    buckets.set(key, bucket)
  }

  for (let x = 0; x < width; x += stride) {
    samplePixel(x, 0)
    samplePixel(x, height - 1)
  }

  for (let y = 0; y < height; y += stride) {
    samplePixel(0, y)
    samplePixel(width - 1, y)
  }

  if (transparentSamples > sampleCount * 0.1) {
    return {
      b: 0,
      g: 0,
      r: 0,
      tolerance: 0,
      transparent: true,
    }
  }

  const dominantBucket = Array.from(buckets.values()).sort((left, right) => right.count - left.count)[0]

  if (!dominantBucket) {
    return {
      b: 0,
      g: 0,
      r: 0,
      tolerance: 0,
      transparent: true,
    }
  }

  return {
    b: dominantBucket.b / dominantBucket.count,
    g: dominantBucket.g / dominantBucket.count,
    r: dominantBucket.r / dominantBucket.count,
    tolerance: 18,
    transparent: false,
  }
}

function isForegroundPixel(data: Uint8ClampedArray, index: number, background: BackgroundProfile) {
  const alpha = data[index + 3]
  if (alpha <= 16) {
    return false
  }

  if (background.transparent) {
    return true
  }

  const distance = Math.max(Math.abs(data[index] - background.r), Math.abs(data[index + 1] - background.g), Math.abs(data[index + 2] - background.b))
  return distance > background.tolerance
}

function getForegroundBounds(imageData: ImageData, background: BackgroundProfile): PixelBounds | null {
  const { data, height, width } = imageData
  let area = 0
  let bottom = -1
  let left = width
  let right = -1
  let top = height

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!isForegroundPixel(data, getPixelIndex(width, x, y), background)) {
        continue
      }

      area += 1
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
    }
  }

  if (!area) {
    return null
  }

  return {
    area,
    bottom,
    height: bottom - top + 1,
    left,
    right,
    top,
    width: right - left + 1,
  }
}

function getForegroundComponents(imageData: ImageData, background: BackgroundProfile) {
  const { data, height, width } = imageData
  const pixelCount = width * height
  const foregroundMask = new Uint8Array(pixelCount)
  const visitedMask = new Uint8Array(pixelCount)
  const components: PixelBounds[] = []

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    if (isForegroundPixel(data, pixelIndex * 4, background)) {
      foregroundMask[pixelIndex] = 1
    }
  }

  for (let startIndex = 0; startIndex < pixelCount; startIndex += 1) {
    if (!foregroundMask[startIndex] || visitedMask[startIndex]) {
      continue
    }

    const stack = [startIndex]
    let area = 0
    let bottom = -1
    let left = width
    let right = -1
    let top = height
    visitedMask[startIndex] = 1

    while (stack.length) {
      const currentIndex = stack.pop() as number
      const x = currentIndex % width
      const y = Math.floor(currentIndex / width)
      area += 1
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)

      const minX = Math.max(0, x - 1)
      const maxX = Math.min(width - 1, x + 1)
      const minY = Math.max(0, y - 1)
      const maxY = Math.min(height - 1, y + 1)

      for (let nextY = minY; nextY <= maxY; nextY += 1) {
        for (let nextX = minX; nextX <= maxX; nextX += 1) {
          const nextIndex = nextY * width + nextX
          if (!foregroundMask[nextIndex] || visitedMask[nextIndex]) {
            continue
          }

          visitedMask[nextIndex] = 1
          stack.push(nextIndex)
        }
      }
    }

    components.push({
      area,
      bottom,
      height: bottom - top + 1,
      left,
      right,
      top,
      width: right - left + 1,
    })
  }

  return components
}

function detectHorizontalGridFromComponents(imageData: ImageData, background: BackgroundProfile) {
  const components = getForegroundComponents(imageData, background)
  if (components.length < 2) {
    return null
  }

  const largestArea = Math.max(...components.map((component) => component.area))
  const minimumArea = Math.max(6, largestArea * 0.06)
  const majorComponents = components
    .filter((component) => component.area >= minimumArea && component.width >= 2 && component.height >= 2)
    .sort((left, right) => left.left - right.left)

  if (majorComponents.length < 2 || majorComponents.length > 64) {
    return null
  }

  const heights = majorComponents.map((component) => component.height)
  const widths = majorComponents.map((component) => component.width)
  const centerYValues = majorComponents.map((component) => (component.top + component.bottom) / 2)
  const medianHeight = getMedian(heights)
  const medianWidth = getMedian(widths)
  const verticalSpread = Math.max(...centerYValues) - Math.min(...centerYValues)

  if (verticalSpread > Math.max(3, medianHeight * 0.45)) {
    return null
  }

  const leftPitches = majorComponents.slice(1).map((component, index) => component.left - majorComponents[index].left)
  const pitch = Math.round(getMedian(leftPitches))
  const pitchDeviation = getMedian(leftPitches.map((value) => Math.abs(value - pitch)))

  if (pitch <= 0 || pitchDeviation > Math.max(3, pitch * 0.28) || pitch < medianWidth * 0.65) {
    return null
  }

  const widthDeviation = getMedian(widths.map((value) => Math.abs(value - medianWidth))) / Math.max(1, medianWidth)
  const heightDeviation = getMedian(heights.map((value) => Math.abs(value - medianHeight))) / Math.max(1, medianHeight)

  if (widthDeviation > 0.65 || heightDeviation > 0.65) {
    return null
  }

  const offsetX = Math.max(0, Math.floor(Math.min(...majorComponents.map((component, index) => component.left - index * pitch))))
  const offsetY = Math.max(0, Math.min(...majorComponents.map((component) => component.top)))
  const frameWidth = Math.ceil(Math.max(...majorComponents.map((component, index) => component.right - (offsetX + index * pitch) + 1)))
  const frameHeight = Math.ceil(Math.max(...majorComponents.map((component) => component.bottom)) - offsetY + 1)

  if (
    frameWidth <= 0 ||
    frameHeight <= 0 ||
    frameWidth > pitch ||
    offsetX + (majorComponents.length - 1) * pitch + frameWidth > imageData.width + 1
  ) {
    return null
  }

  return {
    columns: majorComponents.length,
    frameCount: majorComponents.length,
    frameHeight,
    frameWidth,
    gapX: Math.max(0, pitch - frameWidth),
    gapY: 0,
    offsetX,
    offsetY,
    rows: 1,
  }
}

function getAxisDensity(imageData: ImageData, background: BackgroundProfile, axis: 'x' | 'y') {
  const { data, height, width } = imageData
  const primaryLength = axis === 'x' ? width : height
  const secondaryLength = axis === 'x' ? height : width
  const foregroundCounts = Array.from({ length: primaryLength }, () => 0)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!isForegroundPixel(data, getPixelIndex(width, x, y), background)) {
        continue
      }

      foregroundCounts[axis === 'x' ? x : y] += 1
    }
  }

  return foregroundCounts.map((count) => count / secondaryLength)
}

function getBlankThreshold(densities: number[], secondaryLength: number) {
  const maxDensity = Math.max(...densities)
  return Math.max(2 / Math.max(secondaryLength, 1), Math.min(0.035, maxDensity * 0.12))
}

function getBlankRuns(densities: number[], threshold: number) {
  const runs: PixelRun[] = []
  let start = -1

  densities.forEach((density, index) => {
    const isBlank = density <= threshold

    if (isBlank && start === -1) {
      start = index
      return
    }

    if (!isBlank && start !== -1) {
      runs.push({
        end: index - 1,
        length: index - start,
        start,
      })
      start = -1
    }
  })

  if (start !== -1) {
    runs.push({
      end: densities.length - 1,
      length: densities.length - start,
      start,
    })
  }

  return runs
}

function detectAxisFromDensity(length: number, secondaryLength: number, densities: number[]): AxisDetection | null {
  const threshold = getBlankThreshold(densities, secondaryLength)
  const blankRuns = getBlankRuns(densities, threshold)
  const internalRuns = blankRuns.filter((run) => run.start > 0 && run.end < length - 1 && run.length <= length * 0.25)

  if (!internalRuns.length || internalRuns.length > 23) {
    return null
  }

  const gap = getMedian(internalRuns.map((run) => run.length))

  if (internalRuns.length === 1) {
    const [run] = internalRuns
    const leftSize = run.start
    const rightSize = length - run.end - 1
    const size = leftSize > 0 && rightSize > 0 ? (leftSize + rightSize) / 2 : (length - run.length) / 2

    return {
      count: 2,
      gap: run.length,
      offset: Math.max(0, run.start - size),
      size,
    }
  }

  const runStarts = internalRuns.map((run) => run.start)
  const pitches = runStarts.slice(1).map((start, index) => start - runStarts[index])
  const pitch = getMedian(pitches)
  const pitchDeviation = getMedian(pitches.map((value) => Math.abs(value - pitch)))

  if (pitch <= 0 || pitchDeviation > Math.max(2, pitch * 0.22)) {
    return null
  }

  const size = pitch - gap
  if (size <= 1) {
    return null
  }

  return {
    count: internalRuns.length + 1,
    gap,
    offset: Math.max(0, internalRuns[0].start - size),
    size,
  }
}

function getValidatedAxis(axis: AxisDetection | null, length: number) {
  if (!axis) {
    return null
  }

  const span = axis.count * axis.size + (axis.count - 1) * axis.gap
  const trailing = length - axis.offset - span
  const coverage = span / length

  if (trailing < -2 || coverage < 0.82) {
    return null
  }

  return axis
}

export function detectSpriteGridFromPixels(sourceImage: HTMLImageElement) {
  const imageData = getImageDataFromImage(sourceImage)
  if (!imageData) {
    return guessGrid(sourceImage.naturalWidth, sourceImage.naturalHeight)
  }

  const background = getBackgroundProfile(imageData)
  const horizontalGrid = detectHorizontalGridFromComponents(imageData, background)
  if (horizontalGrid) {
    return horizontalGrid
  }

  const xDensity = getAxisDensity(imageData, background, 'x')
  const yDensity = getAxisDensity(imageData, background, 'y')
  const fallback = guessGrid(imageData.width, imageData.height)
  const xAxis = getValidatedAxis(detectAxisFromDensity(imageData.width, imageData.height, xDensity), imageData.width)
  const yAxis = getValidatedAxis(detectAxisFromDensity(imageData.height, imageData.width, yDensity), imageData.height)
  const foregroundBounds = getForegroundBounds(imageData, background)
  const columns = xAxis?.count || fallback.columns
  const rows = yAxis?.count || (xAxis?.count && xAxis.count > 1 ? 1 : fallback.rows)

  return {
    columns,
    frameCount: columns * rows,
    frameHeight: yAxis?.size || (xAxis?.count && xAxis.count > 1 && foregroundBounds ? foregroundBounds.height : imageData.height / rows),
    frameWidth: xAxis?.size || imageData.width / columns,
    gapX: xAxis?.gap || 0,
    gapY: yAxis?.gap || 0,
    offsetX: xAxis?.offset || 0,
    offsetY: yAxis?.offset || (xAxis?.count && xAxis.count > 1 && foregroundBounds ? foregroundBounds.top : 0),
    rows,
  }
}

function getSourceCropRect(frame: SpriteFrameRect, sourceImage: HTMLImageElement) {
  const left = clamp(Math.round(frame.x), 0, Math.max(0, sourceImage.naturalWidth - 1))
  const top = clamp(Math.round(frame.y), 0, Math.max(0, sourceImage.naturalHeight - 1))
  const right = clamp(Math.round(frame.x + frame.width), left + 1, sourceImage.naturalWidth)
  const bottom = clamp(Math.round(frame.y + frame.height), top + 1, sourceImage.naturalHeight)

  return {
    height: bottom - top,
    left,
    top,
    width: right - left,
  }
}

function parseHexColor(value: string) {
  const normalized = value.replace('#', '').trim()
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return { b: 0, g: 0, r: 0 }
  }

  return {
    b: Number.parseInt(normalized.slice(4, 6), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    r: Number.parseInt(normalized.slice(0, 2), 16),
  }
}

function applyTransparentColor(ctx: CanvasRenderingContext2D, width: number, height: number, settings: TransparentSettings) {
  if (!settings.enabled) {
    return
  }

  const target = parseHexColor(settings.color)
  const imageData = ctx.getImageData(0, 0, width, height)
  const { data } = imageData

  for (let index = 0; index < data.length; index += 4) {
    const distance = Math.max(Math.abs(data[index] - target.r), Math.abs(data[index + 1] - target.g), Math.abs(data[index + 2] - target.b))

    if (distance <= settings.tolerance) {
      data[index + 3] = 0
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

export function renderSpriteFrames(
  sourceImage: HTMLImageElement,
  frames: SpriteFrameRect[],
  transparentSettings: TransparentSettings,
): RenderedSpriteFrame[] {
  return frames
    .filter((frame) => frame.inside)
    .map((frame, outputIndex) => {
      const cropRect = getSourceCropRect(frame, sourceImage)
      const canvas = document.createElement('canvas')
      canvas.width = cropRect.width
      canvas.height = cropRect.height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('无法创建裁剪画布')
      }

      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, cropRect.width, cropRect.height)
      ctx.drawImage(sourceImage, cropRect.left, cropRect.top, cropRect.width, cropRect.height, 0, 0, cropRect.width, cropRect.height)
      applyTransparentColor(ctx, cropRect.width, cropRect.height, transparentSettings)

      return {
        ...frame,
        height: cropRect.height,
        width: cropRect.width,
        x: cropRect.left,
        y: cropRect.top,
        dataUrl: canvas.toDataURL('image/png'),
        fileName: `${String(outputIndex + 1).padStart(3, '0')}.png`,
      }
    })
}
