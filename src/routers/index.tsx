import { lazy, Suspense } from 'react'
import { PictureFilled, SettingOutlined, VideoCameraOutlined, FolderOpenFilled } from '@ant-design/icons'
import Container from '@/layout'
import { Navigate } from 'react-router-dom'
// import Dashboard from '@/pages/Dashboard'

// 路由懒加载
// const Dashboard = lazy(() => import('@/pages/dashboard'))
const List = lazy(() => import('@/pages/List'))
const MyList = lazy(() => import('@/pages/MyList'))
const SetProxy = lazy(() => import('@/pages/SetProxy'))
const LiveWallpaper = lazy(() => import('@/pages/LiveWallpaper'))
const Setting = lazy(() => import('@/pages/Setting'))
const WallPaperPage = lazy(() => import('@/pages/WallPaper'))
const Page404 = lazy(() => import('@/pages/ErrorPage/Page404'))
const Page401 = lazy(() => import('@/pages/ErrorPage/Page401'))

// 路由懒加载的loading
const withSuspense = (Component: JSX.Element) => <Suspense fallback={<div>loading...</div>}>{Component}</Suspense>

// 菜单路由
export const menuRoutes = [
  {
    path: '/list',
    title: '壁纸列表',
    icon: <PictureFilled />,
    element: withSuspense(<List />),
  },
  {
    path: '/dashboard',
    title: '视频壁纸',
    icon: <VideoCameraOutlined />,
    element: withSuspense(<LiveWallpaper />),
  },
  {
    path: '/my-list',
    title: '我的壁纸',
    icon: <FolderOpenFilled />,
    element: withSuspense(<MyList />),
  },
  {
    path: '/setting',
    title: '设置',
    icon: <SettingOutlined />,
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
    path: '/set-proxy',
    element: withSuspense(<SetProxy />),
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
