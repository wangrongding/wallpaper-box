import { getPublicAssetPath } from './paths'
import { app } from 'electron'
import fs from 'fs'

// 设置 dock 图标
export const setDockIcon = () => {
  if (process.platform === 'darwin') {
    const iconPath = getPublicAssetPath('logo.png')
    const dock = app.dock

    if (fs.existsSync(iconPath)) {
      dock?.setIcon(iconPath)
    } else {
      console.warn(`[dock] icon not found: ${iconPath}`)
    }
  }
}

// 初始化 dock
export const initDock = () => {
  setDockIcon()
}
