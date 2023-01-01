// Path: electron/menu.ts
import { app, BrowserWindow, Notification, Menu, ipcMain, Tray, shell, globalShortcut } from 'electron'

const name = app.getName()
// 创建菜单
export const initMenu = (mainWindow: BrowserWindow) => {
  const template = [
    {
      label: '视图',
      submenu: [
        {
          label: '刷新',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload()
          },
        },
        {
          label: '开发者工具',
          accelerator: (() => {
            if (process.platform === 'darwin') return 'Shift+Command+I'
            else return 'Ctrl+Shift+I'
          })(),
          click: () => {
            mainWindow.webContents.toggleDevTools()
          },
        },
      ],
    },
    {
      label: '窗口',
      submenu: [
        {
          label: '最小化',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            mainWindow.minimize()
          },
        },
        {
          label: '关闭',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            mainWindow.hide()
          },
        },
      ],
    },
    {
      label: name,
      submenu: [
        {
          label: '🌸Follow me on GitHub',
          click: () => {
            shell.openExternal('https://github.com/wangrongding')
          },
        },
        {
          label: '退出',
          accelerator: 'Command+Q',
          click: () => {
            app.quit()
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
