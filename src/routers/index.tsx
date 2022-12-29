import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import Dashboard from '@/pages/dashboard'
import Layout from '@/layout'

// 路由懒加载
// const Dashboard = lazy(() => import('@/pages/dashboard'))
const List = lazy(() => import('@/pages/list'))
const WallPaperPage = lazy(() => import('@/pages/wallPaper'))

// 路由懒加载的loading
const withSuspense = (Component: JSX.Element) => <Suspense fallback={<div>loading...</div>}>{Component}</Suspense>

// 菜单路由
export const menuRoutes = [
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/list',
    element: withSuspense(<List />),
  },
  {
    path: '/wallPaper',
    element: withSuspense(<WallPaperPage />),
  },
]

// 路由配置
export const routes = [
  {
    path: '/',
    element: <Navigate to='/dashboard' />,
  },
  {
    path: '/',
    element: <Layout />,
    children: menuRoutes,
  },
]
