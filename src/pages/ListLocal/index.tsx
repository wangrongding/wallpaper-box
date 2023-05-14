import { Image as AntImage } from 'antd'
import { CheckCircleFilled, EyeFilled, DeleteFilled } from '@ant-design/icons'
import { ipcRenderer } from 'electron'
import { Image as CusImage } from '@/components/Image'

const fs = require('fs')
const path = require('path')
const os = require('os')
const dir = path.join(os.homedir(), '/wallpaper-box')

export default function List() {
  const [wallpaperList, setWallpaperList] = useState<string[]>([])
  const [visible, setVisible] = useState(-1)
  // 获取壁纸
  let mounted = false
  // 获取 /wallpaper-box 文件夹中的所有壁纸
  function getWallpaperList() {
    // 对文件进行过滤, 只保留图片
    let files: string[] = []
    fs.readdirSync(dir).map((file: string) => {
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

  useEffect(() => {
    getWallpaperList()

    return () => {
      mounted = true
    }
  }, [])

  return (
    <div className='list-page'>
      <div className='' style={{ columnCount: 5, columnGap: '6px' }}>
        {wallpaperList.map((item: any, index: number) => {
          return (
            <CusImage
              key={index}
              src={`file://${item}`}
              previewSrc={`file://${item}`}
              visible={visible}
              index={index}
              onPreview={() => setVisible(index)}
              onSet={() => ipcRenderer.send('set-wallpaper', item)}
              onVisibleChange={() => setVisible(-1)}
              onDelete={() => deleteWallpaper(item)}
              style={{ breakInside: 'avoid-column', marginBottom: '6px' }}
            />
          )
        })}
      </div>
    </div>
  )
}
