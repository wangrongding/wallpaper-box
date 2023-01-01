// 初始化全局键盘事件
import { app, BrowserWindow, Notification, Menu, ipcMain, Tray, shell, globalShortcut } from 'electron'
export const initKeyboard = (mainWindow: BrowserWindow) => {
  // 注册快捷键
  // 打开调试
  // globalShortcut.register('CommandOrControl+Shift+I', () => {
  //   mainWindow.webContents.toggleDevTools()
  // })
  // // 刷新
  // globalShortcut.register('CommandOrControl+Shift+R', () => {
  //   mainWindow.reload()
  // })
  // // 退出
  // globalShortcut.register('CommandOrControl+Shift+Q', () => {
  //   app.quit()
  // })
  // 最小化
  // globalShortcut.register('CommandOrControl+W', () => {
  //   mainWindow.hide()
  // })
}
