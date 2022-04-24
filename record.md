# 开发记录

mainWindow.webContents.openDevTools() // 打开窗口调试

## 错误 fs.existsSync is not a function 的解决方案

使用 window.require 代替 require

```javascript
const { ipcRenderer: ipc } = window.require("electron");
```
