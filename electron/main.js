'use strict';

var electron = require('electron');
var path = require('path');
var os = require('os');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path);

let tray;
// 创建原生图像
function createNativeImage(path) {
    return electron.nativeImage.createFromPath(path).resize({ width: 30, height: 28 });
}
const icons = [
    createNativeImage(path__namespace.join(__dirname, '../public/icons/runcat/0.png')),
    createNativeImage(path__namespace.join(__dirname, '../public/icons/runcat/1.png')),
    createNativeImage(path__namespace.join(__dirname, '../public/icons/runcat/2.png')),
    createNativeImage(path__namespace.join(__dirname, '../public/icons/runcat/3.png')),
    createNativeImage(path__namespace.join(__dirname, '../public/icons/runcat/4.png')),
    // createNativeImage(path.join(__dirname, '../public/icons/mario/0.png')),
    // createNativeImage(path.join(__dirname, '../public/icons/mario/1.png')),
    // createNativeImage(path.join(__dirname, '../public/icons/mario/2.png')),
];
// 图表索引
let index = 0;
// 间隔时间阶梯 ms
let intervals = [10, 20, 30, 40, 50, 60, 70, 100, 120, 150];
// 替换的间隔时间
let intervalIndex = 9;
// 设置托盘图标
function setTrayIcon() {
    tray = new electron.Tray(icons[0]);
    dynamicTrayIcon(intervalIndex);
}
// 动态替换托盘图标
function dynamicTrayIcon(intervalIndex) {
    // 替换托盘图标
    tray.setImage(icons[index]);
    index = (index + 1) % icons.length;
    // 节流
    intervalIndex = cpuUsage();
    // console.log('🚀🚀🚀 / percentage', intervalIndex)
    // tray.setTitle(intervalIndex.toString())
    setTimeout(() => dynamicTrayIcon(intervalIndex), intervals[intervalIndex]);
    // setTimeout(() => dynamicTrayIcon(intervalIndex), intervals[5])
}
// 获取系统 cpu 信息
function cpuUsage() {
    getCPUUsage((percentage) => {
        intervalIndex = Number((percentage * 10).toFixed(0));
        // console.log(` - CPU使用占比：${Number(percentage * 100).toFixed(2)}%`)
    }, true);
    return intervalIndex;
}
//这里获取的是CPU总信息
function getCPUInfo() {
    let cpus = os.cpus();
    let user = 0;
    let nice = 0;
    let sys = 0;
    let idle = 0;
    let irq = 0;
    let total = 0;
    for (let cpu in cpus) {
        user += cpus[cpu].times.user;
        nice += cpus[cpu].times.nice;
        sys += cpus[cpu].times.sys;
        irq += cpus[cpu].times.irq;
        idle += cpus[cpu].times.idle;
    }
    total = user + nice + sys + idle + irq;
    // 空闲 cpu，总 cpu
    return { idle, total };
}
// 获取CPU使用率，由于cpu是变化的，这里用一秒的时间隔来计算。得到时间差来反映CPU的延迟，侧面反映了CPU的使用率。
function getCPUUsage(callback, free) {
    let stats1 = getCPUInfo();
    let startIdle = stats1.idle;
    let startTotal = stats1.total;
    setTimeout(() => {
        let stats2 = getCPUInfo();
        let endIdle = stats2.idle;
        let endTotal = stats2.total;
        let idle = endIdle - startIdle;
        let total = endTotal - startTotal;
        let perc = idle / total;
        if (free === true)
            callback(perc);
        else
            callback(1 - perc);
    }, 1000);
}

// 关闭electron警告
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
// 保持window对象的全局引用,避免JavaScript对象被垃圾回收时,窗口被自动关闭.
let mainWindow;
// 创建窗口
const createWindow = () => {
    // 创建窗口
    mainWindow = new electron.BrowserWindow({
        width: 1500,
        height: 900,
        frame: false,
        fullscreen: false,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            contextIsolation: false,
            allowRunningInsecureContent: true,
            webviewTag: true,
            spellcheck: false,
            disableHtmlFullscreenWindowResize: true, //禁用 HTML 全屏窗口调整大小
        },
    });
    // 打开窗口调试,默认为 undocked 悬浮窗口
    mainWindow.webContents.openDevTools({ mode: 'right' });
    mainWindow.loadURL(process.argv[2]);
    // 隐藏菜单栏
    electron.Menu.setApplicationMenu(null);
    // 设置托盘图标
    setTrayIcon();
};
// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
electron.app.on('ready', () => {
    createWindow();
});
// app.whenReady().then(() => {
//   createWindow();
// });
// 所有窗口关闭时退出应用.
electron.app.on('window-all-closed', () => {
    console.log('window-all-closed', process.platform);
    electron.app.quit();
    // if (process.platform === "darwin") {}
});
// 当应用程序激活时,在 macOS 上,当单击 dock 图标并且没有其他窗口打开时,通常在应用程序中重新创建一个窗口
electron.app.on('activate', () => {
    console.log('activate');
    if (mainWindow === null) {
        createWindow();
    }
});
// 在默认浏览器中打开 a 标签
electron.ipcMain.on('open-link-in-browser', (event, arg) => {
    console.log('🚀🚀🚀 / event, arg', event, arg);
    // shell.openExternal(arg)
});
// 打开窗口调试
electron.ipcMain.on('open-devtools', () => {
    mainWindow.webContents.toggleDevTools();
});
// 刷新当前页面
electron.ipcMain.on('refresh-window', () => {
    mainWindow.webContents.reload();
});
electron.ipcMain.on('asynchronous-message', (event, arg) => {
    console.log(arg);
    event.reply('asynchronous-reply', 'pong');
    new electron.Notification({
        title: '提示',
        body: '替换成功！',
    }).show();
});
//# sourceMappingURL=main.js.map
