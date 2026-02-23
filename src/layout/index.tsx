import Content from './Content'
import Footer from './Footer'
import Header from './Header'

export default function Container() {
  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      {/* 内容区 */}
      <Content />
      {/* 底部 */}
      <Footer />
    </div>
  )
}
