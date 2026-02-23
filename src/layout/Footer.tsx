import { ipcRenderer } from 'electron'
import { Github } from 'lucide-react'

export default function Footer() {
  function openLinkInBrowser(url: string) {
    ipcRenderer.send('open-link-in-browser', url)
  }

  return (
    <footer className='h-[34px] bg-[#001529] text-center text-sm leading-[34px] text-slate-400'>
      Created by 荣顶，follow me on{' '}
      <a
        className='inline-flex cursor-pointer items-center justify-center gap-1 text-red-400 transition-colors hover:text-red-300'
        onClick={() => openLinkInBrowser('https://github.com/wangrongding')}
      >
        Github 🌸 <Github className='h-4 w-4' />
      </a>
    </footer>
  )
}
