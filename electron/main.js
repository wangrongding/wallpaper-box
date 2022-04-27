const { app, BrowserWindow, Notification, Menu } = require("electron");
const { ipcMain } = require("electron");
const { createWallPaper } = require("./createWallPaper.js");
// 关闭electron警告
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
// 保持window对象的全局引用,避免JavaScript对象被垃圾回收时,窗口被自动关闭.
let mainWindow = null;
// 创建窗口
const createWindow = () => {
  // 隐藏菜单栏
  Menu.setApplicationMenu(null);
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 1000,
    // frame: false, //是否显示边缘框
    fullscreen: false, //是否全屏显示
    webPreferences: {
      nodeIntegration: true, //赋予此窗口页面中的JavaScript访问Node.js环境的能力
      enableRemoteModule: true, //打开remote模块
      webSecurity: false, //禁用同源策略
      contextIsolation: false, //是否使用上下文隔离
    },
  });
  // mainWindow.loadURL("app://./index.html");
  // mainWindow.loadFile("index.html");
  mainWindow.loadURL("http://localhost:8000");
  console.log("createWindow");
  mainWindow.webContents.openDevTools(); // 打开窗口调试
  // 创建壁纸窗口
  // createWallPaper();
};

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.on("ready", () => {
  createWindow();
});

// 所有窗口关闭时退出应用.
app.on("window-all-closed", () => {
  console.log("window-all-closed");
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  console.log("activate");
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on("asynchronous-message", (event, arg) => {
  console.log(arg); // prints "ping"
  event.reply("asynchronous-reply", "pong");
  new Notification({
    title: "提示",
    body: "替换成功！",
  }).show();
});
