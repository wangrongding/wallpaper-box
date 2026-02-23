import { Outlet } from 'react-router-dom'

export default function Content() {
  return (
    <main className='flex-1 overflow-hidden px-4 pt-4'>
      <div className='glass-panel h-[calc(100vh-90px)] overflow-y-auto p-5' id='main-content'>
        <Outlet />
      </div>
    </main>
  )
}
