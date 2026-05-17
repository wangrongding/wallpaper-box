import { getPublicAssetPath, getWallpaperRootPath } from './paths'
import { nativeImage } from 'electron'
import type { NativeImage } from 'electron'
import fs from 'fs'
import path from 'path'

const supportedTrayIconExtensions = new Set(['.png', '.ico', '.jpg', '.jpeg', '.webp'])
const trayIconExtensionPriority = ['.png', '.webp', '.jpg', '.jpeg', '.ico']
const builtinTrayIconDirectory = getPublicAssetPath('icons')
const customTrayIconDirectory = path.join(getWallpaperRootPath(), 'tray-icons')

export type TrayIconSource = 'builtin' | 'custom'

export type TrayIconAnimationMetadata = {
  fps?: number
  frameDurationMs?: number
}

export type TrayIconSetDescriptor = {
  animation?: TrayIconAnimationMetadata
  directory: string
  frameCount: number
  framePaths: string[]
  id: string
  label: string
  lastModifiedAt: number
  name: string
  previewPath: string
  source: TrayIconSource
}

export type TrayIconSet = TrayIconSetDescriptor & {
  images: NativeImage[]
}

type FrameCandidate = {
  extension: string
  fileName: string
  frameOrder: number
  groupName: string
  stem: string
}

type TrayIconDataUrlFrame = {
  dataUrl: string
  fileName?: string
}

type ImportTrayIconDataUrlOptions = {
  fps?: number
}

function compareText(left: string, right: string) {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
}

function getExtensionPriority(extension: string) {
  const index = trayIconExtensionPriority.indexOf(extension)
  return index === -1 ? trayIconExtensionPriority.length : index
}

function normalizeGroupName(value: string) {
  return value.replace(/[_\-\s]+$/g, '').trim()
}

function parseFrameCandidate(directoryName: string, fileName: string): FrameCandidate {
  const extension = path.extname(fileName).toLowerCase()
  const stem = path.basename(fileName, extension)
  const match = stem.match(/^(.*?)(?:[_\-\s]?)(\d+)$/)
  const groupName = normalizeGroupName(match?.[1] || '') || directoryName

  return {
    extension,
    fileName,
    frameOrder: match ? Number(match[2]) : Number.MAX_SAFE_INTEGER,
    groupName,
    stem,
  }
}

function createNativeImageFromAbsolutePath(assetPath: string) {
  if (!fs.existsSync(assetPath)) {
    console.warn(`[tray] icon not found: ${assetPath}`)
    return nativeImage.createEmpty()
  }

  const image = nativeImage.createFromPath(assetPath).resize({ height: 24 })

  if (image.isEmpty()) {
    console.warn(`[tray] icon could not be loaded: ${assetPath}`)
  }

  return image
}

function getTrayIconLastModifiedAt(framePaths: string[]) {
  return framePaths.reduce((latestModifiedAt, framePath) => {
    try {
      return Math.max(latestModifiedAt, fs.statSync(framePath).mtimeMs)
    } catch {
      return latestModifiedAt
    }
  }, 0)
}

function normalizeFps(value: unknown) {
  const fps = Number(value)
  if (!Number.isFinite(fps)) {
    return undefined
  }

  return Math.min(60, Math.max(1, Math.round(fps)))
}

function createAnimationMetadata(fps: unknown): TrayIconAnimationMetadata | undefined {
  const normalizedFps = normalizeFps(fps)
  if (!normalizedFps) {
    return undefined
  }

  return {
    fps: normalizedFps,
    frameDurationMs: Math.max(16, Math.round(1000 / normalizedFps)),
  }
}

function readTrayIconAnimationMetadata(directoryPath: string) {
  const metadataPath = path.join(directoryPath, 'animation.json')

  if (!fs.existsSync(metadataPath)) {
    return undefined
  }

  try {
    const raw = fs.readFileSync(metadataPath, 'utf8')
    const metadata = JSON.parse(raw) as TrayIconAnimationMetadata
    return createAnimationMetadata(metadata.fps)
  } catch {
    return undefined
  }
}

function writeTrayIconAnimationMetadata(directoryPath: string, options?: ImportTrayIconDataUrlOptions) {
  const metadata = createAnimationMetadata(options?.fps)
  if (!metadata) {
    return
  }

  fs.writeFileSync(path.join(directoryPath, 'animation.json'), `${JSON.stringify(metadata, null, 2)}\n`)
}

function ensureTrayIconDirectories() {
  fs.mkdirSync(customTrayIconDirectory, { recursive: true })
}

function collectTrayFrames(directoryName: string, directoryPath: string) {
  const groups = new Map<string, Map<string, FrameCandidate[]>>()
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue
    }

    const extension = path.extname(entry.name).toLowerCase()
    if (!supportedTrayIconExtensions.has(extension)) {
      continue
    }

    const frame = parseFrameCandidate(directoryName, entry.name)
    const groupFrames = groups.get(frame.groupName) || new Map<string, FrameCandidate[]>()
    const dedupeKey = frame.frameOrder === Number.MAX_SAFE_INTEGER ? frame.stem : String(frame.frameOrder)
    const candidates = groupFrames.get(dedupeKey) || []

    candidates.push(frame)
    groupFrames.set(dedupeKey, candidates)
    groups.set(frame.groupName, groupFrames)
  }

  return groups
}

function createTrayIconSet(source: TrayIconSource, directoryName: string, groupName: string, directoryPath: string, framePaths: string[]) {
  const images = framePaths.map((framePath) => createNativeImageFromAbsolutePath(framePath)).filter((image) => !image.isEmpty())

  if (!images.length) {
    return null
  }

  const name = groupName || directoryName

  return {
    animation: readTrayIconAnimationMetadata(directoryPath),
    directory: directoryPath,
    frameCount: framePaths.length,
    framePaths,
    id: `${source}:${directoryName}:${name}`,
    images,
    label: name,
    lastModifiedAt: getTrayIconLastModifiedAt(framePaths),
    name,
    previewPath: framePaths[0],
    source,
  } satisfies TrayIconSet
}

function getTrayIconSetsFromDirectory(source: TrayIconSource, directoryName: string, directoryPath: string) {
  const frameGroups = collectTrayFrames(directoryName, directoryPath)
  const iconSets: TrayIconSet[] = []

  for (const [groupName, groupFrames] of frameGroups.entries()) {
    const selectedFrames = Array.from(groupFrames.values())
      .map(
        (candidates) =>
          candidates.sort((left, right) => {
            const extensionPriority = getExtensionPriority(left.extension) - getExtensionPriority(right.extension)
            if (extensionPriority !== 0) {
              return extensionPriority
            }

            return compareText(left.fileName, right.fileName)
          })[0],
      )
      .sort((left, right) => {
        if (left.frameOrder !== right.frameOrder) {
          return left.frameOrder - right.frameOrder
        }

        return compareText(left.stem, right.stem)
      })

    const trayIconSet = createTrayIconSet(
      source,
      directoryName,
      groupName,
      directoryPath,
      selectedFrames.map((frame) => path.join(directoryPath, frame.fileName)),
    )

    if (trayIconSet) {
      iconSets.push(trayIconSet)
    }
  }

  return iconSets
}

function listLibraryTrayIconSets(libraryPath: string, source: TrayIconSource) {
  if (!fs.existsSync(libraryPath)) {
    return []
  }

  return fs
    .readdirSync(libraryPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => getTrayIconSetsFromDirectory(source, entry.name, path.join(libraryPath, entry.name)))
    .sort((left, right) => {
      if (source === 'custom' && left.lastModifiedAt !== right.lastModifiedAt) {
        return right.lastModifiedAt - left.lastModifiedAt
      }

      return compareText(left.label, right.label)
    })
}

function sanitizeTrayIconName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
}

function getUniqueCustomTrayIconName(name: string) {
  const baseName = sanitizeTrayIconName(name) || `custom-icon-${Date.now()}`
  let candidateName = baseName
  let suffix = 1

  while (fs.existsSync(path.join(customTrayIconDirectory, candidateName))) {
    candidateName = `${baseName}-${suffix}`
    suffix += 1
  }

  return candidateName
}

function parseImageDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/(?:png|webp|jpe?g);base64,([a-z0-9+/=]+)$/i)
  if (!match) {
    throw new Error('图片帧数据格式无效')
  }

  const buffer = Buffer.from(match[1], 'base64')
  const image = nativeImage.createFromBuffer(buffer)

  if (image.isEmpty()) {
    throw new Error('无法读取裁剪后的图片帧')
  }

  return buffer
}

export function getTrayIconLibraryPaths() {
  ensureTrayIconDirectories()

  return {
    builtinDirectory: builtinTrayIconDirectory,
    customDirectory: customTrayIconDirectory,
  }
}

export function getTrayIconSets() {
  ensureTrayIconDirectories()

  return [...listLibraryTrayIconSets(customTrayIconDirectory, 'custom'), ...listLibraryTrayIconSets(builtinTrayIconDirectory, 'builtin')]
}

export function getTrayIconSetDescriptors() {
  return getTrayIconSets().map(({ images: _images, ...item }) => item)
}

export function getDefaultTrayIconId() {
  const trayIconSets = getTrayIconSets()
  return trayIconSets.find((item) => item.name === 'mario')?.id || trayIconSets[0]?.id || ''
}

export function importTrayIconSet(name: string, framePaths: string[]) {
  ensureTrayIconDirectories()

  const normalizedName = getUniqueCustomTrayIconName(name)
  const validFramePaths = Array.from(new Set(framePaths))
    .filter((framePath) => typeof framePath === 'string' && framePath.trim())
    .map((framePath) => framePath.trim())
    .filter((framePath) => supportedTrayIconExtensions.has(path.extname(framePath).toLowerCase()) && fs.existsSync(framePath))
    .sort((left, right) => compareText(path.basename(left), path.basename(right)))

  if (!validFramePaths.length) {
    throw new Error('至少需要导入一张支持的图片帧')
  }

  const destinationDirectory = path.join(customTrayIconDirectory, normalizedName)
  fs.mkdirSync(destinationDirectory, { recursive: true })
  const frameIndexPadding = Math.max(3, String(validFramePaths.length).length)

  validFramePaths.forEach((framePath, index) => {
    const extension = path.extname(framePath).toLowerCase() || '.png'
    const fileName = `${String(index + 1).padStart(frameIndexPadding, '0')}${extension}`
    fs.copyFileSync(framePath, path.join(destinationDirectory, fileName))
  })

  const importedTrayIconSets = getTrayIconSetsFromDirectory('custom', normalizedName, destinationDirectory)
  return importedTrayIconSets.find((item) => item.name === normalizedName) || importedTrayIconSets[0] || null
}

export function importTrayIconSetFromDataUrls(name: string, frames: TrayIconDataUrlFrame[], options?: ImportTrayIconDataUrlOptions) {
  ensureTrayIconDirectories()

  const normalizedName = getUniqueCustomTrayIconName(name || `sprite-icon-${Date.now()}`)
  const validFrames = frames.filter((frame) => typeof frame?.dataUrl === 'string' && frame.dataUrl.trim())

  if (!validFrames.length) {
    throw new Error('至少需要导入一帧裁剪后的图片')
  }

  const destinationDirectory = path.join(customTrayIconDirectory, normalizedName)
  fs.mkdirSync(destinationDirectory, { recursive: true })

  validFrames.forEach((frame, index) => {
    const buffer = parseImageDataUrl(frame.dataUrl.trim())
    const fileName = `${String(index + 1).padStart(3, '0')}.png`
    fs.writeFileSync(path.join(destinationDirectory, fileName), buffer)
  })

  writeTrayIconAnimationMetadata(destinationDirectory, options)

  return getTrayIconSetsFromDirectory('custom', normalizedName, destinationDirectory)[0] || null
}

export function renameCustomTrayIconSet(targetId: string, name: string) {
  ensureTrayIconDirectories()

  const nextName = sanitizeTrayIconName(name)
  if (!nextName) {
    throw new Error('请输入新的动态图标名称')
  }

  const trayIconSets = getTrayIconSets()
  const trayIconSet = trayIconSets.find((item) => item.id === targetId)

  if (!trayIconSet) {
    throw new Error('未找到要重命名的自定义动态图标')
  }

  if (trayIconSet.source !== 'custom') {
    throw new Error('内置动态图标不支持重命名')
  }

  if (trayIconSet.name === nextName) {
    return trayIconSet
  }

  const normalizedName = getUniqueCustomTrayIconName(nextName)
  const destinationDirectory = path.join(customTrayIconDirectory, normalizedName)
  fs.mkdirSync(destinationDirectory, { recursive: true })

  const frameIndexPadding = Math.max(3, String(trayIconSet.framePaths.length).length)
  trayIconSet.framePaths.forEach((framePath, index) => {
    const extension = path.extname(framePath).toLowerCase() || '.png'
    const fileName = `${String(index + 1).padStart(frameIndexPadding, '0')}${extension}`
    fs.copyFileSync(framePath, path.join(destinationDirectory, fileName))
  })

  const metadataPath = path.join(trayIconSet.directory, 'animation.json')
  if (fs.existsSync(metadataPath)) {
    fs.copyFileSync(metadataPath, path.join(destinationDirectory, 'animation.json'))
  }

  const relatedTrayIconSets = trayIconSets.filter((item) => item.source === 'custom' && item.directory === trayIconSet.directory)
  if (relatedTrayIconSets.length <= 1) {
    fs.rmSync(trayIconSet.directory, { force: true, recursive: true })
  } else {
    trayIconSet.framePaths.forEach((framePath) => {
      fs.rmSync(framePath, { force: true })
    })
  }

  return getTrayIconSetsFromDirectory('custom', normalizedName, destinationDirectory)[0] || null
}

export function deleteCustomTrayIconSet(targetId: string) {
  ensureTrayIconDirectories()

  const trayIconSets = getTrayIconSets()
  const trayIconSet = trayIconSets.find((item) => item.id === targetId)

  if (!trayIconSet) {
    throw new Error('未找到要删除的自定义动态图标')
  }

  if (trayIconSet.source !== 'custom') {
    throw new Error('内置动态图标不支持删除')
  }

  const relatedTrayIconSets = trayIconSets.filter((item) => item.source === 'custom' && item.directory === trayIconSet.directory)

  if (relatedTrayIconSets.length <= 1) {
    fs.rmSync(trayIconSet.directory, { force: true, recursive: true })
    return
  }

  trayIconSet.framePaths.forEach((framePath) => {
    fs.rmSync(framePath, { force: true })
  })

  if (!fs.existsSync(trayIconSet.directory)) {
    return
  }

  const remainingEntries = fs.readdirSync(trayIconSet.directory)
  if (!remainingEntries.length) {
    fs.rmdirSync(trayIconSet.directory)
  }
}
