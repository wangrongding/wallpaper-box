import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ipcRenderer } from 'electron'
import { Settings2, Shield, FolderOpen, Wifi } from 'lucide-react'
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
    <div className='animate-fade-in-up mx-auto max-w-2xl py-4'>
      <div className='mb-6 flex items-center gap-3'>
        <div className='from-[var(--accent-primary)]/20 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br to-sky-600/10 text-[var(--accent-primary)]'>
          <Settings2 className='h-5 w-5' />
        </div>
        <div>
          <h1 className='font-display text-xl font-semibold text-[var(--text-primary)]'>设置</h1>
          <p className='text-[13px] text-[var(--text-tertiary)]'>管理应用偏好和网络配置</p>
        </div>
      </div>

      <div className='mb-4 flex items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-2.5 text-[13px] text-sky-300/80'>
        <span className='text-base'>💡</span>
        <span>部分功能开发中，敬请期待</span>
      </div>

      {/* 常规设置 */}
      <div className='mb-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-glass)]'>
        <div className='flex items-center gap-2 border-b border-[var(--border-subtle)] px-5 py-3'>
          <Shield className='h-4 w-4 text-[var(--text-tertiary)]' />
          <span className='text-[13px] font-medium text-[var(--text-secondary)]'>常规</span>
        </div>
        <div className='space-y-0'>
          <div className='flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4'>
            <div>
              <p className='text-[14px] font-medium text-[var(--text-primary)]'>开机自启</p>
              <p className='text-[12px] text-[var(--text-tertiary)]'>登录系统时自动启动应用</p>
            </div>
            <Switch id='auto-start' checked={autoLaunch} onCheckedChange={setAutoStart} />
          </div>

          <div className='flex items-center justify-between px-5 py-4'>
            <div className='flex items-center gap-3'>
              <div>
                <p className='text-[14px] font-medium text-[var(--text-primary)]'>存储位置</p>
                <p className='text-[12px] text-[var(--text-tertiary)]'>壁纸文件的保存路径</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Input id='address' type='url' value={rootPath} className='w-[180px] text-[13px]' readOnly />
              <Button variant='outline' size='sm'>
                修改
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 网络代理 */}
      <div className='overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-glass)]'>
        <div className='flex items-center gap-2 border-b border-[var(--border-subtle)] px-5 py-3'>
          <Wifi className='h-4 w-4 text-[var(--text-tertiary)]' />
          <span className='text-[13px] font-medium text-[var(--text-secondary)]'>网络代理 (HTTP_PROXY)</span>
        </div>
        <div className='space-y-4 px-5 py-4'>
          <div>
            <label className='mb-1.5 block text-[13px] text-[var(--text-secondary)]'>代理服务器地址</label>
            <Input
              id='proxy'
              value={proxyPath}
              placeholder='例: http://localhost:7890'
              type='text'
              onChange={(e) => {
                setProxyPath(e.target.value)
              }}
              className='text-[13px]'
            />
          </div>
          <div className='flex gap-2'>
            <Button onClick={setProxy} size='sm'>
              保存代理
            </Button>
            <Button variant='outline' size='sm' loading={loading} onClick={ping}>
              测试连接
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
