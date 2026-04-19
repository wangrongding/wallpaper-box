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

export type TrayIconSetDescriptor = {
  directory: string
  frameCount: number
  framePaths: string[]
  id: string
  label: string
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
    directory: directoryPath,
    frameCount: framePaths.length,
    framePaths,
    id: `${source}:${directoryName}:${name}`,
    images,
    label: name,
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

  return iconSets.sort((left, right) => compareText(left.label, right.label))
}

function listLibraryTrayIconSets(libraryPath: string, source: TrayIconSource) {
  if (!fs.existsSync(libraryPath)) {
    return []
  }

  return fs
    .readdirSync(libraryPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => compareText(left.name, right.name))
    .flatMap((entry) => getTrayIconSetsFromDirectory(source, entry.name, path.join(libraryPath, entry.name)))
}

function sanitizeTrayIconName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
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

  return [...listLibraryTrayIconSets(builtinTrayIconDirectory, 'builtin'), ...listLibraryTrayIconSets(customTrayIconDirectory, 'custom')]
}

export function getTrayIconSetDescriptors() {
  return getTrayIconSets().map(({ images, ...item }) => item)
}

export function getDefaultTrayIconId() {
  const trayIconSets = getTrayIconSets()
  return trayIconSets.find((item) => item.name === 'mario')?.id || trayIconSets[0]?.id || ''
}

export function importTrayIconSet(name: string, framePaths: string[]) {
  ensureTrayIconDirectories()

  const normalizedName = sanitizeTrayIconName(name) || `custom-icon-${Date.now()}`
  const validFramePaths = Array.from(new Set(framePaths))
    .filter((framePath) => typeof framePath === 'string' && framePath.trim())
    .map((framePath) => framePath.trim())
    .filter((framePath) => supportedTrayIconExtensions.has(path.extname(framePath).toLowerCase()) && fs.existsSync(framePath))
    .sort((left, right) => compareText(path.basename(left), path.basename(right)))

  if (!validFramePaths.length) {
    throw new Error('至少需要导入一张支持的图片帧')
  }

  const destinationDirectory = path.join(customTrayIconDirectory, normalizedName)
  fs.rmSync(destinationDirectory, { force: true, recursive: true })
  fs.mkdirSync(destinationDirectory, { recursive: true })

  validFramePaths.forEach((framePath, index) => {
    const extension = path.extname(framePath).toLowerCase() || '.png'
    const fileName = `${String(index + 1).padStart(3, '0')}${extension}`
    fs.copyFileSync(framePath, path.join(destinationDirectory, fileName))
  })

  return getTrayIconSetsFromDirectory('custom', normalizedName, destinationDirectory)[0] || null
}
