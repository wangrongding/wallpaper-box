import * as rollup from 'rollup'
import chokidar from 'chokidar'
// 引入 rollup 配置文件
import rollupConfig from './rollup.config.js'
import { spawn } from 'child_process'
import electron from 'electron'

const httpAddress = 'http://localhost:1234'
let electronProcess
async function build() {
  try {
    const bundle = await rollup.rollup(rollupConfig)
    await bundle.write(rollupConfig.output)
    // 创建 electron 进程
    createElectronProcess()
  } catch (error) {
    console.error(error)
  }
}

// 创建 electron 进程
function createElectronProcess() {
  electronProcess = spawn(electron.toString(), ['./dist-electron/main.js', httpAddress], {
    cwd: process.cwd(),
    // stdio: 'inherit',
  })
  electronProcess.on('close', closeElectronProcess)
}

// 退出进程
function closeElectronProcess() {
  if (electronProcess && electronProcess.kill) {
    process.kill(electronProcess.pid)
    electronProcess = null
  }
  // 退出进程
  // process.exit()
}

// 文件变化时，重新构建
function onFileChange() {
  console.log('🏃🏃🏃🏃🏃🏃🏃文件更改，正在重新构建...')
  // 退出上一个 electron 进程
  closeElectronProcess()
  build()
}

// 监听 src中所有文件的变化
const chokidarWatcher = chokidar.watch(['electron/**/*'], {
  ignored: /(^|[\/\\])\../, // 忽略以点开头的文件
  persistent: true, // 保持监听状态
})

// 当文件变化时，重新构建
chokidarWatcher.on('change', onFileChange)
build()
