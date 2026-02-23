export default function Page404() {
  return (
    <div className='flex h-screen flex-col items-center justify-center bg-[var(--bg-deep)]'>
      <h1 className='bg-gradient-to-r from-[var(--accent-primary)] to-sky-300 bg-clip-text font-display text-8xl font-bold text-transparent'>404</h1>
      <p className='mt-4 text-[var(--text-tertiary)]'>页面不存在</p>
    </div>
  )
}
