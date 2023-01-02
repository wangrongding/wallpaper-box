import { Checkbox, Switch, Spin, message, Image as AntImage, Button } from 'antd'
import { saveFile } from '@/utils/index'
import { getWallHavenAssets } from '@/api/index'
import _, { debounce } from 'lodash'
import { ipcRenderer } from 'electron'
import wallpaper from 'wallpaper'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { downloadImage as downloadImg } from '@/utils/index'

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
    setLoading(true)
    // 下载图片
    const fileName = item.path.split('/').pop()
    const dir = path.join(os.homedir(), '/Pictures/wallpaper-box')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
    const picturePath = path.join(dir, fileName)
    const filepath: string = await downloadImg({ url: item.path, dest: picturePath })

    // 设置壁纸
    await wallpaper.setWallpaper(filepath, { scale: 'auto' })
    ipcRenderer.send('create-static-wallpaper')
    ipcRenderer.send('asynchronous-message', '设置成功！')
    setLoading(false)
  }

  const onLevelChange = (checkedValues: any) => {
    console.log('checked = ', checkedValues)
  }

  const onTypeChange = (checkedValues: any) => {
    console.log('checked = ', checkedValues)
  }

  // 获取壁纸
  let mounted = false
  async function getWallpaperList(): Promise<void> {
    setLoading(true)
    if (!mounted) return
    console.log('🚀🚀🚀 / query', query)
    const res = await getWallHavenAssets(query)
    const list = res.data
    setWallpaperList((prev) => [...prev, ...list])
    setQuery(
      list.length &&
        Object.assign(query, {
          page: query.page + 1,
        }),
    )
    setLoading(false)
  }

  // TODO api key 需要做持久化配置
  // 没有 api key 时，每次请求只有 24 条数据，所以需要多次请求
  async function getWallpaperListWithNoApiKey(times: number = 3) {
    for (let i = 0; i < times - 1; i++) {
      await getWallpaperList()
    }
  }

  // 滚动加载更多
  const main = document.querySelector('#main-content')!
  const onScroll = debounce(() => {
    if (loading) return
    const { scrollTop, scrollHeight, clientHeight } = main
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      getWallpaperList()
    }
  }, 800)

  useEffect(() => {
    main.addEventListener('scroll', onScroll)
    getWallpaperList()

    return () => {
      mounted = true
      main?.removeEventListener('scroll', onScroll)
    }
  }, [])
  return (
    <Spin spinning={loading}>
      <div className='list-page'>
        <p className='text-black bg-amber-200 leading-8 box-border pl-4 mb-4'>💡 Tip:使用鼠标左击预览图片，右击将其设为壁纸。</p>
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
          <Spin tip='Loading' size='small' />
        </div>
      </div>
    </Spin>
  )
}
