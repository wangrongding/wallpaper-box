import Content from './Content'
import Footer from './Footer'
import Header from './Header'

export default function Container() {
  return (
    <div className='flex min-h-screen flex-col bg-[var(--bg-deep)]'>
      <Header />
      <Content />
      <Footer />
    </div>
  )
}
