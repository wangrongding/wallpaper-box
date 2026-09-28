export const DEFAULT_WALLHAVEN_API_KEY = 'ZdHkLbFRBQk496GqNwIxUEmZMoRZ1ta8'
export const WALLHAVEN_API_KEY_HELP_URL = 'https://wallhaven.cc/settings/account'
export const WALLHAVEN_API_KEY_STORE_KEY = 'wallhaven-api-key'

type BuildWallhavenSearchUrlParams = {
  apiKey?: string | null
  categories?: string
  keyword?: string
  order?: string
  page?: number
  purity?: string
  ratios?: string
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
  order = 'desc',
  page = 1,
  purity = '100',
  ratios = '',
  sorting = 'toplist',
  topRange = '1y',
}: BuildWallhavenSearchUrlParams = {}) {
  const params = new URLSearchParams({
    apikey: resolveWallhavenApiKey(apiKey),
    categories,
    order,
    page: String(page),
    purity,
    sorting,
    topRange,
  })

  // 'all' 或空值表示不限制比例；支持逗号分隔的多比例（如 '16x9,21x9'）。
  const ratioList = ratios
    .split(',')
    .map((ratio) => ratio.trim())
    .filter((ratio) => ratio && ratio !== 'all')
  if (ratioList.length) {
    params.set('ratios', ratioList.join(','))
  }

  if (keyword.trim()) {
    params.set('q', keyword.trim())
  }

  return `https://wallhaven.cc/api/v1/search?${params.toString()}`
}
