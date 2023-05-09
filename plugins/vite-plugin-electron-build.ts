//plugins\buildPlugin.ts
import path from 'path'
import fs from 'fs'

class BuildObj {
  //编译主进程代码
  buildMain() {
    require('esbuild').buildSync({
      entryPoints: [path.resolve(process.cwd(), './electron/main.ts')],
      bundle: true,
      platform: 'node',
      minify: true,
      outfile: path.resolve(process.cwd(), './dist-electron/main.js'),
      external: ['electron'],
    })
  }
  //为生产环境准备package.json
  preparePackageJson() {
    let pkgJsonPath = path.join(process.cwd(), 'package.json')
    let localPkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
    //https://github.com/electron-userland/electron-builder/issues/4157#issuecomment-596419610
    let electronConfig = localPkgJson.devDependencies.electron.replace('^', '')
    // localPkgJson.main = 'main.js'
    localPkgJson.main = path.resolve(process.cwd(), 'main.js')
    delete localPkgJson.scripts
    delete localPkgJson.devDependencies
    localPkgJson.devDependencies = { electron: electronConfig }
    let tarJsonPath = path.join(process.cwd(), 'dist', 'package.json')
    // let tarJsonPath = path.join(process.cwd(), 'package.json')
    fs.writeFileSync(tarJsonPath, JSON.stringify(localPkgJson))
    fs.mkdirSync(path.join(process.cwd(), 'dist/node_modules'))
    // fs.mkdirSync(path.join(process.cwd(), 'node_modules'))
  }
  //使用electron-builder制成安装包
  buildInstaller() {
    let options = {
      config: {
        directories: {
          output: path.join(process.cwd(), 'release'),
          app: path.join(process.cwd(), 'dist'),
        },
        files: ['**'],
        extends: null,
        productName: 'JueJin',
        appId: 'com.juejin.desktop',
        asar: true,
        nsis: {
          oneClick: true,
          perMachine: true,
          allowToChangeInstallationDirectory: false,
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          shortcutName: 'juejinDesktop',
        },
        publish: [{ provider: 'generic', url: 'http://localhost:5500/' }],
      },
      project: process.cwd(),
    }
    return require('electron-builder').build(options)
  }
}

export let buildPlugin = () => {
  return {
    name: 'build-plugin',
    closeBundle: () => {
      let buildObj = new BuildObj()
      buildObj.buildMain()
      buildObj.preparePackageJson()
      buildObj.buildInstaller()
    },
  }
}
