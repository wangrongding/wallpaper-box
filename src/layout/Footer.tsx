import { ipcRenderer } from 'electron'
import { Github } from 'lucide-react'

export default function Footer() {
  function openLinkInBrowser(url: string) {
    ipcRenderer.send('open-link-in-browser', url)
  }

  return (
    <footer className='flex h-[28px] items-center justify-center gap-1 text-[11px] text-[var(--text-tertiary)]'>
      <span>Built by 荣顶</span>
      <span className='mx-1 opacity-30'>·</span>
      <a
        className='inline-flex cursor-pointer items-center gap-1 text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent-primary)]'
        onClick={() => openLinkInBrowser('https://github.com/wangrongding')}
      >
        <Github className='h-3 w-3' />
        <span>GitHub</span>
      </a>
    </footer>
  )
}
