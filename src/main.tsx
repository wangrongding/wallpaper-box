import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { HashRouter } from 'react-router-dom'
import { StyleProvider } from '@ant-design/cssinjs'

// antd 样式
import 'antd/dist/reset.css'
// 全局样式
import '@/styles/index.scss'
// tailwindcss 样式
import '@/styles/tailwind.css'

// svg图标
import 'virtual:svg-icons-register'
// 根组件

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      {/* 提升 antd 样式优先级，防止被 tailwind 覆盖 */}
      <StyleProvider hashPriority='high'>
        <App />
      </StyleProvider>
    </HashRouter>
  </React.StrictMode>,
)
