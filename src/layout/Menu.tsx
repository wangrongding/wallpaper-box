import { cn } from '@/lib/utils'
import { menuRoutes } from '@/routers/index'
import { ipcRenderer } from 'electron'
import { Dice5, RefreshCw } from 'lucide-react'
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
      ipcRenderer.send('set-wallpaper', picturePath)
      ipcRenderer.send('close-live-wallpaper')
      toast.success('设置成功！')
      setLoading(false)
    } catch {
      setLoading(false)
      toast.error('请重新尝试，或检查网络，一直不行可尝试全局挂个梯子或者在设置页面配置该应用的代理。')
    }
  }
  return (
    <div className='no-drag my-0 mr-auto flex h-full items-center gap-1 p-0'>
      <nav className='flex h-[48px] items-center gap-0.5'>
        {menuRoutes.map((item: any) => (
          <button
            key={item.path}
            onClick={() => handleMenuClick(item.path)}
            className={cn(
              'relative flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-all duration-200',
              'text-[var(--text-secondary)] hover:bg-[var(--bg-glass-hover)] hover:text-[var(--text-primary)]',
              currentRoute.pathname === item.path && 'bg-[var(--bg-glass-active)] text-[var(--accent-primary)] shadow-sm',
            )}
          >
            {item.icon}
            <span>{item.title}</span>
            {currentRoute.pathname === item.path && (
              <span className='absolute -bottom-[10px] left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-[var(--accent-primary)]' />
            )}
          </button>
        ))}
      </nav>
      <div className='mx-2 h-4 w-px bg-[var(--border-default)]' />
      <button
        className={cn(
          'relative flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-all duration-200',
          'bg-gradient-to-r from-[var(--accent-primary)] to-sky-400 text-white shadow-sm',
          'hover:shadow-[var(--shadow-glow)] hover:brightness-110',
          loading && 'pointer-events-none opacity-70',
        )}
        onClick={setRandomWallpaper}
      >
        {loading ? (
          <div className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white' />
        ) : (
          <Dice5 className='h-3.5 w-3.5' />
        )}
        <span>一键随机</span>
      </button>
      <button
        className='flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-all duration-200 hover:bg-[var(--bg-glass-hover)] hover:text-[var(--text-primary)]'
        onClick={refreshWindow}
        title='刷新'
      >
        <RefreshCw className='h-3.5 w-3.5' />
      </button>
    </div>
  )
}
export default MenuBar
