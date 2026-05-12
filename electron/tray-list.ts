import { getPublicAssetPath, getWallpaperRootPath } from './paths'
import { nativeImage } from 'electron'
import type { NativeImage } from 'electron'
import fs from 'fs'
import path from 'path'

const supportedTrayIconExtensions = new Set(['.png', '.ico', '.jpg', '.jpeg', '.webp'])
const spriteSheetManifestNames = ['pet.json', 'tray-icon.json', 'sprite.json']
const defaultSpriteSheetColumns = 8
const defaultSpriteSheetRows = 9
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
  lastModifiedAt: number
  name: string
  previewPath: string
  source: TrayIconSource
  spriteSheet?: TrayIconSpriteSheetDescriptor
}

export type TrayIconSpriteSheetDescriptor = {
  columns: number
  frameHeight: number
  frameWidth: number
  path: string
  row: number
  rows: number
}

type SpriteSheetManifest = {
  columns?: number
  defaultAnimation?: string
  displayName?: string
  frameHeight?: number
  frameWidth?: number
  id?: string
  rows?: number
  spriteSheetPath?: string
  spritesheetPath?: string
  states?: Record<string, number | { row?: number }>
  tray?: { animation?: string; row?: number }
  trayAnimation?: string
  trayRow?: number
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

function readSpriteSheetManifest(directoryPath: string): SpriteSheetManifest | null {
  for (const manifestName of spriteSheetManifestNames) {
    const manifestPath = path.join(directoryPath, manifestName)

    if (!fs.existsSync(manifestPath)) {
      continue
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as SpriteSheetManifest
      return manifest && typeof manifest === 'object' ? manifest : null
    } catch (error) {
      console.warn(`[tray] sprite manifest could not be parsed: ${manifestPath}`, error)
    }
  }

  return null
}

function getManifestSpriteSheetPath(manifest: SpriteSheetManifest | null, directoryPath: string) {
  const spriteSheetPath = manifest?.spritesheetPath || manifest?.spriteSheetPath

  if (!spriteSheetPath) {
    return ''
  }

  return path.isAbsolute(spriteSheetPath) ? spriteSheetPath : path.join(directoryPath, spriteSheetPath)
}

function findSpriteSheetPath(directoryPath: string, entries: fs.Dirent[], manifest: SpriteSheetManifest | null) {
  const manifestSpriteSheetPath = getManifestSpriteSheetPath(manifest, directoryPath)

  if (manifestSpriteSheetPath && fs.existsSync(manifestSpriteSheetPath)) {
    return manifestSpriteSheetPath
  }

  const spriteSheetEntry = entries
    .filter((entry) => entry.isFile())
    .find((entry) => {
      const extension = path.extname(entry.name).toLowerCase()
      const stem = path.basename(entry.name, extension).toLowerCase()
      return supportedTrayIconExtensions.has(extension) && ['spritesheet', 'sprite-sheet', 'sprite_sheet', 'atlas'].includes(stem)
    })

  return spriteSheetEntry ? path.join(directoryPath, spriteSheetEntry.name) : ''
}

function getSpriteSheetRow(manifest: SpriteSheetManifest | null, rows: number) {
  const requestedAnimation = manifest?.tray?.animation || manifest?.trayAnimation || manifest?.defaultAnimation
  const requestedState = requestedAnimation ? manifest?.states?.[requestedAnimation] : undefined
  const rowFromState = typeof requestedState === 'number' ? requestedState : requestedState?.row
  const row = manifest?.tray?.row ?? manifest?.trayRow ?? rowFromState ?? 0

  return Math.min(Math.max(Math.floor(row), 0), Math.max(rows - 1, 0))
}

function createSpriteSheetImages(spriteSheetPath: string, frameWidth: number, frameHeight: number, columns: number, row: number) {
  const spriteSheet = nativeImage.createFromPath(spriteSheetPath)

  if (spriteSheet.isEmpty()) {
    console.warn(`[tray] sprite sheet could not be loaded: ${spriteSheetPath}`)
    return []
  }

  return Array.from({ length: columns }, (_, column) =>
    spriteSheet.crop({ height: frameHeight, width: frameWidth, x: column * frameWidth, y: row * frameHeight }).resize({ height: 24 }),
  ).filter((image) => !image.isEmpty())
}

function createSpriteSheetTrayIconSet(
  source: TrayIconSource,
  directoryName: string,
  directoryPath: string,
  manifest: SpriteSheetManifest | null,
  entries: fs.Dirent[],
) {
  const spriteSheetPath = findSpriteSheetPath(directoryPath, entries, manifest)

  if (!spriteSheetPath) {
    return null
  }

  const spriteSheet = nativeImage.createFromPath(spriteSheetPath)
  if (spriteSheet.isEmpty()) {
    console.warn(`[tray] sprite sheet could not be loaded: ${spriteSheetPath}`)
    return null
  }

  const size = spriteSheet.getSize()
  const columns = Math.max(1, Math.floor(manifest?.columns || defaultSpriteSheetColumns))
  const rows = Math.max(1, Math.floor(manifest?.rows || defaultSpriteSheetRows))
  const frameWidth = Math.floor(manifest?.frameWidth || size.width / columns)
  const frameHeight = Math.floor(manifest?.frameHeight || size.height / rows)

  if (!frameWidth || !frameHeight || frameWidth * columns > size.width || frameHeight * rows > size.height) {
    console.warn(`[tray] sprite sheet dimensions are invalid: ${spriteSheetPath}`)
    return null
  }

  const row = getSpriteSheetRow(manifest, rows)
  const images = createSpriteSheetImages(spriteSheetPath, frameWidth, frameHeight, columns, row)

  if (!images.length) {
    return null
  }

  const name = manifest?.displayName || manifest?.id || directoryName

  return {
    directory: directoryPath,
    frameCount: images.length,
    framePaths: [spriteSheetPath],
    id: `${source}:${directoryName}:${name}:spritesheet:${row}`,
    images,
    label: name,
    lastModifiedAt: getTrayIconLastModifiedAt([spriteSheetPath]),
    name,
    previewPath: spriteSheetPath,
    source,
    spriteSheet: {
      columns,
      frameHeight,
      frameWidth,
      path: spriteSheetPath,
      row,
      rows,
    },
  } satisfies TrayIconSet
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

function ensureTrayIconDirectories() {
  fs.mkdirSync(customTrayIconDirectory, { recursive: true })
}

function collectTrayFrames(directoryName: string, directoryPath: string, entries = fs.readdirSync(directoryPath, { withFileTypes: true })) {
  const groups = new Map<string, Map<string, FrameCandidate[]>>()

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
    lastModifiedAt: getTrayIconLastModifiedAt(framePaths),
    name,
    previewPath: framePaths[0],
    source,
  } satisfies TrayIconSet
}

function getTrayIconSetsFromDirectory(source: TrayIconSource, directoryName: string, directoryPath: string) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true })
  const manifest = readSpriteSheetManifest(directoryPath)
  const spriteSheetIconSet = createSpriteSheetTrayIconSet(source, directoryName, directoryPath, manifest, entries)

  if (spriteSheetIconSet) {
    return [spriteSheetIconSet]
  }

  const frameGroups = collectTrayFrames(directoryName, directoryPath, entries)
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

  if (validFramePaths.length === 1) {
    const sourcePath = validFramePaths[0]
    const sourceImage = nativeImage.createFromPath(sourcePath)
    const size = sourceImage.getSize()
    const isLikelyCodexSpriteSheet =
      !sourceImage.isEmpty() && size.width % defaultSpriteSheetColumns === 0 && size.height % defaultSpriteSheetRows === 0

    if (isLikelyCodexSpriteSheet) {
      const extension = path.extname(sourcePath).toLowerCase() || '.png'
      const spriteSheetFileName = `spritesheet${extension}`
      fs.copyFileSync(sourcePath, path.join(destinationDirectory, spriteSheetFileName))
      fs.writeFileSync(
        path.join(destinationDirectory, 'pet.json'),
        JSON.stringify(
          {
            columns: defaultSpriteSheetColumns,
            displayName: normalizedName,
            frameHeight: size.height / defaultSpriteSheetRows,
            frameWidth: size.width / defaultSpriteSheetColumns,
            id: normalizedName,
            rows: defaultSpriteSheetRows,
            spritesheetPath: spriteSheetFileName,
            tray: { row: 0 },
          },
          null,
          2,
        ),
      )

      return getTrayIconSetsFromDirectory('custom', normalizedName, destinationDirectory)[0] || null
    }
  }

  validFramePaths.forEach((framePath, index) => {
    const extension = path.extname(framePath).toLowerCase() || '.png'
    const fileName = `${String(index + 1).padStart(3, '0')}${extension}`
    fs.copyFileSync(framePath, path.join(destinationDirectory, fileName))
  })

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
