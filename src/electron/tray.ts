import { Tray, nativeImage } from 'electron'
import * as path from 'path'
import os from 'os'

export let tray: Tray

// 创建原生图像
export function createNativeImage(path: string) {
  return nativeImage.createFromPath(path).resize({ width: 30, height: 28 })
}

export const icons = [
  createNativeImage(path.join(__dirname, '../public/icons/runcat/0.png')),
  createNativeImage(path.join(__dirname, '../public/icons/runcat/1.png')),
  createNativeImage(path.join(__dirname, '../public/icons/runcat/2.png')),
  createNativeImage(path.join(__dirname, '../public/icons/runcat/3.png')),
  createNativeImage(path.join(__dirname, '../public/icons/runcat/4.png')),
  // createNativeImage(path.join(__dirname, '../public/icons/mario/0.png')),
  // createNativeImage(path.join(__dirname, '../public/icons/mario/1.png')),
  // createNativeImage(path.join(__dirname, '../public/icons/mario/2.png')),
]

// 图表索引
let index = 0
// 间隔时间阶梯 ms
let intervals = [10, 20, 30, 40, 50, 60, 70, 100, 120, 150]
// 替换的间隔时间
let intervalIndex = 9

// 设置托盘图标
export function setTrayIcon() {
  tray = new Tray(icons[0])
  dynamicTrayIcon(intervalIndex)
}

// 动态替换托盘图标
export function dynamicTrayIcon(intervalIndex: number) {
  // 替换托盘图标
  tray.setImage(icons[index])
  index = (index + 1) % icons.length
  // 节流
  intervalIndex = cpuUsage()

  // console.log('🚀🚀🚀 / percentage', intervalIndex)
  // tray.setTitle(intervalIndex.toString())
  setTimeout(() => dynamicTrayIcon(intervalIndex), intervals[intervalIndex])
  // setTimeout(() => dynamicTrayIcon(intervalIndex), intervals[5])
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
