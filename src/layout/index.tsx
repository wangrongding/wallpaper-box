import { Layout } from 'antd'
import Header from './Header'
import Content from './Content'
import Footer from './Footer'

export default function Container() {
  return (
    <>
      <Layout>
        <Header />
        {/* 内容区 */}
        <Content />
        {/* 底部 */}
        <Footer />
      </Layout>
    </>
  )
}
