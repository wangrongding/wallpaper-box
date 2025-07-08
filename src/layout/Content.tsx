import { Layout, theme } from 'antd'
const { Content: ContentLayout } = Layout
import { Outlet } from 'react-router-dom'

export default function Footer() {
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  return (
    <>
      <ContentLayout className='site-layout' style={{ padding: '20px 20px 0' }}>
        <div style={{ padding: 24, background: colorBgContainer }} id='main-content' className='h-[calc(100vh-104px)] overflow-y-auto'>
          <Outlet></Outlet>
        </div>
      </ContentLayout>
    </>
  )
}
