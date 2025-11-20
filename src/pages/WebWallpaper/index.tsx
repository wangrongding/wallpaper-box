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
    let targetUrl = url
    // 简单的处理，如果不是 http 开头，且看起来像绝对路径，加上 file://
    if (!url.startsWith('http') && !url.startsWith('file://')) {
        targetUrl = `file://${url}`
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
