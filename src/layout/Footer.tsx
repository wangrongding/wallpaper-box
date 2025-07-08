import { ipcRenderer } from 'electron'
import { GithubFilled } from '@ant-design/icons'
import { Layout } from 'antd'
const { Header, Footer: FooterLayout, Content } = Layout

export default function Footer() {
  function openLinkInBrowser(url: string) {
    ipcRenderer.send('open-link-in-browser', url)
  }

  return (
    <>
      <FooterLayout className='text-center h-[34px] leading-[34px] p-[0px]' style={{ padding: 0, margin: 0 }}>
        Created by 荣顶，follow me on{' '}
        <a className='text-red-400 inline-flex justify-center items-center' onClick={() => openLinkInBrowser('https://github.com/wangrongding')}>
          Github 🌸 <GithubFilled />
        </a>
      </FooterLayout>
    </>
  )
}
