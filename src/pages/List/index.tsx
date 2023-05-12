import { Select, Switch, Spin, message, Image as AntImage, Button } from 'antd'
import _, { debounce } from 'lodash'
import { ipcRenderer } from 'electron'
import { CheckCircleFilled, EyeFilled } from '@ant-design/icons'

// import path from 'path'
// import os from 'os'
// import fs from 'fs'
const fs = require('fs')
const os = require('os')
const path = require('path')

export default function List() {
  const [loading, setLoading] = useState(false)
  const [wallpaperList, setWallpaperList] = useState<any[]>([])
  const [visible, setVisible] = useState(-1)
  const [query, setQuery] = useState({
    general: '0',
    anime: '0',
    people: '0',
    sfw: '0',
    sketchy: '0',
    nsfw: '0',
    /*
    categories  100/101/111* /etc  (general/anime/people)     Turn categories on(1) or off(0)
    purity      100* /110/111/etc  (sfw/sketchy/nsfw)         Turn purities on(1) or off(0)NSFW requires a valid API key
    */

    page: 1,
    sorting: 'toplist',
  })

  const filterList = ['general', 'anime', 'people', 'sfw', 'sketchy', 'nsfw']

  // 设置壁纸
  const setAsBackground = async (item: any) => {
    setLoading(true)
    // 下载图片
    const fileName = item.path.split('/').pop()
    const dir = path.join(os.homedir(), '/wallpaper-box')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
    const picturePath = path.join(dir, fileName)
    // 判断文件是否存在
    if (!fs.existsSync(picturePath)) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60 * 1000)
        const response = await fetch(item.path, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
        }

        const buffer = await response.arrayBuffer()
        fs.writeFileSync(picturePath, Buffer.from(buffer))
        console.log('Image downloaded successfully!')
      } catch {
        alert('请重新尝试，或检查网络，一直不行可尝试全局挂个梯子或者在设置页面配置该应用的代理。')
        setLoading(false)
      }
    }
    // 设置壁纸
    ipcRenderer.send('set-wallpaper', picturePath)
    // 通知主进程设置壁纸完成
    ipcRenderer.send('asynchronous-message', '设置成功！')
    // 通知主进程关闭动态壁纸
    ipcRenderer.send('close-live-wallpaper')
    setLoading(false)
  }

  // 排序方式改变
  const onSortChange = (checkedVal: any) => {
    console.log('checked = ', checkedVal)
    setQuery(
      Object.assign(query, {
        sorting: checkedVal,
        page: 1,
      }),
    )
    setWallpaperList([])
    getWallpaperList()
  }

  // 限制条件改变
  const onLimitChange = async (checkedVal: any, type: any) => {
    setQuery(
      Object.assign(query, {
        [type]: checkedVal ? '1' : '0',
        page: 1,
      }),
    )
    await setWallpaperList([])
    await getWallpaperList()
  }

  // 获取壁纸
  let mounted = false
  async function getWallpaperList(): Promise<void> {
    setLoading(true)
    // await getWallHavenAssets(query)
    const categories = query.general + query.anime + query.people
    const purity = query.sfw + query.sketchy + query.nsfw

    const res = await fetch(
      `https://wallhaven.cc/api/v1/search?apikey=5RTfusrTnRbHBHs2oWWggQERAzHO2XTO&sorting=${query.sorting}&topRange=1y&page=${query.page}&categories=${categories}&purity=${purity}`,
    )
    const list = await res.json()
    console.log('🚀🚀🚀 / res:', list.data)
    setWallpaperList((prev) => [...prev, ...list.data])
    setQuery(
      list.data.length &&
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
        <div className='mb-[20px] flex gap-4'>
          {filterList.map((item, index) => {
            return (
              <Switch
                key={index}
                checkedChildren={item}
                unCheckedChildren={item}
                onChange={(val) => {
                  onLimitChange(val, item)
                }}
              />
            )
          })}
          <Select
            defaultValue='toplist'
            style={{ width: 120 }}
            onChange={onSortChange}
            options={[
              { value: 'favorites', label: 'favorites' },
              { value: 'toplist', label: 'toplist' },
              { value: 'views', label: 'views' },
            ]}
          />
        </div>
        <div className='grid grid-cols-7 gap-4' onScroll={onScroll}>
          {wallpaperList.map((item: any, index: number) => {
            return (
              <div key={index} className='relative'>
                <img src={item.thumbs.small} alt='' style={{ breakInside: 'avoid-column', marginBottom: '6px' }} />
                <AntImage
                  width={0}
                  height={0}
                  className='absolute top-0 left-0 right-0 bottom-0'
                  style={{ display: 'none !important', width: 0, height: 0 }}
                  src={item.thumbs.small}
                  preview={{
                    visible: visible === index,
                    scaleStep: 0.2,
                    src: item.path,
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
                    onClick={() => setAsBackground(item)}
                    className='bg-teal-500 text-white w-fit p-3 rounded-md shadow-md cursor-pointer grid place-content-center'
                  >
                    <CheckCircleFilled style={{ fontSize: '16px' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className='text-center mt-[30px]'>
          <Spin tip='Loading' size='small' />
        </div>
      </div>
    </Spin>
  )
}
