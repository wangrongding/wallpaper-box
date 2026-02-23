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
    <>
      {/* 右边操作栏 */}
      <div className='no-drag flex cursor-pointer items-center justify-end gap-3 text-white'>
        {/* 最小化 */}
        <button className='rounded p-1 transition-colors hover:bg-white/20' onClick={minimizeWindow}>
          <Minus className='h-5 w-5' />
        </button>

        {isMaximized ? (
          // 恢复
          <button className='rounded p-1 transition-colors hover:bg-white/20' onClick={unMaximizeWindow}>
            <Minimize2 className='h-5 w-5' />
          </button>
        ) : (
          // 最大化
          <button className='rounded p-1 transition-colors hover:bg-white/20' onClick={maximizeWindow}>
            <Maximize2 className='h-5 w-5' />
          </button>
        )}
        {/* 关闭按钮 */}
        <button className='rounded p-1 transition-colors hover:bg-red-500' onClick={closeWindow}>
          <X className='h-5 w-5' />
        </button>
      </div>
    </>
  )
}
