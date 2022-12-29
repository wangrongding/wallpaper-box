import { defineConfig } from "vite";
import { resolve } from "path";
import rollupNodePolyFill from "rollup-plugin-node-polyfills";

const resPath = (url: string) => resolve(__dirname, url);
export default defineConfig({
  // root: resPath("src/views"),
  resolve: {
    alias: {
      path: "rollup-plugin-node-polyfills/polyfills/path",
    },
  },
  build: {
    outDir: resPath("electron"),
    //关闭警告
    // emptyOutDir: false,
    //自定义底层的 Rollup 打包配置
    rollupOptions: {
      input: {
        main: resPath("src/electron/main.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        format: "cjs",
      },
    },
  },
});
