const { app, BrowserWindow } = require("electron");
const { ipcMain } = require("electron");
const { initWallPaperWindow } = require("./initWallPaperWindow.js");
// 保持window对象的全局引用,避免JavaScript对象被垃圾回收时,窗口被自动关闭.
let mainWindow = null;
let wallWindow = null;
// 创建窗口
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    // opacity: 0, //初始透明值
    // transparent: true, //窗口透明
    frame: false, //是否显示边缘框
    fullscreen: true, //是否全屏显示
    webPreferences: {
      nodeIntegration: true, //赋予此窗口页面中的JavaScript访问Node.js环境的能力
      enableRemoteModule: true, //打开remote模块
      webSecurity: false, //可以使用本地资源
    },
  });

  // mainWindow.loadURL("app://./index.html");
  // mainWindow.loadFile("index.html");
  mainWindow.loadURL("http://localhost:8000/wallPaper");
  // 初始化壁纸窗口
  initWallPaperWindow(mainWindow);
};

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.on("ready", createWindow);

// 所有窗口关闭时退出应用.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});
