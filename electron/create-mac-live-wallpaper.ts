import { getDevServerUrl } from './dev-server'
import { app, BrowserWindow, screen } from 'electron'
import path from 'path'

// 是否为开发环境
const isDev = process.env.IS_DEV === 'true'
let wallWindow: BrowserWindow[] = []
// 创建窗口
export async function createMacLiveWallpaper() {
  if (wallWindow.length > 0) {
    // 给窗口发送消息
    wallWindow.forEach((window) => {
      window.webContents.send('change-live-wallpaper')
    })
    return
  }
  const displays = screen.getAllDisplays()
  try {
    await Promise.all(
      displays.map(async (display) => {
        const { bounds } = display
        const { width, height, x, y } = bounds
        const window = new BrowserWindow({
          show: false, // 是否显示窗口
          type: 'desktop', // 设置窗口类型为桌面窗口
          focusable: false, // 窗口是否可以获取焦点
          frame: false, // 是否显示边缘框
          x, // 窗口的x坐标
          y,
          width: width,
          height: height,
          webPreferences: {
            nodeIntegration: true, // 赋予此窗口页面中的JavaScript访问Node.js环境的能力
            webSecurity: false, // 可以使用本地资源
            contextIsolation: false, // 是否使用上下文隔离
          },
          hasShadow: false,
          transparent: true,
          enableLargerThanScreen: true,
          roundedCorners: false, // MacOS Big Sur 版本后窗口默认有圆角
        })
        wallWindow.push(window)
        // 加载页面
        if (isDev) {
          await window.loadURL(`${getDevServerUrl()}/#/wallpaper`)
        } else {
          await window.loadURL(`file://${path.join(__dirname, '../dist-web/index.html')}#/wallpaper`)
        }
        // // 窗口显示
        window.show()
        // 窗口忽略所有鼠标事件
        window.setIgnoreMouseEvents(true)

        // ===================================
        // 设置视频背后的颜色
        // await (await requireWallpaper()).setSolidColorWallpaper('000000')
        // 打开开发者工具
      }),
    )
  } catch (error) {
    closeLiveWallpaper()
    throw error
  }
}

// 关闭窗口
export function closeLiveWallpaper() {
  wallWindow.forEach((window) => {
    window.close()
  })
  wallWindow = []
}

// 获取显示器的宽高
export function getDisplaySize() {
  const displays = screen.getAllDisplays()
  return displays.map((display) => {
    return {
      width: display.bounds.width,
      height: display.bounds.height,
    }
  })
}

app.on('ready', () => {
  screen.on('display-added', () => {
    console.log('display-added')
  })
  screen.on('display-removed', () => {
    console.log('display-removed')
  })
  screen.on('display-metrics-changed', () => {
    console.log('display-metrics-changed')
  })
})
