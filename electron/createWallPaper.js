const { app, BrowserWindow, screen } = require("electron");
const { setUnderLayer } = require("./setUnderLayer.js");
let wallWindow = [];
// 创建窗口
exports.createWallPaper = () => {
  const displays = screen.getAllDisplays();
  displays.forEach((display, index) => {
    wallWindow.push(
      new BrowserWindow({
        // x: display.bounds.x,
        // y: display.bounds.y,
        x: 0,
        y: 0,
        focusable: false, //禁止窗口获取焦点
        frame: false,
        fullscreen: true, //是否全屏显示
        // opacity: 0, //初始透明值
        // transparent: true, //窗口透明
        webPreferences: {
          nodeIntegration: true, //赋予此窗口页面中的JavaScript访问Node.js环境的能力
          enableRemoteModule: true, //打开remote模块
          webSecurity: true, //可以使用本地资源
        },
      }),
    );
    wallWindow[index].loadURL(`http://localhost:8000/wallPaper`);
    wallWindow[index].setIgnoreMouseEvents(true);
    // 窗口设置在壁纸上层
    setUnderLayer(wallWindow[index]);
  });
  // setUnderLayer(wallWindow[wallWindow.length - 1]);
};

app.on("ready", () => {
  screen.on("display-added", (event, display) => {
    console.log("display-added");
  });
  screen.on("display-removed", (event, display) => {
    console.log("display-removed");
  });
  screen.on("display-metrics-changed", (event, display, changedMetrics) => {
    console.log("display-metrics-changed");
  });
});
