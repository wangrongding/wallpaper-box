import { app } from 'electron'

// 设置 dock 图标
export const setDockIcon = () => {
  if (process.platform === 'darwin') {
    app.dock.setIcon('./public/logo.png')
  }
}

// 初始化 dock
export const initDock = () => {
  setDockIcon()
}
