import { createStore, ipcRenderer, toRendererFileUrl } from '@/lib/electron-runtime'

const store = createStore()

export default function WallPaperPage() {
  const [videoPath, setVideoPath] = useState(() => (store.get('video-path') as string) || '')
  const videoSrc = toRendererFileUrl(videoPath)

  useEffect(() => {
    const handleChangeLiveWallpaper = () => {
      setVideoPath((store.get('video-path') as string) || '')
    }

    ipcRenderer.on('change-live-wallpaper', handleChangeLiveWallpaper)

    return () => {
      ipcRenderer.removeListener('change-live-wallpaper', handleChangeLiveWallpaper)
    }
  }, [])

  return (
    <div className='m-[0px] h-[100vh] w-[100vw] overflow-hidden p-[0px]'>
      {/* <video className='text-white object-cover h-full w-full' src={videoPath || 'https://assets.fedtop.com/bike.mp4'} autoPlay loop muted></video> */}
      {/* <video className='text-white object-cover h-full w-full' src={videoPath || 'https://assets.fedtop.com/home.mp4'} autoPlay loop muted></video> */}
      {videoSrc && <video className='h-full w-full object-cover text-white' src={videoSrc} autoPlay loop muted></video>}
    </div>
  )
}
