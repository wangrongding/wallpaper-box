import { app, BrowserWindow, Notification, Menu, ipcMain, Tray, shell, globalShortcut } from 'electron'

interface ProxyConfig {
  proxyRules?: string
  proxyBypassRules?: string
}

// 设置代理
export const setProxy = (mainWindow: BrowserWindow, proxyPath: string) => {
  // TODO pacScript string (optional) - 与 PAC 文件关联的 URL。
  // const proxy = 'http://localhost:7890' //表明要使用的代理规则
  const proxy = proxyPath //表明要使用的代理规则
  const proxyBypassRules = 'localhost' //表明哪些 url 应绕过代理设置的规则。
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
