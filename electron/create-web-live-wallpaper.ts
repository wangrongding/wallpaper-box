import { BrowserWindow, screen } from 'electron'

let webWallWindow: BrowserWindow[] = []

// 创建网页壁纸窗口
export function createWebLiveWallpaper(url: string) {
  if (webWallWindow.length > 0) {
    webWallWindow.forEach((window) => {
      console.log('🌸🌸🌸 / url: ', url)
      window.loadURL(url)
    })
    return
  }
  const displays = screen.getAllDisplays()
  displays.forEach(async (display, index) => {
    const { bounds } = display
    const { width, height, x, y } = bounds
    webWallWindow.push(
      new BrowserWindow({
        show: false,
        type: 'desktop',
        focusable: false,
        frame: false,
        x,
        y,
        width,
        height,
        webPreferences: {
          nodeIntegration: true,
          webSecurity: false,
          contextIsolation: false,
        },
        hasShadow: false,
        transparent: true,
        enableLargerThanScreen: true,
        roundedCorners: false,
      }),
    )
    
    try {
      await webWallWindow[index].loadURL(url)
      webWallWindow[index].show()
      webWallWindow[index].setIgnoreMouseEvents(true)
    } catch (error) {
      console.error('Failed to load URL:', url, error)
    }
  })
}

// 关闭网页壁纸窗口
export function closeWebLiveWallpaper() {
  webWallWindow.forEach((window) => {
    if (!window.isDestroyed()) {
      window.close()
    }
  })
  webWallWindow = []
}
