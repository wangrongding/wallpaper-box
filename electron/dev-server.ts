const fallbackDevServerUrl = 'http://localhost:5173'

export function getDevServerUrl() {
  return (process.env.VITE_DEV_SERVER_URL || process.argv[2] || fallbackDevServerUrl).replace(/\/$/, '')
}
