import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ipcRenderer } from 'electron'
import { useState } from 'react'
import { toast } from 'sonner'

const WebWallpaper = () => {
  const [url, setUrl] = useState('')

  const handleSetWallpaper = () => {
    if (!url) {
      toast.warning('请输入网址或文件路径')
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
      } else if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/.test(targetUrl) || targetUrl.startsWith('localhost')) {
        targetUrl = `http://${targetUrl}`
      } else {
        targetUrl = `file://${targetUrl}`
      }
    }

    ipcRenderer.send('create-web-live-wallpaper', targetUrl)
    toast.success('网页壁纸设置成功')
  }

  const handleCloseWallpaper = () => {
    ipcRenderer.send('close-web-live-wallpaper')
    toast.success('网页壁纸已关闭')
  }

  return (
    <div className='flex h-full flex-col items-center justify-center p-10'>
      <h1 className='mb-8 text-3xl font-bold'>网页壁纸</h1>
      <div className='text-gray-400'>
        <p>提示：</p>
        <ul className='list-disc pl-5'>
          <li>1.支持在线网址，如：https://threejs.org/examples/#webgl_animation_keyframes</li>
          <li>
            2.支持本地 HTML 文件 (需要输入完整路径) ,如：
            <br />
            Windows: D:\path\to\your\file.html <br />
            MacOS或Linux: /path/to/your/file.html
          </li>
        </ul>
      </div>

      <div className='mb-4 mt-8 w-full max-w-2xl'>
        <Input
          placeholder='请输入网址 (http://...) 或本地 HTML 文件路径'
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className='h-10 text-base text-black'
        />
      </div>
      <div className='flex gap-4'>
        <Button onClick={handleSetWallpaper} className='px-8 py-2 text-lg'>
          设置壁纸
        </Button>
        <Button variant='destructive' onClick={handleCloseWallpaper} className='px-8 py-2 text-lg'>
          关闭壁纸
        </Button>
      </div>
    </div>
  )
}

export default WebWallpaper
