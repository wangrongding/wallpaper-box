# 记录

## 安装 electron 失败的解决方案

```sh
pnpm add electron -D
```

一些时候会得到以下错误，主要是该死的 GFW 导致的。

![](https://assets.fedtop.com/picbed/202212261135630.png)

解决方案：使用淘宝镜像

```sh
npm config set registry https://registry.npmmirror.com
npm config set electron_mirror https://cdn.npmmirror.com/binaries/electron/
npm config set electron_builder_binaries_mirror https://npmmirror.com/mirrors/electron-builder-binaries/
```

或者直接使用下面的命令，通过 vim 修改配置文件

```sh
npm config edit
```

在空白处将下面几个配置添加上去,注意如果有原有的这几项配置，就修改

```sh
registry=https://registry.npmmirror.com
electron_mirror=https://cdn.npmmirror.com/binaries/electron/
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/
```

修改完成后，再次执行安装命令

![](https://assets.fedtop.com/picbed/202212261144037.png)

可以看到就成功了。

> https://www.cnblogs.com/makalochen/p/16154510.html  
> https://www.electronjs.org/zh/docs/latest/tutorial/installation

## 关于如何动态壁纸

> https://www.zhihu.com/question/381784377/answer/1099438784

### Windows 中

我们可以通过 Electron 借助 C 的能力，调用 win32 api 来实现动态壁纸。

所以我们可以通过 FFI (语言交互接口,Foreign Function Interface)来实现。

这里我们使用 `win-win-api` 或 `win32-ffi` 来实现。

其中你可能会遇到 node-gyp 的问题

- [解决方法](https://stackoverflow.com/questions/33896511/npm-install-fails-with-node-gyp)
- [node-gyp](https://github.com/nodejs/node-gyp)

```typescript
// import { WinWin, ffi, CPP, L, NULL } from 'win-win-api'
import { BrowserWindow } from 'electron'
import { WinWin, ffi, CPP, L, NULL, Win32ffi } from 'win32-ffi'

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
```

然后在需要的窗口中直接调用即可

```typescript
import { setUnderLayer } from './setUnderLayer'
import { app, BrowserWindow, screen } from 'electron'

let wallWindow: BrowserWindow[] = []
// 创建窗口
export function createWallPaper() {
  const displays = screen.getAllDisplays()
  displays.forEach((display, index) => {
    wallWindow.push(
      new BrowserWindow({
        x: 0,
        y: 0,
        focusable: false, //禁止窗口获取焦点
        frame: false, //是否显示边框
        fullscreen: true, //是否全屏显示
      }),
    )
    wallWindow[index].loadURL(`http://localhost:8000/wallPaper`)
    wallWindow[index].setIgnoreMouseEvents(true)
    // 窗口设置在壁纸上层
    setUnderLayer(wallWindow[index])
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
```
