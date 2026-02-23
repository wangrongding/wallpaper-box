import { Outlet } from 'react-router-dom'

export default function Content() {
  return (
    <main className='flex-1 px-5 pt-5'>
      <div className='h-[calc(100vh-104px)] overflow-y-auto rounded-lg bg-white p-6' id='main-content'>
        <Outlet />
      </div>
    </main>
  )
}
