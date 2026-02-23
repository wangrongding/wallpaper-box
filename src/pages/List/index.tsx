import { Image as CusImage } from '@/components/Image'
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ipcRenderer } from 'electron'
import { debounce } from 'lodash'
import { Download, X, Inbox, Search } from 'lucide-react'
import { toast } from 'sonner'

const fs = require('fs')
const os = require('os')
const path = require('path')

export default function List() {
  const [loading, setLoading] = useState(false)
  const [wallpaperList, setWallpaperList] = useState<any[]>([])
  const [visible, setVisible] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
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
    keyword: '',
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
        toast.error('请重新尝试，或检查网络，一直不行可尝试全局挂个梯子或者在设置页面配置该应用的代理。')
        setLoading(false)
      }
    }
    // 设置壁纸
    ipcRenderer.send('set-wallpaper', picturePath)
    // 通知主进程关闭动态壁纸
    ipcRenderer.send('close-live-wallpaper')
    // 通知主进程设置壁纸完成 (系统弹窗通知)
    // ipcRenderer.send('asynchronous-message', '设置成功！')
    toast.success('设置成功！')
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
    await setWallpaperList([])
    setQuery(
      Object.assign(query, {
        [type]: checkedVal ? '1' : '0',
        page: 1,
      }),
    )
    await getWallpaperList()
  }

  // 搜索关键词
  const onSearch = (keyword: string) => {
    setWallpaperList([])
    setQuery(
      Object.assign(query, {
        keyword: keyword,
        page: 1,
      }),
    )
    console.log('🚀🚀🚀 / keyword:', keyword, query)
    getWallpaperList()
  }

  // 获取壁纸列表
  async function getWallpaperList(): Promise<void> {
    setLoading(true)
    // await getWallHavenAssets(query)
    const categories = query.general + query.anime + query.people
    const purity = query.sfw + query.sketchy + query.nsfw

    try {
      const res = await fetch(
        `https://wallhaven.cc/api/v1/search?apikey=cClHHdiiE4mLTht8yhzdky3beMhGX3rf&q=${query.keyword}&sorting=${query.sorting}&topRange=1y&page=${query.page}&categories=${categories}&purity=${purity}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          mode: 'no-cors',
        },
      )
      const list = await res.json()
      setWallpaperList((prev) => [...prev, ...list.data])
      setQuery(
        list.data.length &&
          Object.assign(query, {
            page: query.page + 1,
          }),
      )
    } catch {
      query.nsfw === '1' ? toast.error('该分区暂时被限制，可能访问人次过多，请晚点重试') : toast.error('请检查网络，刷新重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = (url: string) => {
    setPreviewSrc(url)
    setVisible(true)
  }

  const onDownload = (src: string) => {
    fetch(src)
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(new Blob([blob]))
        const link = document.createElement('a')
        link.href = url
        link.download = 'image.png'
        document.body.appendChild(link)
        link.click()
        URL.revokeObjectURL(url)
        link.remove()
      })
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
      main?.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div className='list-page'>
      <p className='mb-4 box-border rounded bg-amber-200 pl-4 leading-8 text-black'>
        💡 Tip: 如果加载慢，可以尝试挂梯子🪜 (不挂全局的话，Setting页也支持单独配置网络代理)
      </p>
      {/* 筛选条件 */}
      <div className='mb-[20px] flex items-center gap-4'>
        {filterList.map((item, index) => {
          return (
            <Switch
              key={index}
              label={item}
              onCheckedChange={(val) => {
                onLimitChange(val, item)
              }}
            />
          )
        })}
        <Select defaultValue='toplist' onValueChange={onSortChange}>
          <SelectTrigger className='w-[120px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='toplist'>toplist</SelectItem>
            <SelectItem value='views'>views</SelectItem>
            <SelectItem value='favorites'>favorites</SelectItem>
          </SelectContent>
        </Select>
        <div className='relative w-[300px]'>
          <Input
            placeholder='input search text'
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch(searchKeyword)
            }}
            className='pr-10'
          />
          <button
            onClick={() => onSearch(searchKeyword)}
            className='absolute right-0 top-0 flex h-full items-center justify-center rounded-r-md bg-blue-600 px-3 text-white transition-colors hover:bg-blue-700'
          >
            <Search className='h-4 w-4' />
          </button>
        </div>
      </div>
      {/* 壁纸列表 */}
      {wallpaperList.length ? (
        <div className='grid grid-cols-7 gap-2' onScroll={onScroll}>
          {wallpaperList.map((item: any, index: number) => {
            return (
              <CusImage
                key={index}
                src={item.thumbs.small}
                previewSrc={item.path}
                index={index}
                onPreview={handlePreview}
                onSet={() => setAsBackground(item)}
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

      {/* Image Preview Dialog */}
      <Dialog
        open={visible}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewSrc('')
            setVisible(false)
          }
        }}
      >
        <DialogPortal>
          <DialogOverlay />
          <div className='fixed inset-0 z-50 flex items-center justify-center'>
            <div className='relative max-h-[90vh] max-w-[90vw]'>
              <img src={previewSrc} alt='preview' className='max-h-[85vh] max-w-[85vw] rounded-lg object-contain' />
              {/* Toolbar */}
              <div className='absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/50 px-6 py-3'>
                <button onClick={() => onDownload(previewSrc)} className='text-white transition-colors hover:text-slate-300'>
                  <Download className='h-5 w-5' />
                </button>
                <button
                  onClick={() => {
                    setPreviewSrc('')
                    setVisible(false)
                  }}
                  className='text-white transition-colors hover:text-slate-300'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>
            </div>
          </div>
        </DialogPortal>
      </Dialog>

      {loading && (
        <div className='fixed inset-0 z-50 grid h-full w-full place-content-center bg-white/40'>
          <div className='flex flex-col items-center gap-3'>
            <div className='h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600'></div>
            <span className='text-sm text-slate-500'>Loading...</span>
          </div>
        </div>
      )}
    </div>
  )
}
