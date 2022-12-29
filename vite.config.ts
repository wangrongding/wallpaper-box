import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import AutoImport from 'unplugin-auto-import/vite'
import { electronDev } from './plugins/vite-plugin-electron-dev'
import path from 'path'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, ssrBuild }) => {
  return {
    // vite 插件配置
    plugins: [
      mode !== 'web' && electronDev(),
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
      proxy: {
        '/api': {
          // target: "http://localhost:3000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    // 别名配置
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // 打包配置
    build: {
      rollupOptions: {
        plugins: [
          // buildPlugin()
        ],
      },
    },
  }
})
