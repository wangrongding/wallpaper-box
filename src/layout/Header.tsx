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
    <header className='bg-[var(--bg-base)]/80 sticky top-0 z-10 h-[48px] w-full border-b border-[var(--border-subtle)] backdrop-blur-xl'>
      <div className='main-header flex h-[48px] items-center justify-between px-4' onDoubleClick={isMaximized ? unMaximizeWindow : maximizeWindow}>
        {/* LOGO */}
        <div className='no-drag flex h-[36px] items-center gap-2'>
          <img src={Logo} className='logo h-full w-[140px]' alt='logo' />
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
