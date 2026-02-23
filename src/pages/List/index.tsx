import { Image as CusImage } from '@/components/Image'
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ipcRenderer } from 'electron'
import { debounce } from 'lodash'
import { Download, X, Inbox, Search, Loader2, Monitor, ZoomIn, ZoomOut } from 'lucide-react'
import { toast } from 'sonner'

const fs = require('fs')
const os = require('os')
const path = require('path')

export default function List() {
  const [loading, setLoading] = useState(false)
  const [wallpaperList, setWallpaperList] = useState<any[]>([])
  const [visible, setVisible] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')
  const [previewScale, setPreviewScale] = useState(1)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [query, setQuery] = useState({
    general: '0',
    anime: '0',
    people: '0',
    sfw: '0',
    sketchy: '0',
    nsfw: '0',

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
    setPreviewScale(1)
    setVisible(true)
  }

  const closePreview = () => {
    setPreviewSrc('')
    setPreviewScale(1)
    setVisible(false)
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

  // ESC 关闭预览
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        closePreview()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible])

  return (
    <div className='list-page animate-fade-in-up'>
      {/* 提示信息 */}
      <div className='mb-4 flex items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-2.5 text-[13px] text-sky-300/80'>
        <span className='text-base'>💡</span>
        <span>加载慢？可以挂梯子 🪜 或在设置页配置网络代理</span>
      </div>
      {/* 筛选条件 */}
      <div className='mb-5 flex flex-wrap items-center gap-3'>
        <div className='flex items-center gap-2 rounded-lg bg-[var(--bg-glass)] p-1.5'>
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
        </div>
        <Select defaultValue='toplist' onValueChange={onSortChange}>
          <SelectTrigger className='w-[130px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='toplist'>toplist</SelectItem>
            <SelectItem value='views'>views</SelectItem>
            <SelectItem value='favorites'>favorites</SelectItem>
          </SelectContent>
        </Select>
        <div className='relative ml-auto w-[280px]'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]' />
          <Input
            placeholder='搜索壁纸...'
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch(searchKeyword)
            }}
            className='pl-9'
          />
        </div>
      </div>
      {/* 壁纸列表 */}
      {wallpaperList.length ? (
        <div className='grid grid-cols-5 gap-3' onScroll={onScroll}>
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
        <div className='flex flex-col items-center justify-center py-20 text-[var(--text-tertiary)]'>
          <Inbox className='mb-4 h-14 w-14 opacity-40' />
          <p className='font-display text-base font-medium'>暂无数据</p>
          <p className='mt-1 text-[13px] opacity-60'>调整筛选条件或搜索关键词</p>
        </div>
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={visible}
        onOpenChange={(open) => {
          if (!open) {
            closePreview()
          }
        }}
      >
        <DialogPortal>
          <DialogOverlay className='bg-black/80 backdrop-blur-sm' />
          <div
            className='fixed inset-0 z-50 flex items-center justify-center'
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault()
                setPreviewScale((s) => Math.min(Math.max(0.2, s - e.deltaY * 0.005), 5))
              }
            }}
          >
            <div className='relative max-h-[90vh] max-w-[90vw] animate-slide-up'>
              <img
                src={previewSrc}
                alt='preview'
                className='max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl transition-transform duration-150 ease-out'
                style={{ transform: `scale(${previewScale})` }}
                draggable={false}
              />
              {/* Toolbar */}
              <div className='absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-4 py-2 shadow-2xl backdrop-blur-xl'>
                <button
                  onClick={() => {
                    const item = wallpaperList.find((w) => w.path === previewSrc)
                    if (item) {
                      closePreview()
                      setAsBackground(item)
                    }
                  }}
                  className='flex h-8 w-8 items-center justify-center rounded-full text-emerald-400/90 transition-all hover:bg-emerald-500/15 hover:text-emerald-300'
                  title='设置壁纸'
                >
                  <Monitor className='h-4 w-4' />
                </button>
                <div className='h-4 w-px bg-white/15' />
                <button
                  onClick={() => onDownload(previewSrc)}
                  className='flex h-8 w-8 items-center justify-center rounded-full text-sky-400/90 transition-all hover:bg-sky-500/15 hover:text-sky-300'
                  title='下载'
                >
                  <Download className='h-4 w-4' />
                </button>
                <div className='h-4 w-px bg-white/15' />
                <button
                  onClick={() => setPreviewScale((s) => Math.min(s + 0.25, 5))}
                  className='flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-all hover:bg-white/10 hover:text-white'
                  title='放大'
                >
                  <ZoomIn className='h-4 w-4' />
                </button>
                <button
                  onClick={() => setPreviewScale((s) => Math.max(s - 0.25, 0.2))}
                  className='flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-all hover:bg-white/10 hover:text-white'
                  title='缩小'
                >
                  <ZoomOut className='h-4 w-4' />
                </button>
                <div className='h-4 w-px bg-white/15' />
                <button
                  onClick={closePreview}
                  className='flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-all hover:bg-red-500/15 hover:text-red-400'
                  title='关闭 (Esc)'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            </div>
          </div>
        </DialogPortal>
      </Dialog>

      {loading && (
        <div className='bg-[var(--bg-deep)]/60 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm'>
          <div className='flex flex-col items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-8 py-6 shadow-2xl'>
            <Loader2 className='h-8 w-8 animate-spin text-[var(--accent-primary)]' />
            <span className='text-sm text-[var(--text-secondary)]'>加载中...</span>
          </div>
        </div>
      )}
    </div>
  )
}
