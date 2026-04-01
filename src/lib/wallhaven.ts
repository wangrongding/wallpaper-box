export const DEFAULT_WALLHAVEN_API_KEY = 'ZdHkLbFRBQk496GqNwIxUEmZMoRZ1ta8'
export const WALLHAVEN_API_KEY_HELP_URL = 'https://wallhaven.cc/settings/account'
export const WALLHAVEN_API_KEY_STORE_KEY = 'wallhaven-api-key'

type BuildWallhavenSearchUrlParams = {
  apiKey?: string | null
  categories?: string
  keyword?: string
  page?: number
  purity?: string
  sorting?: string
  topRange?: string
}

export function resolveWallhavenApiKey(apiKey?: string | null) {
  return apiKey?.trim() || DEFAULT_WALLHAVEN_API_KEY
}

export function buildWallhavenSearchUrl({
  apiKey,
  categories = '100',
  keyword = '',
  page = 1,
  purity = '100',
  sorting = 'toplist',
  topRange = '1y',
}: BuildWallhavenSearchUrlParams = {}) {
  const params = new URLSearchParams({
    apikey: resolveWallhavenApiKey(apiKey),
    categories,
    page: String(page),
    purity,
    sorting,
    topRange,
  })

  if (keyword.trim()) {
    params.set('q', keyword.trim())
  }

  return `https://wallhaven.cc/api/v1/search?${params.toString()}`
}
