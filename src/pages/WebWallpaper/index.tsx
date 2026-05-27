import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createStore, getRendererFilePath, ipcRenderer, path, toRendererFileUrl } from '@/lib/electron-runtime'
import { cn } from '@/lib/utils'
import { ExternalLink, FileCode2, Globe, Sparkles, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

type Mode = 'online' | 'local'

type RecommendedSite = {
  description: string
  thumbnailUrl: string
  title: string
  url: string
}

type LocalSelection = {
  fileName: string
  filePath: string
  fileUrl: string
  previewUrl: string
}

const store = createStore()

const supportedLocalExtensions = new Set(['.html', '.htm', '.svg'])

const recommendedSites: RecommendedSite[] = [
  {
    title: 'Fluid Simulation',
    description: '高响应流体动效，适合放在桌面做交互背景。',
    url: 'https://paveldogreat.github.io/WebGL-Fluid-Simulation/',
    thumbnailUrl: 'https://image.thum.io/get/width/1200/https://paveldogreat.github.io/WebGL-Fluid-Simulation/',
  },
  {
    title: 'Particles.js Demo',
    description: '轻量粒子背景，加载快，适合长时间悬挂。',
    url: 'https://vincentgarreau.com/particles.js/',
    thumbnailUrl: 'https://image.thum.io/get/width/1200/https://vincentgarreau.com/particles.js/',
  },
  {
    title: 'Three.js Keyframes',
    description: '经典 Three.js 动画示例，适合作为网页壁纸底板。',
    url: 'https://threejs.org/examples/webgl_animation_keyframes.html',
    thumbnailUrl: 'https://image.thum.io/get/width/1200/https://threejs.org/examples/webgl_animation_keyframes.html',
  },
  {
    title: 'Interactive Aurora',
    description: '偏氛围感的渐变动态背景，风格更克制。',
    url: 'https://tympanus.net/Development/AuroraBackground/',
    thumbnailUrl: 'https://image.thum.io/get/width/1200/https://tympanus.net/Development/AuroraBackground/',
  },
]

function getFileName(targetPath: string) {
  return targetPath.split(/[\\/]/).pop() || targetPath
}

function normalizeWebUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) {
    return trimmed
  }

  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/i.test(trimmed)) {
    return `http://${trimmed}`
  }

  return `https://${trimmed}`
}

function getFilePathFromUrl(targetUrl: string) {
  try {
    const decodedPath = decodeURIComponent(new URL(targetUrl).pathname)
    return /^\/[a-zA-Z]:\//.test(decodedPath) ? decodedPath.slice(1) : decodedPath
  } catch {
    return ''
  }
}

function getInitialWebWallpaperState() {
  const savedWebPath = ((store.get('web-path') as string) || '').trim()

  if (!savedWebPath) {
    return {
      localSelection: null,
      mode: 'online' as Mode,
      url: '',
    }
  }

  if (savedWebPath.startsWith('file://')) {
    const filePath = getFilePathFromUrl(savedWebPath)
    return {
      localSelection: {
        fileName: getFileName(filePath || savedWebPath),
        filePath,
        fileUrl: savedWebPath,
        previewUrl: savedWebPath,
      },
      mode: 'local' as Mode,
      url: '',
    }
  }

  return {
    localSelection: null,
    mode: 'online' as Mode,
    url: savedWebPath,
  }
}

const WebWallpaper = () => {
  const [initialState] = useState(() => getInitialWebWallpaperState())
  const [mode, setMode] = useState<Mode>(initialState.mode)
  const [url, setUrl] = useState(initialState.url)
  const [localSelection, setLocalSelection] = useState<LocalSelection | null>(initialState.localSelection)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)

  const normalizedUrl = mode === 'online' ? normalizeWebUrl(url) : ''
  const previewSrc = mode === 'local' ? localSelection?.previewUrl || '' : normalizedUrl
  const previewTitle = mode === 'local' ? localSelection?.fileName || '本地网页预览' : normalizedUrl || '在线网页预览'
  const previewSubtitle =
    mode === 'local'
      ? localSelection?.filePath || '选择 HTML / HTM / SVG 文件后，这里会直接渲染页面内容'
      : normalizedUrl || '输入完整链接，或从右侧推荐网页中选择一个示例'
  const canApplyWallpaper = mode === 'local' ? Boolean(localSelection?.fileUrl) : Boolean(normalizedUrl)
  const ActiveModeIcon = mode === 'local' ? FileCode2 : Globe
  const modeLabel = '网页壁纸'
  const modeBadgeLabel = mode === 'local' ? 'Local File' : 'Online URL'
  const previewHeaderDescription =
    mode === 'local'
      ? '选择本地网页后先在这里确认细节和兼容性，再决定是否把它挂到桌面。'
      : '在线链接输入完成后会直接尝试加载，适合先确认视觉效果，再决定是否设为壁纸。'
  const previewStatus = previewSrc ? (mode === 'local' ? '预览已就绪' : '链接已连接') : mode === 'local' ? '等待文件' : '等待链接'
  const previewActionHint =
    mode === 'local'
      ? '当前模式会先预览本地页面，只有点击“设为壁纸”后桌面才会真正切换。'
      : '推荐网页和输入框都只会准备来源，点击“设为壁纸”后才会替换当前桌面。'
  const previewSourceKind = mode === 'local' ? 'HTML / HTM / SVG' : 'HTTPS / Localhost'

  const applyWallpaper = (targetUrl: string) => {
    ipcRenderer.send('create-web-live-wallpaper', targetUrl)
    toast.success('网页壁纸设置成功')
  }

  const handleSetOnlineWallpaper = () => {
    const targetUrl = normalizeWebUrl(url)

    if (!targetUrl) {
      toast.warning('请输入网址')
      return
    }

    applyWallpaper(targetUrl)
  }

  const handleLocalFile = (targetPath: string) => {
    const extension = path.extname(targetPath).toLowerCase()

    if (!supportedLocalExtensions.has(extension)) {
      toast.warning('请选择 HTML、HTM 或 SVG 文件')
      return
    }

    const fileUrl = toRendererFileUrl(targetPath)
    const previewToken = Date.now()

    setLocalSelection({
      fileName: getFileName(targetPath),
      filePath: targetPath,
      fileUrl,
      previewUrl: toRendererFileUrl(targetPath, { t: previewToken }),
    })
  }

  const handleApplyLocalWallpaper = () => {
    if (!localSelection?.fileUrl) {
      toast.warning('先选择一个本地网页文件')
      return
    }

    applyWallpaper(localSelection.fileUrl)
  }

  const handleApplyCurrentWallpaper = () => {
    if (mode === 'local') {
      handleApplyLocalWallpaper()
      return
    }

    handleSetOnlineWallpaper()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (file) {
      const filePath = getRendererFilePath(file)

      if (!filePath) {
        toast.error('没有读取到本地文件路径')
        event.target.value = ''
        return
      }

      handleLocalFile(filePath)
    }

    event.target.value = ''
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files[0]

    if (!file) {
      return
    }

    const filePath = getRendererFilePath(file)

    if (!filePath) {
      toast.error('没有读取到本地文件路径')
      return
    }

    handleLocalFile(filePath)
  }

  const handleCloseWallpaper = () => {
    ipcRenderer.send('close-web-live-wallpaper')
    toast.success('网页壁纸已关闭')
  }

  const handleClearUrl = () => {
    setUrl('')
    urlInputRef.current?.focus()
  }

  const handleClearLocalSelection = () => {
    setLocalSelection(null)
    fileInputRef.current?.focus()
  }

  return (
    <div className='web-wallpaper-page animate-fade-in-up h-full overflow-hidden'>
      <div className='grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_390px]'>
        <section className='flex min-h-0 flex-col overflow-hidden lg:order-2'>
          <div className='mb-5 rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_34%),linear-gradient(160deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex min-w-0 items-center gap-3'>
                <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-sky-300/15 bg-sky-300/10 text-sky-100'>
                  <Globe className='h-5 w-5' />
                </div>
                <div className='min-w-0'>
                  <p className='text-[11px] uppercase tracking-[0.18em] text-slate-400'>Source Control</p>
                  <p className='mt-1 text-[14px] font-medium text-white'>选择在线链接或本地文件，准备预览内容</p>
                </div>
              </div>
              <div className='rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-[11px] text-cyan-100/90'>Web / HTML</div>
            </div>

            <div className='mt-4 flex rounded-[18px] border border-white/10 bg-black/20 p-1'>
              <button
                type='button'
                onClick={() => setMode('online')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-[14px] px-4 py-3 text-[13px] font-medium transition-all duration-200',
                  mode === 'online' ? 'bg-sky-400 text-slate-950 shadow-[0_12px_30px_rgba(56,189,248,0.22)]' : 'text-slate-400 hover:text-white',
                )}
              >
                <ExternalLink className='h-3.5 w-3.5' />
                在线链接
              </button>
              <button
                type='button'
                onClick={() => setMode('local')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-[14px] px-4 py-3 text-[13px] font-medium transition-all duration-200',
                  mode === 'local' ? 'bg-sky-400 text-slate-950 shadow-[0_12px_30px_rgba(56,189,248,0.22)]' : 'text-slate-400 hover:text-white',
                )}
              >
                <FileCode2 className='h-3.5 w-3.5' />
                本地文件
              </button>
            </div>
          </div>

          {mode === 'online' ? (
            <div className='flex min-h-0 flex-col gap-4 overflow-hidden'>
              <div className='flex min-h-0 flex-col rounded-[22px] border border-white/10 bg-black/20 p-4'>
                <div className='mb-3 flex items-center justify-between gap-3'>
                  <div className='flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400'>
                    <Sparkles className='h-3.5 w-3.5 text-amber-200' />
                    推荐网页
                  </div>
                  <span className='rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-300'>点击填入链接</span>
                </div>

                <div className='grid min-h-0 grid-cols-2 gap-3 overflow-y-auto pr-1'>
                  {recommendedSites.map((item) => (
                    <button
                      key={item.url}
                      type='button'
                      onClick={() => setUrl(item.url)}
                      className='group flex min-h-[220px] min-w-0 flex-col overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.04] text-left transition-all duration-200 hover:border-sky-300/30 hover:bg-white/[0.08]'
                    >
                      <div className='relative aspect-[16/10] shrink-0 overflow-hidden border-b border-white/10 bg-slate-900'>
                        <div
                          className='absolute inset-0 scale-100 bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.04]'
                          style={{ backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.12), rgba(15,23,42,0.72)), url(${item.thumbnailUrl})` }}
                        />
                        <div className='absolute left-3 top-3 rounded-full border border-white/10 bg-black/35 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/80'>
                          推荐
                        </div>
                      </div>
                      <div className='flex min-w-0 flex-1 flex-col p-3'>
                        <div className='truncate text-[13px] font-medium text-white'>{item.title}</div>
                        <p className='mt-1 min-h-10 overflow-hidden text-[12px] leading-5 text-slate-400 [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]'>
                          {item.description}
                        </p>
                        <p className='mt-auto truncate pt-3 text-[11px] text-sky-200/90'>{item.url}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className='rounded-[22px] border border-white/10 bg-black/20 p-4'>
                <div className='mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400'>
                  <ExternalLink className='h-3.5 w-3.5 text-sky-200' />
                  在线网页
                </div>

                <div className='relative'>
                  <Input
                    ref={urlInputRef}
                    placeholder='输入网址，如 https://threejs.org/examples/...'
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleSetOnlineWallpaper()
                      }
                    }}
                    className='h-11 rounded-2xl border-white/10 bg-black/25 pr-11 text-white placeholder:text-slate-500'
                  />
                  {url && (
                    <button
                      type='button'
                      onClick={handleClearUrl}
                      className='absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white'
                      aria-label='清空网址'
                    >
                      <X className='h-3.5 w-3.5' />
                    </button>
                  )}
                </div>

                <p className='mt-3 text-[12px] leading-6 text-slate-400'>
                  支持 https 链接，也支持 localhost 这类本地开发地址。部分网站会禁用 iframe 预览，但依然可以直接设为壁纸。
                </p>
              </div>
            </div>
          ) : (
            <div className='flex min-h-0 flex-col gap-4'>
              <div className='rounded-[22px] border border-white/10 bg-black/20 p-4'>
                <div className='mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400'>
                  <Upload className='h-3.5 w-3.5 text-sky-200' />
                  本地网页
                </div>

                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  className={cn(
                    'w-full rounded-[24px] border border-dashed px-5 py-8 text-center transition-all duration-200',
                    isDragging
                      ? 'border-sky-300/50 bg-sky-300/10 text-white shadow-[0_16px_40px_rgba(56,189,248,0.18)]'
                      : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.05] hover:text-white',
                  )}
                >
                  <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/[0.05] text-sky-100'>
                    <FileCode2 className='h-6 w-6' />
                  </div>
                  <p className='text-[14px] font-medium'>拖拽 HTML 到这里，或点击选择文件</p>
                  <p className='mt-2 text-[12px] leading-6 text-slate-400'>支持 HTML、HTM、SVG。选中后左侧会直接预览页面效果。</p>
                </button>

                <input ref={fileInputRef} type='file' accept='.html,.htm,.svg' className='hidden' onChange={handleFileChange} />

                {localSelection && (
                  <div className='mt-4 rounded-[18px] border border-emerald-400/15 bg-emerald-400/10 p-3'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <p className='truncate text-[13px] font-medium text-emerald-50'>{localSelection.fileName}</p>
                        <p className='mt-1 truncate text-[12px] text-emerald-100/75'>{localSelection.filePath}</p>
                      </div>
                      <button
                        type='button'
                        onClick={handleClearLocalSelection}
                        className='flex h-7 w-7 items-center justify-center rounded-full text-emerald-100/75 transition hover:bg-white/10 hover:text-white'
                        aria-label='清空已选文件'
                      >
                        <X className='h-3.5 w-3.5' />
                      </button>
                    </div>
                  </div>
                )}

                <div className='mt-4'>
                  <Button
                    variant='outline'
                    onClick={() => fileInputRef.current?.click()}
                    className='h-11 w-full rounded-2xl border-white/10 bg-white/[0.03] px-4 text-slate-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white'
                  >
                    重新选择
                  </Button>
                </div>
              </div>

              <div className='rounded-[22px] border border-white/10 bg-black/20 p-4'>
                <div className='mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400'>
                  <Sparkles className='h-3.5 w-3.5 text-amber-200' />
                  使用提示
                </div>
                <div className='space-y-2 text-[12px] leading-6 text-slate-400'>
                  <p>本地文件模式下，选择文件不会立即修改桌面，而是先在左侧做预览。</p>
                  <p>如果你的 HTML 依赖同目录资源，预览会按原始文件路径解析，更适合打包好的静态页面。</p>
                </div>
              </div>
            </div>
          )}

          <div className='mt-4 flex gap-3'>
            <Button
              variant='outline'
              onClick={handleCloseWallpaper}
              className='h-11 flex-1 rounded-2xl border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white'
            >
              <X className='mr-2 h-4 w-4' />
              关闭壁纸
            </Button>
            <Button onClick={handleApplyCurrentWallpaper} disabled={!canApplyWallpaper} className='h-11 flex-[1.15] rounded-2xl text-[14px]'>
              设为壁纸
            </Button>
          </div>
        </section>

        <section className='flex min-h-0 flex-col shadow-[0_28px_70px_rgba(2,6,23,0.2)] lg:order-1'>
          <div className='relative flex-1 overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.1),transparent_24%),linear-gradient(180deg,rgba(8,13,24,0.98),rgba(10,15,24,0.94))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_24px_60px_rgba(2,6,23,0.28)]'>
            <div className='pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]' />

            <div className='absolute inset-0'>
              {previewSrc ? (
                <>
                  <iframe key={`${mode}:${previewSrc}`} src={previewSrc} title='网页壁纸预览' className='h-full w-full bg-white' />
                  <div className='pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent p-4 pt-14'>
                    <div className='flex items-end justify-between gap-3'>
                      <div className='min-w-0'>
                        <p className='text-[11px] uppercase tracking-[0.16em] text-slate-300/75'>Preview Source</p>
                        <p className='truncate text-[13px] font-medium text-white'>{previewTitle}</p>
                        <p className='truncate text-[12px] text-slate-300/70'>{previewSubtitle}</p>
                      </div>
                      <div className='rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] text-slate-200/80'>
                        {mode === 'local' ? '本地渲染' : '实时加载'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className='relative flex h-full flex-col items-center justify-center px-8 text-center'>
                  <div
                    className={cn(
                      'mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-[26px] border shadow-[0_18px_45px_rgba(14,165,233,0.12)]',
                      mode === 'local'
                        ? 'border-emerald-300/15 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.18),transparent_60%),rgba(255,255,255,0.04)] text-emerald-100'
                        : 'border-sky-300/15 bg-[radial-gradient(circle_at_30%_30%,rgba(125,211,252,0.18),transparent_60%),rgba(255,255,255,0.04)] text-sky-100',
                    )}
                  >
                    <ActiveModeIcon className='h-8 w-8' />
                  </div>
                  <h3 className='font-display text-[26px] font-semibold text-white'>{mode === 'local' ? '等待选择本地网页' : '等待输入网页链接'}</h3>
                  <p className='mt-3 max-w-lg text-[13px] leading-7 text-slate-400'>
                    {mode === 'local'
                      ? '选择一个 HTML / HTM / SVG 文件后，这里会直接渲染页面内容。'
                      : '把在线链接填进右侧输入框，或者从推荐网页里选一个作为起点。'}
                  </p>
                  <div className='mt-5 flex flex-wrap items-center justify-center gap-2'>
                    <span className='rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-slate-300'>
                      {previewSourceKind}
                    </span>
                    <span className='rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-slate-300'>
                      {mode === 'local' ? '先预览，再应用到桌面' : '先加载，再决定是否设为壁纸'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className='mt-4 grid gap-3 xl:grid-cols-[1.05fr_0.95fr]'>
            <div className='rounded-[22px] border border-white/10 bg-[linear-gradient(160deg,rgba(8,14,24,0.78),rgba(10,18,30,0.82))] p-4'>
              <div className='mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400'>
                <ExternalLink className='h-3.5 w-3.5 text-sky-200' />
                兼容性说明
              </div>
              <div className='space-y-2 text-[12px] leading-6 text-slate-400'>
                <p>有些在线站点会通过 X-Frame-Options 或 CSP 禁止被嵌入，所以预览区可能显示空白。</p>
                <p>本地 HTML 不受这个限制，更适合做可控的网页壁纸来源。</p>
              </div>
            </div>

            <div className='rounded-[22px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.74),rgba(8,14,24,0.82))] p-4'>
              <div className='mb-3 flex items-center justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400'>
                  <ActiveModeIcon className='h-3.5 w-3.5 text-emerald-200' />
                  {modeLabel}
                </div>
                <span className='shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-slate-300'>
                  {modeBadgeLabel}
                </span>
              </div>
              <div className='space-y-2 text-[12px] leading-6 text-slate-400'>
                <p className='font-medium text-slate-200'>{previewStatus}</p>
                <p>{previewHeaderDescription}</p>
                <p>{previewActionHint}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default WebWallpaper
