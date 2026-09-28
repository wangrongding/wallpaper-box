import { getOmarchyHelperPath } from './paths'
import { spawn } from 'child_process'
import type { ChildProcessWithoutNullStreams } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import readline from 'readline'

export type DynamicWallpaperKind = 'video' | 'web'

let activeHelper: ChildProcessWithoutNullStreams | null = null
let onUnexpectedExit: (() => void) | null = null

export function setOmarchyWallpaperExitHandler(handler: () => void) {
  onUnexpectedExit = handler
}

export async function supportsOmarchyWallpaper() {
  if (process.platform !== 'linux' || process.env.XDG_SESSION_TYPE !== 'wayland' || !process.env.WAYLAND_DISPLAY) {
    return false
  }
  const release = await fs.readFile('/etc/os-release', 'utf8').catch(() => '')
  return /^ID="?omarchy"?$/m.test(release)
}

export async function validateDynamicSource(kind: DynamicWallpaperKind, source: string) {
  if (typeof source !== 'string' || !source.trim()) {
    throw new Error('壁纸来源不能为空')
  }
  if (kind === 'video') {
    const resolved = path.resolve(source)
    if (!['.mp4', '.mov', '.webm'].includes(path.extname(resolved).toLowerCase())) {
      throw new Error('请选择 MP4、MOV 或 WebM 视频')
    }
    const stat = await fs.stat(resolved).catch(() => null)
    if (!stat?.isFile()) throw new Error('视频文件不存在或无法访问')
    return resolved
  }
  let url: URL
  try {
    url = new URL(source)
  } catch {
    throw new Error('网页地址无效')
  }
  if (url.protocol === 'http:' || url.protocol === 'https:') {
    return url.href
  }
  if (url.protocol === 'file:') {
    const { fileURLToPath } = await import('url')
    const localPath = fileURLToPath(url)
    if (!['.html', '.htm', '.svg'].includes(path.extname(localPath).toLowerCase())) {
      throw new Error('本地网页仅支持 HTML、HTM 或 SVG')
    }
    const stat = await fs.stat(localPath).catch(() => null)
    if (!stat?.isFile()) throw new Error('网页文件不存在或无法访问')
    return url.href
  }
  throw new Error('网页地址仅支持 HTTP、HTTPS 或本地文件')
}

function launchHelper(kind: DynamicWallpaperKind, source: string): Promise<ChildProcessWithoutNullStreams> {
  return new Promise((resolve, reject) => {
    const preload = '/usr/lib/libgtk4-layer-shell.so'
    const child = spawn('/usr/bin/python3', [getOmarchyHelperPath(), kind, source], {
      env: {
        ...process.env,
        LD_PRELOAD: process.env.LD_PRELOAD ? `${preload}:${process.env.LD_PRELOAD}` : preload,
        PYTHONUNBUFFERED: '1',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let settled = false
    let diagnostics = ''
    const timer = setTimeout(() => fail(new Error('壁纸加载超时')), kind === 'web' ? 30000 : 15000)
    const lines = readline.createInterface({ input: child.stdout })

    function fail(error: Error) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      child.kill('SIGTERM')
      reject(new Error(`${error.message}${diagnostics ? `：${diagnostics.trim()}` : ''}`))
    }

    child.stderr.on('data', (chunk: Buffer) => {
      diagnostics = (diagnostics + chunk.toString()).slice(-2000)
    })
    lines.on('line', (line) => {
      try {
        const event = JSON.parse(line) as { event?: string; message?: string }
        if (event.event === 'ready' && !settled) {
          settled = true
          clearTimeout(timer)
          resolve(child)
        } else if (event.event === 'error') {
          if (!settled) fail(new Error(event.message || '壁纸加载失败'))
          else console.error('Dynamic wallpaper error:', event.message)
        }
      } catch {
        diagnostics = (diagnostics + line).slice(-2000)
      }
    })
    child.once('error', (error) => fail(error))
    child.once('exit', (code) => {
      if (!settled) fail(new Error(`壁纸进程退出（${code ?? 'unknown'}）`))
      if (activeHelper === child) {
        activeHelper = null
        onUnexpectedExit?.()
      }
    })
  })
}

async function terminateHelper(child: ChildProcessWithoutNullStreams | null) {
  if (!child || child.exitCode !== null || child.killed) return
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      resolve()
    }, 3000)
    child.once('exit', () => {
      clearTimeout(timer)
      resolve()
    })
    child.kill('SIGTERM')
  })
}

export async function applyOmarchyWallpaper(kind: DynamicWallpaperKind, source: string) {
  await fs.access(getOmarchyHelperPath())
  await fs.access('/usr/lib/libgtk4-layer-shell.so')
  const next = await launchHelper(kind, source)
  if (next.exitCode !== null) throw new Error('壁纸进程在启动后退出')
  const previous = activeHelper
  activeHelper = next
  await terminateHelper(previous)
  if (next.exitCode !== null) throw new Error('壁纸进程在切换期间退出')
}

export async function stopOmarchyWallpaper() {
  const previous = activeHelper
  activeHelper = null
  await terminateHelper(previous)
}

export function killOmarchyWallpaper() {
  activeHelper?.kill('SIGTERM')
  activeHelper = null
}
