import { BrowserWindow, screen } from 'electron'

let webWallWindow: BrowserWindow[] = []

// 创建网页壁纸窗口
export async function createWebLiveWallpaper(url: string) {
  if (webWallWindow.length > 0) {
    await Promise.all(webWallWindow.map((window) => window.loadURL(url)))
    return
  }
  const displays = screen.getAllDisplays()
  try {
    await Promise.all(
      displays.map(async (display) => {
        const { bounds } = display
        const { width, height, x, y } = bounds
        const window = new BrowserWindow({
          show: false,
          type: 'desktop',
          focusable: false,
          frame: false,
          x,
          y,
          width,
          height,
          webPreferences: {
            nodeIntegration: false,
            webSecurity: true,
            contextIsolation: true,
          },
          hasShadow: false,
          transparent: true,
          enableLargerThanScreen: true,
          roundedCorners: false,
        })
        webWallWindow.push(window)

        await window.loadURL(url)
        window.show()
        window.setIgnoreMouseEvents(true)
      }),
    )
  } catch (error) {
    closeWebLiveWallpaper()
    throw error
  }
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
