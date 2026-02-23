import App from './App'
import { Toaster } from '@/components/ui/toast'
// 全局样式
import '@/styles/index.scss'
// tailwindcss 样式
import '@/styles/tailwind.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
// svg图标
import 'virtual:svg-icons-register'

// 根组件

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <App />
      <Toaster />
    </HashRouter>
  </React.StrictMode>,
)
