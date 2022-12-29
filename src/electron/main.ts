import { app, BrowserWindow, Notification, Menu, ipcMain, Tray, shell } from 'electron'
import { setTrayIcon, createNativeImage, icons, tray } from './tray'

// 关闭electron警告
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
// 保持window对象的全局引用,避免JavaScript对象被垃圾回收时,窗口被自动关闭.
let mainWindow: BrowserWindow

// 创建窗口
const createWindow = () => {
  // 创建窗口
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 900,
    frame: false, //是否显示边缘框
    fullscreen: false, //是否全屏显示
    webPreferences: {
      nodeIntegration: true, //赋予此窗口页面中的JavaScript访问Node.js环境的能力
      webSecurity: false, //禁用同源策略
      contextIsolation: false, //是否使用上下文隔离,在同一个 JavaScript 上下文中使用 Electron API
      allowRunningInsecureContent: true, //允许在 HTTPS 页面中运行 HTTP URL
      webviewTag: true, //是否允许在页面中使用 <webview> 标签
      spellcheck: false, //是否启用拼写检查
      disableHtmlFullscreenWindowResize: true, //禁用 HTML 全屏窗口调整大小
    },
  })

  // 打开窗口调试,默认为 undocked 悬浮窗口
  mainWindow.webContents.openDevTools({ mode: 'right' })
  mainWindow.loadURL(process.argv[2])
  // 隐藏菜单栏
  Menu.setApplicationMenu(null)
  // 设置托盘图标
  setTrayIcon()
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.on('ready', () => {
  createWindow()
})
// app.whenReady().then(() => {
//   createWindow();
// });

// 所有窗口关闭时退出应用.
app.on('window-all-closed', () => {
  console.log('window-all-closed', process.platform)
  app.quit()
  // if (process.platform === "darwin") {}
})

// 当应用程序激活时,在 macOS 上,当单击 dock 图标并且没有其他窗口打开时,通常在应用程序中重新创建一个窗口
app.on('activate', () => {
  console.log('activate')
  if (mainWindow === null) {
    createWindow()
  }
})

// 在默认浏览器中打开 a 标签
ipcMain.on('open-link-in-browser', (event, arg) => {
  console.log('🚀🚀🚀 / event, arg', event, arg)

  // shell.openExternal(arg)
})

// 打开窗口调试
ipcMain.on('open-devtools', () => {
  mainWindow.webContents.toggleDevTools()
})
// 刷新当前页面
ipcMain.on('refresh-window', () => {
  mainWindow.webContents.reload()
})

ipcMain.on('asynchronous-message', (event, arg) => {
  console.log(arg)
  event.reply('asynchronous-reply', 'pong')
  new Notification({
    title: '提示',
    body: '替换成功！',
  }).show()
})
