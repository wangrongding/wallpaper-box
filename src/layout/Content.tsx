import { Outlet, useLocation } from 'react-router-dom'

export default function Content() {
  const isWallpaperList = useLocation().pathname === '/list'

  return (
    <main className='flex-1 overflow-hidden px-4 pt-4'>
      <div className={`glass-panel h-[calc(100vh-90px)] p-5 ${isWallpaperList ? 'overflow-hidden' : 'overflow-y-auto'}`} id='main-content'>
        <Outlet />
      </div>
    </main>
  )
}
