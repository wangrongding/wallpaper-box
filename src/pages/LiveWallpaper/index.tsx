import { ipcRenderer } from 'electron'
import { Upload, Film } from 'lucide-react'

const Store = require('electron-store')
const store = new Store()

export default function LiveWallpaper() {
  function useStateWithCallback<T>(initialValue: T): [T, Function] {
    const [value, setValue] = useState(initialValue)
    const setValueAndCallback = (newValue: T, callback: Function) => {
      setValue((prevValue: T) => {
        if (callback) {
          callback(prevValue, newValue)
        }
        return newValue
      })
    }
    return [value, setValueAndCallback]
  }

  const [filePath, setFilePath] = useStateWithCallback<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 设置动态壁纸
  const setLiveWallpaper = async (val: string) => {
    store.set('video-path', val)
    ipcRenderer.send('create-live-wallpaper')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const path = (file as any).path
      if (path) {
        setFilePath(path, (_prevValue: string, newValue: string) => {
          setLiveWallpaper(newValue)
        })
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      const path = (file as any).path
      if (path) {
        setFilePath(path, (_prevValue: string, newValue: string) => {
          setLiveWallpaper(newValue)
        })
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    setFilePath(store.get('video-path') || null)
    return () => {}
  }, [])

  return (
    <div className='live-wallpaper-page animate-fade-in-up flex h-full flex-col items-center justify-center px-[80px]'>
      <div className='mb-6 flex items-center gap-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 text-purple-400'>
          <Film className='h-5 w-5' />
        </div>
        <div>
          <h1 className='font-display text-xl font-semibold text-[var(--text-primary)]'>视频壁纸</h1>
          <p className='text-[13px] text-[var(--text-tertiary)]'>选择一个视频文件作为你的动态桌面壁纸</p>
        </div>
      </div>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`glow-border flex w-full max-w-lg cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 transition-all duration-300 ${
          isDragging
            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-glow)] shadow-[var(--shadow-glow)]'
            : 'hover:border-[var(--accent-primary)]/50 border-[var(--border-default)] bg-[var(--bg-glass)] hover:bg-[var(--bg-glass-hover)]'
        }`}
      >
        <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-glass-active)]'>
          <Upload className='h-6 w-6 text-[var(--text-secondary)]' />
        </div>
        <p className='text-[15px] font-medium text-[var(--text-secondary)]'>点击选择 或 拖拽视频到这里</p>
        <p className='mt-2 text-[13px] text-[var(--text-tertiary)]'>{filePath ? filePath.split('/').pop() : '支持 MP4、MOV、WebM 等视频格式'}</p>
        <input ref={fileInputRef} type='file' accept='video/*' className='hidden' onChange={handleFileChange} />
      </div>
      {filePath && (
        <div className='mt-6 w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border-subtle)] shadow-lg'>
          <video className='h-full w-full object-cover' src={`file://${filePath}`} autoPlay loop muted />
        </div>
      )}
    </div>
  )
}
