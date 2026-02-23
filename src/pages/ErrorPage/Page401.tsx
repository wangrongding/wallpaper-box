export default function Page401() {
  return (
    <div className='flex h-screen flex-col items-center justify-center bg-[var(--bg-deep)]'>
      <h1 className='bg-gradient-to-r from-red-400 to-rose-300 bg-clip-text font-display text-8xl font-bold text-transparent'>401</h1>
      <p className='mt-4 text-[var(--text-tertiary)]'>未授权访问</p>
    </div>
  )
}
