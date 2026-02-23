import { Image as CusImage } from '@/components/Image'
import { ipcRenderer } from 'electron'
import { Inbox } from 'lucide-react'
import { toast } from 'sonner'

const fs = require('fs')
const path = require('path')
const os = require('os')
const dir = path.join(os.homedir(), '/wallpaper-box')
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir)
}

export default function List() {
  const [wallpaperList, setWallpaperList] = useState<string[]>([])
  // 获取壁纸
  let mounted = false
  // 获取 /wallpaper-box 文件夹中的所有壁纸
  async function getWallpaperList() {
    try {
      // 使用异步方式读取目录，避免阻塞 UI
      const files = await fs.promises.readdir(dir)
      // 对文件进行过滤, 只保留图片
      const imageFiles = files
        .filter((file: string) => ['.jpg', '.png', '.jpeg'].includes(path.extname(file).toLowerCase()))
        .map((file: string) => path.join(dir, file))

      setWallpaperList(imageFiles)
    } catch (error) {
      console.error('Failed to load wallpapers:', error)
      toast.error('加载壁纸失败')
    }
  }

  // 删除壁纸
  async function deleteWallpaper(filePath: string) {
    try {
      await fs.promises.unlink(filePath)
      getWallpaperList()
    } catch (error) {
      console.error('Failed to delete wallpaper:', error)
      toast.error('删除失败')
    }
  }

  // 设置壁纸
  const setAsBackground = async (item: string) => {
    // 设置壁纸
    ipcRenderer.send('set-wallpaper', item)
    // 通知主进程关闭动态壁纸
    ipcRenderer.send('close-live-wallpaper')
    toast.success('设置成功！')
  }

  useEffect(() => {
    getWallpaperList()

    return () => {
      mounted = true
    }
  }, [])

  return (
    <div className='list-page'>
      {wallpaperList.length > 0 ? (
        <div className='' style={{ columnCount: 5, columnGap: '6px' }}>
          {wallpaperList.map((item: string, index: number) => {
            return (
              <CusImage
                key={index}
                src={`file://${item}`}
                index={index}
                onSet={() => setAsBackground(item)}
                onDelete={() => deleteWallpaper(item)}
                style={{ breakInside: 'avoid-column', marginBottom: '6px' }}
              />
            )
          })}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center py-20 text-slate-400'>
          <Inbox className='mb-4 h-16 w-16' />
          <p className='text-lg'>暂无数据</p>
        </div>
      )}
    </div>
  )
}
