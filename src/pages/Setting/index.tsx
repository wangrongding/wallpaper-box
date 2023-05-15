import { Button, Input, Switch, message } from 'antd'
import { ipcRenderer } from 'electron'

const Store = require('electron-store')
const store = new Store()
export default function Setting() {
  const [rootPath, setRootPath] = useState('/wallpaper-box')
  const [proxyPath, setProxyPath] = useState('')
  const [autoLaunch, setAutoLaunch] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()
  const [loading, setLoading] = useState(false)

  // 设置成功回调
  function handleSetSuccess() {
    messageApi.success('设置成功！')
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
        messageApi.success('访问 Google 通了！！！')
      } else {
        messageApi.error('访问 Google失败。。。', res.status)
      }
    } catch {
      messageApi.error('请求不通，请检查代理是否正确！')
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
      {contextHolder}
      <h1 className='font-bold text-2xl my-8'>Setting</h1>

      <p className='text-black bg-amber-200 leading-8 box-border pl-4 mb-4'>💡 部分功能开发中......</p>

      {/* 设置代理 */}
      <div className=' rounded-lg border-slate-400 border-4 my-4 p-8'>
        <div>
          <label htmlFor='auto-start'>开机自启：</label>
          <Switch id='auto-start' size='default' checked={autoLaunch} checkedChildren='开启' unCheckedChildren='关闭' onChange={setAutoStart} />
        </div>

        <div className='flex items-center'>
          <label htmlFor='address'>图片存储位置：（开发中）</label>
          <Input id='address' type='url' value={rootPath} style={{ width: '200px' }} />
          <Button type='primary' className='ml-4'>
            修改
          </Button>
          {/* <Input type='file' /> */}
          {/* <p>根目录下的 /wallpaper-box </p> */}
        </div>
        {/* <Button type='primary'>选择文件夹</Button> */}
      </div>

      <div className=' rounded-lg border-slate-400 border-4 my-4 p-8'>
        <h2>网络代理：(HTTP_PROXY)</h2>
        <div className='flex items-center'>
          <label htmlFor='proxy'>代理服务器地址：</label>
          <Input
            id='proxy'
            value={proxyPath}
            placeholder='例: http://localhost:7890'
            type='text'
            onChange={(val) => {
              setProxyPath(val.target.value)
            }}
            style={{ width: '200px' }}
          />
          <Button type='primary' className='ml-4' onClick={setProxy}>
            修改
          </Button>
          <Button type='default' style={{ background: '#34d399', color: 'white' }} loading={loading} className='ml-4' onClick={ping}>
            测试
          </Button>
        </div>
      </div>
    </div>
  )
}
