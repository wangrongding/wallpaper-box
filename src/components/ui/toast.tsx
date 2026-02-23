import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position='top-center'
      toastOptions={{
        style: {
          marginTop: '60px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-primary)',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: '13px',
          backdropFilter: 'blur(16px)',
          boxShadow: 'var(--shadow-lg)',
        },
        duration: 3000,
      }}
    />
  )
}
