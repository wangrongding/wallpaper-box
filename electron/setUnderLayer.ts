// import { WinWin, ffi, CPP, L, NULL } from 'win-win-api'
import { WinWin, ffi, CPP, L, NULL, Win32ffi } from 'win32-ffi'

import { BrowserWindow } from 'electron'
const winFns = new WinWin().winFns()
const os = require('os')

// 初始化壁纸窗口
export function setUnderLayer(wallPaperWindow: BrowserWindow) {
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
