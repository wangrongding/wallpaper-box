import MenuBar from './Menu'
import WindowActions from './WindowActions'
import Logo from '/logo-full.svg'
import { ipcRenderer } from 'electron'

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
    <header className='sticky top-0 z-10 h-[50px] w-full bg-[#001529] px-5'>
      <div className='main-header flex h-[50px] items-center justify-between' onDoubleClick={isMaximized ? unMaximizeWindow : maximizeWindow}>
        {/* LOGO */}
        <div className='no-drag h-[40px] text-[28px] font-bold leading-[40px] text-white'>
          <img src={Logo} className='logo h-[40px]' alt='logo' />
        </div>
        {/* 菜单栏 */}
        <MenuBar />
        <div className='drag h-full w-full flex-1'></div>
        {/* 右边窗口操作栏 */}
        <WindowActions />
      </div>
    </header>
  )
}
