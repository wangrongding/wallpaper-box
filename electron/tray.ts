import { getDefaultTrayIconId, getTrayIconLibraryPaths, getTrayIconSetDescriptors, getTrayIconSets } from './tray-list'
import { Tray, nativeImage, Menu, shell, BrowserWindow } from 'electron'
import type { MenuItemConstructorOptions, NativeImage } from 'electron'
import Store from 'electron-store'
import os from 'os'

const store = new Store()

let currentTrayIconId = ((store.get('tray-icon-id') as string) || '').trim()
let icons: NativeImage[] = [nativeImage.createEmpty()]

// 图表索引
let index = 0
// 间隔时间阶梯 ms
let intervals = [10, 20, 30, 40, 50, 60, 70, 100, 120, 150]
// 替换的间隔时间
let intervalIndex = 9

export let tray: Tray
// 主窗口
let main: BrowserWindow

function clampIntervalIndex(value: number) {
  return Math.min(intervals.length - 1, Math.max(0, value))
}

function resolveTrayIconSet(targetId = currentTrayIconId) {
  const trayIconSets = getTrayIconSets()
  const defaultTrayIconId = getDefaultTrayIconId()

  return trayIconSets.find((item) => item.id === targetId) || trayIconSets.find((item) => item.id === defaultTrayIconId) || trayIconSets[0] || null
}

function applyTrayIconSelection(targetId = currentTrayIconId) {
  const trayIconSet = resolveTrayIconSet(targetId)

  if (!trayIconSet) {
    currentTrayIconId = ''
    icons = [nativeImage.createEmpty()]
    index = 0
    return null
  }

  currentTrayIconId = trayIconSet.id
  icons = trayIconSet.images.length ? trayIconSet.images : [nativeImage.createEmpty()]
  index = 0
  store.set('tray-icon-id', currentTrayIconId)

  return trayIconSet
}

function createTrayIconRadioItems(source: 'builtin' | 'custom'): MenuItemConstructorOptions[] {
  const items = getTrayIconSetDescriptors().filter((item) => item.source === source)

  if (!items.length) {
    return [{ label: source === 'builtin' ? '暂无内置图标' : '暂无自定义图标', enabled: false }]
  }

  return items.map((item) => ({
    checked: item.id === currentTrayIconId,
    click: () => {
      setActiveTrayIcon(item.id)
    },
    label: item.label,
    type: 'radio',
  }))
}

function buildTrayIconSelectionMenu() {
  const { customDirectory } = getTrayIconLibraryPaths()

  return [
    { label: '内置图标', enabled: false },
    ...createTrayIconRadioItems('builtin'),
    { type: 'separator' as const },
    { label: '自定义图标', enabled: false },
    ...createTrayIconRadioItems('custom'),
    { type: 'separator' as const },
    {
      label: '打开自定义图标目录',
      click: async () => {
        await shell.openPath(customDirectory)
      },
    },
  ] satisfies MenuItemConstructorOptions[]
}

// 设置托盘图标
export function setTrayIcon(mainWindow: BrowserWindow) {
  main = mainWindow
  applyTrayIconSelection(currentTrayIconId)
  // 初始化托盘图标
  tray = new Tray(icons[0] || nativeImage.createEmpty())
  // 设置托盘图标悬停提示
  tray.setToolTip('wallpaper-box')
  // 动态替换托盘图标
  dynamicTrayIcon()
  // 设置托盘图标菜单
  setTrayIconMenu()
}

export function getTrayIconState() {
  const resolvedTrayIcon = applyTrayIconSelection(currentTrayIconId)
  const { builtinDirectory, customDirectory } = getTrayIconLibraryPaths()

  return {
    builtinDirectory,
    currentId: resolvedTrayIcon?.id || currentTrayIconId,
    customDirectory,
    items: getTrayIconSetDescriptors(),
  }
}

export function refreshTrayIconLibrary() {
  const trayIconSet = applyTrayIconSelection(currentTrayIconId)

  if (tray && !tray.isDestroyed()) {
    tray.setImage(icons[0] || nativeImage.createEmpty())
    setTrayIconMenu()
  }

  return trayIconSet?.id || ''
}

export function setActiveTrayIcon(targetId: string) {
  const trayIconSet = applyTrayIconSelection(targetId)

  if (!trayIconSet) {
    throw new Error('未找到可用的菜单栏动态图标')
  }

  if (tray && !tray.isDestroyed()) {
    tray.setImage(icons[0] || nativeImage.createEmpty())
    setTrayIconMenu()
  }

  return trayIconSet.id
}

// 设置托盘图标菜单
export function setTrayIconMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '更换图标',
      submenu: buildTrayIconSelectionMenu(),
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
export function dynamicTrayIcon() {
  if (!tray || tray.isDestroyed()) {
    return
  }

  // 替换托盘图标
  tray.setImage(icons[index] || icons[0] || nativeImage.createEmpty())
  index = (index + 1) % Math.max(icons.length, 1)
  cpuUsage()
  // tray.setTitle(intervalIndex.toString())
  setTimeout(() => dynamicTrayIcon(), intervals[clampIntervalIndex(intervalIndex)])
}

// 获取系统 cpu 信息
export function cpuUsage() {
  getCPUUsage((percentage: number) => {
    intervalIndex = clampIntervalIndex(Number((percentage * 10).toFixed(0)))
    // console.log(` - CPU使用占比：${Number(percentage * 100).toFixed(2)}%`)
  }, true)

  return clampIntervalIndex(intervalIndex)
}

//这里获取的是CPU总信息
function getCPUInfo() {
  const cpus = os.cpus()
  let user = 0
  let nice = 0
  let sys = 0
  let idle = 0
  let irq = 0
  for (let cpu in cpus) {
    user += cpus[cpu].times.user
    nice += cpus[cpu].times.nice
    sys += cpus[cpu].times.sys
    irq += cpus[cpu].times.irq
    idle += cpus[cpu].times.idle
  }
  const total = user + nice + sys + idle + irq
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
