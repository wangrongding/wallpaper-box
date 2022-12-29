import reactLogo from './assets/react.svg'
import { routes } from '@/routers/index'
import { BrowserRouter, Routes, Route, Navigate, useRoutes, Link, useNavigate } from 'react-router-dom'
import { Breadcrumb, Layout, Menu, theme } from 'antd'
// import { ipcRenderer } from 'electron'
// const { ipcRenderer } = window.require('electron')

const { Header, Footer, Sider, Content } = Layout
export default function App() {
  const [count, setCount] = useState(0)
  const navigate = useNavigate()
  const outlet = useRoutes(routes)
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  useEffect(() => {
    console.log('组件挂载了')

    return () => {
      console.log('组件卸载了')
    }
  }, [])

  // 路由跳转
  function handleMenuClick(e: { key: string }) {
    console.log(e.key)
    navigate(e.key)
  }

  function handleLinkClick(url: string) {
    // ipcRenderer.send('open-new-window', url)
  }

  return (
    <>
      <Layout>
        <Header style={{ position: 'sticky', top: 0, zIndex: 1, width: '100%' }}>
          <div
            style={{
              float: 'left',
              width: 120,
              height: 31,
              margin: '16px 24px 16px 0',
              background: 'rgba(255, 255, 255, 0.2)',
            }}
          />

          <Menu
            theme='dark'
            mode='horizontal'
            defaultSelectedKeys={['2']}
            items={routes.map((item: any, index: number) => ({
              key: item.path,
              label: item.path,
            }))}
            onClick={handleMenuClick}
          />
        </Header>

        <Content className='site-layout' style={{ padding: '20px 20px 0' }}>
          <div style={{ padding: 24, minHeight: 380, background: colorBgContainer }}>
            {outlet}
            Content
          </div>
        </Content>

        <Footer
          className='text-center h-[40px] leading-[40px]'
          style={{
            padding: 0,
            margin: 0,
          }}
        >
          Created by 荣顶，follow me on{' '}
          <a className='text-red-400' onClick={() => handleLinkClick('https://github.com/wangrongding')}>
            Github🌸
          </a>
        </Footer>
      </Layout>
    </>
  )
}
