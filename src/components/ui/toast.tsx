import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position='top-center'
      toastOptions={{
        style: {
          marginTop: '100px',
        },
        duration: 3000,
      }}
    />
  )
}
