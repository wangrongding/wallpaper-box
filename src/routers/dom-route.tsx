// 组件形式的写法
import App from '../App'
import Dashboard from '@/pages/Dashboard'
import List from '@/pages/List'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// 以上写法可以简写为：
const baseRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<App />}>
        {/* 配置 用户访问/ 的时候，重定向到/home路径 */}
        <Route path='/' element={<Navigate to='/home' />}></Route>
        <Route path='/dashboard' element={<Dashboard />}></Route>
        <Route path='/list' element={<List />}></Route>
      </Route>
    </Routes>
  </BrowserRouter>
)
export default baseRouter
