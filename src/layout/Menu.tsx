import { menuRoutes } from '@/routers/index'
import { SyncOutlined } from '@ant-design/icons'
import { Menu, message } from 'antd'
import { ipcRenderer } from 'electron'
import { useLocation, useNavigate } from 'react-router-dom'

const fs = require('fs')
const os = require('os')
const path = require('path')

message.config({
  top: 200,
  duration: 3,
})
const MenuBar: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()
  const currentRoute = useLocation()

  // 路由跳转
  function handleMenuClick(e: { key: string }) {
    console.log(e.key)
    navigate(e.key)
  }

  // 刷新窗口
  function refreshWindow() {
    ipcRenderer.send('refresh-window')
  }

  // 设置随机壁纸
  async function setRandomWallpaper() {
    setLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20 * 1000)
      /*
      推荐的分辨率：
          16/9: 1920x1080 2560x1440 3840x2160
          16/10: 1920x1200 2560x1600 3840x2400
          4/3: 1920x1440 2560x1920 3840x2880
          5/4: 1920x1536 2560x2048 3840x3072
      */
      const response = await fetch('https://source.unsplash.com/random/3840x2400', { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
      }

      const dir = path.join(os.homedir(), '/wallpaper-box')
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
      const picturePath = path.join(dir, new Date().getTime() + '.jpg')
      const buffer = await response.arrayBuffer()
      fs.writeFileSync(picturePath, Buffer.from(buffer))
      console.log('Image downloaded successfully!')
      // 设置壁纸
      ipcRenderer.send('set-wallpaper', picturePath)
      // 通知主进程关闭动态壁纸
      ipcRenderer.send('close-live-wallpaper')
      messageApi.success('设置成功！')
      setLoading(false)
      // ipcRenderer.send('asynchronous-message', '设置成功！')
    } catch {
      setLoading(false)
      messageApi.error('请重新尝试，或检查网络，一直不行可尝试全局挂个梯子或者在设置页面配置该应用的代理。')
      // ipcRenderer.send('asynchronous-message', '设置失败，请重新尝试，或检查网络！')
    }
  }
  return (
    <div className='no-drag my-[0px] mr-auto flex h-full p-[0px]'>
      {contextHolder}
      <Menu
        style={{ height: '50px', lineHeight: '50px' }}
        theme='dark'
        mode='horizontal'
        onClick={handleMenuClick}
        // defaultSelectedKeys 表示当前样式所在的选中项的key
        defaultSelectedKeys={[currentRoute.pathname]}
        // 菜单项的数据
        items={menuRoutes.map((item: any) => ({
          key: item.path,
          label: item.title,
          icon: item.icon,
        }))}
      />
      <div
        className='relative grid w-[100px] cursor-pointer place-content-center bg-teal-950 text-white hover:bg-cyan-800'
        onClick={setRandomWallpaper}
      >
        {loading && (
          <div className='absolute left-0 top-0 flex h-full w-full place-content-center place-items-center bg-black bg-opacity-50'>
            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-white'></div>
          </div>
        )}
        一键随机
      </div>
      <div
        className='grid w-[50px]  cursor-pointer place-content-center bg-emerald-600 text-xl font-bold  text-white hover:bg-emerald-400'
        onClick={refreshWindow}
      >
        <SyncOutlined style={{ fontWeight: 'bold' }} />
      </div>
    </div>
  )
}
export default MenuBar
