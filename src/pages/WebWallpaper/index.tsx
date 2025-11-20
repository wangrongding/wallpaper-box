import { useState } from 'react'
import { Input, message } from 'antd'
import { ipcRenderer } from 'electron'

const WebWallpaper = () => {
  const [url, setUrl] = useState('')

  const handleSetWallpaper = () => {
    if (!url) {
      message.warning('请输入网址或文件路径')
      return
    }
    let targetUrl = url.trim()
    // 检查是否包含协议头
    const hasProtocol = /^(http|https|file):\/\//i.test(targetUrl)

    if (!hasProtocol) {
      // 检查是否是 Windows 绝对路径 (例如 C:\ 或 C:/)
      const isWinPath = /^[a-zA-Z]:[\\/]/.test(targetUrl)
      // 检查是否是 Unix/Linux/macOS 绝对路径 (例如 /Users/...)
      const isUnixPath = targetUrl.startsWith('/')

      if (isWinPath || isUnixPath) {
        targetUrl = `file://${targetUrl}`
      } else if (
        /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/.test(targetUrl) ||
        targetUrl.startsWith('localhost')
      ) {
        // 如果看起来像域名 (例如 google.com, localhost)，默认添加 http://
        targetUrl = `http://${targetUrl}`
      } else {
        // 其他情况，默认尝试作为 file 协议处理
        targetUrl = `file://${targetUrl}`
      }
    }
    
    ipcRenderer.send('create-web-live-wallpaper', targetUrl)
    message.success('网页壁纸设置成功')
  }

  const handleCloseWallpaper = () => {
    ipcRenderer.send('close-web-live-wallpaper')
    message.success('网页壁纸已关闭')
  }

  return (
    <div className='flex h-full flex-col items-center justify-center p-10 text-white'>
      <h1 className='mb-8 text-3xl font-bold'>网页壁纸</h1>
      <div className='mb-4 w-full max-w-md'>
        <Input
          placeholder='请输入网址 (http://...) 或本地 HTML 文件路径'
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          size='large'
        />
      </div>
      <div className='flex gap-4'>
        <button
          className='rounded-lg bg-blue-600 px-8 py-2 text-lg font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800'
          onClick={handleSetWallpaper}
        >
          设置壁纸
        </button>
        <button
          className='rounded-lg bg-red-600 px-8 py-2 text-lg font-medium text-white transition-colors hover:bg-red-700 active:bg-red-800'
          onClick={handleCloseWallpaper}
        >
          关闭壁纸
        </button>
      </div>
      <div className='mt-8 text-gray-400'>
        <p>提示：</p>
        <ul className='list-disc pl-5'>
          <li>支持在线网址，如：https://threejs.org/examples/#webgl_animation_keyframes</li>
          <li>支持本地 HTML 文件，请输入完整路径,如：C:\path\to\your\file.html 或 /path/to/your/file.html</li>
        </ul>
      </div>
    </div>
  )
}

export default WebWallpaper
