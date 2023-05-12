import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import AutoImport from 'unplugin-auto-import/vite'
import { electronDev, getReplacer } from './plugins/vite-plugin-electron-dev'
import path from 'path'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import esModule from 'vite-plugin-esmodule'
// import nodeStdlibBrowser from 'node-stdlib-browser'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, ssrBuild }) => {
  return {
    base: './',
    // vite 插件配置
    plugins: [
      mode === 'sort' && electronDev(),
      getReplacer(),
      esModule(['wallpaper']),
      react(),
      // Api自动导入
      AutoImport({
        dts: true,
        // 目标文件
        include: [
          /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        ],
        // 全局引入插件
        imports: ['react'],
        resolvers: [],
        // eslint报错解决方案
        eslintrc: {
          enabled: true, // Default `false`
          filepath: './.eslintrc-auto-import.json', // Default `./.eslintrc-auto-import.json`
          globalsPropValue: true, // Default `true`, (true | false | 'readonly' | 'readable' | 'writable' | 'writeable')
        },
      }),
      createSvgIconsPlugin({
        // 所有的 svg的文件都存放在该文件夹下
        iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
        symbolId: 'icon-[name]',
      }),
    ],
    // 服务配置
    server: {
      port: 1234,
      open: false,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    // 别名配置
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // ...(mode === 'production' ? nodeStdlibBrowser : null),
      },
    },
    // 打包配置
    build: {
      outDir: 'dist-web',
      rollupOptions: {
        plugins: [
          // buildPlugin()
        ],
      },
    },
  }
})
