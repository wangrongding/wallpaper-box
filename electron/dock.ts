import { app } from 'electron'
import path from 'path'

// 设置 dock 图标
export const setDockIcon = () => {
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, '../public/logo.png'))
  }
}

// 初始化 dock
export const initDock = () => {
  setDockIcon()
}
