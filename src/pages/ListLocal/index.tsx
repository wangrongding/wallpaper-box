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
  const [visible, setVisible] = useState(-1)
  const [messageApi, contextHolder] = message.useMessage()
  // 获取壁纸
  let mounted = false
  // 获取 /wallpaper-box 文件夹中的所有壁纸
  function getWallpaperList() {
    // 对文件进行过滤, 只保留图片
    let files: string[] = []
    fs.readdirSync(dir).forEach((file: string) => {
      if (['.jpg', '.png', '.jpeg'].includes(path.extname(file))) {
        files.push(path.join(dir, file))
      }
    })
    setWallpaperList(files)
  }

  // 删除壁纸
  function deleteWallpaper(filePath: string) {
    fs.unlinkSync(filePath)
    getWallpaperList()
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
                previewSrc={`file://${item}`}
                visible={visible}
                index={index}
                onPreview={() => setVisible(index)}
                onSet={() => setAsBackground(item)}
                onVisibleChange={() => setVisible(-1)}
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
