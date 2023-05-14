import { ipcRenderer } from 'electron'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { Upload } from 'antd'

const { Dragger } = Upload
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

  // const [filePath, setFilePath] = useState<string | null>(null)
  const [filePath, setFilePath] = useStateWithCallback<string | null>(null)

  // 设置动态壁纸
  const setLiveWallpaper = async (val: string) => {
    store.set('video-path', val)
    ipcRenderer.send('create-live-wallpaper')
  }

  const props: UploadProps = {
    name: 'file',
    multiple: true,
    action: '#',
    customRequest: () => {},
    maxCount: 1,
    showUploadList: false,
    onChange(info) {
      setFilePath(info.file.originFileObj?.path || null, (prevValue: string, newValue: string) => {
        setLiveWallpaper(newValue)
      })
    },
  }

  useEffect(() => {
    setFilePath(store.get('video-path') || null)
    return () => {}
  }, [])

  return (
    <div className='live-wallpaper-page grid content-center px-[100px]'>
      <h1 className='text-2xl font-bold'>视频壁纸</h1>
      <Dragger {...props}>
        <p className='ant-upload-drag-icon'>
          <InboxOutlined />
        </p>
        <p className='ant-upload-text'>单击 或 拖动文件到此区域进行设置</p>
        <p className='ant-upload-hint'>{filePath}</p>
      </Dragger>
      {filePath && <video className='text-white object-cover h-full w-full mt-4' src={`file://${filePath}`} autoPlay loop muted></video>}
    </div>
  )
}
