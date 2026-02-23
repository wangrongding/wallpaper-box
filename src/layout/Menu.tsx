import { cn } from '@/lib/utils'
import { menuRoutes } from '@/routers/index'
import { ipcRenderer } from 'electron'
import { RefreshCw } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

const fs = require('fs')
const os = require('os')
const path = require('path')

const MenuBar: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const currentRoute = useLocation()

  // 路由跳转
  function handleMenuClick(path: string) {
    navigate(path)
  }

  // 刷新窗口
  function refreshWindow() {
    ipcRenderer.send('refresh-window')
  }

  // 设置随机壁纸
  async function setRandomWallpaper() {
    setLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20 * 1000)
      /*
      推荐的分辨率：
          16/9: 1920x1080 2560x1440 3840x2160
          16/10: 1920x1200 2560x1600 3840x2400
          4/3: 1920x1440 2560x1920 3840x2880
          5/4: 1920x1536 2560x2048 3840x3072
      */
      const response = await fetch('https://source.unsplash.com/random/3840x2400', { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
      }

      const dir = path.join(os.homedir(), '/wallpaper-box')
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
      const picturePath = path.join(dir, new Date().getTime() + '.jpg')
      const buffer = await response.arrayBuffer()
      fs.writeFileSync(picturePath, Buffer.from(buffer))
      console.log('Image downloaded successfully!')
      // 设置壁纸
      ipcRenderer.send('set-wallpaper', picturePath)
      // 通知主进程关闭动态壁纸
      ipcRenderer.send('close-live-wallpaper')
      toast.success('设置成功！')
      setLoading(false)
    } catch {
      setLoading(false)
      toast.error('请重新尝试，或检查网络，一直不行可尝试全局挂个梯子或者在设置页面配置该应用的代理。')
    }
  }
  return (
    <div className='no-drag my-0 mr-auto flex h-full items-center p-0'>
      <nav className='flex h-[50px] items-center'>
        {menuRoutes.map((item: any) => (
          <button
            key={item.path}
            onClick={() => handleMenuClick(item.path)}
            className={cn(
              'flex h-[50px] items-center gap-1.5 px-4 text-sm text-slate-300 transition-colors hover:bg-blue-600 hover:text-white',
              currentRoute.pathname === item.path && 'bg-blue-600 text-white',
            )}
          >
            {item.icon}
            <span>{item.title}</span>
          </button>
        ))}
      </nav>
      <div
        className='relative grid h-[50px] w-[100px] cursor-pointer place-content-center bg-teal-950 text-white hover:bg-cyan-800'
        onClick={setRandomWallpaper}
      >
        {loading && (
          <div className='absolute left-0 top-0 flex h-full w-full place-content-center place-items-center bg-black/50'>
            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-white'></div>
          </div>
        )}
        一键随机
      </div>
      <div
        className='grid h-[50px] w-[50px] cursor-pointer place-content-center bg-emerald-600 text-xl font-bold text-white hover:bg-emerald-400'
        onClick={refreshWindow}
      >
        <RefreshCw className='h-5 w-5' />
      </div>
    </div>
  )
}
export default MenuBar
