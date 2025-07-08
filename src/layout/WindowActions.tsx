import { ipcRenderer } from 'electron'
import { MinusOutlined, FullscreenExitOutlined, BorderOutlined, PlusOutlined } from '@ant-design/icons'

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
    </>
  )
}
