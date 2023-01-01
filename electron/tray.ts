import { Tray, nativeImage, Menu, shell, BrowserWindow } from 'electron'
import * as path from 'path'
import os from 'os'
import { trays } from './tray-list'

// 创建原生图像
export function createNativeImage(path: string) {
  return nativeImage.createFromPath(path).resize({ width: 30, height: 28 })
}

export let icons = trays.partyBlobCat

// 图表索引
let index = 0
// 间隔时间阶梯 ms
let intervals = [10, 20, 30, 40, 50, 60, 70, 100, 120, 150]
// 替换的间隔时间
let intervalIndex = 9

export let tray: Tray
// 主窗口
let main: BrowserWindow

// 设置托盘图标
export function setTrayIcon(mainWindow: BrowserWindow) {
  main = mainWindow
  // 设置托盘图标标题
  // tray.setTitle('wallpaper-box')
  // 初始化托盘图标
  tray = new Tray(icons[0])
  // 设置托盘图标悬停提示
  tray.setToolTip('wallpaper-box')
  // 动态替换托盘图标
  dynamicTrayIcon(intervalIndex)
  // 设置托盘图标菜单
  setTrayIconMenu()
}

type Trays = keyof typeof trays
// 切换托盘图标,参数的类型为 trays 的 key
function changeTrayIcon(item: Trays) {
  icons = trays[item]
  // dynamicTrayIcon(intervalIndex)
}

// 设置托盘图标菜单
export function setTrayIconMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '更换图标',
      submenu: [
        { label: 'runcat', type: 'radio', checked: true, click: () => changeTrayIcon('runcat') },
        { label: 'mario', type: 'radio', click: () => changeTrayIcon('mario') },
        { label: 'Mona', type: 'radio', click: () => changeTrayIcon('mona') },
        { label: 'partyBlobCat', type: 'radio', click: () => changeTrayIcon('partyBlobCat') },
        { label: 'Points', type: 'radio', click: () => changeTrayIcon('points') },
        { label: 'RuncatX', type: 'radio', click: () => changeTrayIcon('runcatX') },
      ],
    },
    { type: 'separator' },
    { label: '显示主窗口', type: 'normal', click: () => main.show() },
    { label: '隐藏主窗口', role: 'hide' },
    // { label: '隐藏其他窗口', role: 'hideOthers' },
    // { label: '取消隐藏其他窗口', role: 'unhide' },
    { label: '重启应用', role: 'reload' },
    { label: '强制重启应用', role: 'forceReload' },
    { type: 'separator' },
    { label: '关于', role: 'about' },
    {
      label: 'Github🌸',
      click: async () => await shell.openExternal('https://github.com/wangrongding'),
    },
    { type: 'separator' },
    { label: '退出', type: 'normal', role: 'quit' },
    // { label: 'checkbox', type: 'checkbox' },
  ])
  tray.setContextMenu(contextMenu)
}

// 动态替换托盘图标
export function dynamicTrayIcon(intervalIndex: number) {
  // 替换托盘图标
  tray.setImage(icons[index] || icons[0])
  index = (index + 1) % icons.length
  intervalIndex = cpuUsage()
  // tray.setTitle(intervalIndex.toString())
  setTimeout(() => dynamicTrayIcon(intervalIndex), intervals[intervalIndex])
}

// 获取系统 cpu 信息
export function cpuUsage() {
  getCPUUsage((percentage: number) => {
    intervalIndex = Number((percentage * 10).toFixed(0))
    // console.log(` - CPU使用占比：${Number(percentage * 100).toFixed(2)}%`)
  }, true)

  return intervalIndex
}

//这里获取的是CPU总信息
function getCPUInfo() {
  let cpus = os.cpus()
  let user = 0
  let nice = 0
  let sys = 0
  let idle = 0
  let irq = 0
  let total = 0
  for (let cpu in cpus) {
    user += cpus[cpu].times.user
    nice += cpus[cpu].times.nice
    sys += cpus[cpu].times.sys
    irq += cpus[cpu].times.irq
    idle += cpus[cpu].times.idle
  }
  total = user + nice + sys + idle + irq
  // 空闲 cpu，总 cpu
  return { idle, total }
}

// 获取CPU使用率，由于cpu是变化的，这里用一秒的时间隔来计算。得到时间差来反映CPU的延迟，侧面反映了CPU的使用率。
function getCPUUsage(callback: (v: number) => void, free: boolean) {
  let stats1 = getCPUInfo()
  let startIdle = stats1.idle
  let startTotal = stats1.total

  setTimeout(() => {
    let stats2 = getCPUInfo()
    let endIdle = stats2.idle
    let endTotal = stats2.total

    let idle = endIdle - startIdle
    let total = endTotal - startTotal
    let perc = idle / total

    if (free === true) callback(perc)
    else callback(1 - perc)
  }, 1000)
}
