import { ipcRenderer } from 'electron'
import { Outlet } from 'react-router-dom'
import { Layout, theme } from 'antd'
import { MinusOutlined, FullscreenExitOutlined, BorderOutlined, CloseOutlined } from '@ant-design/icons'
import MenuBar from './Menu'
import './index.scss'

const { Header, Footer, Content } = Layout
export default function Container() {
  // 窗口是否最大化
  const [isMaximized, setIsMaximized] = useState(false)

  const {
    token: { colorBgContainer },
  } = theme.useToken()

  function openLinkInBrowser(url: string) {
    ipcRenderer.send('open-link-in-browser', url)
  }

  // 最小化窗口
  function minimizeWindow() {
    ipcRenderer.send('minimize-window')
  }

  // 最大化窗口
  function maximizeWindow() {
    setIsMaximized(true)
    ipcRenderer.send('maximize-window')
  }

  // 恢复窗口
  function unMaximizeWindow() {
    setIsMaximized(false)
    ipcRenderer.send('unmaximize-window')
  }

  // 关闭窗口
  function closeWindow() {
    ipcRenderer.send('hide-window')
  }

  // 刷新窗口
  function refreshWindow() {
    ipcRenderer.send('refresh-window')
  }

  return (
    <>
      <Layout>
        <Header style={{ position: 'sticky', top: 0, zIndex: 1, width: '100%', padding: '0 20px', margin: 0 }}>
          <div className='main-header flex justify-between align-middle items-center'>
            {/* LOGO */}
            <div className='text-white font-bold text-[28px] px-4 h-[40px] leading-[40px]'>
              <span onClick={refreshWindow}>🏞️</span> wallpaper-box
            </div>
            {/* 菜单栏 */}
            <div className='mr-auto my-[0px] p-[0px] h-full'>
              <MenuBar />
            </div>

            {/* 右边操作栏 */}
            <div className='text-white cursor-pointer text-[30px] flex justify-end gap-4 items-center'>
              {/* 最小化 */}
              <MinusOutlined onClick={minimizeWindow} />

              {isMaximized ? (
                // 恢复
                <FullscreenExitOutlined onClick={unMaximizeWindow} />
              ) : (
                // 最大化
                <BorderOutlined onClick={maximizeWindow} />
              )}
              {/* 关闭按钮 */}
              <CloseOutlined onClick={closeWindow} />
            </div>
          </div>
        </Header>

        {/* 内容区 */}
        <Content className='site-layout' style={{ padding: '20px 20px 0' }}>
          <div style={{ padding: 24, background: colorBgContainer }} id='main-content' className='h-[calc(100vh-118px)] overflow-y-auto'>
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
