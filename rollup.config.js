const typescript2 = require("rollup-plugin-typescript2");
// const json = require("@rollup/plugin-json");

const defaultConfig = {
  input: "./src/electron/main.ts",
  output: {
    dir: "./electron", // 输出目录
    format: "cjs", // 输出格式, 可选值: amd, cjs, es, iife, umd
    sourcemap: true, // 是否生成sourcemap, 默认为false
    // globals, // 外部依赖,
  },
  plugins: [
    // 使用typescript2插件
    typescript2(),
    // 解析json文件
    // json(),
  ],
};

module.exports = defaultConfig;
