import { ipcRenderer } from 'electron'
import { Upload } from 'lucide-react'

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
    <div className='live-wallpaper-page grid content-center px-[100px]'>
      <h1 className='mb-4 text-2xl font-bold'>视频壁纸</h1>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
        }`}
      >
        <Upload className='mb-4 h-12 w-12 text-slate-400' />
        <p className='text-base text-slate-600'>单击 或 拖动文件到此区域进行设置</p>
        <p className='mt-2 text-sm text-slate-400'>{filePath || '暂未选择文件'}</p>
        <input ref={fileInputRef} type='file' accept='video/*' className='hidden' onChange={handleFileChange} />
      </div>
      {filePath && <video className='mt-4 h-full w-full rounded-lg object-cover text-white' src={`file://${filePath}`} autoPlay loop muted></video>}
    </div>
  )
}
