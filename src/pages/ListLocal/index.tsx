import { Image as CusImage } from '@/components/Image'
import { ipcRenderer } from 'electron'
import { FolderOpen, Inbox } from 'lucide-react'
import { toast } from 'sonner'

const fs = require('fs')

type LocalWallpaperItem = {
  modifiedAt: number
  path: string
  size: number
  thumbnailPath?: string
}

function LocalWallpaperImage({
  index,
  item,
  onDelete,
  onSet,
}: {
  index: number
  item: LocalWallpaperItem
  onDelete: () => void
  onSet: () => void
}) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [shouldLoadThumbnail, setShouldLoadThumbnail] = useState(Boolean(item.thumbnailPath))
  const [thumbnailSrc, setThumbnailSrc] = useState(item.thumbnailPath ? `file://${item.thumbnailPath}?t=${item.modifiedAt}` : '')

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
          setThumbnailSrc(`file://${response.path}?t=${item.modifiedAt}`)
          return
        }

        setThumbnailSrc(`file://${item.path}?t=${item.modifiedAt}`)
      } catch {
        if (!disposed) {
          setThumbnailSrc(`file://${item.path}?t=${item.modifiedAt}`)
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
    <div className='list-page animate-fade-in-up'>
      <div className='mb-5 flex items-center gap-3'>
        <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400'>
          <FolderOpen className='h-4 w-4' />
        </div>
        <div>
          <h1 className='font-display text-lg font-semibold text-[var(--text-primary)]'>我的壁纸</h1>
          <p className='text-[12px] text-[var(--text-tertiary)]'>已下载 {wallpaperList.length} 张壁纸</p>
        </div>
      </div>
      {wallpaperList.length > 0 ? (
        <div className='columns-5 gap-3'>
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
      ) : loaded ? (
        <div className='flex flex-col items-center justify-center py-20 text-[var(--text-tertiary)]'>
          <Inbox className='mb-4 h-14 w-14 opacity-40' />
          <p className='font-display text-base font-medium'>暂无壁纸</p>
          <p className='mt-1 text-[13px] opacity-60'>去壁纸列表中下载喜欢的壁纸吧</p>
        </div>
      ) : null}
    </div>
  )
}
