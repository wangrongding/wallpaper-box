import { ipcRenderer } from 'electron'
import { Layout } from 'antd'
import MenuBar from './Menu'
import WindowActions from './WindowActions'
import Logo from '/logo-full.svg'

const { Header: HeaderLayout } = Layout
export default function Header() {
  // 窗口是否最大化
  const [isMaximized, setIsMaximized] = useState(false)

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

  return (
    <>
      <HeaderLayout style={{ position: 'sticky', top: 0, zIndex: 1, width: '100%', padding: '0 20px', margin: 0, height: '50px' }}>
        <div
          className='main-header flex justify-between align-middle items-center h-[50px]'
          onDoubleClick={isMaximized ? unMaximizeWindow : maximizeWindow}
        >
          {/* LOGO */}
          <div className='no-drag text-white font-bold text-[28px] h-[40px] leading-[40px]'>
            <img src={Logo} className='logo h-[40px]' alt='logo' />
          </div>
          {/* 菜单栏 */}
          <MenuBar />
          <div className='drag flex-1 w-full h-full'></div>
          {/* 右边窗口操作栏 */}
          <WindowActions />
        </div>
      </HeaderLayout>
    </>
  )
}
