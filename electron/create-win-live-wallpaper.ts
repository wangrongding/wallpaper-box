import { app, BrowserWindow, screen, ipcMain } from 'electron'
// import { WinWin, ffi, CPP, L, NULL } from 'win-win-api'
import { WinWin, ffi, CPP, L, NULL, Win32ffi } from 'win32-ffi'
import os from 'os'

let wallWindow: BrowserWindow[] = []
// 创建窗口
export function createWinLiveWallpaper() {
  const displays = screen.getAllDisplays()
  displays.forEach((display, index) => {
    wallWindow.push(
      new BrowserWindow({
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
        frame: false, // 是否显示窗口边框
        focusable: false, //禁止窗口获取焦点
        fullscreen: true, //是否全屏显示
        webPreferences: {
          nodeIntegration: true, //赋予此窗口页面中的JavaScript访问Node.js环境的能力
          webSecurity: true, //可以使用本地资源
          contextIsolation: false, //是否使用上下文隔离
        },
      }),
    )
    wallWindow[index].loadURL('http://localhost:1234/wallpaper')
    wallWindow[index].setIgnoreMouseEvents(true)
    // 窗口设置在壁纸上层
    setUnderLayer(wallWindow[index])
  })
  // setUnderLayer(wallWindow[wallWindow.length - 1]);
}

// 关闭窗口
export function closeWinLiveWallpaper() {
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

// 初始化壁纸窗口
export function setUnderLayer(wallPaperWindow: BrowserWindow) {
  const winFns = new WinWin().winFns()
  //壁纸句柄
  let wallPaperHwnd = null
  //寻找底层窗体句柄
  let Progman = winFns.FindWindowW(L('Progman'), NULL)
  //使用 0x3e8 命令分割出两个 WorkerW
  winFns.SendMessageTimeoutW(Progman, 0x052c, 0, 0, 0, 0x3e8, L('ok'))
  //创建回调函数
  const createEnumWindowProc = () =>
    ffi.Callback(CPP.BOOL, [CPP.HWND, CPP.LPARAM], (tophandle: any) => {
      //寻找桌面句柄
      let defview = winFns.FindWindowExW(tophandle, 0, L('SHELLDLL_DefView'), NULL)
      // 如果找到桌面句柄再找壁纸句柄
      if (defview != NULL) {
        wallPaperHwnd = winFns.FindWindowExW(0, tophandle, L('WorkerW'), NULL)
      }
      return true
    })
  //遍历窗体获得窗口句柄
  winFns.EnumWindows(createEnumWindowProc(), 0)
  //获取electron的句柄
  const electronAppHwnd = bufferCastInt32(wallPaperWindow.getNativeWindowHandle())
  //将buffer类型的句柄进行转换
  function bufferCastInt32(buf: Buffer) {
    return os.endianness() == 'LE' ? buf.readInt32LE() : buf.readInt32BE()
  }
  //将electron窗口设置在壁纸上层
  winFns.SetParent(electronAppHwnd, wallPaperHwnd)
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
