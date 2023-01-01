import { app, BrowserWindow, Notification, Menu, ipcMain, Tray, shell, globalShortcut } from 'electron'
// 设置代理
export const setProxy = (mainWindow: BrowserWindow, proxyUrl?: string) => {
  const proxy = 'http://localhost:7890'
  const proxyBypassRules = 'localhost'
  mainWindow.webContents.session.setProxy({
    proxyRules: proxy,
    proxyBypassRules: proxyBypassRules,
  })
}

// 移除代理
export const removeProxy = (mainWindow: BrowserWindow) => {
  mainWindow.webContents.session.setProxy({})
  // mainWindow.webContents.session.setProxy({
  //   proxyRules: '',
  //   proxyBypassRules: '',
  // })
}
