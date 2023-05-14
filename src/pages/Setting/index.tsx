import { Button, Input, Switch } from 'antd'
import { ipcRenderer } from 'electron'

const Store = require('electron-store')
const store = new Store()
export default function Setting() {
  const [rootPath, setRootPath] = useState('/wallpaper-box')
  const [proxyPath, setProxyPath] = useState('')

  // 设置开机自启
  function setAutoStart(val: boolean) {
    ipcRenderer.send('set-auto-launch', val)
  }

  // 设置网络代理
  function setProxy() {
    store.set('proxy-path', proxyPath)
    ipcRenderer.send('set-proxy', proxyPath)
  }

  useEffect(() => {
    setProxyPath(store.get('proxy-path'))
    return () => {}
  }, [])

  return (
    <div className='px-[100px]'>
      <h1 className='font-bold text-2xl my-8'>Setting</h1>

      <p className='text-black bg-amber-200 leading-8 box-border pl-4 mb-4'>💡 部分功能开发中......</p>

      {/* 设置代理 */}
      <div className=' rounded-lg border-slate-400 border-4 my-4 p-8'>
        <div>
          <label htmlFor='auto-start'>开机自启：</label>
          <Switch id='auto-start' size='default' checkedChildren='开启' unCheckedChildren='关闭' onChange={setAutoStart} />
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
        <h2>网络代理：( 例: http://localhost:7890 )</h2>
        <label htmlFor='proxy'>代理服务器地址：</label>
        <Input
          id='proxy'
          value={proxyPath}
          type='text'
          onChange={(val) => {
            setProxyPath(val.target.value)
          }}
          style={{ width: '300px' }}
        />
        <Button type='primary' className='ml-4' onClick={setProxy}>
          修改
        </Button>
      </div>
    </div>
  )
}
