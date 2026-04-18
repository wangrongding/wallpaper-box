import { generateAiWallpaper } from './ai-wallpaper'
import { createMacLiveWallpaper, closeLiveWallpaper } from './create-mac-live-wallpaper'
import { createWebLiveWallpaper, closeWebLiveWallpaper } from './create-web-live-wallpaper'
import { getDevServerUrl } from './dev-server'
import { initDock } from './dock'
import { initKeyboard } from './keyboard'
import { initMenu } from './menu'
import { getWallpaperRootPath, getWallpaperThumbnailDirectory } from './paths'
import { setProxy, removeProxy } from './proxy'
import { setTrayIcon } from './tray'
import { startVideoDownload } from './video-downloader'
import { execFile as execFileCallback } from 'child_process'
import type { ChildProcess } from 'child_process'
import { createHash } from 'crypto'
import { protocol, app, BrowserWindow, Notification, ipcMain, shell, nativeImage } from 'electron'
import Store from 'electron-store'
import fs from 'fs/promises'
import path from 'path'
import { promisify } from 'util'

const execFile = promisify(execFileCallback)

Store.initRenderer()
const store = new Store()
const videoPath = store.get('video-path')
const webPath = store.get('web-path') as string
const proxyPath = store.get('proxy-path') as string
// 是否为开发环境
const isDev = process.env.IS_DEV === 'true'
// 关闭electron警告
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
// 保持window对象的全局引用,避免JavaScript对象被垃圾回收时,窗口被自动关闭.
let mainWindow: BrowserWindow
let activeVideoDownload: ChildProcess | null = null
const supportedLocalWallpaperExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp'])

// 初始化应用
const initApp = () => {
  // 创建窗口
  createWindow()
  // 设置托盘图标
  setTrayIcon(mainWindow)
  // 设置快捷键
  initKeyboard(mainWindow)
  // 设置菜单
  initMenu(mainWindow)
  // 设置dock
  initDock()
  // 设置代理
  if (proxyPath) {
    setProxy(mainWindow, proxyPath)
  }
  // 创建动态壁纸
  if (videoPath) {
    createLiveWallpaperWindow()
  } else if (webPath) {
    createWebLiveWallpaperWindow()
  }
  // 隐藏菜单栏
  // Menu.setApplicationMenu(null)
}

//为自定义的 file 协议提供特权
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'file',
    privileges: {
      standard: true,
      supportFetchAPI: true,
      bypassCSP: true,
      corsEnabled: true,
      stream: true,
      allowServiceWorkers: true,
    },
  },
])

// 创建窗口
const createWindow = () => {
  // 创建窗口
  mainWindow = new BrowserWindow({
    width: isDev ? 1600 : 1300,
    minWidth: 950,
    height: 900,
    minHeight: 900,
    frame: false, //是否显示边缘框
    // titleBarStyle: 'hiddenInset', //标题栏样式
    fullscreen: false, //是否全屏显示
    webPreferences: {
      // preload: './preload.js',
      // preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, //赋予此窗口页面中的JavaScript访问Node.js环境的能力
      webSecurity: false, //禁用同源策略
      contextIsolation: false, //是否使用上下文隔离,在同一个 JavaScript 上下文中使用 Electron API
      allowRunningInsecureContent: true, //允许在 HTTPS 页面中运行 HTTP URL
      webviewTag: true, //是否允许在页面中使用 <webview> 标签
      spellcheck: false, //是否启用拼写检查
      disableHtmlFullscreenWindowResize: true, //禁用 HTML 全屏窗口调整大小
    },
  })

  if (isDev) {
    // mainWindow.loadFile(path.join(__dirname, '../dist-web/index.html'))
    mainWindow.loadURL(getDevServerUrl())
    mainWindow.webContents.openDevTools({ mode: 'right' })
  } else {
    // mainWindow.loadFile(...fileRoute)
    mainWindow.loadFile(path.join(__dirname, '../dist-web/index.html'))
  }
}

async function setWallPaper(picturePath: string) {
  if (!picturePath || typeof picturePath !== 'string') {
    throw new Error('壁纸路径无效')
  }

  const resolvedPath = path.resolve(picturePath)
  await fs.access(resolvedPath)

  if (process.platform === 'darwin') {
    const binaryPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'wallpaper', 'source', 'macos-wallpaper')
      : path.join(path.dirname(require.resolve('wallpaper')), 'source', 'macos-wallpaper')

    await fs.access(binaryPath)
    await execFile(binaryPath, ['set', resolvedPath, '--screen', 'all', '--scale', 'auto'])
    return
  }

  const wallpaper = await import('wallpaper')
  await wallpaper.setWallpaper(resolvedPath, { scale: 'auto', screen: 'all' })
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function getAiConfig() {
  return {
    apiBaseUrl: ((store.get('ai-api-base-url') as string) || 'https://api.openai.com/v1').trim(),
    apiKey: ((store.get('ai-api-key') as string) || '').trim(),
    model: ((store.get('ai-model') as string) || 'gpt-image-1').trim(),
  }
}

function getProxyPath() {
  return ((store.get('proxy-path') as string) || '').trim()
}

async function pathExists(targetPath: string) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

function isSupportedLocalWallpaperFile(fileName: string) {
  return supportedLocalWallpaperExtensions.has(path.extname(fileName).toLowerCase())
}

function getLocalWallpaperThumbnailPath(filePath: string, modifiedAt: number, size: number) {
  const hash = createHash('sha1').update(`${filePath}:${modifiedAt}:${size}`).digest('hex')
  return path.join(getWallpaperThumbnailDirectory(), `${hash}.jpg`)
}

async function ensureLocalWallpaperThumbnail(filePath: string) {
  const stat = await fs.stat(filePath)
  const thumbnailPath = getLocalWallpaperThumbnailPath(filePath, stat.mtimeMs, stat.size)
  if (await pathExists(thumbnailPath)) {
    return thumbnailPath
  }

  await fs.mkdir(getWallpaperThumbnailDirectory(), { recursive: true })

  const image = nativeImage.createFromPath(filePath)
  if (image.isEmpty()) {
    throw new Error('无法读取本地壁纸预览')
  }

  const { width, height } = image.getSize()
  const maxWidth = 640
  const maxHeight = 400
  const resizeRatio = Math.min(maxWidth / Math.max(width, 1), maxHeight / Math.max(height, 1), 1)
  const resized =
    resizeRatio < 1
      ? image.resize({
          width: Math.max(1, Math.round(width * resizeRatio)),
          height: Math.max(1, Math.round(height * resizeRatio)),
          quality: 'good',
        })
      : image

  await fs.writeFile(thumbnailPath, resized.toJPEG(82))
  return thumbnailPath
}

async function listLocalWallpapers() {
  const wallpaperDirectory = getWallpaperRootPath()
  await fs.mkdir(wallpaperDirectory, { recursive: true })

  const entries = await fs.readdir(wallpaperDirectory, { withFileTypes: true })
  const files = entries.filter((entry) => entry.isFile() && isSupportedLocalWallpaperFile(entry.name))

  const wallpapers = await Promise.all(
    files.map(async (entry) => {
      const filePath = path.join(wallpaperDirectory, entry.name)
      const stat = await fs.stat(filePath)
      const thumbnailPath = getLocalWallpaperThumbnailPath(filePath, stat.mtimeMs, stat.size)

      return {
        modifiedAt: stat.mtimeMs,
        path: filePath,
        size: stat.size,
        thumbnailPath: (await pathExists(thumbnailPath)) ? thumbnailPath : '',
      }
    }),
  )

  return wallpapers.sort((left, right) => right.modifiedAt - left.modifiedAt)
}

function sendVideoDownloadProgress(payload: Record<string, unknown>) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  mainWindow.webContents.send('video-download-progress', payload)
}

async function createLiveWallpaperWindow() {
  const videoPath = store.get('video-path') as string
  if (!videoPath) return

  if (process.platform === 'darwin') {
    // 创建 mac 端动态壁纸窗口
    createMacLiveWallpaper()
  } else if (process.platform === 'win32') {
    // 创建 win 端动态壁纸窗口
    // TODO 打开会导致 mac 端无法运行，在 win 端正常。
    // createWinLiveWallpaper()
  }
}

// 关闭动态壁纸窗口
function closeLiveWallpaperWindow() {
  // 清除 store 中的 video-path
  store.delete('video-path')
  if (process.platform === 'darwin') {
    closeLiveWallpaper()
  } else if (process.platform === 'win32') {
    // closeWinLiveWallpaper()
  }
}

// 创建网页壁纸窗口
function createWebLiveWallpaperWindow() {
  const webPath = store.get('web-path') as string
  if (!webPath) return

  // 如果有视频壁纸，先关闭
  closeLiveWallpaperWindow()

  if (process.platform === 'darwin') {
    createWebLiveWallpaper(webPath)
  }
}

// 关闭网页壁纸窗口
function closeWebLiveWallpaperWindow() {
  store.delete('web-path')
  if (process.platform === 'darwin') {
    closeWebLiveWallpaper()
  }
}

// 设置自动启动
function setAutoLaunch(val: boolean) {
  app.setLoginItemSettings({
    openAtLogin: val,
    openAsHidden: true,
    path: app.getPath('exe'),
    args: ['--processStart', `"${app.getPath('exe')}"`],
  })
}

// ============================ app ============================

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.on('ready', () => {
  initApp()
})

// 所有窗口关闭时退出应用.
app.on('window-all-closed', () => {
  console.log('window-all-closed', process.platform)
  if (process.platform !== 'darwin') {
    // app.quit()
  }
})

// 当应用程序激活时,在 macOS 上,当单击 dock 图标并且没有其他窗口打开时,通常在应用程序中重新创建一个窗口
app.on('activate', () => {
  console.log('activate')
  if (mainWindow === null) {
    createWindow()
  } else {
    mainWindow.show()
  }
})

// ============================ 事件 ============================

// 设置网络代理
ipcMain.on('set-proxy', (_, arg) => {
  if (arg) {
    setProxy(mainWindow, arg)
  } else {
    removeProxy(mainWindow)
  }
})

// 设置自动启动
ipcMain.on('set-auto-launch', (_, arg) => {
  setAutoLaunch(arg)
})

// 设置图片壁纸
ipcMain.handle('set-wallpaper', async (_, arg) => {
  try {
    await setWallPaper(arg)
    return { success: true }
  } catch (error) {
    console.error('Failed to set wallpaper:', error)
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
})

ipcMain.handle('generate-ai-wallpaper', async (_, arg) => {
  try {
    const result = await generateAiWallpaper(getAiConfig(), arg)
    return {
      success: true,
      ...result,
    }
  } catch (error) {
    console.error('Failed to generate AI wallpaper:', error)
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
})

ipcMain.handle('show-item-in-folder', async (_, arg) => {
  try {
    shell.showItemInFolder(arg)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
})

ipcMain.handle('list-local-wallpapers', async () => {
  try {
    return {
      success: true,
      items: await listLocalWallpapers(),
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
})

ipcMain.handle('get-local-wallpaper-thumbnail', async (_, arg) => {
  try {
    if (typeof arg !== 'string' || !arg.trim()) {
      throw new Error('壁纸路径无效')
    }

    return {
      success: true,
      path: await ensureLocalWallpaperThumbnail(arg),
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
})

ipcMain.handle('download-video-wallpaper', async (_, arg) => {
  if (activeVideoDownload) {
    return {
      success: false,
      message: '已有视频正在下载，请等待当前任务完成',
    }
  }

  try {
    sendVideoDownloadProgress({
      line: '正在启动 yt-dlp 下载器',
      percent: 0,
      phase: 'prepare',
    })

    const controller = await startVideoDownload(
      {
        proxy: getProxyPath(),
        url: typeof arg?.url === 'string' ? arg.url : '',
      },
      (progress) => {
        sendVideoDownloadProgress(progress)
      },
    )

    activeVideoDownload = controller.child
    const result = await controller.result

    return {
      success: true,
      ...result,
    }
  } catch (error) {
    const message = getErrorMessage(error)
    sendVideoDownloadProgress({
      line: message,
      phase: 'error',
    })

    return {
      success: false,
      message,
    }
  } finally {
    activeVideoDownload = null
  }
})

// 在默认浏览器中打开 a 标签
ipcMain.on('open-link-in-browser', (_, arg) => {
  shell.openExternal(arg)
})

// 创建动态壁纸
ipcMain.on('create-live-wallpaper', (_, arg) => {
  closeWebLiveWallpaperWindow() // 确保网页壁纸关闭
  createLiveWallpaperWindow()
})

// 关闭动态壁纸
ipcMain.on('close-live-wallpaper', (_, arg) => {
  closeLiveWallpaperWindow()
})

// 创建网页壁纸
ipcMain.on('create-web-live-wallpaper', (_, arg) => {
  store.set('web-path', arg)
  createWebLiveWallpaperWindow()
})

// 关闭网页壁纸
ipcMain.on('close-web-live-wallpaper', (_, arg) => {
  closeWebLiveWallpaperWindow()
})

// ============================ 窗口 ============================

// 刷新主窗口
ipcMain.on('refresh-window', () => {
  mainWindow.webContents.reload()
})

// 打开窗口调试
ipcMain.on('open-devtools', () => {
  mainWindow.webContents.toggleDevTools()
})

// 最小化窗口
ipcMain.on('minimize-window', () => {
  mainWindow.minimize()
})

// 最大化窗口
ipcMain.on('maximize-window', () => {
  mainWindow.maximize()
})

// 关闭窗口
ipcMain.on('close-window', () => {
  mainWindow.close()
})

// 恢复窗口
ipcMain.on('unmaximize-window', () => {
  mainWindow.unmaximize()
})

// 隐藏窗口
ipcMain.on('hide-window', () => {
  mainWindow.hide()
})

// 显示窗口
ipcMain.on('show-window', () => {
  mainWindow.show()
})

// ============================ 通知 ============================

// 消息通知
ipcMain.on('asynchronous-message', (event, arg) => {
  console.log(arg)
  event.reply('asynchronous-reply', 'pong')
  new Notification({
    title: '提示',
    body: arg,
  }).show()
})
