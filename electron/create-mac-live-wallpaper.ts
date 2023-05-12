import { app, BrowserWindow, screen, ipcMain } from 'electron'

let wallWindow: BrowserWindow[] = []
// 创建窗口
export function createMacLiveWallpaper() {
  if (wallWindow.length > 0) {
    return
  }
  const displays = screen.getAllDisplays()
  displays.forEach(async (display, index) => {
    wallWindow.push(
      new BrowserWindow({
        show: false, // 是否显示窗口
        type: 'desktop', // 设置窗口类型为桌面窗口
        focusable: false, // 窗口是否可以获取焦点
        frame: false, // 是否显示边缘框
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
        // fullscreen: true, // TODO 是否全屏显示, 会导致窗口无法显示
        webPreferences: {
          nodeIntegration: true, // 赋予此窗口页面中的JavaScript访问Node.js环境的能力
          webSecurity: true, // 可以使用本地资源
          contextIsolation: false, // 是否使用上下文隔离
        },
      }),
    )
    // console.log('🚀🚀🚀 / display', display, wallWindow)
    // 加载页面
    await wallWindow[index].loadURL('http://localhost:1234/wallpaper')
    // 窗口最大化
    wallWindow[index].maximize()
    // // 窗口显示
    wallWindow[index].show()
    // 窗口忽略所有鼠标事件
    wallWindow[index].setIgnoreMouseEvents(true)

    // ===================================
    // 设置视频背后的颜色
    // await (await requireWallpaper()).setSolidColorWallpaper('000000')
    // 打开开发者工具
    // wallWindow[index].webContents.openDevTools()
  })
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
  screen.on('display-added', (event, display) => {
    console.log('display-added')
  })
  screen.on('display-removed', (event, display) => {
    console.log('display-removed')
  })
  screen.on('display-metrics-changed', (event, display, changedMetrics) => {
    console.log('display-metrics-changed')
  })
})

// 更换动态壁纸
ipcMain.on('change-live-wallpaper', (event, arg) => {
  console.log('change-live-wallpaper', arg)
  // 给窗口发送消息
  wallWindow.forEach((window) => {
    window.webContents.send('change-live-wallpaper', arg)
  })
  // ipcMain.emit('change-live-wallpaper', arg)
  // // 关闭窗口
  // closeLiveWallpaper()
  // // 创建窗口
  // createLiveWallpaper()
})
