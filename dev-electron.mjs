import { spawn } from 'child_process'
import chokidar from 'chokidar'
import electron from 'electron'
import path from 'path'

process.env.IS_DEV ??= 'true'

const viteDevServerUrl = (process.env.VITE_DEV_SERVER_URL || process.argv[2] || 'http://localhost:5173').replace(/\/$/, '')
const tscBin = path.join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc')

let electronProcess = null
let isBuilding = false
let hasPendingRebuild = false

function runTypeScriptBuild() {
  return new Promise((resolve, reject) => {
    const buildProcess = spawn(process.execPath, [tscBin, '-p', 'tsconfig.electron.json'], {
      cwd: process.cwd(),
      stdio: 'inherit',
    })

    buildProcess.on('error', reject)
    buildProcess.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`Electron TypeScript build failed with exit code ${code ?? 'unknown'}`))
    })
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
}

function handleElectronProcessError(error) {
  const erroredProcess = electronProcess
  console.error('🤖 electron 进程异常退出：', error)
  clearElectronProcess(erroredProcess)
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

function startElectronProcess() {
  const electronEnv = { ...process.env }
  delete electronEnv.ELECTRON_RUN_AS_NODE

  electronProcess = spawn(electron, ['./dist-electron/main.js', viteDevServerUrl], {
    cwd: process.cwd(),
    env: electronEnv,
    stdio: 'inherit',
  })

  electronProcess.on('close', handleElectronProcessClose)
  electronProcess.on('error', handleElectronProcessError)
}

async function buildAndRestartElectron() {
  if (isBuilding) {
    hasPendingRebuild = true
    return
  }

  isBuilding = true

  try {
    await runTypeScriptBuild()
    stopElectronProcess()
    startElectronProcess()
  } catch (error) {
    console.error(error)
  } finally {
    isBuilding = false

    if (hasPendingRebuild) {
      hasPendingRebuild = false
      await buildAndRestartElectron()
    }
  }
}

function onFileChange(filePath) {
  console.log(`🏃 检测到 Electron 文件变化，正在重建: ${filePath}`)
  void buildAndRestartElectron()
}

const chokidarWatcher = chokidar.watch(['electron/**/*'], {
  ignored: /(^|[\/\\])\../,
  ignoreInitial: true,
  persistent: true,
})

chokidarWatcher.on('add', onFileChange)
chokidarWatcher.on('change', onFileChange)
chokidarWatcher.on('unlink', onFileChange)

void buildAndRestartElectron()
