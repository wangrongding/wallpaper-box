import { Image as CusImage } from '@/components/Image'
import { Empty, message } from 'antd'
import { ipcRenderer } from 'electron'

const fs = require('fs')
const path = require('path')
const os = require('os')
const dir = path.join(os.homedir(), '/wallpaper-box')
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir)
}

export default function List() {
  const [wallpaperList, setWallpaperList] = useState<string[]>([])
  const [messageApi, contextHolder] = message.useMessage()
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
      messageApi.error('加载壁纸失败')
    }
  }

  // 删除壁纸
  async function deleteWallpaper(filePath: string) {
    try {
      await fs.promises.unlink(filePath)
      getWallpaperList()
    } catch (error) {
      console.error('Failed to delete wallpaper:', error)
      messageApi.error('删除失败')
    }
  }

  // 设置壁纸
  const setAsBackground = async (item: string) => {
    // 设置壁纸
    ipcRenderer.send('set-wallpaper', item)
    // 通知主进程关闭动态壁纸
    ipcRenderer.send('close-live-wallpaper')
    // 通知主进程设置壁纸完成 (系统弹窗通知)
    // ipcRenderer.send('asynchronous-message', '设置成功！')
    messageApi.success('设置成功！')
  }

  useEffect(() => {
    getWallpaperList()

    return () => {
      mounted = true
    }
  }, [])

  return (
    <div className='list-page'>
      {contextHolder}
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
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  )
}
