import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getRendererFilePath, ipcRenderer, toRendererFileUrl } from '@/lib/electron-runtime'
import { cn } from '@/lib/utils'
import { AppWindowMac, FolderOpen, ImagePlus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

type TrayIconSource = 'builtin' | 'custom'

type TrayIconItem = {
  directory: string
  frameCount: number
  framePaths: string[]
  id: string
  label: string
  name: string
  previewPath: string
  source: TrayIconSource
}

type TrayIconListResponse = {
  builtinDirectory?: string
  currentId?: string
  customDirectory?: string
  items?: TrayIconItem[]
  message?: string
  success?: boolean
}

type TrayIconMutationResponse = {
  currentId?: string
  message?: string
  success?: boolean
}

function inferTrayIconName(files: File[]) {
  const firstFile = files[0]

  if (!firstFile) {
    return ''
  }

  return firstFile.name
    .replace(/\.[^.]+$/g, '')
    .replace(/(?:[_\-\s]?\d+)+$/g, '')
    .trim()
}

function getTrayIconSourceLabel(source: TrayIconSource) {
  return source === 'builtin' ? '内置' : '自定义'
}

export default function TrayIconPanel() {
  const [items, setItems] = useState<TrayIconItem[]>([])
  const [currentId, setCurrentId] = useState('')
  const [builtinDirectory, setBuiltinDirectory] = useState('')
  const [customDirectory, setCustomDirectory] = useState('')
  const [importName, setImportName] = useState('')
  const [selectedFrameFiles, setSelectedFrameFiles] = useState<File[]>([])
  const [previewTick, setPreviewTick] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function loadTrayIcons() {
    const response = (await ipcRenderer.invoke('list-tray-icons')) as TrayIconListResponse

    if (!response?.success) {
      toast.error(response?.message || '读取菜单栏动态图标失败')
      return false
    }

    setItems(response.items || [])
    setCurrentId(response.currentId || '')
    setBuiltinDirectory(response.builtinDirectory || '')
    setCustomDirectory(response.customDirectory || '')
    return true
  }

  async function handleRefresh() {
    setRefreshing(true)

    try {
      const refreshed = await loadTrayIcons()
      if (refreshed) {
        toast.success('动态图标列表已刷新')
      }
    } finally {
      setRefreshing(false)
    }
  }

  async function handleSelectTrayIcon(id: string) {
    const response = (await ipcRenderer.invoke('set-tray-icon', id)) as TrayIconMutationResponse

    if (!response?.success) {
      toast.error(response?.message || '切换菜单栏动态图标失败')
      return
    }

    setCurrentId(response.currentId || id)
    toast.success('菜单栏动态图标已切换')
  }

  async function handleOpenLibraryDirectory(source: TrayIconSource) {
    const response = (await ipcRenderer.invoke('open-tray-icon-directory', source)) as TrayIconMutationResponse

    if (!response?.success) {
      toast.error(response?.message || '打开图标目录失败')
      return
    }
  }

  function handleFrameFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])

    setSelectedFrameFiles(files)
    if (!importName.trim()) {
      setImportName(inferTrayIconName(files))
    }

    event.target.value = ''
  }

  async function handleImport() {
    const framePaths = selectedFrameFiles.map((file) => getRendererFilePath(file)).filter(Boolean)

    if (!framePaths.length) {
      toast.warning('先选择一组图片帧')
      return
    }

    setImporting(true)

    try {
      const response = (await ipcRenderer.invoke('import-tray-icon-set', {
        framePaths,
        name: importName,
      })) as TrayIconMutationResponse

      if (!response?.success) {
        toast.error(response?.message || '导入自定义图标失败')
        return
      }

      setImportName('')
      setSelectedFrameFiles([])
      const refreshed = await loadTrayIcons()
      toast.success(refreshed ? '自定义动态图标已导入，现在可以在下方预览并切换' : '自定义动态图标已导入')
    } finally {
      setImporting(false)
    }
  }

  useEffect(() => {
    void loadTrayIcons().finally(() => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPreviewTick((tick) => tick + 1)
    }, 180)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  const selectedFramesLabel = selectedFrameFiles.length
    ? `已选择 ${selectedFrameFiles.length} 帧：${selectedFrameFiles
        .slice(0, 4)
        .map((file) => file.name)
        .join('、')}${selectedFrameFiles.length > 4 ? ' ...' : ''}`
    : '你也可以直接在自定义目录里新建一个子文件夹，把动画帧按文件名顺序放进去，再点刷新。'

  return (
    <div className='mb-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-glass)]'>
      <div className='flex items-center gap-2 border-b border-[var(--border-subtle)] px-5 py-3'>
        <AppWindowMac className='h-4 w-4 text-[var(--text-tertiary)]' />
        <span className='text-[13px] font-medium text-[var(--text-secondary)]'>菜单栏动态图标</span>
      </div>

      <div className='space-y-4 px-5 py-4'>
        <div className='rounded-xl border border-[var(--border-subtle)] bg-black/10 p-4'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <p className='text-[14px] font-medium text-[var(--text-primary)]'>图标库与目录</p>
              <p className='mt-1 text-[12px] leading-5 text-[var(--text-tertiary)]'>
                内置图标会自动扫描 public/icons，自定义图标会扫描用户目录。每个子文件夹代表一组动画帧，系统按文件名顺序播放。
              </p>
            </div>

            <div className='flex flex-wrap gap-2'>
              <Button variant='outline' size='sm' loading={refreshing} onClick={() => void handleRefresh()}>
                {!refreshing && <RefreshCw className='mr-1.5 h-3.5 w-3.5' />}
                刷新
              </Button>
              <Button variant='outline' size='sm' onClick={() => void handleOpenLibraryDirectory('builtin')}>
                <FolderOpen className='mr-1.5 h-3.5 w-3.5' />
                打开内置目录
              </Button>
              <Button variant='outline' size='sm' onClick={() => void handleOpenLibraryDirectory('custom')}>
                <FolderOpen className='mr-1.5 h-3.5 w-3.5' />
                打开自定义目录
              </Button>
            </div>
          </div>

          <div className='mt-4 grid gap-3 md:grid-cols-2'>
            <div className='bg-[var(--bg-base)]/40 rounded-lg border border-[var(--border-subtle)] px-3 py-3'>
              <p className='text-[12px] font-medium text-[var(--text-secondary)]'>内置图标目录</p>
              <p className='mt-1 break-all text-[12px] leading-5 text-[var(--text-tertiary)]'>{builtinDirectory || '加载中...'}</p>
            </div>
            <div className='bg-[var(--bg-base)]/40 rounded-lg border border-[var(--border-subtle)] px-3 py-3'>
              <p className='text-[12px] font-medium text-[var(--text-secondary)]'>自定义图标目录</p>
              <p className='mt-1 break-all text-[12px] leading-5 text-[var(--text-tertiary)]'>{customDirectory || '加载中...'}</p>
            </div>
          </div>
        </div>

        <div className='rounded-xl border border-[var(--border-subtle)] bg-black/10 p-4'>
          <div className='mb-3'>
            <p className='text-[14px] font-medium text-[var(--text-primary)]'>导入一组自定义动画帧</p>
            <p className='mt-1 text-[12px] leading-5 text-[var(--text-tertiary)]'>
              选择一组 PNG / ICO / JPG / WebP 图片帧，应用会自动复制到自定义图标目录，并在这里提供预览与切换。
            </p>
          </div>

          <div className='flex flex-col gap-3 md:flex-row'>
            <Input
              value={importName}
              placeholder='图标名称，例如：my-cat'
              onChange={(event) => {
                setImportName(event.target.value)
              }}
              className='text-[13px]'
            />
            <Button variant='outline' size='sm' className='shrink-0' onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className='mr-1.5 h-3.5 w-3.5' />
              选择动画帧
            </Button>
            <Button size='sm' className='shrink-0' loading={importing} onClick={() => void handleImport()}>
              {!importing && <ImagePlus className='mr-1.5 h-3.5 w-3.5' />}
              导入图标
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type='file'
            multiple
            accept='.png,.ico,.jpg,.jpeg,.webp,image/*'
            className='hidden'
            onChange={handleFrameFileChange}
          />

          <p className='mt-3 text-[12px] leading-5 text-[var(--text-tertiary)]'>{selectedFramesLabel}</p>
        </div>

        {loading ? (
          <div className='flex items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] px-4 py-10 text-[13px] text-[var(--text-tertiary)]'>
            正在读取动态图标...
          </div>
        ) : items.length ? (
          <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
            {items.map((item) => {
              const framePath = item.framePaths.length ? item.framePaths[previewTick % item.framePaths.length] : item.previewPath
              const previewSrc = framePath ? toRendererFileUrl(framePath) : ''
              const isActive = item.id === currentId

              return (
                <article
                  key={item.id}
                  className={cn(
                    'rounded-xl border p-4 transition-all duration-200',
                    isActive
                      ? 'bg-sky-400/8 border-sky-400/40 shadow-[0_16px_40px_rgba(56,189,248,0.12)]'
                      : 'bg-[var(--bg-base)]/30 hover:bg-[var(--bg-base)]/40 border-[var(--border-subtle)] hover:border-[var(--border-default)]',
                  )}
                >
                  <div className='mb-3 flex items-start justify-between gap-3'>
                    <div>
                      <p className='text-[14px] font-medium text-[var(--text-primary)]'>{item.label}</p>
                      <p className='mt-1 text-[12px] text-[var(--text-tertiary)]'>
                        {getTrayIconSourceLabel(item.source)} · {item.frameCount} 帧
                      </p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-[11px]',
                        isActive ? 'bg-sky-400/20 text-sky-200' : 'bg-[var(--bg-glass-active)] text-[var(--text-tertiary)]',
                      )}
                    >
                      {isActive ? '当前使用' : '可切换'}
                    </span>
                  </div>

                  <div className='mb-3 flex h-24 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_55%),rgba(2,6,23,0.35)]'>
                    {previewSrc ? (
                      <img src={previewSrc} alt={item.label} className='h-14 w-auto object-contain [image-rendering:pixelated]' />
                    ) : (
                      <span className='text-[12px] text-[var(--text-tertiary)]'>暂无预览</span>
                    )}
                  </div>

                  <p className='mb-4 break-all text-[12px] leading-5 text-[var(--text-tertiary)]'>{item.directory}</p>

                  <Button
                    size='sm'
                    variant={isActive ? 'secondary' : 'default'}
                    className='w-full'
                    onClick={() => void handleSelectTrayIcon(item.id)}
                  >
                    {isActive ? '已选中这个图标' : '使用这个图标'}
                  </Button>
                </article>
              )
            })}
          </div>
        ) : (
          <div className='rounded-xl border border-dashed border-[var(--border-subtle)] px-4 py-10 text-center'>
            <p className='text-[14px] font-medium text-[var(--text-primary)]'>还没有可用的菜单栏动态图标</p>
            <p className='mt-2 text-[12px] leading-5 text-[var(--text-tertiary)]'>
              把动画帧放进 public/icons 的子文件夹里，或者导入一组自定义图片帧，然后点击刷新。
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
