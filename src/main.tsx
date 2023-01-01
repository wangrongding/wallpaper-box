import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { BrowserRouter } from 'react-router-dom'

// antd 样式
import "antd/dist/reset.css";
// 全局样式
import '@/styles/index.scss'
// tailwindcss 样式
import '@/styles/tailwind.css'

// svg图标
import 'virtual:svg-icons-register'
// 根组件

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
