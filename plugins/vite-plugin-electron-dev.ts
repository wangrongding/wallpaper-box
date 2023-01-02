import { AddressInfo } from 'net'
import { ViteDevServer } from 'vite'
import optimizer from 'vite-plugin-optimizer'

export const electronDev = () => {
  return {
    name: 'vite-plugin-electron-dev',
    configureServer(server: ViteDevServer) {
      require('esbuild').buildSync({
        entryPoints: ['./electron/main.ts'],
        bundle: true,
        platform: 'node',
        outfile: './dist-electron/main.js',
        external: ['electron'],
      })
      const httpServer = server.httpServer!
      httpServer.once('listening', () => {
        let { spawn } = require('child_process')
        let addressInfo = httpServer.address()! as AddressInfo
        // let httpAddress = `http://${addressInfo.address}:${addressInfo.port}`;
        let httpAddress = `http://localhost:${addressInfo.port}`
        console.log('🚀🚀🚀 / httpAddress', httpAddress)
        let electronProcess = spawn(require('electron').toString(), ['./dist-electron/main.js', httpAddress], {
          cwd: process.cwd(),
          stdio: 'inherit',
        })
        electronProcess.on('close', () => {
          // if (electronProcess && electronProcess.kill) {
          //   process.kill(electronProcess.pid);
          //   electronProcess = null;
          // }
          server.close()
          process.exit()
        })
      })
    },
  }
}

export const replacer = () => {
  let externalModels = ['os', 'fs', 'path', 'events', 'child_process', 'crypto', 'http', 'https', 'buffer', 'stream', 'url', 'better-sqlite3', 'knex']
  let result = {}
  for (let item of externalModels) {
    result[item] = () => ({
      find: new RegExp(`^${item}$`),
      code: `const ${item} = require('${item}');export { ${item} as default }`,
    })
  }
  result['electron'] = () => {
    let electronModules = ['clipboard', 'ipcRenderer', 'nativeImage', 'shell', 'webFrame'].join(',')
    return {
      find: new RegExp(`^electron$`),
      code: `const {${electronModules}} = require('electron');export {${electronModules}}`,
    }
  }
  return result
}

export function getReplacer() {
  return optimizer(replacer())
}
