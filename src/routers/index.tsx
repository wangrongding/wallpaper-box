import Container from '@/layout'
import { Image, Settings, Video, FolderOpen, Globe } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'

// import Dashboard from '@/pages/Dashboard'

// 路由懒加载
// const Dashboard = lazy(() => import('@/pages/dashboard'))
const List = lazy(() => import('@/pages/List'))
const ListLocal = lazy(() => import('@/pages/ListLocal'))
const LiveWallpaper = lazy(() => import('@/pages/LiveWallpaper'))
const WebWallpaper = lazy(() => import('@/pages/WebWallpaper'))
const Setting = lazy(() => import('@/pages/Setting'))
const WallPaperPage = lazy(() => import('@/pages/WallPaper'))
const Page404 = lazy(() => import('@/pages/ErrorPage/Page404'))
const Page401 = lazy(() => import('@/pages/ErrorPage/Page401'))

// 路由懒加载的loading
const withSuspense = (Component: JSX.Element) => (
  <Suspense fallback={<div className='text-center text-2xl font-bold'>loading...</div>}>{Component}</Suspense>
)

// 菜单路由
export const menuRoutes = [
  {
    path: '/list',
    title: '壁纸列表',
    icon: <Image className='h-4 w-4' />,
    element: withSuspense(<List />),
  },
  {
    path: '/video-wallpaper',
    title: '视频壁纸',
    icon: <Video className='h-4 w-4' />,
    element: withSuspense(<LiveWallpaper />),
  },
  {
    path: '/web-wallpaper',
    title: '网页壁纸',
    icon: <Globe className='h-4 w-4' />,
    element: withSuspense(<WebWallpaper />),
  },
  {
    path: '/my-list',
    title: '我的壁纸',
    icon: <FolderOpen className='h-4 w-4' />,
    element: withSuspense(<ListLocal />),
  },
  {
    path: '/setting',
    title: '设置',
    icon: <Settings className='h-4 w-4' />,
    element: withSuspense(<Setting />),
  },
  // {
  //   path: '/dashboard',
  //   title: '仪表盘',
  //   icon: <DesktopOutlined />,
  //   element: withSuspense(<Dashboard />),
  // },
]

// 路由配置
export const routes = [
  {
    path: '/',
    element: <Navigate to='/list' />,
    // element: <Navigate to='/video-wallpaper' />,
    // element: <Navigate to='/setting' />,
  },
  {
    path: '/',
    element: <Container />,
    children: menuRoutes,
  },
  {
    path: '/wallPaper',
    element: withSuspense(<WallPaperPage />),
  },
  {
    path: '/401',
    element: <Page401 />,
  },
  {
    path: '*',
    element: <Page404 />,
  },
]
