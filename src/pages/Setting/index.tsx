import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { createStore, ipcRenderer, os, path } from '@/lib/electron-runtime'
import { WALLHAVEN_API_KEY_HELP_URL, WALLHAVEN_API_KEY_STORE_KEY } from '@/lib/wallhaven'
import { CheckCircle2, ExternalLink, FolderOpen, Image, Info, KeyRound, Settings2, Shield, Wifi } from 'lucide-react'
import { toast } from 'sonner'

const store = createStore()

const defaultRootPath = path.join(os.homedir(), 'wallpaper-box')

export default function Setting() {
  const [rootPath, setRootPath] = useState(defaultRootPath)
  const [proxyPath, setProxyPath] = useState('')
  const [wallhavenApiKey, setWallhavenApiKey] = useState('')
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

  function saveWallhavenApiKey() {
    const nextValue = wallhavenApiKey.trim()

    if (nextValue) {
      store.set(WALLHAVEN_API_KEY_STORE_KEY, nextValue)
      toast.success('Wallhaven API Key 已保存')
      return
    }

    store.delete(WALLHAVEN_API_KEY_STORE_KEY)
    toast.success('已切回内置默认 Wallhaven API Key')
  }

  function openWallhavenAccount() {
    ipcRenderer.send('open-link-in-browser', WALLHAVEN_API_KEY_HELP_URL)
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
    setProxyPath(store.get('proxy-path') || '')
    setWallhavenApiKey(store.get(WALLHAVEN_API_KEY_STORE_KEY) || '')
    // 读取图片存储位置
    setRootPath(store.get('root-path') || defaultRootPath)
    // 读取开机自启
    setAutoLaunch(store.get('auto-launch') || false)
    return () => {}
  }, [])

  const hasCustomWallhavenApiKey = !!wallhavenApiKey.trim()

  return (
    <div className='animate-fade-in-up mx-auto max-w-3xl px-1 pb-8 pt-2'>
      <div className='mb-5 flex flex-wrap items-end justify-between gap-4'>
        <div className='flex min-w-0 items-center gap-3'>
          <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_35%_20%,rgba(56,189,248,0.24),transparent_42%),linear-gradient(135deg,rgba(0,173,238,0.16),rgba(255,255,255,0.04))] text-sky-100 shadow-[0_18px_50px_rgba(2,6,23,0.25)]'>
            <Settings2 className='h-5 w-5' />
          </div>
          <div className='min-w-0'>
            <h1 className='font-display text-2xl font-semibold text-[var(--text-primary)]'>设置</h1>
            <p className='mt-1 text-[13px] text-[var(--text-tertiary)]'>管理网络、壁纸源和应用启动偏好</p>
          </div>
        </div>
        <div className='rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[12px] text-[var(--text-tertiary)]'>偏好设置</div>
      </div>

      <div className='mb-4 flex items-start gap-3 rounded-xl border border-sky-400/15 bg-[radial-gradient(circle_at_left,rgba(56,189,248,0.13),transparent_58%),rgba(56,189,248,0.045)] px-4 py-3 text-[13px] text-sky-100/80'>
        <div className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-200'>
          <Info className='h-3.5 w-3.5' />
        </div>
        <div className='min-w-0'>
          <p className='font-medium text-sky-100/90'>连接慢或遇到限速时，优先检查网络代理和 Wallhaven API Key。</p>
          <p className='mt-0.5 text-[12px] leading-5 text-sky-100/55'>保存后会立即写入本地配置，测试连接会临时访问 Google 验证代理可用性。</p>
        </div>
      </div>

      {/* 网络代理 */}
      <div className='mb-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] shadow-[0_18px_60px_rgba(2,6,23,0.18)]'>
        <div className='flex items-center gap-3 border-b border-[var(--border-subtle)] px-5 py-4'>
          <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-200 ring-1 ring-sky-300/15'>
            <Wifi className='h-4 w-4' />
          </div>
          <div className='min-w-0'>
            <p className='text-[14px] font-semibold text-[var(--text-primary)]'>网络代理</p>
            <p className='text-[12px] text-[var(--text-tertiary)]'>用于 Wallhaven、在线资源和网络检测请求</p>
          </div>
          <span className='ml-auto hidden rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] text-[var(--text-tertiary)] sm:block'>
            HTTP_PROXY
          </span>
        </div>
        <div className='px-5 py-4'>
          <label className='mb-2 block text-[13px] font-medium text-[var(--text-secondary)]'>代理服务器地址</label>
          <div className='flex flex-col gap-2 sm:flex-row'>
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
            <Button onClick={setProxy} size='sm' className='shrink-0 sm:w-[88px]'>
              保存代理
            </Button>
            <Button variant='outline' size='sm' loading={loading} onClick={ping} className='shrink-0 sm:w-[88px]'>
              测试连接
            </Button>
          </div>
          <p className='mt-2 text-[12px] leading-5 text-[var(--text-tertiary)]'>留空保存可清除代理配置。</p>
        </div>
      </div>

      <div className='mb-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] shadow-[0_18px_60px_rgba(2,6,23,0.18)]'>
        <div className='flex items-center gap-3 border-b border-[var(--border-subtle)] px-5 py-4'>
          <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-200 ring-1 ring-amber-300/15'>
            <Image className='h-4 w-4' />
          </div>
          <div className='min-w-0'>
            <p className='text-[14px] font-semibold text-[var(--text-primary)]'>壁纸源</p>
            <p className='text-[12px] text-[var(--text-tertiary)]'>配置 Wallhaven 访问凭证，减少共享 Key 限速影响</p>
          </div>
        </div>
        <div className='space-y-4 px-5 py-4'>
          <div>
            <div className='mb-1.5 flex items-center justify-between gap-3'>
              <label className='text-[13px] font-medium text-[var(--text-secondary)]'>Wallhaven API Key</label>
              <Button variant='ghost' size='sm' className='h-7 px-2 text-[12px]' onClick={openWallhavenAccount}>
                <ExternalLink className='mr-1.5 h-3.5 w-3.5' />
                获取 ApiKey
              </Button>
            </div>
            <div className='flex flex-col gap-2 sm:flex-row'>
              <Input
                value={wallhavenApiKey}
                placeholder='留空则使用内置默认 Key'
                type='text'
                onChange={(e) => {
                  setWallhavenApiKey(e.target.value)
                }}
                className='text-[13px]'
              />
              <Button onClick={saveWallhavenApiKey} size='sm' className='shrink-0 sm:w-[88px]'>
                保存 Key
              </Button>
            </div>
            <div className='mt-3 flex flex-wrap items-center gap-2 text-[12px] leading-5'>
              <span className='text-[var(--text-tertiary)]'>当前生效</span>
              <span className='inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.045] px-2.5 py-1 text-[var(--text-secondary)]'>
                {hasCustomWallhavenApiKey ? (
                  <CheckCircle2 className='h-3.5 w-3.5 text-emerald-300' />
                ) : (
                  <KeyRound className='h-3.5 w-3.5 text-amber-300' />
                )}
                {hasCustomWallhavenApiKey ? '自定义 API Key' : '内置默认 Key'}
              </span>
              {!hasCustomWallhavenApiKey && <span className='text-[var(--text-tertiary)]'>共享 Key 使用人数较多时可能遇到访问限制</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 常规设置 */}
      <div className='mb-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] shadow-[0_18px_60px_rgba(2,6,23,0.18)]'>
        <div className='flex items-center gap-3 border-b border-[var(--border-subtle)] px-5 py-4'>
          <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/15'>
            <Shield className='h-4 w-4' />
          </div>
          <div className='min-w-0'>
            <p className='text-[14px] font-semibold text-[var(--text-primary)]'>常规</p>
            <p className='text-[12px] text-[var(--text-tertiary)]'>启动行为和本地文件保存位置</p>
          </div>
        </div>
        <div className='space-y-0'>
          <div className='flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-4'>
            <div className='min-w-0'>
              <p className='text-[14px] font-medium text-[var(--text-primary)]'>开机自启</p>
              <p className='mt-0.5 text-[12px] text-[var(--text-tertiary)]'>登录系统时自动启动应用</p>
            </div>
            <Switch id='auto-start' checked={autoLaunch} onCheckedChange={setAutoStart} />
          </div>

          <div className='flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex min-w-0 items-center gap-3'>
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-[var(--text-tertiary)] ring-1 ring-white/[0.06]'>
                <FolderOpen className='h-4 w-4' />
              </div>
              <div className='min-w-0'>
                <p className='text-[14px] font-medium text-[var(--text-primary)]'>存储位置</p>
                <p className='mt-0.5 text-[12px] text-[var(--text-tertiary)]'>壁纸文件的保存路径</p>
              </div>
            </div>
            <div className='flex min-w-0 items-center gap-2 sm:w-[360px]'>
              <Input id='address' type='url' value={rootPath} className='min-w-0 flex-1 text-[13px]' readOnly />
              <Button variant='outline' size='sm' disabled className='shrink-0'>
                修改
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
