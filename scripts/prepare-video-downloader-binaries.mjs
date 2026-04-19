import { execFile as execFileCallback, spawn } from 'child_process'
import fs from 'fs'
import { chmod, mkdir, mkdtemp, rename, rm } from 'fs/promises'
import os from 'os'
import path from 'path'
import { promisify } from 'util'
import { fileURLToPath } from 'url'

const execFile = promisify(execFileCallback)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const outputDirectory = path.join(projectRoot, 'resources', 'bin')
const args = new Set(process.argv.slice(2))
const forceRefresh = args.has('--force')

const downloadPlan = [
  {
    archiveName: 'yt-dlp_macos.zip',
    extractedName: 'yt-dlp_macos',
    label: 'yt-dlp',
    verificationPaths: ['yt-dlp_macos', '_internal/Python'],
    siblingEntries: ['_internal'],
    targetName: 'yt-dlp_macos',
    url: process.env.YTDLP_MACOS_URL || 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos.zip',
  },
  {
    archiveName: 'deno-aarch64-apple-darwin.zip',
    extractedName: 'deno',
    label: 'deno-arm64',
    verificationPaths: ['deno-aarch64-apple-darwin'],
    targetName: 'deno-aarch64-apple-darwin',
    url: process.env.DENO_ARM64_URL || 'https://github.com/denoland/deno/releases/latest/download/deno-aarch64-apple-darwin.zip',
  },
  {
    archiveName: 'deno-x86_64-apple-darwin.zip',
    extractedName: 'deno',
    label: 'deno-x64',
    verificationPaths: ['deno-x86_64-apple-darwin'],
    targetName: 'deno-x86_64-apple-darwin',
    url: process.env.DENO_X64_URL || 'https://github.com/denoland/deno/releases/latest/download/deno-x86_64-apple-darwin.zip',
  },
  {
    archiveName: 'ffmpeg80arm.zip',
    extractedName: 'ffmpeg',
    label: 'ffmpeg-arm64',
    verificationPaths: ['ffmpeg-darwin-arm64'],
    targetName: 'ffmpeg-darwin-arm64',
    url: process.env.FFMPEG_ARM64_URL || 'https://www.osxexperts.net/ffmpeg80arm.zip',
  },
  {
    archiveName: 'ffprobe80arm.zip',
    extractedName: 'ffprobe',
    label: 'ffprobe-arm64',
    verificationPaths: ['ffprobe-darwin-arm64'],
    targetName: 'ffprobe-darwin-arm64',
    url: process.env.FFPROBE_ARM64_URL || 'https://www.osxexperts.net/ffprobe80arm.zip',
  },
  {
    archiveName: 'ffmpeg80intel.zip',
    extractedName: 'ffmpeg',
    label: 'ffmpeg-x64',
    verificationPaths: ['ffmpeg-darwin-x64'],
    targetName: 'ffmpeg-darwin-x64',
    url: process.env.FFMPEG_X64_URL || 'https://www.osxexperts.net/ffmpeg80intel.zip',
  },
  {
    archiveName: 'ffprobe80intel.zip',
    extractedName: 'ffprobe',
    label: 'ffprobe-x64',
    verificationPaths: ['ffprobe-darwin-x64'],
    targetName: 'ffprobe-darwin-x64',
    url: process.env.FFPROBE_X64_URL || 'https://www.osxexperts.net/ffprobe80intel.zip',
  },
]

const requiredPaths = downloadPlan.flatMap((item) => item.verificationPaths)

function runCurl(argumentsList) {
  return new Promise((resolve, reject) => {
    const child = spawn('curl', argumentsList, {
      stdio: ['ignore', 'ignore', 'inherit'],
    })

    child.once('error', reject)
    child.once('close', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }

      if (signal) {
        reject(new Error(`curl exited with signal ${signal}`))
        return
      }

      reject(new Error(`curl exited with code ${code}`))
    })
  })
}

async function download(url, destination) {
  const baseArgs = ['--fail', '--location', '--progress-bar', '--retry', '3', '--retry-all-errors', '--output', destination, url]

  try {
    await runCurl(baseArgs)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (!message.includes('code 92')) {
      throw error
    }

    console.warn('curl encountered an HTTP/2 transport error, retrying with HTTP/1.1...')
    await runCurl(['--http1.1', ...baseArgs])
  }
}

async function unzip(archivePath, destination) {
  await execFile('unzip', ['-o', archivePath, '-d', destination])
}

async function adHocSign(targetPath) {
  if (process.platform !== 'darwin') {
    return
  }

  try {
    await execFile('xattr', ['-cr', targetPath])
  } catch {
    // xattr is optional; continue even if it is unavailable.
  }

  try {
    await execFile('codesign', ['-s', '-', targetPath])
  } catch (error) {
    console.warn(`Unable to ad-hoc sign ${targetPath}:`, error.message || error)
  }
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(outputDirectory, relativePath))
}

function getMissingPaths() {
  return requiredPaths.filter((item) => !fileExists(item))
}

async function prepareBinary(item, tempDirectory) {
  const archivePath = path.join(tempDirectory, item.archiveName)
  const extractDirectory = path.join(tempDirectory, item.label)
  const targetPath = path.join(outputDirectory, item.targetName)

  console.log(`Downloading ${item.label}...`)
  await download(item.url, archivePath)

  await mkdir(extractDirectory, { recursive: true })
  await unzip(archivePath, extractDirectory)

  const extractedPath = path.join(extractDirectory, item.extractedName)
  await rm(targetPath, { force: true })
  await rename(extractedPath, targetPath)
  await chmod(targetPath, 0o755)
  await adHocSign(targetPath)

  for (const entry of item.siblingEntries || []) {
    const sourcePath = path.join(extractDirectory, entry)
    const destinationPath = path.join(outputDirectory, entry)

    await rm(destinationPath, { force: true, recursive: true })
    await rename(sourcePath, destinationPath)
  }

  console.log(`Prepared ${item.targetName}`)
}

async function main() {
  await mkdir(outputDirectory, { recursive: true })

  const missingPaths = forceRefresh ? [] : getMissingPaths()
  const pendingDownloads = forceRefresh
    ? downloadPlan
    : downloadPlan.filter((item) => item.verificationPaths.some((relativePath) => missingPaths.includes(relativePath)))

  if (!forceRefresh && pendingDownloads.length === 0) {
    console.log(`All video downloader binaries already exist in ${outputDirectory}`)
    console.log('Skip downloading. Use `yarn prepare:video-downloader` if you want to force refresh them.')
    return
  }

  if (!forceRefresh) {
    for (const item of downloadPlan) {
      if (!pendingDownloads.includes(item)) {
        console.log(`Skip ${item.label}, already prepared`)
      }
    }
  }

  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'wallpaper-box-video-downloader-'))

  try {
    for (const item of pendingDownloads) {
      await prepareBinary(item, tempDirectory)
    }

    console.log(`All binaries are ready in ${outputDirectory}`)
    console.log('yt-dlp, Deno, ffmpeg and ffprobe are ready for both Apple Silicon and Intel macOS builds.')
  } finally {
    await rm(tempDirectory, { force: true, recursive: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
