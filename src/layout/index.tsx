import { Outlet } from 'react-router-dom'
import { Layout, theme } from 'antd'
import MenuBar from './Menu'

import { ipcRenderer } from 'electron'

const { Header, Footer, Content } = Layout
export default function Container() {
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  function openLinkInBrowser(url: string) {
    ipcRenderer.send('open-link-in-browser', url)
  }

  return (
    <>
      <Layout>
        <Header style={{ position: 'sticky', top: 0, zIndex: 1, width: '100%', padding: '0 20px' }}>
          {/* LOGO */}
          <div className='float-left text-white font-bold text-[28px] px-4 h-[40px] leading-[40px] mt-[13px]'>🏞️ wallpaper-hub</div>
          {/* 菜单栏 */}
          <MenuBar />
        </Header>

        {/* 内容区 */}
        <Content className='site-layout' style={{ padding: '20px 20px 0' }}>
          <div style={{ padding: 24, background: colorBgContainer }} className='bgx h-[calc(100vh-118px)] overflow-y-auto'>
            <Outlet></Outlet>
          </div>
        </Content>

        {/* 底部 */}
        <Footer className='text-center h-[34px] leading-[34px] p-[0px]' style={{ padding: 0, margin: 0 }}>
          Created by 荣顶，follow me on{' '}
          <a className='text-red-400' onClick={() => openLinkInBrowser('https://github.com/wangrongding')}>
            Github🌸
          </a>
        </Footer>
      </Layout>
    </>
  )
}
