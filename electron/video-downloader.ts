import { getBundledBinaryPath, getWallpaperVideoDirectory } from './paths'
import { spawn, type ChildProcess } from 'child_process'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { Readable } from 'stream'

export type DownloadVideoPayload = {
  proxy?: string
  url: string
}

export type DownloadVideoProgress = {
  destination?: string
  eta?: string
  extractor?: string
  line?: string
  percent?: number
  phase: 'prepare' | 'download' | 'merge' | 'completed' | 'error'
  speed?: string
  title?: string
}

export type DownloadVideoResult = {
  directory: string
  extractor?: string
  fileName: string
  path: string
  title?: string
}

export type DownloadVideoController = {
  child: ChildProcess
  result: Promise<DownloadVideoResult>
}

type RuntimeBinaryName = 'deno' | 'ffmpeg' | 'ffprobe' | 'yt-dlp'

const BINARY_CANDIDATES: Partial<Record<NodeJS.Platform, Partial<Record<RuntimeBinaryName, string[]>>>> = {
  aix: {},
  android: {},
  darwin: {
    deno: [process.arch === 'arm64' ? 'deno-aarch64-apple-darwin' : 'deno-x86_64-apple-darwin', 'deno'],
    ffmpeg: [process.arch === 'arm64' ? 'ffmpeg-darwin-arm64' : 'ffmpeg-darwin-x64', 'ffmpeg'],
    ffprobe: [process.arch === 'arm64' ? 'ffprobe-darwin-arm64' : 'ffprobe-darwin-x64', 'ffprobe'],
    'yt-dlp': ['yt-dlp_macos', 'yt-dlp'],
  },
  freebsd: {},
  haiku: {},
  linux: {
    deno: [process.arch === 'arm64' ? 'deno-aarch64-unknown-linux-gnu' : 'deno-x86_64-unknown-linux-gnu', 'deno'],
    ffmpeg: ['ffmpeg'],
    ffprobe: ['ffprobe'],
    'yt-dlp': ['yt-dlp_linux', 'yt-dlp'],
  },
  openbsd: {},
  sunos: {},
  win32: {
    deno: [process.arch === 'arm64' ? 'deno-aarch64-pc-windows-msvc.exe' : 'deno-x86_64-pc-windows-msvc.exe', 'deno.exe'],
    ffmpeg: ['ffmpeg.exe', 'ffmpeg'],
    ffprobe: ['ffprobe.exe', 'ffprobe'],
    'yt-dlp': ['yt-dlp.exe', 'yt-dlp'],
  },
}

function getBinaryEnvKey(name: RuntimeBinaryName) {
  return `WALLPAPER_BOX_${name.replace(/-/g, '_').toUpperCase()}_PATH`
}

async function fileExists(targetPath: string) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function ensureExecutable(targetPath: string) {
  try {
    await fs.chmod(targetPath, 0o755)
  } catch {
    // Ignore chmod failures for filesystems that do not preserve executable bits.
  }
}

async function resolveBundledBinary(name: RuntimeBinaryName) {
  const candidates = BINARY_CANDIDATES[process.platform]?.[name] || []

  for (const candidate of candidates) {
    const fullPath = getBundledBinaryPath(candidate)
    if (await fileExists(fullPath)) {
      await ensureExecutable(fullPath)
      return fullPath
    }
  }

  return null
}

async function resolveRequiredExecutable(name: RuntimeBinaryName): Promise<string> {
  const envOverride = process.env[getBinaryEnvKey(name)]
  if (envOverride) {
    const normalized = path.resolve(envOverride)
    if (await fileExists(normalized)) {
      await ensureExecutable(normalized)
      return normalized
    }
  }

  const bundled = await resolveBundledBinary(name)
  if (bundled) {
    return bundled
  }

  if (process.platform === 'darwin') {
    throw new Error(`缺少内置 ${name} 二进制，请先运行 yarn prepare:video-downloader 或将对应文件放到 resources/bin`)
  }

  return name
}

async function resolveOptionalExecutable(name: RuntimeBinaryName) {
  const envOverride = process.env[getBinaryEnvKey(name)]
  if (envOverride) {
    const normalized = path.resolve(envOverride)
    if (await fileExists(normalized)) {
      await ensureExecutable(normalized)
      return normalized
    }
  }

  const bundled = await resolveBundledBinary(name)
  if (bundled) {
    return bundled
  }

  return null
}

function pushByLine(stream: Readable, handler: (line: string) => void) {
  let buffer = ''

  stream.setEncoding('utf8')
  stream.on('data', (chunk: string) => {
    buffer += chunk
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() || ''

    for (const line of lines) {
      const normalized = line.trim()
      if (normalized) {
        handler(normalized)
      }
    }
  })

  stream.on('end', () => {
    const normalized = buffer.trim()
    if (normalized) {
      handler(normalized)
    }
  })
}

function parseDownloadLine(line: string) {
  const match = line.match(/^\[download\]\s+(\d+(?:\.\d+)?)%\s+of\s+.+?(?:\s+at\s+(.+?))?(?:\s+ETA\s+(.+))?$/)
  if (!match) {
    return null
  }

  return {
    eta: match[3]?.trim(),
    percent: Number(match[1]),
    speed: match[2]?.trim(),
  }
}

function toFileName(filePath: string) {
  return filePath.split(/[\\/]/).pop() || filePath
}

function buildFormatSelector(hasFfmpeg: boolean) {
  if (hasFfmpeg) {
    return 'bestvideo*+bestaudio/best'
  }

  return 'best[acodec!=none][vcodec!=none]/best'
}

async function linkOrCopyExecutable(sourcePath: string, targetPath: string) {
  await fs.rm(targetPath, { force: true })

  try {
    await fs.symlink(sourcePath, targetPath)
  } catch {
    await fs.copyFile(sourcePath, targetPath)
  }

  await ensureExecutable(targetPath)
}

async function createFfmpegLocationDirectory(ffmpegPath: string, ffprobePath: string) {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'wallpaper-box-ffmpeg-'))
  const ffmpegAlias = path.join(tempDirectory, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')
  const ffprobeAlias = path.join(tempDirectory, process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe')

  await linkOrCopyExecutable(ffmpegPath, ffmpegAlias)
  await linkOrCopyExecutable(ffprobePath, ffprobeAlias)

  return tempDirectory
}

async function cleanupTemporaryDirectory(targetPath?: string) {
  if (!targetPath) {
    return
  }

  try {
    await fs.rm(targetPath, { force: true, recursive: true })
  } catch {
    // Best-effort cleanup only.
  }
}

async function buildSpawnConfig(payload: DownloadVideoPayload) {
  const ytDlpPath = await resolveRequiredExecutable('yt-dlp')
  const denoPath = await resolveOptionalExecutable('deno')
  const ffmpegPath = await resolveOptionalExecutable('ffmpeg')
  const ffprobePath = await resolveOptionalExecutable('ffprobe')
  const downloadDirectory = getWallpaperVideoDirectory()

  await fs.mkdir(downloadDirectory, { recursive: true })

  if (Boolean(ffmpegPath) !== Boolean(ffprobePath)) {
    throw new Error('检测到 ffmpeg / ffprobe 不完整，请把这两个文件都放到 resources/bin 后重试')
  }

  const ffmpegLocation = ffmpegPath && ffprobePath ? await createFfmpegLocationDirectory(ffmpegPath, ffprobePath) : undefined
  const hasFfmpeg = Boolean(ffmpegLocation)
  const format = buildFormatSelector(hasFfmpeg)

  const args = [
    '--no-playlist',
    '--newline',
    '--progress',
    '--no-warnings',
    '--format',
    format,
    '--paths',
    downloadDirectory,
    '--output',
    '%(title).140B [%(id)s].%(ext)s',
    '--print',
    'before_dl:__WBX_TITLE__:%(title)s',
    '--print',
    'before_dl:__WBX_EXTRACTOR__:%(extractor_key)s',
    '--print',
    'after_move:__WBX_FILE__:%(filepath)s',
  ]

  if (payload.proxy?.trim()) {
    args.push('--proxy', payload.proxy.trim())
  }

  if (denoPath) {
    args.push('--no-js-runtimes', '--js-runtimes', `deno:${denoPath}`)
  }

  if (ffmpegLocation) {
    args.push('--ffmpeg-location', ffmpegLocation)
    args.push('--merge-output-format', 'mp4')
  }

  args.push(payload.url.trim())

  return {
    args,
    downloadDirectory,
    ffmpegLocation,
    hasFfmpeg,
    ytDlpPath,
  }
}

export async function startVideoDownload(
  payload: DownloadVideoPayload,
  onProgress: (progress: DownloadVideoProgress) => void,
): Promise<DownloadVideoController> {
  if (!payload.url?.trim()) {
    throw new Error('请先输入视频链接')
  }

  const { ytDlpPath, args, downloadDirectory, ffmpegLocation, hasFfmpeg } = await buildSpawnConfig(payload)
  const child = spawn(ytDlpPath, args, {
    env: {
      ...process.env,
      NO_COLOR: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  if (!child.stdout || !child.stderr) {
    throw new Error('yt-dlp 输出流初始化失败')
  }

  let destination = ''
  let title = ''
  let extractor = ''
  let lastErrorLine = ''

  const handleLine = (line: string) => {
    if (line.startsWith('__WBX_TITLE__:')) {
      title = line.slice('__WBX_TITLE__:'.length).trim()
      onProgress({
        line: `准备下载 ${title}`,
        phase: 'prepare',
        title,
      })
      return
    }

    if (line.startsWith('__WBX_EXTRACTOR__:')) {
      extractor = line.slice('__WBX_EXTRACTOR__:'.length).trim()
      onProgress({
        extractor,
        line: extractor ? `来源：${extractor}` : '已解析视频来源',
        phase: 'prepare',
        title,
      })
      return
    }

    if (line.startsWith('__WBX_FILE__:')) {
      destination = line.slice('__WBX_FILE__:'.length).trim()
      onProgress({
        destination,
        line: `已保存到 ${toFileName(destination)}`,
        percent: 100,
        phase: 'completed',
        title,
      })
      return
    }

    const parsedDownload = parseDownloadLine(line)
    if (parsedDownload) {
      onProgress({
        destination,
        eta: parsedDownload.eta,
        extractor,
        line,
        percent: parsedDownload.percent,
        phase: 'download',
        speed: parsedDownload.speed,
        title,
      })
      return
    }

    if (line.startsWith('[download] Destination:')) {
      destination = line.replace('[download] Destination:', '').trim()
      onProgress({
        destination,
        extractor,
        line: `保存中：${toFileName(destination)}`,
        phase: 'prepare',
        title,
      })
      return
    }

    if (line.startsWith('[Merger]')) {
      onProgress({
        destination,
        extractor,
        line: '正在整理视频文件',
        phase: 'merge',
        title,
      })
      return
    }

    if (!line.startsWith('[debug]')) {
      lastErrorLine = line
      onProgress({
        destination,
        extractor,
        line,
        phase: 'prepare',
        title,
      })
    }
  }

  pushByLine(child.stdout, handleLine)
  pushByLine(child.stderr, handleLine)

  const result = new Promise<DownloadVideoResult>((resolve, reject) => {
    child.once('error', (error: Error) => {
      void cleanupTemporaryDirectory(ffmpegLocation)
      reject(error)
    })

    child.once('close', (code: number | null) => {
      void cleanupTemporaryDirectory(ffmpegLocation)

      if (code !== 0) {
        const message =
          !hasFfmpeg && /Requested format is not available/i.test(lastErrorLine)
            ? '当前视频只提供分离的音视频流，必须配合 ffmpeg 才能下载。请将 ffmpeg 和 ffprobe 放到 resources/bin 后重试。'
            : lastErrorLine || `yt-dlp 下载失败，退出码 ${code}`

        reject(new Error(message))
        return
      }

      if (!destination) {
        reject(new Error('下载已完成，但没有找到输出文件路径'))
        return
      }

      resolve({
        directory: downloadDirectory,
        extractor: extractor || undefined,
        fileName: toFileName(destination),
        path: destination,
        title: title || undefined,
      })
    })
  })

  return { child, result }
}
