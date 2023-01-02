import { menuRoutes } from '@/routers/index'
import { Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'

const MenuBar: React.FC = () => {
  const navigate = useNavigate()
  const currentRoute = useLocation()

  // 路由跳转
  function handleMenuClick(e: { key: string }) {
    console.log(e.key)
    navigate(e.key)
  }

  return (
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
  )
}
export default MenuBar
