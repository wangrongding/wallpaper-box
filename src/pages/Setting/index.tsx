import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ipcRenderer } from 'electron'
import { toast } from 'sonner'

const Store = require('electron-store')
const store = new Store()
export default function Setting() {
  const [rootPath, setRootPath] = useState('/wallpaper-box')
  const [proxyPath, setProxyPath] = useState('')
  const [autoLaunch, setAutoLaunch] = useState(false)
  const [loading, setLoading] = useState(false)

  // 设置成功回调
  function handleSetSuccess() {
    toast.success('设置成功！')
  }

  // 设置开机自启
  function setAutoStart(val: boolean) {
    ipcRenderer.send('set-auto-launch', val)
    handleSetSuccess()
    setAutoLaunch(val)
    store.set('auto-launch', val)
  }

  // 设置网络代理
  function setProxy() {
    store.set('proxy-path', proxyPath)
    ipcRenderer.send('set-proxy', proxyPath)
    handleSetSuccess()
  }

  // 测试网络代理
  async function ping() {
    store.set('proxy-path', proxyPath)
    ipcRenderer.send('set-proxy', proxyPath)
    setLoading(true)
    // 测试访问 https://www.google.com
    try {
      const res = await fetch('https://www.google.com')
      if (res.status === 200) {
        toast.success('访问 Google 通了！！！')
      } else {
        toast.error(`访问 Google失败。。。 ${res.status}`)
      }
    } catch {
      toast.error('请求不通，请检查代理是否正确！')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 读取代理地址
    setProxyPath(store.get('proxy-path'))
    // 读取图片存储位置
    setRootPath(store.get('root-path'))
    // 读取开机自启
    setAutoLaunch(store.get('auto-launch'))
    return () => {}
  }, [])

  return (
    <div className='px-[100px]'>
      <h1 className='my-8 text-2xl font-bold'>Setting</h1>

      <p className='mb-4 box-border rounded bg-amber-200 pl-4 leading-8 text-black'>💡 部分功能开发中......</p>

      {/* 设置代理 */}
      <div className='my-4 space-y-4 rounded-lg border border-slate-300 p-8'>
        <div className='flex items-center gap-3'>
          <label htmlFor='auto-start'>开机自启：</label>
          <Switch id='auto-start' checked={autoLaunch} onCheckedChange={setAutoStart} />
          <span className='text-sm text-slate-500'>{autoLaunch ? '已开启' : '已关闭'}</span>
        </div>

        <div className='flex items-center gap-3'>
          <label htmlFor='address'>图片存储位置：（开发中）</label>
          <Input id='address' type='url' value={rootPath} className='w-[200px]' readOnly />
          <Button className='ml-1'>修改</Button>
        </div>
      </div>

      <div className='my-4 space-y-4 rounded-lg border border-slate-300 p-8'>
        <h2 className='text-lg font-semibold'>网络代理：(HTTP_PROXY)</h2>
        <div className='flex items-center gap-3'>
          <label htmlFor='proxy'>代理服务器地址：</label>
          <Input
            id='proxy'
            value={proxyPath}
            placeholder='例: http://localhost:7890'
            type='text'
            onChange={(e) => {
              setProxyPath(e.target.value)
            }}
            className='w-[200px]'
          />
          <Button onClick={setProxy}>修改</Button>
          <Button variant='secondary' loading={loading} onClick={ping} className='bg-emerald-400 text-white hover:bg-emerald-500'>
            测试
          </Button>
        </div>
      </div>
    </div>
  )
}
