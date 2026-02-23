import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ipcRenderer } from 'electron'
import { Globe, ExternalLink, Upload, FileCode2, X } from 'lucide-react'
import { toast } from 'sonner'

type Mode = 'online' | 'local'

const WebWallpaper = () => {
  const [mode, setMode] = useState<Mode>('online')
  const [url, setUrl] = useState('')
  const [localPath, setLocalPath] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const applyWallpaper = (targetUrl: string) => {
    ipcRenderer.send('create-web-live-wallpaper', targetUrl)
    toast.success('网页壁纸设置成功')
  }

  const handleSetOnlineWallpaper = () => {
    if (!url) {
      toast.warning('请输入网址')
      return
    }
    let targetUrl = url.trim()
    const hasProtocol = /^(http|https):\/\//i.test(targetUrl)
    if (!hasProtocol) {
      if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/.test(targetUrl) || targetUrl.startsWith('localhost')) {
        targetUrl = `http://${targetUrl}`
      } else {
        targetUrl = `https://${targetUrl}`
      }
    }
    applyWallpaper(targetUrl)
  }

  const handleLocalFile = (path: string) => {
    setLocalPath(path)
    applyWallpaper(`file://${path}`)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const path = (file as any).path
      if (path) handleLocalFile(path)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      const path = (file as any).path
      if (path) handleLocalFile(path)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleCloseWallpaper = () => {
    ipcRenderer.send('close-web-live-wallpaper')
    toast.success('网页壁纸已关闭')
  }

  return (
    <div className='animate-fade-in-up flex h-full flex-col items-center justify-center px-10'>
      {/* Header */}
      <div className='mb-6 flex flex-col items-center'>
        <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-400'>
          <Globe className='h-7 w-7' />
        </div>
        <h1 className='font-display text-2xl font-semibold text-[var(--text-primary)]'>网页壁纸</h1>
        <p className='mt-2 max-w-md text-center text-[13px] leading-relaxed text-[var(--text-tertiary)]'>
          将任何网页或本地 HTML 文件设置为桌面动态壁纸
        </p>
      </div>

      <div className='w-full max-w-xl space-y-4'>
        {/* Mode Tabs */}
        <div className='flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-glass)] p-1'>
          <button
            onClick={() => setMode('online')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
              mode === 'online' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <ExternalLink className='h-3.5 w-3.5' />
            在线网页
          </button>
          <button
            onClick={() => setMode('local')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
              mode === 'local' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <FileCode2 className='h-3.5 w-3.5' />
            本地文件
          </button>
        </div>

        {/* Online Mode */}
        {mode === 'online' && (
          <div className='animate-fade-in space-y-3'>
            <div className='rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-glass)] p-4'>
              <div className='space-y-3'>
                <div className='flex items-center gap-2 text-[12px] text-[var(--text-tertiary)]'>
                  <ExternalLink className='h-3 w-3' />
                  <span>支持在线网址、Three.js 场景、Shadertoy 等</span>
                </div>
                <Input
                  placeholder='输入网址，如 https://threejs.org/examples/...'
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSetOnlineWallpaper()
                  }}
                  className='h-11 text-sm'
                />
              </div>
            </div>
            <Button onClick={handleSetOnlineWallpaper} className='w-full'>
              设为壁纸
            </Button>
          </div>
        )}

        {/* Local Mode */}
        {mode === 'local' && (
          <div className='animate-fade-in space-y-3'>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`glow-border flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all duration-300 ${
                isDragging
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-glow)] shadow-[var(--shadow-glow)]'
                  : 'hover:border-[var(--accent-primary)]/50 border-[var(--border-default)] bg-[var(--bg-glass)] hover:bg-[var(--bg-glass-hover)]'
              }`}
            >
              <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-glass-active)]'>
                <Upload className='h-5 w-5 text-[var(--text-secondary)]' />
              </div>
              <p className='text-[14px] font-medium text-[var(--text-secondary)]'>点击选择 或 拖拽文件到这里</p>
              <p className='mt-1.5 text-[12px] text-[var(--text-tertiary)]'>{localPath ? localPath.split('/').pop() : '支持 HTML、HTM 等网页文件'}</p>
              <input ref={fileInputRef} type='file' accept='.html,.htm,.svg' className='hidden' onChange={handleFileChange} />
            </div>
          </div>
        )}

        {/* Close Button */}
        <Button variant='outline' onClick={handleCloseWallpaper} className='w-full'>
          <X className='mr-1.5 h-4 w-4' />
          关闭壁纸
        </Button>
      </div>
    </div>
  )
}

export default WebWallpaper
