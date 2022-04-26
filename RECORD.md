# 开发记录

mainWindow.webContents.openDevTools() // 打开窗口调试

## 错误 fs.existsSync is not a function 的解决方案

使用 window.require 代替 require

```javascript
const { ipcRenderer: ipc } = window.require("electron");
```

屏蔽 Electron 的安全警告

```javascript
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
```
