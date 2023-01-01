import { Checkbox, Switch, Spin, message, Image as AntImage, Button } from 'antd'
import { saveFile } from '@/utils/index'
import { getWallHavenAssets } from '@/api/index'
import { useRequest } from 'ahooks'
import _, { debounce } from 'lodash'
import { ipcRenderer } from 'electron'
// import wallpaper from 'wallpaper'
import wallpaper, { getWallpaper, setWallpaper } from 'wallpaper'
import path from 'path'
import fs from 'fs'
import os from 'os'
import Axios from 'axios'
import { downloadImage as downloadImg } from '@/utils/index'

const isMac = process.platform === 'darwin'
// 保存壁纸
const onSave = (item: any) => {
  console.log('🚀🚀🚀 / item', item)
  saveFile(item.path, item.id)
}

export default function List() {
  const [loading, setLoading] = useState(false)
  const [wallpaperList, setWallpaperList] = useState<any[]>([])
  const [query, setQuery] = useState({
    page: 1,
    categories: '000',
    purity: '000',
    /*
    categories  100/101/111* /etc  (general/anime/people)     Turn categories on(1) or off(0)
    purity      100* /110/111/etc  (sfw/sketchy/nsfw)         Turn purities on(1) or off(0)NSFW requires a valid API key
    */
  })

  // 设置壁纸
  const setAsBackground = async (item: any) => {
    // 下载图片
    const fileName = new Date().getTime() + 'background.jpg.jpg'
    const dir = path.join(os.homedir(), '/Pictures/wallpaper-box')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
    const picturePath = path.join(dir, fileName)
    const filepath: string = await downloadImg({ url: item.path, dest: picturePath })

    // 设置壁纸
    await wallpaper.setWallpaper(filepath, { scale: 'auto' })
    message.success('设置成功')
    // ==============================================
    // // 创建图片
    // const img = new Image()
    // img.src = item.path
    // img.onload = (e) => {
    //   const base64Image = convertToBase64(img)
    //   let picturePath = path.join(os.homedir(), '/Pictures', 'background.jpg')
    //   console.log('🚀🚀🚀 / picturePath', picturePath)
    //   picturePath = path.normalize(picturePath)
    //   fs.writeFile(picturePath, base64Image, 'base64', (err) => {
    //     wallpaper.setWallpaper(picturePath, { scale: 'stretch' }).then(() => {
    //       console.log(path.resolve(picturePath))
    //       message.success('设置成功')
    //     })
    //   })
    // }
  }

  const onLevelChange = (checkedValues: any) => {
    console.log('checked = ', checkedValues)
  }

  const onTypeChange = (checkedValues: any) => {
    console.log('checked = ', checkedValues)
  }

  // 获取壁纸
  let mounted = false
  const getWallpaperList = () => {
    setLoading(true)
    if (!mounted) return
    getWallHavenAssets(query).then((res) => {
      const list = res.data
      setWallpaperList((prev) => [...prev, ...list])
      // setQuery((prev) => ({ ...prev, page: prev.page + 1 }))
      setQuery(
        list.length &&
          Object.assign(query, {
            page: query.page + 1,
          }),
      )
      console.log('🚀🚀🚀 / getWallpaperList', query)

      setLoading(false)
    })
  }

  // 滚动加载更多
  const main = document.querySelector('#main-content')!
  const onScroll = debounce(() => {
    if (loading) return
    const { scrollTop, scrollHeight, clientHeight } = main
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      // console.log('🚀🚀🚀 / getWallpaperList')
      getWallpaperList()
    }
  }, 800)

  useEffect(() => {
    main?.addEventListener('scroll', onScroll)
    getWallpaperList()

    return () => {
      mounted = true
      main?.removeEventListener('scroll', onScroll)
    }
  }, [])
  return (
    <div className='list-page'>
      <p className='bg-slate-700 text-white leading-8 box-border pl-4 mb-4'>鼠标左击预览，右击设置为壁纸</p>
      <div className=''>{/* <Switch checkedChildren='人物' unCheckedChildren='人物' onChange={onLevelChange} defaultChecked /> */}</div>
      <div className='grid grid-cols-7 gap-4' onScroll={onScroll}>
        <AntImage.PreviewGroup>
          {wallpaperList.map((item: any, index: number) => {
            return (
              <AntImage
                rootClassName='custom-image'
                onContextMenu={() => setAsBackground(item)}
                key={index}
                src={item.thumbs.small}
                preview={{
                  src: item.path,
                }}
              />
            )
          })}
        </AntImage.PreviewGroup>
      </div>
      <div className='text-center mt-[30px]'>
        <Spin size='large' />
      </div>
    </div>
  )
}
