import { protocol, app, BrowserWindow, Notification, ipcMain, shell, globalShortcut } from 'electron'
import { setTrayIcon } from './tray'
import { initMenu } from './menu'
import { initKeyboard } from './keyboard'
import { initDock } from './dock'
import { setProxy, removeProxy } from './proxy'
import { createMacLiveWallpaper, closeLiveWallpaper } from './create-mac-live-wallpaper'
import { createWebLiveWallpaper, closeWebLiveWallpaper } from './create-web-live-wallpaper'
import path from 'path'
import Store from 'electron-store'
import fs from 'fs/promises'
import os from 'os'
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'


const ffmpeg = createFFmpeg({
  log: false,
  // 删掉 corePath 这行！就是这一行害的你
})

let ffmpegLoaded = false

async function loadFFmpegOnce() {
  if (!ffmpegLoaded) {
    await ffmpeg.load()  // 它会自动用内置的 ffmpeg-core.js（已打包进 node_modules）
    ffmpegLoaded = true
  }
}

async function getVideoFrame(videoPath: string): Promise<string> {
  await loadFFmpegOnce()

  const inputName = 'input.mp4'
  const outputName = 'frame.png'

  ffmpeg.FS('writeFile', inputName, await fetchFile(videoPath))
  await ffmpeg.run('-i', inputName, '-ss', '00:00:08', '-vframes', '1', '-q:v', '2', outputName)

  const data = ffmpeg.FS('readFile', outputName)
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wallpaper-'))
  const framePath = path.join(tempDir, outputName)

  await fs.writeFile(framePath, data)  // 0.11 版本直接就是 Buffer，完美兼容

  // 清理内存
  try {
    ffmpeg.FS('unlink', inputName)
    ffmpeg.FS('unlink', outputName)
  } catch {}

  return framePath
}

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
  proxyPath && setProxy(mainWindow, proxyPath)
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
    width: 1300,
    height: 900,
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
    mainWindow.loadURL(process.argv[2] || 'http://localhost:1234')
    mainWindow.webContents.openDevTools({ mode: 'right' })
  } else {
    // mainWindow.loadFile(...fileRoute)
    mainWindow.loadFile(path.join(__dirname, '../dist-web/index.html'))
  }
}

async function setWallPaper(picturePath: string) {
  const wallpaper = await import('wallpaper')
  await wallpaper.setWallpaper(picturePath, { scale: 'auto',screen: 'all' })
  // await wallpaper.setSolidColorWallpaper('000000')
}

// ===== 只替换你原来的 createLiveWallpaperWindow 函数，完整替换成下面这个 =====
async function createLiveWallpaperWindow() {
  const videoPath = store.get('video-path') as string
  if (!videoPath) return

  let tempFramePath = ''

  try {
    tempFramePath = await getVideoFrame(videoPath)
    await setWallPaper(tempFramePath)
    console.log('视频帧壁纸设置成功')
  } catch (error) {
    console.error('Failed to set wallpaper from video frame:', error)
  }

  // 10秒后自动删除临时图片，防止壁纸还没生效就被删掉
  if (tempFramePath) {
    setTimeout(() => {
      fs.unlink(tempFramePath)
      fs.rmdir(path.dirname(tempFramePath))
    }, 10000)
  }

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
ipcMain.on('set-wallpaper', (_, arg) => {
  setWallPaper(arg)
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
