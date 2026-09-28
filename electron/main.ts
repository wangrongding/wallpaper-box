import { generateAiWallpaper } from './ai-wallpaper'
import { createMacLiveWallpaper, closeLiveWallpaper } from './create-mac-live-wallpaper'
import { createWebLiveWallpaper, closeWebLiveWallpaper } from './create-web-live-wallpaper'
import { getDevServerUrl } from './dev-server'
import { initDock } from './dock'
import { initKeyboard } from './keyboard'
import { initMenu } from './menu'
import {
  applyOmarchyWallpaper,
  killOmarchyWallpaper,
  setOmarchyWallpaperExitHandler,
  stopOmarchyWallpaper,
  supportsOmarchyWallpaper,
  validateDynamicSource,
} from './omarchy-wallpaper'
import type { DynamicWallpaperKind } from './omarchy-wallpaper'
import { floatWindowOnOmarchy } from './omarchy-window'
import { getWallpaperRootPath, getWallpaperThumbnailDirectory, getWallpaperVideoDirectory } from './paths'
import { setProxy, removeProxy } from './proxy'
import { getTrayIconState, refreshTrayIconLibrary, setActiveTrayIcon, setTrayIcon } from './tray'
import { deleteCustomTrayIconSet, importTrayIconSet, importTrayIconSetFromDataUrls, renameCustomTrayIconSet } from './tray-list'
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
const proxyPath = store.get('proxy-path') as string
// 是否为开发环境
const isDev = process.env.IS_DEV === 'true'
// 关闭electron警告
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
// 保持window对象的全局引用,避免JavaScript对象被垃圾回收时,窗口被自动关闭.
let mainWindow: BrowserWindow
let activeVideoDownload: ChildProcess | null = null
let wallpaperOperation: Promise<unknown> = Promise.resolve()
setOmarchyWallpaperExitHandler(() => {
  store.delete('video-path')
  store.delete('web-path')
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('dynamic-wallpaper-stopped', { reason: 'renderer-exited' })
  }
})
const supportedLocalWallpaperExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp'])

type TrayIconSpriteFramePayload = {
  dataUrl: string
  fileName?: string
}

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
  void enqueueWallpaperOperation(async () => {
    const savedVideo = store.get('video-path') as string | undefined
    const savedWeb = store.get('web-path') as string | undefined
    if (!savedVideo && !savedWeb) return
    try {
      await applyDynamicWallpaper(savedVideo ? 'video' : 'web', (savedVideo || savedWeb) as string)
    } catch (error) {
      console.error('Failed to restore dynamic wallpaper:', error)
      store.delete('video-path')
      store.delete('web-path')
    }
  })
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
  const windowWidth = isDev ? 1600 : 1300
  const windowHeight = 900
  // 创建窗口
  mainWindow = new BrowserWindow({
    width: windowWidth,
    minWidth: 950,
    height: windowHeight,
    minHeight: 600,
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

  void floatWindowOnOmarchy(mainWindow, windowWidth, windowHeight)

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

  if (process.platform === 'linux') {
    const osRelease = await fs.readFile('/etc/os-release', 'utf8').catch(() => '')
    if (/^ID="?omarchy"?$/m.test(osRelease)) {
      await execFile('omarchy', ['theme', 'bg', 'set', resolvedPath])

      const currentBackground = path.join(app.getPath('home'), '.local', 'state', 'omarchy', 'current', 'background')
      if ((await fs.realpath(currentBackground)) !== (await fs.realpath(resolvedPath))) {
        throw new Error('Omarchy 未更新当前壁纸')
      }
      return
    }
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

function enqueueWallpaperOperation<T>(operation: () => Promise<T>): Promise<T> {
  const result = wallpaperOperation.then(operation, operation)
  wallpaperOperation = result.catch(() => undefined)
  return result
}

async function applyDynamicWallpaper(kind: DynamicWallpaperKind, input: string) {
  const source = await validateDynamicSource(kind, input)
  if (process.platform === 'linux') {
    if (!(await supportsOmarchyWallpaper())) {
      throw new Error('当前 Linux 桌面暂不支持网页和视频壁纸；需要 Omarchy Wayland 环境')
    }
    await applyOmarchyWallpaper(kind, source)
  } else if (process.platform === 'darwin') {
    if (kind === 'video') {
      const previousVideo = store.get('video-path') as string | undefined
      store.set('video-path', source)
      try {
        await createMacLiveWallpaper()
      } catch (error) {
        if (previousVideo) store.set('video-path', previousVideo)
        else store.delete('video-path')
        throw error
      }
      closeWebLiveWallpaper()
    } else {
      await createWebLiveWallpaper(source)
      closeLiveWallpaper()
    }
  } else {
    throw new Error('当前系统暂不支持网页和视频壁纸')
  }
  store.set(kind === 'video' ? 'video-path' : 'web-path', source)
  store.delete(kind === 'video' ? 'web-path' : 'video-path')
}

async function stopDynamicWallpaper() {
  if (process.platform === 'linux') {
    await stopOmarchyWallpaper()
  } else if (process.platform === 'darwin') {
    closeLiveWallpaper()
    closeWebLiveWallpaper()
  }
  store.delete('video-path')
  store.delete('web-path')
}

function getSpriteFramesFromIpcPayload(value: unknown): TrayIconSpriteFramePayload[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>).dataUrl === 'string',
    )
    .map((item) => ({
      dataUrl: item.dataUrl as string,
      fileName: typeof item.fileName === 'string' ? item.fileName : undefined,
    }))
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

app.on('before-quit', () => {
  killOmarchyWallpaper()
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
    await enqueueWallpaperOperation(async () => {
      await setWallPaper(arg)
      await stopDynamicWallpaper()
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to set wallpaper:', error)
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
})

ipcMain.handle('apply-dynamic-wallpaper', async (_, arg: { kind?: DynamicWallpaperKind; source?: string }) => {
  try {
    if (arg?.kind !== 'video' && arg?.kind !== 'web') throw new Error('壁纸类型无效')
    await enqueueWallpaperOperation(() => applyDynamicWallpaper(arg.kind as DynamicWallpaperKind, arg.source as string))
    return { success: true }
  } catch (error) {
    return { success: false, message: getErrorMessage(error) }
  }
})

ipcMain.handle('stop-dynamic-wallpaper', async (_, kind?: DynamicWallpaperKind) => {
  try {
    await enqueueWallpaperOperation(async () => {
      if (kind === 'video' && !store.get('video-path')) return
      if (kind === 'web' && !store.get('web-path')) return
      await stopDynamicWallpaper()
    })
    return { success: true }
  } catch (error) {
    return { success: false, message: getErrorMessage(error) }
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

ipcMain.handle('open-local-wallpaper-directory', async () => {
  try {
    const targetPath = getWallpaperRootPath()
    await fs.mkdir(targetPath, { recursive: true })

    const result = await shell.openPath(targetPath)
    if (result) {
      throw new Error(result)
    }

    return {
      path: targetPath,
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
})

ipcMain.handle('open-video-wallpaper-directory', async () => {
  try {
    const targetPath = getWallpaperVideoDirectory()
    await fs.mkdir(targetPath, { recursive: true })

    const result = await shell.openPath(targetPath)
    if (result) {
      throw new Error(result)
    }

    return {
      path: targetPath,
      success: true,
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

ipcMain.handle('list-tray-icons', async () => {
  try {
    return {
      success: true,
      ...getTrayIconState(),
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
})

ipcMain.handle('set-tray-icon', async (_, arg) => {
  try {
    if (typeof arg !== 'string' || !arg.trim()) {
      throw new Error('动态图标 ID 无效')
    }

    return {
      currentId: setActiveTrayIcon(arg.trim()),
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
})

ipcMain.handle('import-tray-icon-set', async (_, arg) => {
  try {
    const importedTrayIcon = importTrayIconSet(
      typeof arg?.name === 'string' ? arg.name : '',
      Array.isArray(arg?.framePaths) ? arg.framePaths.filter((item: unknown): item is string => typeof item === 'string') : [],
    )

    return {
      currentId: refreshTrayIconLibrary(),
      item: importedTrayIcon,
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
})

ipcMain.handle('import-tray-icon-set-from-sprite', async (_, arg) => {
  try {
    const importedTrayIcon = importTrayIconSetFromDataUrls(
      typeof arg?.name === 'string' ? arg.name : '',
      getSpriteFramesFromIpcPayload(arg?.frames),
      {
        fps: arg?.metadata?.fps,
      },
    )

    return {
      currentId: refreshTrayIconLibrary(),
      item: importedTrayIcon,
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
})

ipcMain.handle('rename-tray-icon-set', async (_, arg) => {
  try {
    const targetId = typeof arg?.id === 'string' ? arg.id.trim() : ''
    const nextName = typeof arg?.name === 'string' ? arg.name.trim() : ''

    if (!targetId) {
      throw new Error('动态图标 ID 无效')
    }

    if (!nextName) {
      throw new Error('请输入新的动态图标名称')
    }

    const previousCurrentId = getTrayIconState().currentId || ''
    const renamedTrayIcon = renameCustomTrayIconSet(targetId, nextName)
    let currentId = refreshTrayIconLibrary()

    if (renamedTrayIcon && previousCurrentId === targetId) {
      currentId = setActiveTrayIcon(renamedTrayIcon.id)
    }

    return {
      currentId,
      item: renamedTrayIcon,
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
})

ipcMain.handle('delete-tray-icon-set', async (_, arg) => {
  try {
    if (typeof arg !== 'string' || !arg.trim()) {
      throw new Error('动态图标 ID 无效')
    }

    deleteCustomTrayIconSet(arg.trim())

    return {
      currentId: refreshTrayIconLibrary(),
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
})

ipcMain.handle('open-tray-icon-directory', async (_, arg) => {
  try {
    const trayIconState = getTrayIconState()
    const targetPath = arg === 'builtin' ? trayIconState.builtinDirectory : trayIconState.customDirectory

    await fs.mkdir(targetPath, { recursive: true })

    const result = await shell.openPath(targetPath)
    if (result) {
      throw new Error(result)
    }

    return {
      path: targetPath,
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
})

// 在默认浏览器中打开 a 标签
ipcMain.on('open-link-in-browser', (_, arg) => {
  shell.openExternal(arg)
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
