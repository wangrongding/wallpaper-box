// 引入 rollup 配置文件
import rollupConfig from './rollup.config.js'
import { spawn } from 'child_process'
import chokidar from 'chokidar'
import electron from 'electron'
import * as rollup from 'rollup'

const httpAddress = 'http://localhost:1234'
let electronProcess
let isRestarting = false
async function build() {
  try {
    const bundle = await rollup.rollup(rollupConfig)
    await bundle.write(rollupConfig.output)
    // 创建 electron 进程
    createElectronProcess()
  } catch (error) {
    console.error(error)
    isRestarting = false
  }
}

// 创建 electron 进程
async function createElectronProcess() {
  electronProcess = await spawn(electron, ['./dist-electron/main.js', httpAddress], {
    cwd: process.cwd(),
    // stdio: 'inherit',
  })
  electronProcess.on('close', handleElectronProcessClose)
  electronProcess.on('error', handleElectronProcessError)
  electronProcess.stdout.on('data', (data) => {
    console.log(data.toString())
  })
  electronProcess.stderr.on('data', (data) => {
    console.error(data.toString())
  })
}

function clearElectronProcess(referenceProcess) {
  if (electronProcess === referenceProcess) {
    electronProcess = null
  }
}

function handleElectronProcessClose(code) {
  const closedProcess = electronProcess
  console.log(`🤖 electron 进程退出，退出码 ${code}`)
  clearElectronProcess(closedProcess)
  isRestarting = false
}

function handleElectronProcessError(error) {
  const erroredProcess = electronProcess
  console.error('🤖 electron 进程异常退出：', error)
  clearElectronProcess(erroredProcess)
  isRestarting = false
}

function stopElectronProcess() {
  if (!electronProcess || electronProcess.killed) {
    return
  }

  const processToStop = electronProcess
  processToStop.removeListener('close', handleElectronProcessClose)
  processToStop.removeListener('error', handleElectronProcessError)

  try {
    processToStop.kill()
  } catch (error) {
    console.warn('Failed to stop existing electron process:', error)
  }

  clearElectronProcess(processToStop)
}

// 文件变化时，重新构建
function onFileChange() {
  if (isRestarting) {
    return
  }

  isRestarting = true
  console.log('🏃🏃🏃🏃🏃🏃🏃文件更改，正在重新构建...')
  // 退出上一个 electron 进程
  stopElectronProcess()
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
