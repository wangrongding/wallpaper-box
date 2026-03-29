const typescript2 = require('rollup-plugin-typescript2')
const { spawn } = require('child_process')

// import { nodeResolve } from '@rollup/plugin-node-resolve'
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
  ],
}

module.exports = defaultConfig
