import { Image as AntImage } from 'antd'
import { CheckCircleFilled, EyeFilled, DeleteFilled } from '@ant-design/icons'
import { ipcRenderer } from 'electron'

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
        {wallpaperList.map((item: string, index: number) => {
          return (
            <div key={index} className='relative'>
              <img src={`file://${item}`} alt='' style={{ breakInside: 'avoid-column', marginBottom: '6px' }} />
              <AntImage
                width={0}
                height={0}
                className='absolute top-0 left-0 right-0 bottom-0'
                style={{ display: 'none !important', width: 0, height: 0 }}
                src={`file://${item}`}
                preview={{
                  visible: visible === index,
                  scaleStep: 0.1,
                  src: `file://${item}`,
                  onVisibleChange: (value) => {
                    setVisible(-1)
                  },
                }}
              />
              <div className=' absolute top-0 left-0 right-0 bottom-0 opacity-0 hover:opacity-100 flex justify-center flex-row text-center items-center gap-4 bg-black bg-opacity-70'>
                <div
                  onClick={() => setVisible(index)}
                  className='bg-cyan-500 text-white w-fit p-3 rounded-md shadow-md cursor-pointer grid place-content-center'
                >
                  <EyeFilled style={{ fontSize: '16px' }} />
                </div>
                <div
                  onClick={() => ipcRenderer.send('set-wallpaper', item)}
                  className='bg-teal-500 text-white w-fit p-3 rounded-md shadow-md cursor-pointer grid place-content-center'
                >
                  <CheckCircleFilled style={{ fontSize: '16px' }} />
                </div>
                <div
                  onClick={() => deleteWallpaper(item)}
                  className='bg-red-500  text-white w-fit p-3 rounded-md shadow-md cursor-pointer grid place-content-center'
                >
                  <DeleteFilled style={{ fontSize: '16px' }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
