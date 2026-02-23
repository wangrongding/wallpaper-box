import { ipcRenderer } from 'electron'
import { Minus, Maximize2, Minimize2, X } from 'lucide-react'

export default function WindowActions() {
  // 窗口是否最大化
  const [isMaximized, setIsMaximized] = useState(false)

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

  return (
    <div className='no-drag flex items-center gap-1.5'>
      <button
        className='flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-all duration-200 hover:bg-[var(--bg-glass-hover)] hover:text-[var(--text-primary)]'
        onClick={minimizeWindow}
      >
        <Minus className='h-3.5 w-3.5' />
      </button>

      {isMaximized ? (
        <button
          className='flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-all duration-200 hover:bg-[var(--bg-glass-hover)] hover:text-[var(--text-primary)]'
          onClick={unMaximizeWindow}
        >
          <Minimize2 className='h-3.5 w-3.5' />
        </button>
      ) : (
        <button
          className='flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-all duration-200 hover:bg-[var(--bg-glass-hover)] hover:text-[var(--text-primary)]'
          onClick={maximizeWindow}
        >
          <Maximize2 className='h-3.5 w-3.5' />
        </button>
      )}
      <button
        className='flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-all duration-200 hover:bg-red-500/80 hover:text-white'
        onClick={closeWindow}
      >
        <X className='h-3.5 w-3.5' />
      </button>
    </div>
  )
}
