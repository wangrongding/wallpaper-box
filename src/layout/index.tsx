import { ipcRenderer } from 'electron'
import { Outlet } from 'react-router-dom'
import { Layout, theme } from 'antd'
import { MinusOutlined, FullscreenExitOutlined, BorderOutlined, GithubFilled, SyncOutlined, PlusOutlined } from '@ant-design/icons'
import MenuBar from './Menu'
import './index.scss'
import Logo from '/logo-full.svg'

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
        <Header style={{ position: 'sticky', top: 0, zIndex: 1, width: '100%', padding: '0 20px', margin: 0, height: '50px' }}>
          <div
            className='main-header flex justify-between align-middle items-center h-[50px]'
            onDoubleClick={isMaximized ? unMaximizeWindow : maximizeWindow}
          >
            {/* LOGO */}
            <div className='no-drag text-white font-bold text-[28px] h-[40px] leading-[40px]'>
              <img src={Logo} className='logo h-[40px]' alt='logo' />
              {/* <span onClick={refreshWindow}>🏞️</span> wallpaper-box */}
            </div>
            {/* 菜单栏 */}
            <div className='no-drag mr-auto my-[0px] p-[0px] h-full flex'>
              <MenuBar />
              <div
                className='text-white w-[50px] font-bold text-xl grid place-content-center bg-emerald-600 hover:bg-emerald-400 cursor-pointer'
                onClick={refreshWindow}
              >
                <SyncOutlined style={{ fontWeight: 'bold' }} />
              </div>
            </div>
            <div className=' drag flex-1 w-full h-full text-center'></div>

            {/* 右边操作栏 */}
            <div className='no-drag text-white cursor-pointer text-[30px] flex justify-end gap-4 items-center'>
              {/* 最小化 */}
              <MinusOutlined onClick={minimizeWindow} style={{ fontSize: '30px' }} />

              {isMaximized ? (
                // 恢复
                <FullscreenExitOutlined onClick={unMaximizeWindow} style={{ fontSize: '25px' }} />
              ) : (
                // 最大化
                <BorderOutlined onClick={maximizeWindow} style={{ fontSize: '25px' }} />
              )}
              {/* 关闭按钮 */}
              <PlusOutlined style={{ transform: 'rotate(45deg)', fontSize: '30px' }} onClick={closeWindow} />
            </div>
          </div>
        </Header>

        {/* 内容区 */}
        <Content className='site-layout' style={{ padding: '20px 20px 0' }}>
          <div style={{ padding: 24, background: colorBgContainer }} id='main-content' className='h-[calc(100vh-104px)] overflow-y-auto'>
            <Outlet></Outlet>
          </div>
        </Content>

        {/* 底部 */}
        <Footer className='text-center h-[34px] leading-[34px] p-[0px]' style={{ padding: 0, margin: 0 }}>
          Created by 荣顶，follow me on{' '}
          <a className='text-red-400 inline-flex justify-center items-center' onClick={() => openLinkInBrowser('https://github.com/wangrongding')}>
            Github 🌸 <GithubFilled />
          </a>
        </Footer>
      </Layout>
    </>
  )
}
