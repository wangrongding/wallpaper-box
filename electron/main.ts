import { protocol, app, BrowserWindow, Notification, ipcMain, shell, globalShortcut } from 'electron'
import { setTrayIcon } from './tray'
import { initMenu } from './menu'
import { initKeyboard } from './keyboard'
import { initDock } from './dock'
import { setProxy, removeProxy } from './proxy'
import { createMacLiveWallpaper, closeLiveWallpaper } from './create-mac-live-wallpaper'
import path from 'path'
import Store from 'electron-store'

Store.initRenderer()
const store = new Store()
const videoPath = store.get('video-path')
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
  setProxy(mainWindow)
  // 创建动态壁纸
  videoPath && createLiveWallpaperWindow()
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
  // const picList = [
  //   'wallhaven-2ye18x.jpg',
  //   'wallhaven-1k6y7g.jpg',
  //   'wallhaven-7p39gy.png',
  //   'wallhaven-e7kpl8.png',
  //   'wallhaven-e756dr.jpg',
  //   'wallhaven-k7m65d.png',
  //   'wallhaven-g7elo3.jpg',
  //   'wallhaven-28m319.jpg',
  //   'wallhaven-kx9pg7.jpg',
  //   'wallhaven-rd83mq.jpg',
  // ]
  // const picturePath = path.join(dir, picList[Math.floor(Math.random() * picList.length)])
  // const dir = path.join(os.homedir(), '/wallpaper-box')
  // const picturePath = path.join(dir, fileName)
  const wallpaper = await import('wallpaper')
  await wallpaper.setWallpaper(picturePath, { scale: 'auto' })
  // await wallpaper.setSolidColorWallpaper('000000')
}

// 创建动态壁纸窗口
function createLiveWallpaperWindow() {
  if (process.platform === 'darwin') {
    createMacLiveWallpaper()
  } else if (process.platform === 'win32') {
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

// 设置自动启动
ipcMain.on('set-auto-launch', (_, arg) => {
  setAutoLaunch(arg)
})

// 关闭动态壁纸
ipcMain.on('set-wallpaper', (_, arg) => {
  setWallPaper(arg)
})

// 在默认浏览器中打开 a 标签
ipcMain.on('open-link-in-browser', (_, arg) => {
  shell.openExternal(arg)
})

// 创建动态壁纸
ipcMain.on('create-live-wallpaper', (_, arg) => {
  createLiveWallpaperWindow()
})

// 关闭动态壁纸
ipcMain.on('close-live-wallpaper', (_, arg) => {
  closeLiveWallpaperWindow()
})

// 设置代理
ipcMain.on('set_proxy', (event, arg) => {
  console.log(arg)
  var { http_proxy } = arg
  mainWindow.webContents.session.setProxy({
    proxyRules: http_proxy,
    proxyBypassRules: 'localhost',
  })
})

// 移除代理
ipcMain.on('remove_proxy', (event, arg) => {
  mainWindow.webContents.session.setProxy({})
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
