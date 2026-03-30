import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createStore, ipcRenderer } from '@/lib/electron-runtime'
import { cn } from '@/lib/utils'
import { CheckCircle2, Download, ExternalLink, Film, FolderOpen, Link2, Loader2, Upload, Video } from 'lucide-react'
import { toast } from 'sonner'

const store = createStore()

type VideoDownloadProgress = {
  destination?: string
  eta?: string
  extractor?: string
  line?: string
  percent?: number
  phase: 'prepare' | 'download' | 'merge' | 'completed' | 'error'
  speed?: string
  title?: string
}

type VideoDownloadResponse = {
  directory?: string
  extractor?: string
  fileName?: string
  message?: string
  path?: string
  success?: boolean
  title?: string
}

function getFileName(targetPath: string) {
  return targetPath.split(/[\\/]/).pop() || targetPath
}

function normalizeVideoUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

export default function LiveWallpaper() {
  const [filePath, setFilePath] = useState<string | null>(null)
  const [previewToken, setPreviewToken] = useState<number>(Date.now())
  const [downloadUrl, setDownloadUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<VideoDownloadProgress | null>(null)
  const [lastDownloadedVideo, setLastDownloadedVideo] = useState<VideoDownloadResponse | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function applyVideoWallpaper(nextPath: string, successMessage: string) {
    store.set('video-path', nextPath)
    setFilePath(nextPath)
    setPreviewToken(Date.now())
    ipcRenderer.send('create-live-wallpaper')
    toast.success(successMessage)
  }

  async function revealInFinder(targetPath?: string) {
    if (!targetPath) {
      return
    }

    const result = await ipcRenderer.invoke('show-item-in-folder', targetPath)
    if (!result?.success) {
      toast.error(result?.message || '打开文件位置失败')
    }
  }

  async function handlePickedFile(file?: File | null) {
    if (!file) {
      return
    }

    const targetPath = (file as File & { path?: string }).path
    if (!targetPath) {
      toast.error('没有读取到本地视频路径')
      return
    }

    await applyVideoWallpaper(targetPath, '本地视频已设为壁纸')
  }

  async function handleDownload() {
    const normalizedUrl = normalizeVideoUrl(downloadUrl)
    if (!normalizedUrl) {
      toast.warning('先粘贴一个视频链接')
      return
    }

    setIsDownloading(true)
    setDownloadProgress({
      line: '正在准备下载器',
      percent: 0,
      phase: 'prepare',
    })

    try {
      const response = (await ipcRenderer.invoke('download-video-wallpaper', {
        url: normalizedUrl,
      })) as VideoDownloadResponse

      if (!response?.success || !response.path) {
        toast.error(response?.message || '视频下载失败')
        return
      }

      setLastDownloadedVideo(response)
      await applyVideoWallpaper(response.path, '视频下载完成，已自动设为壁纸')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await handlePickedFile(event.target.files?.[0])
    event.target.value = ''
  }

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    await handlePickedFile(event.dataTransfer.files?.[0])
  }

  useEffect(() => {
    setFilePath(store.get('video-path') || null)

    const handleProgress = (_event: unknown, payload: VideoDownloadProgress) => {
      setDownloadProgress(payload)
    }

    ipcRenderer.on('video-download-progress', handleProgress)

    return () => {
      ipcRenderer.removeListener('video-download-progress', handleProgress)
    }
  }, [])

  const previewSrc = filePath ? encodeURI(`file://${filePath}`) : ''
  const currentFileName = filePath ? getFileName(filePath) : ''
  const progressPercent = Math.max(0, Math.min(100, Math.round(downloadProgress?.percent ?? 0)))
  const progressTone =
    downloadProgress?.phase === 'error'
      ? 'from-rose-500/85 to-orange-400/85'
      : downloadProgress?.phase === 'completed'
        ? 'from-emerald-500 to-cyan-400'
        : 'from-sky-400 via-cyan-300 to-amber-300'
  const statusTitle = downloadProgress?.title || lastDownloadedVideo?.title || currentFileName || '等待选择视频'
  const statusLine = downloadProgress?.line || (filePath ? '已准备好作为壁纸循环播放' : '粘贴在线视频链接，或选择本地视频文件')
  const sourceLabel = downloadProgress?.extractor || lastDownloadedVideo?.extractor || '本地文件'

  return (
    <div className='live-wallpaper-page h-full overflow-hidden'>
      <div className='grid h-full grid-cols-[380px_minmax(0,1fr)] gap-4'>
        <section className='flex min-h-0 flex-col rounded-[14px] border border-white/10 bg-[linear-gradient(160deg,rgba(8,14,24,0.98),rgba(10,18,30,0.95))] p-4 shadow-[0_24px_60px_rgba(2,6,23,0.2)]'>
          <div className='mb-4 flex items-center justify-between gap-3'>
            <div>
              <h1 className='font-display text-[24px] font-semibold text-white'>视频壁纸</h1>
              <p className='mt-1 text-[13px] leading-6 text-slate-400'>下载在线视频或导入本地视频，完成后自动接入现有动态壁纸流程。</p>
            </div>
            <div className='rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-100/90'>
              最高可用清晰度
            </div>
          </div>

          <div className='mb-4 rounded-[22px] border border-white/10 bg-black/20 p-4'>
            <div className='mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400'>
              <Link2 className='h-3.5 w-3.5 text-sky-200' />
              在线下载
            </div>
            <div className='space-y-3'>
              <Input
                value={downloadUrl}
                onChange={(event) => setDownloadUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !isDownloading) {
                    void handleDownload()
                  }
                }}
                placeholder='https://www.youtube.com/watch?v=... 或 https://www.bilibili.com/video/...'
                className='h-11 rounded-2xl border-white/10 bg-black/25 text-white placeholder:text-slate-500'
              />
              <Button onClick={handleDownload} loading={isDownloading} className='h-11 w-full rounded-2xl text-[14px]'>
                {!isDownloading && <Download className='mr-2 h-4 w-4' />}
                下载并设为壁纸
              </Button>
            </div>
            <div className='mt-4 grid gap-2'>
              <div className='border-white/8 rounded-2xl border bg-white/[0.03] px-3 py-2 text-[12px] text-slate-400'>
                如果源站的 4K / HDR 需要登录、会员或 Cookie，最终能拿到的是“当前可访问的最高档”。
              </div>
            </div>
          </div>

          <div className='mb-4 rounded-[22px] border border-white/10 bg-black/20 p-4'>
            <div className='mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400'>
              <Upload className='h-3.5 w-3.5 text-sky-200' />
              本地导入
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              onDrop={(event) => void handleDrop(event)}
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
                <FolderOpen className='h-6 w-6' />
              </div>
              <p className='text-[14px] font-medium'>拖拽视频到这里，或点击选择</p>
              <p className='mt-2 text-[12px] leading-6 text-slate-400'>支持 MP4、MOV、WebM。适合本地素材直接当作壁纸源。</p>
            </button>
            <input ref={fileInputRef} type='file' accept='video/*' className='hidden' onChange={(event) => void handleFileChange(event)} />
          </div>

          <div className='mt-auto space-y-3'>
            <div className='rounded-[22px] border border-white/10 bg-black/20 p-4'>
              <div className='mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400'>
                <CheckCircle2 className='h-3.5 w-3.5 text-emerald-300' />
                当前策略
              </div>
              <div className='space-y-2 text-[12px] leading-6 text-slate-300'>
                <p>在线视频：优先拿最高可用画质，再自动设为动态壁纸。</p>
                <p>本地导入：不改码，直接复用当前视频壁纸链路。</p>
                <p>保存目录：`~/wallpaper-box/videos`</p>
              </div>
            </div>
          </div>
        </section>

        <section className='flex min-h-0 flex-col rounded-[14px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-4 shadow-[0_28px_70px_rgba(2,6,23,0.2)]'>
          <div className='mb-4 flex items-center justify-between gap-3'>
            <div>
              <h2 className='font-display text-[24px] font-semibold text-white'>预览与状态</h2>
              <p className='mt-1 text-[12px] uppercase tracking-[0.14em] text-slate-400'>Current Video</p>
            </div>
            <div className='rounded-full border border-sky-300/15 bg-sky-300/10 px-3 py-1 text-[11px] text-sky-100/90'>
              {filePath ? currentFileName || '视频已就绪' : '等待素材'}
            </div>
          </div>

          <div className='relative flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.12),transparent_26%),radial-gradient(circle_at_100%_0%,rgba(251,191,36,0.08),transparent_22%),linear-gradient(180deg,rgba(8,13,24,0.98),rgba(10,15,24,0.94))] p-4'>
            <div className='pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]' />
            <div className='relative flex h-full items-center justify-center'>
              {filePath ? (
                <div className='relative w-full overflow-hidden rounded-[24px] border border-white/10 bg-black/40 shadow-[0_24px_60px_rgba(2,6,23,0.42)]'>
                  <video
                    key={previewToken}
                    className='h-full max-h-[640px] w-full bg-black/30 object-contain'
                    src={previewSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                  <div className='pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/65 to-transparent' />
                </div>
              ) : (
                <div className='max-w-md text-center'>
                  <div className='mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-[24px] bg-white/[0.04] text-sky-100'>
                    {isDownloading ? <Loader2 className='h-8 w-8 animate-spin' /> : <Video className='h-8 w-8' />}
                  </div>
                  <h3 className='font-display text-2xl font-semibold text-white'>{isDownloading ? '正在下载高质量视频' : '视频会显示在这里'}</h3>
                  <p className='mt-3 text-[13px] leading-7 text-slate-400'>
                    {isDownloading
                      ? '下载完成后会自动设为壁纸，你可以在这里直接预览最终素材。'
                      : '左侧输入在线视频链接，或拖入本地文件，就能立即接入动态壁纸。'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className='mt-4 grid grid-cols-[minmax(0,1fr)_220px] gap-4'>
            <div className='rounded-[22px] border border-white/10 bg-[linear-gradient(160deg,rgba(8,14,24,0.78),rgba(10,18,30,0.82))] p-4'>
              <div className='mb-3 flex items-start justify-between gap-3'>
                <div>
                  <p className='text-[12px] uppercase tracking-[0.14em] text-slate-400'>下载进度</p>
                  <h3 className='mt-1 text-[18px] font-semibold text-white'>{statusTitle}</h3>
                </div>
                <div className='text-right'>
                  <div className='text-[26px] font-semibold leading-none text-white'>{progressPercent}%</div>
                  <div className='mt-1 text-[12px] text-slate-400'>{downloadProgress?.speed || (isDownloading ? '处理中' : '等待任务')}</div>
                </div>
              </div>

              <div className='bg-white/8 h-2 overflow-hidden rounded-full'>
                <div
                  className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', progressTone)}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className='mt-3 flex flex-wrap gap-2'>
                <span className='border-white/8 rounded-full border bg-white/[0.04] px-2.5 py-1 text-[12px] text-slate-300'>{sourceLabel}</span>
                <span className='border-white/8 rounded-full border bg-white/[0.04] px-2.5 py-1 text-[12px] text-slate-300'>
                  {downloadProgress?.eta ? `ETA ${downloadProgress.eta}` : '最高可用清晰度'}
                </span>
                <span className='border-white/8 rounded-full border bg-white/[0.04] px-2.5 py-1 text-[12px] text-slate-300'>
                  {downloadProgress?.phase === 'merge' ? '正在合并音视频流' : '下载完成后自动应用'}
                </span>
              </div>

              <div className='border-white/8 mt-3 rounded-2xl border bg-black/20 px-3 py-3 text-[13px] leading-6 text-slate-300'>{statusLine}</div>
            </div>

            <div className='rounded-[22px] border border-white/10 bg-black/20 p-4'>
              <p className='mb-3 text-[12px] uppercase tracking-[0.14em] text-slate-400'>操作</p>
              <div className='space-y-2'>
                <Button
                  variant='outline'
                  onClick={() => void revealInFinder(filePath || lastDownloadedVideo?.path)}
                  disabled={!filePath && !lastDownloadedVideo?.path}
                  className='w-full rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]'
                >
                  <FolderOpen className='mr-2 h-4 w-4' />
                  打开所在位置
                </Button>
                <Button
                  variant='ghost'
                  onClick={() => fileInputRef.current?.click()}
                  className='w-full rounded-2xl text-slate-200 hover:bg-white/[0.06] hover:text-white'
                >
                  <Upload className='mr-2 h-4 w-4' />
                  选择本地视频
                </Button>
                <Button
                  variant='ghost'
                  onClick={() => void revealInFinder(lastDownloadedVideo?.path)}
                  disabled={!lastDownloadedVideo?.path}
                  className='w-full rounded-2xl text-slate-200 hover:bg-white/[0.06] hover:text-white'
                >
                  <ExternalLink className='mr-2 h-4 w-4' />
                  查看刚下载的视频
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
