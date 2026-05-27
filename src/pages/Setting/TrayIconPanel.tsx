import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getRendererFilePath, ipcRenderer, toRendererFileUrl } from '@/lib/electron-runtime'
import { cn } from '@/lib/utils'
import SpriteSheetEditor from '@/pages/TrayIcons/SpriteSheetEditor'
import { AppWindowMac, Check, FolderOpen, ImagePlus, Inbox, Pencil, RefreshCw, Scissors, Search, Sparkles, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

type TrayIconSource = 'builtin' | 'custom'
type TrayIconSourceFilter = TrayIconSource | 'all'
type TrayIconPanelTab = 'designer' | 'library'

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
  item?: TrayIconItem
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

function isImageFrameFile(file: File) {
  return file.type.startsWith('image/') || /\.(ico|jpe?g|png|webp)$/i.test(file.name)
}

export default function TrayIconPanel() {
  const [items, setItems] = useState<TrayIconItem[]>([])
  const [currentId, setCurrentId] = useState('')
  const [builtinDirectory, setBuiltinDirectory] = useState('')
  const [customDirectory, setCustomDirectory] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [sourceFilter, setSourceFilter] = useState<TrayIconSourceFilter>('all')
  const [selectedFrameFiles, setSelectedFrameFiles] = useState<File[]>([])
  const [lastImportSummary, setLastImportSummary] = useState('')
  const [activeTab, setActiveTab] = useState<TrayIconPanelTab>('library')
  const [previewTick, setPreviewTick] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [renamingId, setRenamingId] = useState('')
  const [renameValue, setRenameValue] = useState('')
  const [renamingSubmittingId, setRenamingSubmittingId] = useState('')
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

  async function importFrameFiles(files: File[], name: string) {
    const framePaths = files.map((file) => getRendererFilePath(file)).filter(Boolean)

    if (!framePaths.length) {
      setLastImportSummary('无法读取这些文件路径，请重新选择。')
      toast.warning('先选择一组图片帧')
      return
    }

    setLastImportSummary(`正在导入 ${files.length} 帧到「${name || '自动命名图标'}」...`)
    setImporting(true)

    try {
      const response = (await ipcRenderer.invoke('import-tray-icon-set', {
        framePaths,
        name,
      })) as TrayIconMutationResponse

      if (!response?.success) {
        setLastImportSummary('导入失败，可以重新选择这组帧再试一次。')
        toast.error(response?.message || '导入自定义图标失败')
        return
      }

      const importedItem = response.item
      if (importedItem?.label) {
        setLastImportSummary(`已导入为「${importedItem.label}」，当前共 ${importedItem.frameCount} 帧。`)
      } else {
        setLastImportSummary(`已导入 ${files.length} 帧。`)
      }

      const refreshed = await loadTrayIcons()
      toast.success(refreshed ? '自定义动态图标已导入，列表已更新' : '自定义动态图标已导入')
    } finally {
      setImporting(false)
    }
  }

  function handleImportFrameFiles(files: File[]) {
    if (!files.length) {
      return
    }

    const imageFiles = files.filter(isImageFrameFile)

    if (!imageFiles.length) {
      toast.warning('请选择图片帧文件')
      return
    }

    const inferredName = inferTrayIconName(imageFiles)
    const targetName = inferredName.trim()

    setSelectedFrameFiles(imageFiles)
    void importFrameFiles(imageFiles, targetName)
  }

  function handleFrameFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    handleImportFrameFiles(files)
  }

  function handleFrameDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setDragActive(false)
    handleImportFrameFiles(Array.from(event.dataTransfer.files || []))
  }

  function handleStartRenameTrayIcon(item: TrayIconItem) {
    if (item.source !== 'custom') {
      return
    }

    setRenamingId(item.id)
    setRenameValue(item.label)
  }

  function handleCancelRenameTrayIcon() {
    setRenamingId('')
    setRenameValue('')
  }

  async function handleRenameTrayIcon(item: TrayIconItem) {
    if (item.source !== 'custom') {
      return
    }

    const nextName = renameValue.trim()
    if (!nextName) {
      toast.warning('请输入新的动态图标名称')
      return
    }

    if (nextName === item.label) {
      handleCancelRenameTrayIcon()
      return
    }

    setRenamingSubmittingId(item.id)

    try {
      const response = (await ipcRenderer.invoke('rename-tray-icon-set', {
        id: item.id,
        name: nextName,
      })) as TrayIconMutationResponse

      if (!response?.success) {
        toast.error(response?.message || '重命名自定义动态图标失败')
        return
      }

      const refreshed = await loadTrayIcons()
      if (response.currentId) {
        setCurrentId(response.currentId)
      }
      toast.success(refreshed ? `已重命名为「${response.item?.label || nextName}」` : '自定义动态图标已重命名')
      handleCancelRenameTrayIcon()
    } finally {
      setRenamingSubmittingId('')
    }
  }

  async function handleDeleteTrayIcon(item: TrayIconItem) {
    if (item.source !== 'custom') {
      return
    }

    const confirmed = window.confirm(`确认删除 ${item.label} 吗？删除后会移除这组自定义动画帧。`)
    if (!confirmed) {
      return
    }

    setDeletingId(item.id)

    try {
      const response = (await ipcRenderer.invoke('delete-tray-icon-set', item.id)) as TrayIconMutationResponse

      if (!response?.success) {
        toast.error(response?.message || '删除自定义动态图标失败')
        return
      }

      const refreshed = await loadTrayIcons()
      toast.success(refreshed ? '自定义动态图标已删除' : '自定义动态图标已删除，列表待刷新')
    } finally {
      setDeletingId('')
    }
  }

  async function handleSpriteImported() {
    const refreshed = await loadTrayIcons()
    setActiveTab('library')
    return refreshed
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

  const currentTrayIconItem = items.find((item) => item.id === currentId) || null
  const currentPreviewFramePath = currentTrayIconItem?.framePaths.length
    ? currentTrayIconItem.framePaths[previewTick % currentTrayIconItem.framePaths.length]
    : currentTrayIconItem?.previewPath || ''
  const currentPreviewSrc = currentPreviewFramePath ? toRendererFileUrl(currentPreviewFramePath) : ''
  const currentPreviewIndex = currentTrayIconItem?.framePaths.length ? (previewTick % currentTrayIconItem.framePaths.length) + 1 : 0
  const currentPreviewFrameLimit = 16
  const currentPreviewStrip = currentTrayIconItem?.framePaths.length
    ? currentTrayIconItem.framePaths.slice(0, currentPreviewFrameLimit)
    : currentTrayIconItem?.previewPath
      ? [currentTrayIconItem.previewPath]
      : []
  const hiddenPreviewFrameCount = currentTrayIconItem ? Math.max(0, currentTrayIconItem.frameCount - currentPreviewStrip.length) : 0
  const customIconCount = items.filter((item) => item.source === 'custom').length
  const builtinIconCount = items.length - customIconCount
  const visibleItems = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase()

    return items.filter((item) => {
      const matchesSource = sourceFilter === 'all' || item.source === sourceFilter
      const matchesKeyword =
        !normalizedKeyword ||
        item.label.toLowerCase().includes(normalizedKeyword) ||
        item.name.toLowerCase().includes(normalizedKeyword) ||
        item.directory.toLowerCase().includes(normalizedKeyword)

      return matchesSource && matchesKeyword
    })
  }, [items, searchKeyword, sourceFilter])
  const selectedFramesLabel = selectedFrameFiles.length
    ? lastImportSummary || `已选择 ${selectedFrameFiles.length} 帧，正在导入。`
    : '按首个文件名自动命名；同名会保存为 -1、-2。'

  const selectedFrameNamesLabel = selectedFrameFiles.length
    ? `${selectedFrameFiles
        .slice(0, 6)
        .map((file) => file.name)
        .join('、')}${selectedFrameFiles.length > 6 ? ' ...' : ''}`
    : ''

  return (
    <div className='mb-4 space-y-4'>
      <div className='rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-2 shadow-[0_20px_60px_rgba(2,6,23,0.18)]'>
        <div className='grid gap-2 sm:grid-cols-2'>
          <button
            type='button'
            className={cn(
              'group flex min-h-[64px] items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all',
              activeTab === 'library'
                ? 'border-sky-300/35 bg-sky-400/[0.08] text-[var(--text-primary)] shadow-[0_12px_32px_rgba(56,189,248,0.10)]'
                : 'border-white/[0.07] bg-black/15 text-[var(--text-tertiary)] hover:border-white/15 hover:bg-white/[0.05] hover:text-[var(--text-secondary)]',
            )}
            onClick={() => setActiveTab('library')}
          >
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                activeTab === 'library'
                  ? 'bg-sky-400/15 text-sky-100'
                  : 'bg-white/[0.055] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]',
              )}
            >
              <AppWindowMac className='h-4 w-4' />
            </span>
            <span className='min-w-0'>
              <span className='flex items-center gap-2 text-[13px] font-semibold'>
                图标库
                {activeTab === 'library' && (
                  <span className='rounded-full bg-sky-400/15 px-1.5 py-0.5 text-[10px] font-medium text-sky-100'>当前</span>
                )}
              </span>
              <span className='mt-1 block truncate text-[11px] text-[var(--text-tertiary)]'>选择、导入、改名和删除动态图标</span>
            </span>
          </button>
          <button
            type='button'
            className={cn(
              'group flex min-h-[64px] items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all',
              activeTab === 'designer'
                ? 'border-amber-300/35 bg-amber-400/[0.08] text-[var(--text-primary)] shadow-[0_12px_32px_rgba(245,158,11,0.10)]'
                : 'border-white/[0.07] bg-black/15 text-[var(--text-tertiary)] hover:border-white/15 hover:bg-white/[0.05] hover:text-[var(--text-secondary)]',
            )}
            onClick={() => setActiveTab('designer')}
          >
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                activeTab === 'designer'
                  ? 'bg-amber-400/15 text-amber-100'
                  : 'bg-white/[0.055] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]',
              )}
            >
              <Scissors className='h-4 w-4' />
            </span>
            <span className='min-w-0'>
              <span className='flex items-center gap-2 text-[13px] font-semibold'>
                合图拆帧
                {activeTab === 'designer' && (
                  <span className='rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-100'>当前</span>
                )}
              </span>
              <span className='mt-1 block truncate text-[11px] text-[var(--text-tertiary)]'>从 sprite sheet 裁剪并保存动画帧</span>
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'library' ? (
        <div className='overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_8%_0%,rgba(245,158,11,0.10),transparent_24%),radial-gradient(circle_at_92%_8%,rgba(56,189,248,0.12),transparent_28%),linear-gradient(180deg,rgba(10,15,28,0.98),rgba(8,12,22,0.95))] shadow-[0_24px_90px_rgba(2,6,23,0.28)]'>
          <main className='min-w-0 p-4 lg:p-5'>
            <section className='grid gap-3 lg:grid-cols-[260px_108px_minmax(0,1fr)] xl:grid-cols-[280px_112px_minmax(0,1fr)]'>
              <div className='min-w-0 rounded-xl border border-white/[0.08] bg-black/15 p-3'>
                <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
                  <div className='flex min-w-0 items-center gap-2'>
                    <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-200 ring-1 ring-amber-300/15'>
                      <Upload className='h-4 w-4' />
                    </span>
                    <div className='min-w-0'>
                      <p className='text-[13px] font-semibold text-[var(--text-primary)]'>快速导入</p>
                      <p className='truncate text-[11px] text-[var(--text-tertiary)]'>{selectedFramesLabel}</p>
                    </div>
                  </div>
                  {selectedFrameFiles.length > 0 && (
                    <span className='rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-100/80'>{selectedFrameFiles.length} 帧</span>
                  )}
                </div>

                <div className='grid gap-2'>
                  <button
                    type='button'
                    className={cn(
                      'flex h-36 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 bg-white/[0.035] px-3 text-[12px] font-medium text-[var(--text-secondary)] transition-all hover:border-sky-300/35 hover:bg-sky-400/10 hover:text-sky-100',
                      dragActive && 'border-sky-300/60 bg-sky-400/15 text-sky-100',
                      importing && 'pointer-events-none opacity-60',
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={(event) => {
                      event.preventDefault()
                      setDragActive(true)
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault()
                      setDragActive(false)
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleFrameDrop}
                  >
                    {importing ? <RefreshCw className='h-3.5 w-3.5 animate-spin' /> : <ImagePlus className='h-3.5 w-3.5' />}
                    <span>{importing ? '导入中' : '选择或拖入图片帧'}</span>
                    <span className='text-[10px] font-normal text-[var(--text-tertiary)]'>自动命名，不覆盖同名图标</span>
                  </button>
                </div>

                {selectedFrameNamesLabel && (
                  <p className='mt-2 truncate text-[11px] text-[var(--text-tertiary)]' title={selectedFrameNamesLabel}>
                    {selectedFrameNamesLabel}
                  </p>
                )}

                <input
                  ref={fileInputRef}
                  type='file'
                  multiple
                  accept='.png,.ico,.jpg,.jpeg,.webp,image/*'
                  className='hidden'
                  onChange={handleFrameFileChange}
                />
              </div>

              <div className='grid grid-cols-3 overflow-hidden rounded-xl border border-white/[0.08] bg-black/15 text-center lg:grid-cols-1'>
                <div className='flex flex-col justify-center border-r border-white/[0.06] px-2 py-3 lg:border-b lg:border-r-0'>
                  <span className='text-[17px] font-semibold text-[var(--text-primary)]'>{items.length}</span>
                  <span className='text-[11px] text-[var(--text-tertiary)]'>全部</span>
                </div>
                <div className='flex flex-col justify-center border-r border-white/[0.06] px-2 py-3 lg:border-b lg:border-r-0'>
                  <span className='text-[17px] font-semibold text-sky-100'>{builtinIconCount}</span>
                  <span className='text-[11px] text-[var(--text-tertiary)]'>内置</span>
                </div>
                <div className='flex flex-col justify-center px-2 py-3'>
                  <span className='text-[17px] font-semibold text-amber-100'>{customIconCount}</span>
                  <span className='text-[11px] text-[var(--text-tertiary)]'>自定义</span>
                </div>
              </div>

              <div className='flex min-w-0 flex-col rounded-xl border border-white/[0.08] bg-black/15 p-3'>
                <div className='mb-3 flex items-center justify-between gap-2'>
                  <div className='flex min-w-0 items-center gap-2'>
                    <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-100 ring-1 ring-sky-300/15'>
                      <Sparkles className='h-4 w-4' />
                    </span>
                    <div className='min-w-0'>
                      <p className='text-[13px] font-semibold text-[var(--text-primary)]'>当前图标</p>
                      <p className='truncate text-[11px] text-[var(--text-tertiary)]'>{currentTrayIconItem?.label || '未选择'}</p>
                    </div>
                  </div>
                  {currentTrayIconItem && (
                    <span className='shrink-0 rounded-full bg-sky-400/10 px-2 py-0.5 text-[11px] text-sky-100/80'>
                      {currentPreviewIndex ? `${currentPreviewIndex}/${currentTrayIconItem.frameCount}` : `${currentTrayIconItem.frameCount} 帧`}
                    </span>
                  )}
                </div>

                <div className='flex h-16 items-center gap-3 rounded-lg border border-white/[0.06] bg-[radial-gradient(circle_at_left,rgba(56,189,248,0.14),transparent_64%),rgba(2,6,23,0.30)] px-3'>
                  <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-black/30'>
                    {currentTrayIconItem && currentPreviewSrc ? (
                      <img
                        src={currentPreviewSrc}
                        alt={currentTrayIconItem.label}
                        className='max-h-8 max-w-8 object-contain [image-rendering:pixelated]'
                      />
                    ) : (
                      <AppWindowMac className='h-5 w-5 text-[var(--text-tertiary)]' />
                    )}
                  </div>
                  <div className='min-w-0'>
                    <p className='truncate text-[12px] font-medium text-[var(--text-secondary)]'>{currentTrayIconItem?.label || '下方选择图标'}</p>
                    <p className='mt-0.5 truncate text-[11px] text-[var(--text-tertiary)]'>
                      {currentTrayIconItem
                        ? `${getTrayIconSourceLabel(currentTrayIconItem.source)} · ${currentTrayIconItem.frameCount} 帧`
                        : '预览会在这里显示'}
                    </p>
                  </div>
                </div>

                <div className='mt-auto pt-2'>
                  <div className='mb-1.5 flex items-center justify-between gap-2 text-[10px] text-[var(--text-tertiary)]'>
                    <span>{currentPreviewStrip.length ? `前 ${currentPreviewStrip.length} 帧` : '帧预览'}</span>
                    {hiddenPreviewFrameCount > 0 && <span>+{hiddenPreviewFrameCount}</span>}
                  </div>
                  {currentPreviewStrip.length ? (
                    <div className='flex flex-nowrap gap-1.5 overflow-hidden'>
                      {currentPreviewStrip.map((framePath, index) => (
                        <div
                          key={`${framePath}-${index}`}
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-black/25',
                            currentPreviewIndex === index + 1 ? 'border-sky-300/70 bg-sky-400/10' : 'border-white/[0.06]',
                          )}
                          title={`${currentTrayIconItem?.label || '当前图标'} #${index + 1}`}
                        >
                          <img src={toRendererFileUrl(framePath)} alt='' className='max-h-6 max-w-6 object-contain [image-rendering:pixelated]' />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='flex h-9 items-center rounded-lg border border-dashed border-white/[0.08] px-2 text-[10px] text-[var(--text-tertiary)]'>
                      选择图标后显示帧
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className='mt-4 rounded-xl border border-white/[0.08] bg-black/15 p-3'>
              <div className='mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                <div>
                  <p className='text-[14px] font-semibold text-[var(--text-primary)]'>图标库</p>
                  <p className='mt-0.5 text-[11px] text-[var(--text-tertiary)]'>{visibleItems.length ? `${visibleItems.length} 组可见` : ' '}</p>
                </div>

                <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
                  <div className='relative min-w-[220px]'>
                    <Search className='absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]' />
                    <Input
                      value={searchKeyword}
                      placeholder='搜索名称或目录'
                      className='h-9 bg-black/20 pl-8'
                      onChange={(event) => setSearchKeyword(event.target.value)}
                    />
                  </div>

                  <div className='flex rounded-lg bg-black/20 p-1'>
                    {[
                      { label: '全部', value: 'all' },
                      { label: '内置', value: 'builtin' },
                      { label: '自定义', value: 'custom' },
                    ].map((filter) => (
                      <button
                        key={filter.value}
                        type='button'
                        className={cn(
                          'h-7 rounded-md px-2.5 text-[11px] font-medium transition-all',
                          sourceFilter === filter.value
                            ? 'bg-white/[0.09] text-[var(--text-primary)] shadow-sm'
                            : 'text-[var(--text-tertiary)] hover:bg-white/[0.04] hover:text-[var(--text-secondary)]',
                        )}
                        onClick={() => setSourceFilter(filter.value as TrayIconSourceFilter)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  <div className='flex flex-wrap gap-1.5 sm:justify-end'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-[58px] px-0 text-[11px]'
                      onClick={() => void handleRefresh()}
                      disabled={refreshing}
                    >
                      <RefreshCw className={cn('mr-1 h-3 w-3 shrink-0', refreshing && 'animate-spin')} />
                      刷新
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-[92px] px-0 text-[11px]'
                      title={customDirectory || '自定义目录'}
                      onClick={() => void handleOpenLibraryDirectory('custom')}
                    >
                      <FolderOpen className='mr-1 h-3 w-3' />
                      打开文件夹
                    </Button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className='grid gap-3 md:grid-cols-2 2xl:grid-cols-3'>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className='h-[136px] animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.035]' />
                  ))}
                </div>
              ) : items.length && visibleItems.length ? (
                <div className='grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3'>
                  {visibleItems.map((item) => {
                    const framePath = item.framePaths.length ? item.framePaths[previewTick % item.framePaths.length] : item.previewPath
                    const previewSrc = framePath ? toRendererFileUrl(framePath) : ''
                    const isActive = item.id === currentId
                    const isRenaming = renamingId === item.id

                    return (
                      <article
                        key={item.id}
                        className={cn(
                          'group min-w-0 overflow-hidden rounded-xl border bg-white/[0.035] transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300/25 hover:bg-white/[0.055] hover:shadow-[0_16px_45px_rgba(2,6,23,0.22)]',
                          isActive ? 'border-sky-300/35 bg-sky-400/[0.075] shadow-[0_0_0_1px_rgba(56,189,248,0.10)]' : 'border-white/[0.07]',
                        )}
                        title={item.directory}
                      >
                        <div className='flex items-start gap-3 p-3'>
                          <div className='flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.015))] shadow-inner'>
                            {previewSrc ? (
                              <img src={previewSrc} alt={item.label} className='max-h-11 max-w-11 object-contain [image-rendering:pixelated]' />
                            ) : (
                              <span className='text-[10px] text-[var(--text-tertiary)]'>无</span>
                            )}
                          </div>

                          <div className='min-w-0 flex-1 pt-0.5'>
                            {isRenaming ? (
                              <Input
                                autoFocus
                                value={renameValue}
                                className='h-8 bg-black/20 text-[12px]'
                                onChange={(event) => setRenameValue(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    void handleRenameTrayIcon(item)
                                  }
                                  if (event.key === 'Escape') {
                                    handleCancelRenameTrayIcon()
                                  }
                                }}
                              />
                            ) : (
                              <div className='flex min-w-0 items-center gap-1.5'>
                                <p className='truncate text-[13px] font-semibold text-[var(--text-primary)]'>{item.label}</p>
                                {isActive && (
                                  <span className='inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-400/15 px-1.5 py-0.5 text-[10px] text-sky-100'>
                                    <Check className='h-3 w-3' />
                                    当前
                                  </span>
                                )}
                              </div>
                            )}
                            {!isRenaming && (
                              <>
                                <p className='mt-1 text-[11px] text-[var(--text-tertiary)]'>
                                  {getTrayIconSourceLabel(item.source)} · {item.frameCount} 帧
                                </p>
                                <p className='mt-1 truncate text-[10px] text-[var(--text-tertiary)] opacity-80'>{item.name}</p>
                              </>
                            )}
                            {isRenaming && <p className='mt-1 truncate text-[11px] text-[var(--text-tertiary)]'>同名会自动保存为 -1、-2</p>}
                          </div>
                        </div>

                        <div className='flex items-center gap-2 border-t border-white/[0.06] px-3 py-2'>
                          {isRenaming ? (
                            <>
                              <Button
                                size='sm'
                                className='h-8 flex-1 px-2 text-[12px]'
                                loading={renamingSubmittingId === item.id}
                                onClick={() => void handleRenameTrayIcon(item)}
                              >
                                {renamingSubmittingId !== item.id && <Check className='mr-1.5 h-3.5 w-3.5' />}
                                保存
                              </Button>
                              <Button
                                size='sm'
                                variant='ghost'
                                className='h-8 px-2 text-[11px]'
                                disabled={renamingSubmittingId === item.id}
                                onClick={handleCancelRenameTrayIcon}
                              >
                                <X className='mr-1 h-3 w-3' />
                                取消
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size='sm'
                                variant={isActive ? 'secondary' : 'default'}
                                className='h-8 flex-1 px-2 text-[12px]'
                                disabled={isActive}
                                onClick={() => void handleSelectTrayIcon(item.id)}
                              >
                                {isActive && <Check className='mr-1.5 h-3.5 w-3.5' />}
                                {isActive ? '使用中' : '设为当前'}
                              </Button>
                              {item.source === 'custom' && (
                                <>
                                  <Button
                                    size='sm'
                                    variant='secondary'
                                    className='h-8 px-2 text-[11px]'
                                    onClick={() => handleStartRenameTrayIcon(item)}
                                  >
                                    <Pencil className='mr-1 h-3 w-3' />
                                    改名
                                  </Button>
                                  <Button
                                    size='sm'
                                    variant='destructive'
                                    className='h-8 px-2 text-[11px]'
                                    loading={deletingId === item.id}
                                    onClick={() => void handleDeleteTrayIcon(item)}
                                  >
                                    {deletingId !== item.id && <Trash2 className='mr-1 h-3 w-3' />}
                                    删除
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className='flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.09] bg-black/10 px-5 text-center'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-[var(--text-tertiary)]'>
                    <Inbox className='h-6 w-6' />
                  </div>
                  <p className='mt-4 text-[14px] font-semibold text-[var(--text-primary)]'>
                    {items.length ? '没有匹配的图标' : '还没有可用的菜单栏动态图标'}
                  </p>
                  <p className='mt-1 max-w-sm text-[12px] leading-5 text-[var(--text-tertiary)]'>
                    {items.length ? '换个关键词或来源筛选试试。' : '导入一组图片帧，或者打开目录手动放入帧文件。'}
                  </p>
                </div>
              )}
            </section>
          </main>
        </div>
      ) : (
        <SpriteSheetEditor onImported={handleSpriteImported} />
      )}
    </div>
  )
}
