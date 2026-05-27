import { Image as CusImage } from '@/components/Image'
import { Button } from '@/components/ui/button'
import { fs, ipcRenderer, toRendererFileUrl } from '@/lib/electron-runtime'
import { FolderOpen, HardDrive, ImageIcon, Inbox } from 'lucide-react'
import { toast } from 'sonner'

type LocalWallpaperItem = {
  modifiedAt: number
  path: string
  size: number
  thumbnailPath?: string
}

type OpenDirectoryResponse = {
  message?: string
  path?: string
  success?: boolean
}

function formatStorageSize(bytes: number) {
  if (!bytes) {
    return '0 MB'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${unitIndex === 0 ? size.toFixed(0) : size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`
}

function formatModifiedTime(timestamp?: number) {
  if (!timestamp) {
    return '暂无记录'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(timestamp)
}

function LocalWallpaperImage({ index, item, onDelete, onSet }: { index: number; item: LocalWallpaperItem; onDelete: () => void; onSet: () => void }) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [shouldLoadThumbnail, setShouldLoadThumbnail] = useState(Boolean(item.thumbnailPath))
  const [thumbnailSrc, setThumbnailSrc] = useState(item.thumbnailPath ? toRendererFileUrl(item.thumbnailPath, { t: item.modifiedAt }) : '')

  useEffect(() => {
    if (thumbnailSrc) {
      return
    }

    const currentNode = cardRef.current
    if (!currentNode) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoadThumbnail(true)
          observer.disconnect()
        }
      },
      { rootMargin: '240px' },
    )

    observer.observe(currentNode)
    return () => observer.disconnect()
  }, [thumbnailSrc])

  useEffect(() => {
    let disposed = false

    async function loadThumbnail() {
      if (!shouldLoadThumbnail || thumbnailSrc) {
        return
      }

      try {
        const response = await ipcRenderer.invoke('get-local-wallpaper-thumbnail', item.path)
        if (disposed) {
          return
        }

        if (response?.success && response.path) {
          setThumbnailSrc(toRendererFileUrl(response.path, { t: item.modifiedAt }))
          return
        }

        setThumbnailSrc(toRendererFileUrl(item.path, { t: item.modifiedAt }))
      } catch {
        if (!disposed) {
          setThumbnailSrc(toRendererFileUrl(item.path, { t: item.modifiedAt }))
        }
      }
    }

    loadThumbnail()
    return () => {
      disposed = true
    }
  }, [item.modifiedAt, item.path, shouldLoadThumbnail, thumbnailSrc])

  if (!thumbnailSrc) {
    return (
      <div
        ref={cardRef}
        style={{
          breakInside: 'avoid-column',
          contentVisibility: 'auto',
          containIntrinsicSize: '260px',
          marginBottom: '12px',
        }}
        className='overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-glass)]'
      >
        <div className='aspect-[16/10] animate-pulse bg-[var(--bg-surface)]' />
      </div>
    )
  }

  return (
    <div
      ref={cardRef}
      style={{
        breakInside: 'avoid-column',
        contentVisibility: 'auto',
        containIntrinsicSize: '260px',
        marginBottom: '12px',
      }}
    >
      <CusImage src={thumbnailSrc} index={index} onSet={onSet} onDelete={onDelete} />
    </div>
  )
}

export default function List() {
  const [wallpaperList, setWallpaperList] = useState<LocalWallpaperItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [openingDirectory, setOpeningDirectory] = useState(false)
  const totalStorageSize = useMemo(() => wallpaperList.reduce((total, item) => total + item.size, 0), [wallpaperList])
  const latestModifiedAt = wallpaperList[0]?.modifiedAt

  async function getWallpaperList() {
    try {
      const response = await ipcRenderer.invoke('list-local-wallpapers')
      if (!response?.success) {
        throw new Error(response?.message || '加载壁纸失败')
      }

      setWallpaperList(response.items || [])
    } catch (error) {
      console.error('Failed to load wallpapers:', error)
      toast.error(error instanceof Error ? error.message : '加载壁纸失败')
    } finally {
      setLoaded(true)
    }
  }

  async function openWallpaperDirectory() {
    setOpeningDirectory(true)

    try {
      const response = (await ipcRenderer.invoke('open-local-wallpaper-directory')) as OpenDirectoryResponse
      if (!response?.success) {
        throw new Error(response?.message || '打开目录失败')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '打开目录失败')
    } finally {
      setOpeningDirectory(false)
    }
  }

  async function deleteWallpaper(filePath: string) {
    try {
      await fs.promises.unlink(filePath)
      setWallpaperList((previous) => previous.filter((item: LocalWallpaperItem) => item.path !== filePath))
    } catch (error) {
      console.error('Failed to delete wallpaper:', error)
      toast.error('删除失败')
    }
  }

  const setAsBackground = async (item: string) => {
    const result = await ipcRenderer.invoke('set-wallpaper', item)

    if (!result?.success) {
      toast.error(result?.message || '设置壁纸失败')
      return
    }

    ipcRenderer.send('close-live-wallpaper')
    toast.success('设置成功！')
  }

  useEffect(() => {
    getWallpaperList()
  }, [])

  return (
    <div className='list-page animate-fade-in-up mx-auto max-w-[1540px] pb-6'>
      <div className='mb-5 overflow-hidden rounded-xl border border-white/[0.08] bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.16),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.68),rgba(8,13,24,0.42))] shadow-[0_20px_70px_rgba(2,6,23,0.20)]'>
        <div className='flex flex-wrap items-center justify-between gap-4 px-5 py-4'>
          <div className='flex min-w-0 items-center gap-4'>
            <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/20'>
              <FolderOpen className='h-5 w-5' />
            </div>
            <div className='min-w-0'>
              <h1 className='font-display text-xl font-semibold text-[var(--text-primary)]'>我的壁纸</h1>
            </div>
          </div>

          <div className='flex items-center justify-center gap-2'>
            <div className='flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-tertiary)]'>
              <span className='inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5'>
                <ImageIcon className='h-3 w-3 text-emerald-300/80' />
                {loaded ? `${wallpaperList.length} 张壁纸` : '正在读取'}
              </span>
              <span className='inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5'>
                <HardDrive className='h-3 w-3 text-sky-300/80' />
                {formatStorageSize(totalStorageSize)}
              </span>
              <span className='rounded-full bg-white/[0.06] px-2 py-0.5'>最近更新 {formatModifiedTime(latestModifiedAt)}</span>
            </div>
            <Button
              variant='outline'
              size='sm'
              loading={openingDirectory}
              className='h-8 w-[104px] shrink-0 bg-black/10'
              onClick={() => void openWallpaperDirectory()}
            >
              {!openingDirectory && <FolderOpen className='mr-1.5 h-3.5 w-3.5' />}
              打开目录
            </Button>
          </div>
        </div>
      </div>

      {wallpaperList.length > 0 ? (
        <div className=''>
          <div className='columns-2 gap-3 sm:columns-3 xl:columns-4 2xl:columns-5'>
            {wallpaperList.map((item: LocalWallpaperItem, index: number) => {
              return (
                <LocalWallpaperImage
                  key={item.path}
                  item={item}
                  index={index}
                  onSet={() => setAsBackground(item.path)}
                  onDelete={() => deleteWallpaper(item.path)}
                />
              )
            })}
          </div>
        </div>
      ) : loaded ? (
        <div className='flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.10] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_46%),rgba(255,255,255,0.025)] px-6 py-16 text-center text-[var(--text-tertiary)]'>
          <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05] text-emerald-300/70 ring-1 ring-white/[0.08]'>
            <Inbox className='h-8 w-8' />
          </div>
          <p className='font-display text-base font-medium text-[var(--text-secondary)]'>暂无壁纸</p>
          <p className='mt-1 text-[13px] opacity-70'>去壁纸列表中下载喜欢的壁纸吧</p>
          <Button variant='secondary' size='sm' className='mt-5' onClick={() => void openWallpaperDirectory()}>
            <FolderOpen className='mr-1.5 h-3.5 w-3.5' />
            打开本地目录
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className='overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.035] p-2'
              style={{
                aspectRatio: index % 3 === 0 ? '4 / 5' : '16 / 10',
              }}
            >
              <div className='h-full animate-pulse rounded-lg bg-white/[0.055]' />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
