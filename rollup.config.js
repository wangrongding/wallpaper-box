const typescript2 = require('rollup-plugin-typescript2')
const { spawn } = require('child_process')
// const json = require("@rollup/plugin-json");

let httpAddress = `http://localhost:1234`
const defaultConfig = {
  input: ['./electron/main.ts', './electron/preload.ts'],
  output: {
    dir: './dist-electron', // 输出目录
    format: 'cjs', // 输出格式, 可选值: amd, cjs, es, iife, umd
    sourcemap: true, // 是否生成sourcemap, 默认为false
    // globals, // 外部依赖,
  },
  plugins: [
    // 使用typescript2插件
    typescript2(),
    // 解析json文件
    // json(),

    // 打包结束后执行的钩子函数
    {
      buildEnd: (error) => {
        if (error) {
          console.log(error)
        } else {
          console.log('打包成功')

          let electronProcess = spawn(require('electron').toString(), ['./dist-electron/main.js', httpAddress], {
            cwd: process.cwd(),
            stdio: 'inherit',
          })
          electronProcess.on('close', () => {
            server.close()
            process.exit()
          })
        }
      },
    },
  ],
}

module.exports = defaultConfig
