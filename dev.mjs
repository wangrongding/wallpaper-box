import { spawn } from 'child_process'
import { createServer } from 'vite'

let electronDevProcess = null
let shuttingDown = false
let viteServer = null

function createElectronEnv(viteDevServerUrl) {
  const electronEnv = {
    ...process.env,
    IS_DEV: 'true',
    VITE_DEV_SERVER_URL: viteDevServerUrl,
  }

  delete electronEnv.ELECTRON_RUN_AS_NODE

  return electronEnv
}

function getViteDevServerUrl(server) {
  const viteDevServerUrl = server.resolvedUrls?.local[0] || server.resolvedUrls?.network[0]

  if (!viteDevServerUrl) {
    throw new Error('Vite dev server did not expose a resolved URL.')
  }

  return viteDevServerUrl.replace(/\/$/, '')
}

function startElectronDevProcess(viteDevServerUrl) {
  return new Promise((resolve, reject) => {
    electronDevProcess = spawn(process.execPath, ['./dev-electron.mjs'], {
      cwd: process.cwd(),
      env: createElectronEnv(viteDevServerUrl),
      stdio: 'inherit',
    })

    electronDevProcess.on('error', reject)
    electronDevProcess.on('spawn', resolve)
    electronDevProcess.on('close', (code) => {
      if (!shuttingDown) {
        void shutdown(code ?? 0)
      }
    })
  })
}

async function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true

  if (electronDevProcess && !electronDevProcess.killed) {
    electronDevProcess.kill('SIGTERM')
  }

  if (viteServer) {
    await viteServer.close()
  }

  process.exit(exitCode)
}

async function main() {
  viteServer = await createServer({
    mode: 'development',
  })

  await viteServer.listen()
  viteServer.printUrls()
  viteServer.bindCLIShortcuts?.({ print: true })

  const viteDevServerUrl = getViteDevServerUrl(viteServer)
  console.log(`[dev] renderer dev server: ${viteDevServerUrl}`)

  await startElectronDevProcess(viteDevServerUrl)
}

process.on('SIGINT', () => {
  void shutdown(0)
})

process.on('SIGTERM', () => {
  void shutdown(0)
})

void main().catch(async (error) => {
  console.error(error)
  await shutdown(1)
})
