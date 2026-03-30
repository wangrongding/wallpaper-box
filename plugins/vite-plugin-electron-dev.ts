import optimizer from 'vite-plugin-optimizer'

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
